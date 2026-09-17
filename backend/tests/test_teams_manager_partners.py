# backend/tests/test_teams_manager_partners.py
"""تست انتساب رزرو، دید شریکِ مدیر سالن، توالی ممیزی و fanout اعلان."""
from datetime import date, datetime, time as dtime, timedelta, timezone

from sqlmodel import Session

from conftest import test_engine
from helpers import auth, err_code
from app.models.booking import Booking, BookingStatus
from app.models.slot import Slot, SlotStatus
from app.models.user import User
from app.models.venue import Venue

BASE = "/api/v1/teams"
CAP = "09380000001"
M1 = "09380000002"
MGR = "09380000003"     # مدیر سالن
OTHER_MGR = "09380000009"
OUTSIDER = "09380000004"
OUT_BK = "09380000005"  # رزروکننده غیرعضو در همان سالن


def _uid(phone):
    with Session(test_engine) as s:
        return s.exec(select_user_by_phone(phone)).first().id


def select_user_by_phone(phone):
    from sqlmodel import select
    return select(User).where(User.phone == phone)


def _make_booking_at(manager_phone, booker_phone, price=600000, day=None,
                     venue_name="سالن شریک"):
    """Venue(manager) + Slot + Booking(booker) — خارج از API، مستقیم."""
    day = day or (date.today() + timedelta(days=5))
    with Session(test_engine) as s:
        mgr = s.exec(select_user_by_phone(manager_phone)).first()
        booker = s.exec(select_user_by_phone(booker_phone)).first()
        venue = Venue(name=venue_name, category="futsal", address="آ",
                      latitude=35.0, longitude=51.0, phone="021",
                      manager_id=mgr.id)
        s.add(venue); s.commit(); s.refresh(venue)
        slot = Slot(venue_id=venue.id, slot_date=day, start_time=dtime(19, 0),
                    duration=90, base_price=price, current_price=price,
                    status=SlotStatus.BOOKED)
        s.add(slot); s.commit(); s.refresh(slot)
        booking = Booking(slot_id=slot.id, user_id=booker.id,
                          status=BookingStatus.CONFIRMED, payment_amount=price)
        s.add(booking); s.commit(); s.refresh(booking)
        return {"venue_id": venue.id, "slot_date": day, "booking_id": booking.id}


def _team_two_members(client, seed, name="تیم شریک"):
    from app.models.user import UserRole
    for ph in (CAP, M1, OUTSIDER, OUT_BK):
        seed["user"](ph)
    for ph in (MGR, OTHER_MGR):
        seed["user"](ph, role=UserRole.VENUE_MANAGER)
    t = client.post(f"{BASE}/", json={"name": name, "visibility": "public"},
                    headers=auth(CAP)).json()
    mid = client.post(f"{BASE}/{t['id']}/invite", json={"phone": M1},
                      headers=auth(CAP)).json()["member_id"]
    client.post(f"{BASE}/{t['id']}/invitations/{mid}/accept", headers=auth(M1))
    return t


# ─────────────────────────── TeamBooking link ───────────────────────────

def test_link_only_own_booking(client, seed):
    t = _team_two_members(client, seed, name="تیم لینک")
    bk = _make_booking_at(MGR, M1, day=date.today() + timedelta(days=3))
    r = client.post(f"{BASE}/{t['id']}/bookings/{bk['booking_id']}/link",
                    headers=auth(M1))
    assert r.status_code == 201, r.text
    item = r.json()
    assert item["venue_id"] == bk["venue_id"] and item["payment_amount"] == 600000
    # لینک تکراری → 409
    assert err_code(client.post(f"{BASE}/{t['id']}/bookings/{bk['booking_id']}/link",
                                headers=auth(M1))) == "ALREADY_LINKED"
    # مالکیت: کاپیتان نمی‌تواند رزرو M1 را لینک کند
    bk2 = _make_booking_at(MGR, M1, day=date.today() + timedelta(days=4),
                           venue_name="سالن دوم")
    assert err_code(client.post(f"{BASE}/{t['id']}/bookings/{bk2['booking_id']}/link",
                                headers=auth(CAP))) == "NOT_MY_BOOKING"
    # رزرو ناشناس
    assert client.post(f"{BASE}/{t['id']}/bookings/99999/link",
                       headers=auth(M1)).status_code == 404
    # فهرست تاریخچه — عضو فعال
    hist = client.get(f"{BASE}/{t['id']}/bookings", headers=auth(M1)).json()
    assert hist["total"] == 1 and hist["items"][0]["booking_id"] == bk["booking_id"]


# ─────────────────────────── دید مدیر سالن ───────────────────────────

def test_manager_partners_aggregation(client, seed):
    t = _team_two_members(client, seed, name="تیم همکار")
    # رزروِ عضو (M1) در سالن مدیر — از طریق لینک
    bk_link = _make_booking_at(MGR, M1, price=600000, day=date.today() + timedelta(days=6))
    client.post(f"{BASE}/{t['id']}/bookings/{bk_link['booking_id']}/link",
                headers=auth(M1))
    # رزرو بدون لینکِ کاپیتان (فقط از راه عضویت شمرده می‌شود) — امروز+۲
    bk_own = _make_booking_at(MGR, CAP, price=450000, day=date.today() + timedelta(days=2))
    # رزرو غیرعضو در همان سالن — نباید بشمارد
    _make_booking_at(MGR, OUT_BK, price=999999, day=date.today())
    # رزرو در سالن مدیر دیگر با قیمت نجومی — نباید در دامنه MGR بیاید
    other_bk = _make_booking_at(OTHER_MGR, M1, price=10_000_000,
                                day=date.today() + timedelta(days=9),
                                venue_name="سالن رقابت")
    other_venue = other_bk["venue_id"]

    r = client.get("/api/v1/teams/manager/partners", headers=auth(MGR))
    assert r.status_code == 200, r.text
    items = r.json()["items"]
    assert len(items) == 1
    p = items[0]
    assert p["team_id"] == t["id"] and p["name"] == "تیم همکار"
    assert p["captain_id"] == _uid(CAP) and p["captain_phone"] == CAP
    assert p["total_bookings_at_my_venues"] == 2
    assert p["upcoming_bookings_at_my_venues"] == 2
    assert p["spent_at_my_venues"] == 600000 + 450000
    assert p["members_count"] == 2
    assert p["last_booking_date"] == str(max(bk_link["slot_date"], bk_own["slot_date"]))

    # فیلتر venue_id معتبر → فقط رزروهای همان سالن
    by_venue = client.get(f"/api/v1/teams/manager/partners?venue_id={bk_own['venue_id']}",
                          headers=auth(MGR))
    assert by_venue.status_code == 200
    v_items = by_venue.json()["items"]
    assert len(v_items) == 1 and v_items[0]["spent_at_my_venues"] == 450000
    assert v_items[0]["total_bookings_at_my_venues"] == 1
    # venue متعلق به مدیر دیگر → 403
    forbidden = client.get(f"/api/v1/teams/manager/partners?venue_id={other_venue}",
                           headers=auth(MGR))
    assert forbidden.status_code == 403
    # مدیر دیگر هم تیم را در دامنه خودش می‌بیند (رزروی عضو در سالن او هست)
    o = client.get("/api/v1/teams/manager/partners", headers=auth(OTHER_MGR)).json()
    assert o["total"] == 1 and o["items"][0]["spent_at_my_venues"] == 10_000_000


def test_partners_requires_manager_role(client, seed):
    t = _team_two_members(client, seed, name="تیم بی‌مدیر")
    _make_booking_at(MGR, M1)
    r = client.get("/api/v1/teams/manager/partners", headers=auth(OUTSIDER))
    assert r.status_code == 403


# ─────────────────────────── ممیزی + اعلان‌ها ───────────────────────────

def test_audit_trail_ordering_and_full_lifecycle_notifs(client, seed, sent_notifications):
    t = _team_two_members(client, seed, name="تیم ممیزی")
    # سهم بساز و یکی را پرداخت کن
    g = client.post(f"{BASE}/{t['id']}/dues/generate",
                    json={"amount": 500, "title": "ممیزی",
                          "due_date": str(date.today() + timedelta(days=4))},
                    headers=auth(CAP)).json()
    due = g["items"][0]
    client.post(f"{BASE}/{t['id']}/dues/{due['id']}/pay", json={}, headers=auth(CAP))
    bk = _make_booking_at(MGR, M1, day=date.today() + timedelta(days=1))
    client.post(f"{BASE}/{t['id']}/bookings/{bk['booking_id']}/link", headers=auth(M1))

    audit = client.get(f"{BASE}/{t['id']}/audit", headers=auth(CAP)).json()
    actions = [a["action"] for a in audit["items"]]
    # جدیدترین اول
    assert actions[0] == "booking_linked"
    assert "dues_paid" in actions and "dues_generated" in actions
    assert "member_accepted" in actions and "member_invited" in actions
    assert actions[-1] == "created"
    assert all(a["actor_name"] for a in audit["items"] if a["actor_id"])
    # غیرمدیر نمی‌تواند ممیزی را ببیند
    assert client.get(f"{BASE}/{t['id']}/audit", headers=auth(M1)).status_code == 403

    # fanout اعلان در کل چرخه عمر
    types = {n["type"] for n in sent_notifications}
    assert {"team_created", "team_invitation", "dues_created", "dues_paid",
            "team_booking_linked"} <= types