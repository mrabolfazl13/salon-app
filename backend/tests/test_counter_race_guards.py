# backend/tests/test_counter_race_guards.py
"""دو شمارندۀ پولی که «بخوان-و-بنویس» بودند و حالا CAS‌اند (راند ۲۳).

C11.6.3 — `pay_share` در `split_payments.py` مبلغ کل را با `sp.paid_amount += share.amount`
جلو می‌برد؛ دو پرداختِ همزمان یکی را گم می‌کرد (و در مسیرِ هم‌سهمی، یک سهم دو بار شمرده
می‌شد). C13.3.1 — `bump_uses` هم `uses_count` را روی آبجکتِ در-حافظه زیاد می‌کرد، پس دو
رزروِ موازیِ یک کدِ `max_uses=1` می‌توانستند هر دو از چکِ Python رد شوند.

هر دو نگهبان حالا داخل خودِ SQL هستند. سطح این فایل unit/SQLite است (شکلِ statement و
رفتار); همزمانیِ واقعی روی PostgreSQL در `~/.qoder-tmp/pg_race23.py` سنجیده می‌شود، چون
`tests/conftest.py:104` هر تراکنش SQLite را با `BEGIN IMMEDIATE` می‌بندد.
"""
from datetime import date, timedelta
from datetime import time as dtime

import pytest
from sqlalchemy import event
from sqlmodel import Session, select

import app.services.pending_booking_service as pbs_module
import app.utils.rate_limit as rate_limit_module
from app.models.coupon import Coupon, CouponRedemption
from app.models.slot import Slot, SlotStatus
from app.models.split_payment import ShareStatus, TeamSplitPayment, SplitPaymentShare
from app.models.user import User, UserRole
from app.models.venue import Venue, VenuePaymentMode
from app.repositories.coupon_repository import CouponRepository

from conftest import test_engine
from helpers import auth, FakeRedis
from test_split_payments import BASE, _create_team, _invite_and_accept


@pytest.fixture()
def fake_redis(monkeypatch):
    fake = FakeRedis()
    monkeypatch.setattr(pbs_module, "_client", fake)
    monkeypatch.setattr(rate_limit_module, "_client", fake)
    return fake


def _capture():
    """statementهای داخل-تراکنش را می‌گیرد (برای شاهدِ شکلِ کوئری)."""
    captured = []

    @event.listens_for(test_engine, "before_cursor_execute")
    def _recv(conn, cursor, statement, parameters, context, executemany):
        captured.append(statement)

    return captured, _recv


def _with_capture(fn):
    captured, hook = _capture()
    try:
        result = fn()
    finally:
        event.remove(test_engine, "before_cursor_execute", hook)
    return result, captured


# ─────────────── ۱) ظرفیت کوپن ───────────────

def _mk_coupon(client, mgr, code, venue_id, **over):
    body = {"code": code, "venue_id": venue_id, "discount_type": "percent",
            "value": 2000, "per_user_limit": 1}
    body.update(over)
    return client.post("/api/v1/coupons/", json=body, headers=auth(mgr))


def _coupon_setup(tag, users=1):
    """یک سالنِ مدیرمحور + N مشتری؛ dictِ کاربرها را می‌دهد."""
    with Session(test_engine) as s:
        mgr = User(phone=f"0912{tag}550001", full_name="مدیر", hashed_password="x",
                   role=UserRole.VENUE_MANAGER, is_verified=True)
        s.add(mgr)
        s.commit()
        s.refresh(mgr)
        venue = Venue(name=f"سالن {tag}", address="آ", latitude=35.7, longitude=51.4,
                      phone="0912", manager_id=mgr.id,
                      payment_mode=VenuePaymentMode.PAY_IN_PLACE)
        s.add(venue)
        s.commit()
        s.refresh(venue)
        vids, mid = venue.id, mgr.phone
        custs = []
        for i in range(1, users + 1):
            c = User(phone=f"0912{tag}55100{i}", full_name=f"مشتری {i}",
                     hashed_password="x", role=UserRole.USER, is_verified=True)
            s.add(c)
            s.commit()
            s.refresh(c)
            custs.append(c.phone)
        slots = []
        for i in range(users):
            sl = Slot(venue_id=vids, slot_date=date.today() + timedelta(days=2),
                      start_time=dtime(18 + i, 0), duration=90, base_price=250_000,
                      current_price=250_000, status=SlotStatus.AVAILABLE)
            s.add(sl)
            s.commit()
            s.refresh(sl)
            slots.append(sl.id)
    return {"mgr": mid, "venue": vids, "custs": custs, "slots": slots}


def _book(client, phone, slot_id, code):
    return client.post("/api/v1/bookings/", json={"slot_id": slot_id, "discount_code": code},
                       headers=auth(phone))


def test_capacity_check_lives_inside_the_update(client, fake_redis):
    """نگهبانِ `max_uses` در WHERE خودِ UPDATE است، نه در Python."""
    a = _coupon_setup("601", users=1)
    assert _mk_coupon(client, a["mgr"], "CAS1", a["venue"], max_uses=1).status_code == 200

    resp, captured = _with_capture(
        lambda: _book(client, a["custs"][0], a["slots"][0], "CAS1"))
    assert resp.status_code == 200, resp.text
    bumps = [st.strip().lower() for st in captured
             if st.strip().lower().startswith("update coupons")]
    assert len(bumps) == 1, [st for st in captured if "coupons" in st.lower()]
    st = " ".join(bumps[0].split())
    assert "set uses_count=(coupons.uses_count + ?)" in st
    assert "and (coupons.max_uses is null or coupons.uses_count < coupons.max_uses)" in st


def test_a_one_seat_coupon_is_not_overfilled_by_two_bookings(client, fake_redis):
    """دو کاربر، یک کدِ `max_uses=1` ⇒ دومی ۴۰۰ و شمارنده روی ۱ می‌ماند."""
    a = _coupon_setup("602", users=2)
    assert _mk_coupon(client, a["mgr"], "SEAT1", a["venue"], max_uses=1).status_code == 200

    first = _book(client, a["custs"][0], a["slots"][0], "SEAT1")
    assert first.status_code == 200, first.text
    second = _book(client, a["custs"][1], a["slots"][1], "SEAT1")
    assert second.status_code == 400, second.text
    assert "ظرفیت" in second.json()["detail"]

    with Session(test_engine) as s:
        coupon = s.exec(select(Coupon)).first()
        assert coupon.uses_count == 1
        assert len(s.exec(select(CouponRedemption)).all()) == 1


def test_unlimited_coupon_still_burns_every_use(client, fake_redis):
    """نگهبانِ جدید نباید کوپنِ بی‌سقف را بلاک کند (`max_uses IS NULL` شاخۀ اولِ OR است)."""
    a = _coupon_setup("603", users=2)
    assert _mk_coupon(client, a["mgr"], "NOLIM", a["venue"], max_uses=None,
                      per_user_limit=2).status_code == 200
    for i in range(2):
        r = _book(client, a["custs"][i], a["slots"][i], "NOLIM")
        assert r.status_code == 200, r.text
    with Session(test_engine) as s:
        assert s.exec(select(Coupon)).first().uses_count == 2


def test_release_cannot_push_the_counter_below_zero(client, fake_redis):
    """آزادسازیِ دوباره (ردیفِ تکراری/باختی) نباید ظرفیتِ ساختگی تولید کند."""
    a = _coupon_setup("604", users=1)
    assert _mk_coupon(client, a["mgr"], "FLOOR", a["venue"], max_uses=5).status_code == 200
    with Session(test_engine) as s:
        cid = s.exec(select(Coupon)).first().id
        repo = CouponRepository(s)
        assert repo.try_consume_capacity(cid) is True   # ۰ ⇒ ۱
        s.commit()
        assert repo.release_capacity(cid) is True       # ۱ ⇒ ۰
        for _ in range(6):
            assert repo.release_capacity(cid) is False  # کفِ صفر در SQL، نه در Python
        s.commit()
        assert s.exec(select(Coupon)).first().uses_count == 0


# ─────────────── ۲) شمارندۀ پرداخت اشتراکی ───────────────

def _split_setup(client, seed, tag):
    """کاپیتان + دو عضو با سه سهمِ ۱۰۰٬۰۰۰ریالی؛ (payment_id, [(share_id, phone), …])."""
    phones = [f"0935{tag}{i:03d}" for i in range(1, 4)]
    for p in phones:
        seed["user"](p)
    team = _create_team(client, seed, phones[0])
    for p in phones[1:]:
        _invite_and_accept(client, phones[0], p, team["id"])
    r = client.post(BASE + "/", json={"team_id": team["id"], "amount": 300_000,
                                      "method": "EQUAL"}, headers=auth(phones[0]))
    assert r.status_code == 201, r.text
    with Session(test_engine) as s:
        owned = [(sh["id"], s.get(User, sh["user_id"]).phone) for sh in r.json()["shares"]]
    return r.json()["id"], owned


def test_pay_share_moves_the_total_inside_sql(client, seed):
    """یک UPDATE روی `team_split_payments`، با حسابِ `paid_amount + ?` و `CASE` برای وضعیت."""
    pid, owned = _split_setup(client, seed, "711")
    sid, phone = owned[0]
    _, captured = _with_capture(
        lambda: client.post(f"{BASE}/{pid}/shares/{sid}/pay", headers=auth(phone)))

    sp_updates = [st for st in captured
                  if st.strip().lower().startswith("update team_split_payments")]
    assert len(sp_updates) == 1, [st for st in captured if "team_split" in st.lower()]
    st = sp_updates[0].lower()
    assert "paid_amount + ?" in st
    assert "case" in st                       # وضعیت از خودِ SQL می‌آید، نه از listِ Python
    # `cast`: روی PostgreSQL ستون `status` enum بومی است و CASE بدون cast با
    # DatatypeMismatch رد می‌شود؛ SQLite این را نمی‌سنجد، پس شکلِ statement اینجا نگهبان است.
    assert "cast(case" in st, sp_updates[0]
    share_updates = [st for st in captured
                     if st.strip().lower().startswith("update split_payment_shares")]
    assert len(share_updates) == 1
    assert "status != ?" in share_updates[0].lower()   # تبدیلِ سهم با نگهبان


def test_paying_the_same_share_twice_counts_once(client, seed):
    pid, owned = _split_setup(client, seed, "712")
    sid, phone = owned[0]
    first = client.post(f"{BASE}/{pid}/shares/{sid}/pay", headers=auth(phone))
    assert first.status_code == 200, first.text
    second = client.post(f"{BASE}/{pid}/shares/{sid}/pay", headers=auth(phone))
    assert second.status_code == 400, second.text
    assert "قبلاً" in second.json()["detail"]
    with Session(test_engine) as s:
        sp = s.get(TeamSplitPayment, pid)
        assert sp.paid_amount == 100_000          # نه ۲۰۰٬۰۰۰
        assert sp.status.value == "PARTIAL"
        assert s.get(SplitPaymentShare, sid).status == ShareStatus.PAID


def test_status_completes_when_sql_finds_no_unpaid_share(client, seed):
    pid, owned = _split_setup(client, seed, "713")
    for i, (sid, phone) in enumerate(owned):
        r = client.post(f"{BASE}/{pid}/shares/{sid}/pay", headers=auth(phone))
        assert r.status_code == 200, r.text
        with Session(test_engine) as s:
            sp = s.get(TeamSplitPayment, pid)
            assert sp.paid_amount == 100_000 * (i + 1)
            expect = "COMPLETED" if i == 2 else "PARTIAL"
            assert sp.status.value == expect, (i, sp.status)
