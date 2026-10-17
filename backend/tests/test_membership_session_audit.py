# backend/tests/test_membership_session_audit.py
"""ممیزی و اتمی‌بودنِ کسر جلسه (C15.5.3، راند ۲۲).

تا پیش از این `consume_session` شمارنده را با read-modify-write کم می‌کرد
(`purchase.sessions_remaining -= 1`) و هیچ‌جا ثبت نمی‌شد چه کسی و کِی. حالا یک
UPDATE شرطیِ تنها-کوئری شمارنده را کم می‌کند و هر اقدام یک ردیفِ append-only
در `membership_session_events` می‌گذارد.

سطح: unit/SQLite (TestClient + `Session(test_engine)`). صفحۀ واقعیِ race روی
PostgreSQL در `~/.qoder-tmp/pg_consume22.py` سنجیده می‌شود، چون conftest روی
SQLite را با `BEGIN IMMEDIATE` می‌بندد (`tests/conftest.py:104`).
"""
from sqlalchemy import event
from sqlmodel import Session, select

from app.models.membership import (
    MembershipPurchase,
    MembershipSessionEvent,
    SessionEventType,
)
from app.models.user import User, UserRole
from app.models.venue import Venue

from conftest import test_engine
from helpers import auth

CARD_OK = "6037701150123456"
PAY = {"card_number": CARD_OK, "cvv": "123"}
PACK = 3


def _setup(client, tag: str, sessions: int = PACK):
    """مدیر + مشتری + پلنِ پکِ Nجلسه‌ایِ پرداخت‌شده؛ (mgr_phone, cust_phone, pid, vid)."""
    with Session(test_engine) as s:
        mgr = User(phone=f"0912551{tag}", full_name=f"مدیر {tag}", hashed_password="x",
                   role=UserRole.VENUE_MANAGER, is_verified=True)
        cust = User(phone=f"0912552{tag}", full_name="ورزشکار", hashed_password="x",
                    role=UserRole.USER, is_verified=True)
        other = User(phone=f"0912553{tag}", full_name="مدیر دیگر", hashed_password="x",
                     role=UserRole.VENUE_MANAGER, is_verified=True)
        s.add(mgr); s.add(cust); s.add(other)
        s.commit()
        for u in (mgr, cust, other):
            s.refresh(u)
        venue = Venue(name=f"باشگاه {tag}", address="قم", latitude=34.64, longitude=50.87,
                      phone="025", manager_id=mgr.id, category="gym")
        other_venue = Venue(name=f"باشگاهِ دیگر {tag}", address="قم", latitude=34.6,
                            longitude=50.8, phone="025", manager_id=other.id, category="gym")
        s.add(venue); s.add(other_venue)
        s.commit()
        s.refresh(venue)
        mgr_id, cust_id, other_id, vid, other_vid = (
            mgr.id, cust.id, other.id, venue.id, other_venue.id)
    plan = {"venue_id": vid, "title": f"پک {sessions} جلسه", "plan_type": "sessions_pack",
            "price": 900_000, "sessions_count": sessions, "duration_days": None}
    r = client.post("/api/v1/memberships/plans", json=plan,
                    headers=auth(f"0912551{tag}"))
    assert r.status_code == 201, r.text
    inv = client.post("/api/v1/memberships/purchases", json={"plan_id": r.json()["id"]},
                      headers=auth(f"0912552{tag}"))
    assert inv.status_code == 201, inv.text
    pid = inv.json()["id"]
    paid = client.post(f"/api/v1/memberships/purchases/{pid}/pay", json=PAY,
                       headers=auth(f"0912552{tag}"))
    assert paid.status_code == 200, paid.text
    return (f"0912551{tag}", f"0912552{tag}", pid, vid, f"0912553{tag}", other_vid, mgr_id)


def _events(purchase_id: int):
    with Session(test_engine) as s:
        return s.exec(select(MembershipSessionEvent)
                      .where(MembershipSessionEvent.purchase_id == purchase_id)
                      .order_by(MembershipSessionEvent.id)).all()


# ─────────────── ۱) ممیزیِ «چه کسی، کِی» ───────────────

def test_each_consumption_records_an_audit_row(client):
    mgr, _cust, pid, _vid, *_ = _setup(client, "001")
    for expected_after in (2, 1, 0):
        r = client.post(f"/api/v1/memberships/purchases/{pid}/consume", headers=auth(mgr))
        assert r.status_code == 200, r.text
        assert r.json()["sessions_remaining"] == expected_after

    rows = _events(pid)
    assert len(rows) == 3
    assert [x.sessions_remaining_after for x in rows] == [2, 1, 0]
    assert all(x.event_type == SessionEventType.CONSUMED for x in rows)
    assert all(x.actor_id == rows[0].actor_id for x in rows)
    assert rows[0].venue_id == _purchase_venue(pid)


def _purchase_venue(pid: int) -> int:
    with Session(test_engine) as s:
        return s.get(MembershipPurchase, pid).venue_id


def test_events_are_newest_first_and_bounded(client):
    mgr, _cust, pid, _vid, *_ = _setup(client, "002", sessions=2)
    for _ in range(2):
        assert client.post(f"/api/v1/memberships/purchases/{pid}/consume",
                           headers=auth(mgr)).status_code == 200
    r = client.get(f"/api/v1/memberships/purchases/{pid}/events", headers=auth(mgr))
    assert r.status_code == 200, r.text
    items = r.json()
    assert [x["sessions_remaining_after"] for x in items] == [0, 1]   # تازه‌ترین اول
    assert all(x["event_type"] == "consumed" for x in items)
    assert all(isinstance(x["created_at"], str) for x in items)
    assert all(x["actor_name"] == "مدیر 002" for x in items)


def test_refund_is_audited_with_amount_and_reason(client):
    mgr, _cust, pid, _vid, *_ = _setup(client, "003")
    assert client.post(f"/api/v1/memberships/purchases/{pid}/consume",
                       headers=auth(mgr)).status_code == 200
    r = client.post(f"/api/v1/memberships/purchases/{pid}/refund",
                    json={"reason": "انصرافِ همان روز"}, headers=auth(mgr))
    assert r.status_code == 200, r.text

    rows = _events(pid)
    assert [x.event_type for x in rows] == [SessionEventType.CONSUMED, SessionEventType.REFUNDED]
    refund = rows[-1]
    assert refund.amount == 900_000 and refund.detail == "انصرافِ همان روز"
    assert refund.sessions_remaining_after == 0
    assert refund.actor_id is not None


def test_blocked_refund_writes_no_audit_row(client):
    """۴۰۰/۴۰۳ نباید تاریخچه را پر کند — ردیفِ ممیزی فقط برای اقدامِ واقعی."""
    _mgr, cust, pid, _vid, other_phone, *_ = _setup(client, "004")
    assert client.post(f"/api/v1/memberships/purchases/{pid}/refund", json={},
                       headers=auth(other_phone)).status_code == 403
    assert client.post(f"/api/v1/memberships/purchases/{pid}/consume",
                       headers=auth(cust)).status_code == 403
    assert _events(pid) == []


# ─────────────── ۲) نگهبانِ شمارنده در خودِ SQL ───────────────

def test_consume_decrements_with_a_guarded_single_update(client):
    """شاهدِ ساختارِ کوئری: `WHERE … sessions_remaining > 0` داخل UPDATE است، نه در Python.

    این همان چیزی است که race را می‌بندد: اگر دو درخواست همزمان به همان ردیف برسند،
    دومی rowcount=0 می‌گیرد و ۴۰۰ می‌شود، پس عدد هرگز منفی نمی‌شود. روی SQLite نمی‌توان
    دو تراکنش همزمان داشت (conftest ⇒ BEGIN IMMEDIATE)، ولی شکلِ statement مستقل از
    dialect است و روی PostgreSQL واقعی در pg_consume22.py اثبات می‌شود.
    """
    mgr, _cust, pid, _vid, *_ = _setup(client, "005", sessions=1)
    captured = []

    @event.listens_for(test_engine, "before_cursor_execute")
    def _recv(conn, cursor, statement, parameters, context, executemany):
        captured.append((statement, parameters))

    try:
        ok = client.post(f"/api/v1/memberships/purchases/{pid}/consume", headers=auth(mgr))
        assert ok.status_code == 200, ok.text
        late = client.post(f"/api/v1/memberships/purchases/{pid}/consume", headers=auth(mgr))
        assert late.status_code == 400, late.text
        assert "تمام شده" in late.json()["detail"]
    finally:
        event.remove(test_engine, "before_cursor_execute", _recv)

    updates = [(st, pr) for st, pr in captured
               if st.strip().upper().startswith("UPDATE ") and "membership_purchases" in st]
    assert len(updates) == 2, [st for st, _ in captured]
    guard = updates[0]
    assert "sessions_remaining > ?" in guard[0] or "sessions_remaining > :" in guard[0]
    assert 0 in guard[1]                       # آستانه‌ی نگهبان واقعاً پارامترِ همین UPDATE است
    # ردیفِ دوم (شکست‌خورده) هیچ writes نمی‌گذارد: شمارنده و تاریخچه ثابت‌اند
    with Session(test_engine) as s:
        assert s.get(MembershipPurchase, pid).sessions_remaining == 0
    assert len(_events(pid)) == 1


def test_counter_never_goes_negative_and_audit_matches_wins(client):
    mgr, _cust, pid, _vid, *_ = _setup(client, "006", sessions=2)
    wins = 0
    for _ in range(5):
        r = client.post(f"/api/v1/memberships/purchases/{pid}/consume", headers=auth(mgr))
        if r.status_code == 200:
            wins += 1
        else:
            assert r.status_code == 400
    with Session(test_engine) as s:
        assert s.get(MembershipPurchase, pid).sessions_remaining == 0
    assert wins == 2
    assert len(_events(pid)) == 2              # به‌ازای هر بُرد یک ردیف، نه هر پنج تلاش


# ─────────────── ۳) دسترسی به تاریخچه ───────────────

def test_only_that_venues_manager_can_read_events(client):
    _mgr, cust, pid, _vid, other_phone, *_ = _setup(client, "007")
    assert client.post(f"/api/v1/memberships/purchases/{pid}/consume",
                       headers=auth(_mgr)).status_code == 200
    assert client.get(f"/api/v1/memberships/purchases/{pid}/events",
                      headers=auth(other_phone)).status_code == 403
    assert client.get(f"/api/v1/memberships/purchases/{pid}/events",
                      headers=auth(cust)).status_code == 403
    assert client.get(f"/api/v1/memberships/purchases/{pid}/events").status_code in (401, 403)
    assert client.get("/api/v1/memberships/purchases/999999/events",
                      headers=auth(_mgr)).status_code == 404


# ─────────────── ۴) نامِ عامل بدون N+1 ───────────────

def _name_lookup_count(client, mgr: str, pid: int) -> int:
    """چند SELECT «نامِ عامل» در یک درخواستِ تاریخچه اجرا می‌شود؟"""
    captured = []

    @event.listens_for(test_engine, "before_cursor_execute")
    def _recv(conn, cursor, statement, parameters, context, executemany):
        captured.append(statement)

    try:
        r = client.get(f"/api/v1/memberships/purchases/{pid}/events", headers=auth(mgr))
        assert r.status_code == 200, r.text
        rows = r.json()
    finally:
        event.remove(test_engine, "before_cursor_execute", _recv)
    lookups = [st for st in captured
               if st.strip().upper().startswith("SELECT ")
               and "from users" in st.lower() and " in (" in st.lower()]
    return len(lookups), len(rows)


def test_actor_names_resolve_in_one_query_not_one_per_row(client):
    mgr, _cust, pid, _vid, *_ = _setup(client, "008", sessions=4)
    for _ in range(2):
        assert client.post(f"/api/v1/memberships/purchases/{pid}/consume",
                           headers=auth(mgr)).status_code == 200
    two_lookups, two_rows = _name_lookup_count(client, mgr, pid)
    assert two_rows == 2
    for _ in range(2):
        assert client.post(f"/api/v1/memberships/purchases/{pid}/consume",
                           headers=auth(mgr)).status_code == 200
    four_lookups, four_rows = _name_lookup_count(client, mgr, pid)
    assert four_rows == 4
    # شیبِ صفر: دو ردیف و چهار ردیف هر دو دقیقاً یک کوئریِ نام می‌زنند
    assert two_lookups == four_lookups == 1
    last = client.get(f"/api/v1/memberships/purchases/{pid}/events", headers=auth(mgr)).json()
    assert {x["actor_name"] for x in last} == {"مدیر 008"}
