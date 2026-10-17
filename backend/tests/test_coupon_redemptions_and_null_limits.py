# backend/tests/test_coupon_redemptions_and_null_limits.py
"""مصرف‌های کوپن حالا خوانده می‌شوند، و «بی‌سقف» از API نوشتنی است (راند ۲۵).

دو گرهٔ هم‌خانواده در همین ماژول باز مانده بود:

C13.3.2 — ردیف‌های `coupon_redemptions` نوشته می‌شدند (هر مصرف یک ردیف با مبلغ
تخفیف و کاربر) ولی **هیچ‌جا** خوانده نمی‌شدند: مدیر نمی‌دانست کدش را چه کسی مصرف
کرده و چقدر تخفیف داده است. رفع: `GET /coupons/{id}/redemptions` با همان دامنهٔ
دسترسیِ مدیریتِ کوپن.

C21.2 — «هر کاربر نامحدود» و «بدون سقف کلی» از API نوشتنی نبود: `BaseRepository.update:71`
مقدار None را رد می‌کند، و روی INSERT خودِ SQLAlchemy پیش‌فرضِ ستون (`per_user_limit=1`)
را به‌جای NULL می‌گذارد. رفع: null صریح (کلیدِ موجود در `model_fields_set`) با یک
UPDATE در سطح ستون روی NULL نوشته می‌شود.

سطح: unit/SQLite از مسیر API.
"""
from datetime import date, timedelta
from datetime import time as dtime

import pytest
from sqlmodel import Session, select

import app.services.pending_booking_service as pbs_module
import app.utils.rate_limit as rate_limit_module
from app.models.coupon import Coupon, CouponRedemption
from app.models.slot import Slot, SlotStatus
from app.models.user import User, UserRole
from app.models.venue import Venue, VenuePaymentMode
from app.repositories.coupon_repository import CouponRepository

from conftest import test_engine
from helpers import auth, FakeRedis

PRICE = 250_000          # ۲۰٪ آن = ۵۰٬۰۰۰ ریال تخفیف
COUPONS = "/api/v1/coupons/"


@pytest.fixture()
def fake_redis(monkeypatch):
    fake = FakeRedis()
    monkeypatch.setattr(pbs_module, "_client", fake)
    monkeypatch.setattr(rate_limit_module, "_client", fake)
    return fake


def _user(s: Session, phone: str, name: str, role=UserRole.USER) -> str:
    s.add(User(phone=phone, full_name=name, hashed_password="x",
               role=role, is_verified=True))
    s.commit()
    return phone


def _venue(s: Session, mgr_phone: str, tag: str) -> int:
    mgr = s.exec(select(User).where(User.phone == mgr_phone)).one()
    v = Venue(name=f"سالن {tag}", address="آ", latitude=35.7, longitude=51.4,
              phone="0912", manager_id=mgr.id,
              payment_mode=VenuePaymentMode.PAY_IN_PLACE)
    s.add(v)
    s.commit()
    return int(v.id)


def _slots(s: Session, venue_id: int, n: int) -> list:
    out = []
    for i in range(n):
        sl = Slot(venue_id=venue_id, slot_date=date.today() + timedelta(days=2 + i),
                  start_time=dtime(17, 0), duration=90, base_price=PRICE,
                  current_price=PRICE, status=SlotStatus.AVAILABLE)
        s.add(sl)
        s.commit()
        out.append(int(sl.id))
    return out


def _setup(tag):
    """دو سالن با دو مدیر + سه مشتریِ با نام‌های متمایز + سرپرست سیستم."""
    with Session(test_engine) as s:
        sup = _user(s, f"0912{tag}900001", "سرپرست", UserRole.SUPER_ADMIN)
        mgr_a = _user(s, f"0912{tag}900002", "مدیر الف", UserRole.VENUE_MANAGER)
        mgr_b = _user(s, f"0912{tag}900003", "مدیر ب", UserRole.VENUE_MANAGER)
        v_a = _venue(s, mgr_a, f"{tag}الف")
        v_b = _venue(s, mgr_b, f"{tag}ب")
        custs = [_user(s, f"0935{tag}91000{i}", f"مشتری {i}") for i in (1, 2, 3)]
        slots_a = _slots(s, v_a, 6)
    return {"sup": sup, "mgr_a": mgr_a, "mgr_b": mgr_b, "custs": custs,
            "venue_a": v_a, "venue_b": v_b, "slots_a": slots_a}


def _mk_coupon(client, mgr, code, venue_id, **over):
    body = {"code": code, "venue_id": venue_id, "discount_type": "percent",
            "value": 2000, "max_uses": None, "per_user_limit": 1}
    body.update(over)
    return client.post(COUPONS, json=body, headers=auth(mgr))


def _book(client, phone, slot_id, code):
    return client.post("/api/v1/bookings/", json={"slot_id": slot_id,
                                                  "discount_code": code},
                       headers=auth(phone))


def _redemptions(client, mgr, coupon_id, **params):
    return client.get(f"{COUPONS}{coupon_id}/redemptions", params=params,
                      headers=auth(mgr))


def _rows():
    with Session(test_engine) as s:
        return s.exec(select(CouponRedemption)).all()


# ─────────────── C13.3.2 — خواندنِ مصرف‌ها ───────────────

def test_the_list_names_who_used_the_code_and_for_how_much(client, fake_redis):
    a = _setup("801")
    cid = _mk_coupon(client, a["mgr_a"], "WHO1", a["venue_a"]).json()["id"]
    assert _book(client, a["custs"][0], a["slots_a"][0], "WHO1").status_code == 200

    r = _redemptions(client, a["mgr_a"], cid)
    assert r.status_code == 200, r.text
    rows = r.json()["items"]
    assert len(rows) == 1
    row = rows[0]
    assert row["user_phone"] == a["custs"][0]
    assert row["user_full_name"] == "مشتری 1"
    assert row["amount_discounted"] == 50_000      # ۲۰٪ از ۲۵۰٬۰۰۰
    assert row["coupon_id"] == cid
    # رزروِ معلقِ تأیید نشده هنوز به booking وصل نشده است
    assert row["booking_id"] is None
    assert row["created_at"]


def test_confirming_the_booking_links_the_row_to_it(client, fake_redis):
    a = _setup("802")
    cid = _mk_coupon(client, a["mgr_a"], "LINK1", a["venue_a"]).json()["id"]
    pending = _book(client, a["custs"][0], a["slots_a"][0], "LINK1").json()["id"]
    conf = client.post(f"/api/v1/bookings/pending/{pending}/confirm",
                       headers=auth(a["mgr_a"]))
    assert conf.status_code == 200, conf.text

    row = _redemptions(client, a["mgr_a"], cid).json()["items"][0]
    assert row["booking_id"] == conf.json()["id"]


def test_only_the_manager_of_the_coupon_venue_gets_the_list(client, fake_redis):
    a = _setup("803")
    cid = _mk_coupon(client, a["mgr_a"], "SCOPE1", a["venue_a"]).json()["id"]
    _book(client, a["custs"][0], a["slots_a"][0], "SCOPE1")

    other = _redemptions(client, a["mgr_b"], cid)
    assert other.status_code == 403, other.text
    plain = _redemptions(client, a["custs"][1], cid)
    assert plain.status_code == 403, plain.text
    # و مدیرِ خودش باید برنده شود — یعنی ۴۰۳ از نگهبان می‌آید نه از مسیر شکسته
    assert len(_redemptions(client, a["mgr_a"], cid).json()["items"]) == 1


def test_a_missing_coupon_is_404_not_an_empty_list(client, fake_redis):
    a = _setup("804")
    r = _redemptions(client, a["mgr_a"], 999_999)
    assert r.status_code == 404, r.text
    # پیامِ خودِ endpoint — نبودش یعنی به مسیر نرسیده‌ایم (نه کوپنِ ناموجود)
    assert r.json()["detail"] == "کد تخفیف یافت نشد"


def test_a_global_coupon_is_only_for_the_super_admin(client, fake_redis):
    a = _setup("805")
    cid = _mk_coupon(client, a["sup"], "GLOBAL1", None).json()["id"]
    _book(client, a["custs"][0], a["slots_a"][0], "GLOBAL1")

    as_manager = _redemptions(client, a["mgr_a"], cid)
    assert as_manager.status_code == 403, as_manager.text
    assert "سراسری" in as_manager.json()["detail"]
    rows = _redemptions(client, a["sup"], cid).json()["items"]
    assert [r["user_phone"] for r in rows] == [a["custs"][0]]


def test_the_list_is_newest_first_and_paged(client, fake_redis):
    a = _setup("806")
    cid = _mk_coupon(client, a["mgr_a"], "PAGE1", a["venue_a"],
                     per_user_limit=3).json()["id"]
    for i, phone in enumerate(a["custs"]):
        assert _book(client, phone, a["slots_a"][i], "PAGE1").status_code == 200

    full = _redemptions(client, a["mgr_a"], cid).json()["items"]
    assert [r["user_phone"] for r in full] == a["custs"][::-1]  # تازه‌ترین اول
    assert [r["id"] for r in full] == sorted(
        (r["id"] for r in full), reverse=True)
    page = _redemptions(client, a["mgr_a"], cid, limit=2).json()["items"]
    assert [r["user_phone"] for r in page] == a["custs"][2:0:-1]
    tail = _redemptions(client, a["mgr_a"], cid, limit=1, offset=2).json()["items"]
    assert [r["user_phone"] for r in tail] == [a["custs"][0]]


def test_a_cancelled_unpaid_booking_stays_in_the_list_as_history(client, fake_redis):
    """راند ۲۷ (C22.1): ردیفِ آزادشده حذف نمی‌شود ⇒ فهرست تاریخچۀ کامل است.

    پیش از این راند همین تست `== []` و `_rows() == []` را می‌خواست؛ یعنی لغوِ یک
    رزروِ پرداخت‌نشده ردیفِ مصرف را از تاریخ می‌انداخت. حالا ردیف می‌ماند،
    `status` روی `RELEASED` است و ظرفیت برگشته ⇒ `uses_count` با **شمارِ
    ردیف‌های ACTIVE** می‌خواند، نه با شمارِ همهٔ ردیف‌ها.
    """
    a = _setup("807")
    cid = _mk_coupon(client, a["mgr_a"], "GONE1", a["venue_a"]).json()["id"]
    pending = _book(client, a["custs"][0], a["slots_a"][0], "GONE1").json()["id"]
    bid = client.post(f"/api/v1/bookings/pending/{pending}/confirm",
                      headers=auth(a["mgr_a"])).json()["id"]
    assert client.delete(f"/api/v1/bookings/{bid}",
                         headers=auth(a["custs"][0])).status_code == 200

    rows = _redemptions(client, a["mgr_a"], cid).json()["items"]
    assert [r["status"] for r in rows] == ["RELEASED"]
    assert rows[0]["released_at"] is not None
    assert rows[0]["booking_id"] == bid        # «کجا مصرف شد» هم گم نمی‌شود
    with Session(test_engine) as s:
        assert s.get(Coupon, cid).uses_count == 0
    assert len(_rows()) == 1                   # ردیف فیزیکی حذف نشده است


def test_a_released_row_does_not_block_a_second_use(client, fake_redis):
    """معنای «ACTIVE-only»: پس از لغو، همان کاربر دوباره جا دارد."""
    a = _setup("818")
    cid = _mk_coupon(client, a["mgr_a"], "AGAIN1", a["venue_a"]).json()["id"]
    pending = _book(client, a["custs"][0], a["slots_a"][0], "AGAIN1").json()["id"]
    bid = client.post(f"/api/v1/bookings/pending/{pending}/confirm",
                      headers=auth(a["mgr_a"])).json()["id"]
    assert client.delete(f"/api/v1/bookings/{bid}",
                         headers=auth(a["custs"][0])).status_code == 200

    second = _book(client, a["custs"][0], a["slots_a"][1], "AGAIN1")
    assert second.status_code == 200, second.text
    assert [r["status"] for r in _redemptions(client, a["mgr_a"], cid).json()["items"]] == \
        ["ACTIVE", "RELEASED"]                 # تازه‌ترین اول


def test_a_paid_and_cancelled_booking_stays_visible(client, fake_redis):
    """عکسِ حالتِ بالا: راند ۱۶ ردیفِ رزروِ پرداخت‌شده را حذف نمی‌کند ⇒ فهرست هم می‌بیندش."""
    a = _setup("808")
    cid = _mk_coupon(client, a["mgr_a"], "KEPT1", a["venue_a"]).json()["id"]
    pending = _book(client, a["custs"][0], a["slots_a"][0], "KEPT1").json()["id"]
    conf = client.post(f"/api/v1/bookings/pending/{pending}/confirm",
                       headers=auth(a["mgr_a"]))
    assert conf.status_code == 200, conf.text
    bid = conf.json()["id"]
    inv = client.post("/api/v1/payments/", json={"booking_id": bid},
                      headers=auth(a["custs"][0]))
    client.post(f"/api/v1/payments/{inv.json()['id']}/pay",
                json={"card_number": "6037991122334455", "cvv": "123"},
                headers=auth(a["custs"][0]))
    assert client.delete(f"/api/v1/bookings/{bid}",
                         headers=auth(a["custs"][0])).status_code == 200

    rows = _redemptions(client, a["mgr_a"], cid).json()["items"]
    assert [r["booking_id"] for r in rows] == [bid]
    assert rows[0]["amount_discounted"] == 50_000


# ─────────────── C21.2 — «بی‌سقف» نوشتنی از API ───────────────

def test_post_with_a_null_per_user_limit_creates_an_unlimited_code(client, fake_redis):
    a = _setup("811")
    r = _mk_coupon(client, a["mgr_a"], "NOLIM1", a["venue_a"], per_user_limit=None)
    assert r.status_code == 200, r.text
    assert r.json()["per_user_limit"] is None
    cid = r.json()["id"]
    with Session(test_engine) as s:
        assert s.get(Coupon, cid).per_user_limit is None

    # معنا: یک کاربر می‌تواند بیش از یک بار مصرف کند
    assert _book(client, a["custs"][0], a["slots_a"][0], "NOLIM1").status_code == 200
    again = _book(client, a["custs"][0], a["slots_a"][1], "NOLIM1")
    assert again.status_code == 200, again.text


def test_put_can_lift_a_per_user_cap(client, fake_redis):
    a = _setup("812")
    cid = _mk_coupon(client, a["mgr_a"], "LIFT1", a["venue_a"],
                     per_user_limit=1).json()["id"]
    assert _book(client, a["custs"][0], a["slots_a"][0], "LIFT1").status_code == 200
    blocked = _book(client, a["custs"][0], a["slots_a"][1], "LIFT1")
    assert blocked.status_code == 400 and "سقف" in blocked.json()["detail"]

    up = client.put(f"{COUPONS}{cid}", json={"per_user_limit": None},
                    headers=auth(a["mgr_a"]))
    assert up.status_code == 200, up.text
    assert up.json()["per_user_limit"] is None

    third = _book(client, a["custs"][0], a["slots_a"][2], "LIFT1")
    assert third.status_code == 200, third.text


def test_put_can_remove_the_total_ceiling(client, fake_redis):
    a = _setup("813")
    cid = _mk_coupon(client, a["mgr_a"], "NOCAP", a["venue_a"], max_uses=1).json()["id"]
    up = client.put(f"{COUPONS}{cid}", json={"max_uses": None}, headers=auth(a["mgr_a"]))
    assert up.status_code == 200, up.text
    assert up.json()["max_uses"] is None
    with Session(test_engine) as s:
        assert s.get(Coupon, cid).max_uses is None
    # بی‌سقف واقعی است: دو کاربر پشت هم جا می‌گیرند
    assert _book(client, a["custs"][0], a["slots_a"][0], "NOCAP").status_code == 200
    assert _book(client, a["custs"][1], a["slots_a"][1], "NOCAP").status_code == 200


def test_put_can_clear_the_validity_window(client, fake_redis):
    a = _setup("814")
    cid = _mk_coupon(client, a["mgr_a"], "DATES", a["venue_a"],
                     min_booking_amount=100_000).json()["id"]
    up = client.put(f"{COUPONS}{cid}", json={"min_booking_amount": None},
                    headers=auth(a["mgr_a"]))
    assert up.status_code == 200, up.text
    assert up.json()["min_booking_amount"] is None


def test_a_field_the_client_did_not_send_stays_untouched(client, fake_redis):
    """نگهبانِ بازگشتی: null فقط وقتی که صریحاً فرستاده شود — PUTِ بخشی بی‌تأثیر بماند."""
    a = _setup("815")
    cid = _mk_coupon(client, a["mgr_a"], "PART1", a["venue_a"],
                     max_uses=5, per_user_limit=2).json()["id"]
    up = client.put(f"{COUPONS}{cid}", json={"value": 1000}, headers=auth(a["mgr_a"]))
    assert up.status_code == 200, up.text
    assert up.json()["max_uses"] == 5 and up.json()["per_user_limit"] == 2
    with Session(test_engine) as s:
        c = s.get(Coupon, cid)
        assert (c.max_uses, c.per_user_limit, c.value) == (5, 2, 1000)


def test_null_on_a_required_field_is_refused_not_dropped(client, fake_redis):
    a = _setup("816")
    cid = _mk_coupon(client, a["mgr_a"], "REQ1", a["venue_a"]).json()["id"]
    r = client.put(f"{COUPONS}{cid}", json={"value": None}, headers=auth(a["mgr_a"]))
    assert r.status_code == 400, r.text
    assert "خالی" in r.json()["detail"]
    with Session(test_engine) as s:
        assert s.get(Coupon, cid).value == 2000


def test_clearing_an_unknown_column_is_a_programmer_error(client, fake_redis):
    """سafetyِ خودِ repository: یک تایپو نباید شمارندۀ پولی را صفر کند."""
    a = _setup("817")
    cid = _mk_coupon(client, a["mgr_a"], "SAFE1", a["venue_a"], max_uses=3).json()["id"]
    with Session(test_engine) as s:
        with pytest.raises(ValueError):
            CouponRepository(s).clear_fields(cid, ["uses_count"])
        s.rollback()
        assert s.get(Coupon, cid).max_uses == 3
