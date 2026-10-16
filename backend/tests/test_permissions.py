# backend/tests/test_permissions.py
"""ماتریس دسترسی نقش‌ها روی سه مسیر حساس: صف انتظار، چک‌این QR و نظرات.

نسخهٔ قبلی این فایل برای `httpx.AsyncClient` و fixture های `user_token`/`slot_id`
نوشته شده بود که در این هارنس وجود ندارند (۲۱ ERROR) و assertion های «in [200, 400]»
تقریباً هر رفتاری را قبول می‌کرد. اینجا همان مسیرها با harness واقعی (TestClient +
هدر تستی = شماره تلفن) و کدهای **دقیق** بررسی می‌شوند.
"""
from sqlmodel import Session, select

from conftest import test_engine
from helpers import auth
from app.models.user import UserRole

WL = "/api/v1/waitlist"
CK = "/api/v1/checkin"
RV = "/api/v1/reviews"


def _booked(seed, owner_phone: str, role: UserRole = UserRole.USER) -> dict:
    """صاحب‌سالن + سانس رزروشده + رزرو قطعی."""
    owner = seed["user"](owner_phone, role=role)
    return {"owner": owner, **seed["booking"](owner)}


def _waiter(seed, phone: str, role: UserRole = UserRole.USER):
    return seed["user"](phone, role=role)


def _join(client, phone: str, slot_id: int):
    return client.post(f"{WL}/join/{slot_id}", headers=auth(phone))


# ─────────────────────────── صف انتظار ───────────────────────────

def test_waitlist_join_requires_auth(client, seed):
    ctx = _booked(seed, "09220000001")
    r = client.post(f"{WL}/join/{ctx['slot'].id}")
    assert r.status_code == 401


def test_waitlist_join_allowed_for_regular_user(client, seed):
    ctx = _booked(seed, "09220000002")
    waiter = _waiter(seed, "09220000003")
    assert _join(client, waiter.phone, ctx["slot"].id).status_code == 201


def test_slot_waitlist_visible_only_to_manager_and_admins(client, seed):
    ctx = _booked(seed, "09220000004")
    slot_id = ctx["slot"].id
    waiter = _waiter(seed, "09220000005")
    assert _join(client, waiter.phone, slot_id).status_code == 201

    stranger = _waiter(seed, "09220000006")
    assert client.get(f"{WL}/slot/{slot_id}", headers=auth(stranger.phone)).status_code == 403
    # مدیر همان سالن
    assert client.get(f"{WL}/slot/{slot_id}", headers=auth(ctx["owner"].phone)).status_code == 200
    # نقش‌های بالاتر (فیلتر نقش در endpoint با مقدار enum مقایسه می‌شود)
    club = _waiter(seed, "09220000007", role=UserRole.CLUB_ADMIN)
    assert client.get(f"{WL}/slot/{slot_id}", headers=auth(club.phone)).status_code == 200
    root = _waiter(seed, "09220000008", role=UserRole.SUPER_ADMIN)
    assert client.get(f"{WL}/slot/{slot_id}", headers=auth(root.phone)).status_code == 200


# ─────────────────────────── چک‌این QR ───────────────────────────

def _qr_code(client, phone: str, booking_id: int) -> str:
    r = client.get(f"{CK}/booking/{booking_id}/qr-code", headers=auth(phone))
    assert r.status_code == 200, r.text
    return r.json()["check_in_code"]


def test_checkin_qr_only_for_owner(client, seed):
    ctx = _booked(seed, "09220000010")
    other = _waiter(seed, "09220000011")
    assert client.get(f"{CK}/booking/{ctx['booking'].id}/qr-code",
                      headers=auth(other.phone)).status_code == 403
    code = _qr_code(client, ctx["owner"].phone, ctx["booking"].id)
    assert code
    # همان کد در فراخوانی دوم هم برگردانده می‌شود (ensure_check_in_code idempotent است)
    assert _qr_code(client, ctx["owner"].phone, ctx["booking"].id) == code


def test_checkin_verify_role_gates(client, seed):
    #کنترل‌کنندهٔ چک‌این باید مدیر همان سالن باشد (نقش + مالکیت سالن هر دو لازم‌اند)
    ctx = _booked(seed, "09220000012", role=UserRole.VENUE_MANAGER)
    code = _qr_code(client, ctx["owner"].phone, ctx["booking"].id)

    assert client.post(f"{CK}/verify", params={"check_in_code": code}).status_code == 401
    regular = _waiter(seed, "09220000013")
    denied = client.post(f"{CK}/verify", params={"check_in_code": code}, headers=auth(regular.phone))
    assert denied.status_code == 403
    assert "مدیران سالن" in denied.text

    ok = client.post(f"{CK}/verify", params={"check_in_code": code}, headers=auth(ctx["owner"].phone))
    assert ok.status_code == 200, ok.text
    assert ok.json()["booking_id"] == ctx["booking"].id

    again = client.post(f"{CK}/verify", params={"check_in_code": code}, headers=auth(ctx["owner"].phone))
    assert again.status_code == 400  # کد قبلاً استفاده شده

    bogus = client.post(f"{CK}/verify", params={"check_in_code": "nope-123"},
                        headers=auth(ctx["owner"].phone))
    assert bogus.status_code == 400


def test_checkin_verify_blocked_for_other_venue_manager(client, seed):
    """مدیر یک سالن دیگر نمی‌تواند رزرو سالن دیگری را چک‌این کند."""
    ctx = _booked(seed, "09220000030", role=UserRole.VENUE_MANAGER)
    code = _qr_code(client, ctx["owner"].phone, ctx["booking"].id)
    rival = _booked(seed, "09220000031", role=UserRole.VENUE_MANAGER)
    r = client.post(f"{CK}/verify", params={"check_in_code": code}, headers=auth(rival["owner"].phone))
    assert r.status_code == 400, r.text
    assert "دسترسی به این سالن" in r.text
    # و رزرو هم چک‌این نشده باشد
    assert client.get(f"{CK}/booking/{ctx['booking'].id}/status",
                      headers=auth(ctx["owner"].phone)).json()["checked_in"] is False


def test_checkin_verify_allowed_for_admin_roles(client, seed):
    club_ctx = _booked(seed, "09220000014")
    club_code = _qr_code(client, club_ctx["owner"].phone, club_ctx["booking"].id)
    club = _waiter(seed, "09220000015", role=UserRole.CLUB_ADMIN)
    assert client.post(f"{CK}/verify", params={"check_in_code": club_code},
                       headers=auth(club.phone)).status_code == 200

    root_ctx = _booked(seed, "09220000016")
    root_code = _qr_code(client, root_ctx["owner"].phone, root_ctx["booking"].id)
    root = _waiter(seed, "09220000017", role=UserRole.SUPER_ADMIN)
    assert client.post(f"{CK}/verify", params={"check_in_code": root_code},
                       headers=auth(root.phone)).status_code == 200


def test_checkin_status_visibility(client, seed):
    ctx = _booked(seed, "09220000018")
    booking_id = ctx["booking"].id
    assert client.get(f"{CK}/booking/{booking_id}/status").status_code == 401
    assert client.get(f"{CK}/booking/{booking_id}/status",
                      headers=auth(ctx["owner"].phone)).status_code == 200
    stranger = _waiter(seed, "09220000019")
    assert client.get(f"{CK}/booking/{booking_id}/status",
                      headers=auth(stranger.phone)).status_code == 403
    assert client.get(f"{CK}/booking/999999/status",
                      headers=auth(ctx["owner"].phone)).status_code == 404


# ─────────────────────────── نظرات ───────────────────────────

def test_reviews_public_listing(client, seed):
    ctx = _booked(seed, "09220000020")
    r = client.get(f"{RV}/venue/{ctx['venue'].id}")
    assert r.status_code == 200
    assert r.json() == []


def test_review_create_role_and_validation(client, seed):
    ctx = _booked(seed, "09220000021")
    user = _waiter(seed, "09220000022")
    payload = {"venue_id": ctx["venue"].id, "rating": 4, "comment": "عالی بود"}

    assert client.post(f"{RV}/", json=payload).status_code == 401
    created = client.post(f"{RV}/", json=payload, headers=auth(user.phone))
    assert created.status_code == 201, created.text
    assert created.json()["rating"] == 4
    assert created.json()["venue_name"] == "سالن تست"

    dup = client.post(f"{RV}/", json=payload, headers=auth(user.phone))
    assert dup.status_code == 400

    manager = _waiter(seed, "09220000023", role=UserRole.VENUE_MANAGER)
    blocked = client.post(f"{RV}/", json={"venue_id": ctx["venue"].id, "rating": 5},
                          headers=auth(manager.phone))
    assert blocked.status_code == 403

    bad = client.post(f"{RV}/", json={"venue_id": ctx["venue"].id, "rating": 9},
                      headers=auth(_waiter(seed, "09220000024").phone))
    assert bad.status_code == 422


def test_review_edit_and_delete_ownership(client, seed):
    ctx = _booked(seed, "09220000025")
    author = _waiter(seed, "09220000026")
    other = _waiter(seed, "09220000027")
    made = client.post(f"{RV}/", json={"venue_id": ctx["venue"].id, "rating": 3,
                                       "comment": "خوب"}, headers=auth(author.phone))
    assert made.status_code == 201, made.text
    rid = made.json()["id"]

    body = {"venue_id": ctx["venue"].id, "rating": 5, "comment": "ویرایش شده"}
    assert client.put(f"{RV}/{rid}", json=body,
                      headers=auth(other.phone)).status_code == 403
    edited = client.put(f"{RV}/{rid}", json=body, headers=auth(author.phone))
    assert edited.status_code == 200, edited.text
    assert edited.json()["rating"] == 5

    assert client.delete(f"{RV}/{rid}", headers=auth(other.phone)).status_code == 403
    assert client.delete(f"{RV}/999999", headers=auth(author.phone)).status_code == 404
    assert client.delete(f"{RV}/{rid}", headers=auth(author.phone)).status_code == 200
    with Session(test_engine) as s:
        from app.models.review import Review
        assert s.exec(select(Review).where(Review.id == rid)).first() is None


def test_my_reviews_requires_auth(client, seed):
    ctx = _booked(seed, "09220000028")
    user = _waiter(seed, "09220000029")
    assert client.get(f"{RV}/my").status_code == 401
    client.post(f"{RV}/", json={"venue_id": ctx["venue"].id, "rating": 4},
                headers=auth(user.phone))
    mine = client.get(f"{RV}/my", headers=auth(user.phone))
    assert mine.status_code == 200
    assert len(mine.json()) == 1
    assert mine.json()[0]["venue_id"] == ctx["venue"].id
