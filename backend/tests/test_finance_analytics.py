# backend/tests/test_finance_analytics.py
"""تست گزارش‌های مالی — occupancy، درآمد به تفکیک منبع، سری‌ها، export و اتصال جریان‌های واقعی."""
from datetime import date, time as dtime

from app.models.user import UserRole
from app.models.venue import Venue
from app.models.slot import Slot, SlotStatus
from helpers import auth

BASE = "/api/v1/finance"

VALID_CARD = {"card_number": "6037991122334455", "cvv": "123"}


def _manager_with_slots(seed, db, phone, statuses, day=None):
    user = seed["user"](phone, role=UserRole.VENUE_MANAGER)
    venue = Venue(name="سالن گزارش", category="futsal", address="آدرس", latitude=35.7,
                  longitude=51.4, phone="09123333333", manager_id=user.id)
    db.add(venue)
    db.commit()
    db.refresh(venue)
    day = day or date.today()
    created = []
    for i, st in enumerate(statuses):
        s = Slot(venue_id=venue.id, slot_date=day, start_time=dtime(8 + i, 0),
                 duration=90, base_price=200_000, current_price=200_000, status=st)
        db.add(s)
        created.append(s)
    db.commit()
    db.refresh(venue)
    db.close()
    return user, venue, created


# ─────────────────────────── occupancy ───────────────────────────

def test_occupancy_calculation(client, seed, db):
    manager, venue, _ = _manager_with_slots(
        seed, db, "09310000001",
        [SlotStatus.BOOKED, SlotStatus.RESERVED, SlotStatus.AVAILABLE, SlotStatus.BLOCKED])
    h = auth(manager.phone)
    today = date.today().isoformat()
    r = client.get(f"{BASE}/occupancy?venue_id={venue.id}&from={today}&to={today}", headers=h)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["total_active_slots"] == 3      # بلاک‌شده «فعال» حساب نمی‌شود
    assert body["occupied_slots"] == 2          # booked + reserved
    assert body["occupancy_rate"] == round(2 / 3 * 100, 2)
    assert len(body["per_venue"]) == 1
    assert body["per_venue"][0]["venue_id"] == venue.id


def test_occupancy_super_admin_without_venue_filter(client, seed, db):
    """scope=None ⇒ فهرست سالن‌ها از scalarها ساخته می‌شود — رگرشن برای اشتباه 500 قبلی."""
    manager, venue, _ = _manager_with_slots(
        seed, db, "09310000009", [SlotStatus.BOOKED, SlotStatus.AVAILABLE])
    sup = seed["user"]("09310000008", role=UserRole.SUPER_ADMIN)
    today = date.today().isoformat()
    r = client.get(f"{BASE}/occupancy?from={today}&to={today}", headers=auth(sup.phone))
    assert r.status_code == 200, r.text
    assert venue.id in [x["venue_id"] for x in r.json()["per_venue"]]


def test_low_demand_slots(client, seed, db):
    manager, venue, _ = _manager_with_slots(
        seed, db, "09310000002",
        [SlotStatus.BOOKED, SlotStatus.AVAILABLE, SlotStatus.AVAILABLE, SlotStatus.AVAILABLE])
    today = date.today().isoformat()
    r = client.get(f"{BASE}/low-demand-slots?venue_id={venue.id}&from={today}&to={today}"
                   f"&threshold=1",
                   headers=auth(manager.phone))
    assert r.status_code == 200, r.text
    rows = {x["hour"]: x for x in r.json()}
    # ساعت ۸ (۲۵٪ اشغال) زیر آستانه نیست؛ ساعت‌های ۹..۱۱ با ۰٪ بله
    assert 8 not in rows
    assert rows[9]["occupancy_rate"] == 0.0 and rows[9]["total_slots"] == 1
    assert all(x["occupancy_rate"] <= 1.0 for x in rows.values())


# ─────────────────────────── اتصال جریان‌های واقعی ───────────────────────────

def _pay_booking(client, seed, db, phone="09310000010"):
    """رزرو → فاکتور → پرداخت mock — تا جریان اصلی، دفتر کل را پر کند."""
    owner = seed["user"](phone, role=UserRole.VENUE_MANAGER)
    chain = seed["booking"](owner)  # payment_amount=500_000، slot 2026-09-10
    h = auth(owner.phone)
    inv = client.post("/api/v1/payments/", json={"booking_id": chain["booking"].id}, headers=h)
    assert inv.status_code == 201, inv.text
    pid = inv.json()["id"]
    pay = client.post(f"/api/v1/payments/{pid}/pay", json=VALID_CARD, headers=h)
    assert pay.status_code == 200, pay.text
    return owner, chain, pid


def test_booking_payment_writes_ledger(client, seed, db):
    owner, chain, pid = _pay_booking(client, seed, db)
    h = auth(owner.phone)

    txs = client.get(f"{BASE}/transactions?source_type=booking_payment", headers=h).json()
    assert txs["total"] == 1
    tx = txs["items"][0]
    assert tx["amount"] == 500_000
    assert tx["direction"] == "income"
    assert tx["venue_id"] == chain["venue"].id
    assert tx["counterparty"] == owner.id
    assert tx["idempotency_key"] == f"booking-payment:{pid}"

    by_source = client.get(f"{BASE}/revenue/by-source?venue_id={chain['venue'].id}",
                           headers=h).json()
    booking_row = next(s for s in by_source["by_source"] if s["source"] == "booking_payment")
    assert booking_row["income"] == 500_000

    series = client.get(f"{BASE}/revenue/series?group_by=day&venue_id={chain['venue'].id}",
                        headers=h).json()
    assert sum(p["income"] for p in series["points"]) == 500_000


def test_booking_cancel_writes_refund(client, seed, db):
    owner, chain, pid = _pay_booking(client, seed, db, phone="09310000011")
    h = auth(owner.phone)
    cancel = client.delete(f"/api/v1/bookings/{chain['booking'].id}", headers=h)
    assert cancel.status_code == 200, cancel.text
    assert cancel.json()["refunded"] is True

    refunds = client.get(f"{BASE}/transactions?type=refund", headers=h).json()
    assert refunds["total"] == 1
    assert refunds["items"][0]["amount"] == 500_000
    assert refunds["items"][0]["direction"] == "expense"
    assert refunds["items"][0]["counterparty"] == owner.id

    # پرداخت اصلی دست‌نخورده (cleared) و سود خالص به صفر رسیده
    orig = client.get(f"{BASE}/transactions?source_type=booking_payment", headers=h).json()
    assert orig["items"][0]["status"] == "cleared"
    dash = client.get(f"{BASE}/dashboard?venue_id={chain['venue'].id}", headers=h).json()
    assert dash["gross_profit"] == 0
    assert dash["open_receivables"] == 0


def test_membership_and_game_payments_write_ledger(client, seed, db):
    # --- membership ---
    owner = seed["user"]("09310000012", role=UserRole.VENUE_MANAGER)
    chain = seed["booking"](owner)
    venue = chain["venue"]
    h = auth(owner.phone)
    plan = client.post("/api/v1/memberships/plans",
                       json={"venue_id": venue.id, "title": "ماهانه", "plan_type": "monthly",
                             "duration_days": 30, "price": 400_000}, headers=h)
    assert plan.status_code == 201, plan.text
    purchase = client.post("/api/v1/memberships/purchases",
                           json={"plan_id": plan.json()["id"]},
                           headers=auth(owner.phone))  # خریدار = خود مدیر (user عادی نیست ولی مجاز)
    assert purchase.status_code == 201, purchase.text
    pay = client.post(f"/api/v1/memberships/purchases/{purchase.json()['id']}/pay",
                      json=VALID_CARD, headers=auth(owner.phone))
    assert pay.status_code == 200, pay.text

    ms = client.get(f"{BASE}/transactions?source_type=membership_purchase", headers=h).json()
    assert ms["total"] == 1 and ms["items"][0]["amount"] == 400_000

    # --- game share (split) ---
    player = seed["user"]("09310000013")
    g_chain = seed["booking"](owner)
    game = client.post("/api/v1/games/", json={"booking_id": g_chain["booking"].id,
                                               "name": "بازی مالی", "max_players": 5,
                                               "visibility": "public",
                                               "payment_mode": "split_payment"},
                       headers=auth(owner.phone))
    assert game.status_code == 201, game.text
    gid = game.json()["id"]
    assert client.post(f"/api/v1/games/{gid}/join", headers=auth(player.phone)).status_code == 200
    parts = client.get(f"/api/v1/games/{gid}/participants", headers=auth(player.phone)).json()
    pid = next(p["id"] for p in parts if p["user_id"] == player.id)
    assert client.post(f"/api/v1/games/{gid}/payments/{pid}/pay",
                       headers=auth(player.phone)).status_code == 200

    gp = client.get(f"{BASE}/transactions?source_type=game_payment", headers=h).json()
    assert gp["total"] == 1
    assert gp["items"][0]["amount"] == 100_000  # 500_000 // 5
    assert gp["items"][0]["venue_id"] == g_chain["venue"].id


# ─────────────────────────── خروجی CSV ───────────────────────────

def test_export_csv(client, seed, db):
    owner, chain, _ = _pay_booking(client, seed, db, phone="09310000020")
    h = auth(owner.phone)
    r = client.get(f"{BASE}/export?format=csv&venue_id={chain['venue'].id}", headers=h)
    assert r.status_code == 200
    assert "text/csv" in r.headers["content-type"]
    lines = r.text.strip().splitlines()
    assert lines[0].lstrip("\ufeff").startswith("id,occurred_at,type")
    assert any("booking_payment" in ln for ln in lines)

    bad = client.get(f"{BASE}/export?format=pdf", headers=h)
    assert bad.status_code == 400