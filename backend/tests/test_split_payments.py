# backend/tests/test_split_payments.py
"""تست API پرداخت اشتراکی تیم — EQUAL/CUSTOM/PERCENTAGE."""
from helpers import auth, err_code
from datetime import datetime, timedelta, timezone

BASE = "/api/v1/split-payments"


def _create_team(client, seed, phone):
    """Create a team for testing."""
    from sqlmodel import Session, select
    from conftest import test_engine
    from app.models.user import User
    
    with Session(test_engine) as s:
        user = s.exec(select(User).where(User.phone == phone)).first()
        if not user:
            seed["user"](phone)
    
    r = client.post("/api/v1/teams/", json={
        "name": f"تیم تست {phone}",
        "sport": "futsal",
        "visibility": "private"
    }, headers=auth(phone))
    return r.json()


def _invite_and_accept(client, captain_phone, member_phone, team_id):
    """Invite and accept a team member."""
    # Create member user
    from sqlmodel import Session, select
    from conftest import test_engine
    from app.models.user import User
    
    with Session(test_engine) as s:
        member_user = s.exec(select(User).where(User.phone == member_phone)).first()
        if not member_user:
            seed_member = lambda: None  # dummy
            from tests.helpers import register_user
            register_user(member_phone)
    
    # Invite
    r = client.post(f"/api/v1/teams/{team_id}/invite", json={
        "phone": member_phone,
        "expires_in_days": 7
    }, headers=auth(captain_phone))
    
    # Accept invitation (captain accepts on behalf of member for simplicity)
    invitations = client.get("/api/v1/teams/invitations/me", headers=auth(member_phone)).json()
    if invitations:
        inv = [i for i in invitations if i["team_id"] == team_id and i["status"] == "pending"]
        if inv:
            client.post(
                f"/api/v1/teams/{team_id}/invitations/{inv[0]['member_id']}/accept",
                headers=auth(member_phone)
            )


# ─────────────────────────── CREATE SPLIT PAYMENT ───────────────────────────

def test_create_equal_split(client, seed):
    """Test creating EQUAL split payment among team members."""
    captain = "09350000101"
    member1 = "09350000102"
    member2 = "09350000103"
    
    seed["user"](captain)
    seed["user"](member1)
    seed["user"](member2)
    
    team = _create_team(client, seed, captain)
    _invite_and_accept(client, captain, member1, team["id"])
    _invite_and_accept(client, captain, member2, team["id"])
    
    # Create equal split payment
    r = client.post(BASE + "/", json={
        "team_id": team["id"],
        "amount": 300000,
        "currency": "IRR",
        "method": "EQUAL",
        "deadline": (datetime.now(timezone.utc) + timedelta(days=3)).isoformat(),
        "note": "هزینه اجاره زمین"
    }, headers=auth(captain))
    
    assert r.status_code == 201, r.text
    data = r.json()
    assert data["amount"] == 300000
    assert data["method"] == "EQUAL"
    assert data["status"] == "PENDING"
    assert len(data["shares"]) == 3  # captain + 2 members
    # Each share should be 100000
    for share in data["shares"]:
        assert share["amount"] == 100000
        assert share["status"] == "PENDING"


def test_create_custom_split(client, seed):
    """Test creating CUSTOM split with specific amounts."""
    captain = "09350000201"
    member1 = "09350000202"
    
    seed["user"](captain)
    seed["user"](member1)
    
    team = _create_team(client, seed, captain)
    _invite_and_accept(client, captain, member1, team["id"])
    
    # Get member IDs
    members = client.get(f"/api/v1/teams/{team['id']}/members", headers=auth(captain)).json()
    user_ids = [m["user_id"] for m in members]
    
    # Create custom split
    r = client.post(BASE + "/", json={
        "team_id": team["id"],
        "amount": 500000,
        "currency": "IRR",
        "method": "CUSTOM",
        "custom_shares": [
            {"user_id": user_ids[0], "amount": 300000},
            {"user_id": user_ids[1], "amount": 200000}
        ],
        "note": "تقسیم سفارشی"
    }, headers=auth(captain))
    
    assert r.status_code == 201, r.text
    data = r.json()
    assert data["amount"] == 500000
    assert data["method"] == "CUSTOM"
    assert len(data["shares"]) == 2
    
    shares_by_user = {s["user_id"]: s for s in data["shares"]}
    assert shares_by_user[user_ids[0]]["amount"] == 300000
    assert shares_by_user[user_ids[1]]["amount"] == 200000


def test_create_percentage_split(client, seed):
    """Test creating PERCENTAGE split."""
    captain = "09350000301"
    member1 = "09350000302"
    member2 = "09350000303"
    
    seed["user"](captain)
    seed["user"](member1)
    seed["user"](member2)
    
    team = _create_team(client, seed, captain)
    _invite_and_accept(client, captain, member1, team["id"])
    _invite_and_accept(client, captain, member2, team["id"])
    
    members = client.get(f"/api/v1/teams/{team['id']}/members", headers=auth(captain)).json()
    user_ids = [m["user_id"] for m in members]
    
    # Create percentage split: 50%, 30%, 20%
    r = client.post(BASE + "/", json={
        "team_id": team["id"],
        "amount": 1000000,
        "currency": "IRR",
        "method": "PERCENTAGE",
        "percentage_shares": [
            {"user_id": user_ids[0], "percentage": 50},
            {"user_id": user_ids[1], "percentage": 30},
            {"user_id": user_ids[2], "percentage": 20}
        ]
    }, headers=auth(captain))
    
    assert r.status_code == 201, r.text
    data = r.json()
    assert data["method"] == "PERCENTAGE"
    
    shares_by_user = {s["user_id"]: s for s in data["shares"]}
    assert shares_by_user[user_ids[0]]["percentage"] == 50
    assert shares_by_user[user_ids[0]]["amount"] == 500000
    assert shares_by_user[user_ids[1]]["percentage"] == 30
    assert shares_by_user[user_ids[1]]["amount"] == 300000
    assert shares_by_user[user_ids[2]]["percentage"] == 20
    assert shares_by_user[user_ids[2]]["amount"] == 200000


def test_create_split_invalid_amount_mismatch(client, seed):
    """Test that custom split rejects when amounts don't match total."""
    captain = "09350000401"
    member1 = "09350000402"
    
    seed["user"](captain)
    seed["user"](member1)
    
    team = _create_team(client, seed, captain)
    _invite_and_accept(client, captain, member1, team["id"])
    
    members = client.get(f"/api/v1/teams/{team['id']}/members", headers=auth(captain)).json()
    user_ids = [m["user_id"] for m in members]
    
    # Total is 500000 but shares sum to 600000
    r = client.post(BASE + "/", json={
        "team_id": team["id"],
        "amount": 500000,
        "currency": "IRR",
        "method": "CUSTOM",
        "custom_shares": [
            {"user_id": user_ids[0], "amount": 400000},
            {"user_id": user_ids[1], "amount": 200000}
        ]
    }, headers=auth(captain))
    
    assert r.status_code == 422, r.text


def test_create_split_percentage_not_100(client, seed):
    """Test that percentage split rejects when percentages don't sum to 100."""
    captain = "09350000501"
    member1 = "09350000502"
    
    seed["user"](captain)
    seed["user"](member1)
    
    team = _create_team(client, seed, captain)
    _invite_and_accept(client, captain, member1, team["id"])
    
    members = client.get(f"/api/v1/teams/{team['id']}/members", headers=auth(captain)).json()
    user_ids = [m["user_id"] for m in members]
    
    # Percentages sum to 90, not 100
    r = client.post(BASE + "/", json={
        "team_id": team["id"],
        "amount": 1000000,
        "currency": "IRR",
        "method": "PERCENTAGE",
        "percentage_shares": [
            {"user_id": user_ids[0], "percentage": 60},
            {"user_id": user_ids[1], "percentage": 30}
        ]
    }, headers=auth(captain))
    
    assert r.status_code == 422, r.text


# ─────────────────────────── GET SPLIT PAYMENT DETAILS ───────────────────────────

def test_get_split_payment_details(client, seed):
    """Test retrieving split payment details with shares."""
    captain = "09350000601"
    seed["user"](captain)
    
    team = _create_team(client, seed, captain)
    
    # Create split payment
    r = client.post(BASE + "/", json={
        "team_id": team["id"],
        "amount": 200000,
        "currency": "IRR",
        "method": "EQUAL",
        "note": "تست دریافت جزئیات"
    }, headers=auth(captain))
    
    payment_id = r.json()["id"]
    
    # Get details
    r = client.get(f"{BASE}/{payment_id}", headers=auth(captain))
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["id"] == payment_id
    assert "shares" in data
    assert "total_paid" in data
    assert "remaining" in data
    assert data["total_paid"] == 0
    assert data["remaining"] == 200000


def test_get_split_payment_not_found(client, seed):
    """Test 404 for non-existent split payment."""
    captain = "09350000701"
    seed["user"](captain)
    
    r = client.get(f"{BASE}/99999", headers=auth(captain))
    assert r.status_code == 404


# ─────────────────────────── PAY SHARE ───────────────────────────

def test_pay_share_success(client, seed):
    """Test marking a share as paid."""
    captain = "09350000801"
    member = "09350000802"
    
    seed["user"](captain)
    seed["user"](member)
    
    team = _create_team(client, seed, captain)
    _invite_and_accept(client, captain, member, team["id"])
    
    # Create split payment
    r = client.post(BASE + "/", json={
        "team_id": team["id"],
        "amount": 200000,
        "currency": "IRR",
        "method": "EQUAL"
    }, headers=auth(captain))
    
    payment = r.json()
    share_id = payment["shares"][1]["id"]  # Member's share
    
    # Pay the share
    r = client.post(
        f"{BASE}/{payment['id']}/shares/{share_id}/pay",
        json={"payment_method": "gateway", "note": "پرداخت آنلاین"},
        headers=auth(member)
    )
    
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["status"] == "PAID"
    assert data["paid_at"] is not None


def test_pay_share_already_paid(client, seed):
    """Test cannot pay an already paid share."""
    captain = "09350000901"
    member = "09350000902"
    
    seed["user"](captain)
    seed["user"](member)
    
    team = _create_team(client, seed, captain)
    _invite_and_accept(client, captain, member, team["id"])
    
    # Create and pay
    r = client.post(BASE + "/", json={
        "team_id": team["id"],
        "amount": 200000,
        "currency": "IRR",
        "method": "EQUAL"
    }, headers=auth(captain))
    
    payment = r.json()
    share_id = payment["shares"][1]["id"]
    
    # First payment
    client.post(
        f"{BASE}/{payment['id']}/shares/{share_id}/pay",
        json={},
        headers=auth(member)
    )
    
    # Second payment attempt
    r = client.post(
        f"{BASE}/{payment['id']}/shares/{share_id}/pay",
        json={},
        headers=auth(member)
    )
    
    assert r.status_code == 400, r.text


# ─────────────────────────── LIST TEAM PAYMENTS ───────────────────────────

def test_list_team_payments(client, seed):
    """Test listing all split payments for a team."""
    captain = "09350001001"
    seed["user"](captain)
    
    team = _create_team(client, seed, captain)
    
    # Create multiple payments
    for i in range(3):
        client.post(BASE + "/", json={
            "team_id": team["id"],
            "amount": 100000 * (i + 1),
            "currency": "IRR",
            "method": "EQUAL",
            "note": f"پرداخت شماره {i+1}"
        }, headers=auth(captain))
    
    # List payments
    r = client.get(f"{BASE}/team/{team['id']}", headers=auth(captain))
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["total"] >= 3
    assert len(data["items"]) >= 3
    
    # Check ordering (newest first)
    amounts = [item["amount"] for item in data["items"][:3]]
    assert amounts == sorted(amounts, reverse=True)


def test_list_team_payments_pagination(client, seed):
    """Test pagination for team payments list."""
    captain = "09350001101"
    seed["user"](captain)
    
    team = _create_team(client, seed, captain)
    
    # Create 5 payments
    for i in range(5):
        client.post(BASE + "/", json={
            "team_id": team["id"],
            "amount": 100000,
            "currency": "IRR",
            "method": "EQUAL"
        }, headers=auth(captain))
    
    # Get first page
    r = client.get(f"{BASE}/team/{team['id']}?limit=2&offset=0", headers=auth(captain))
    assert r.status_code == 200
    data = r.json()
    assert len(data["items"]) == 2
    assert data["total"] == 5
    
    # Get second page
    r = client.get(f"{BASE}/team/{team['id']}?limit=2&offset=2", headers=auth(captain))
    assert len(r.json()["items"]) == 2


# ─────────────────────────── AUDIT TRAIL ───────────────────────────

def test_split_payment_audit_created(client, seed):
    """Test that audit events are created for split payment actions."""
    captain = "09350001201"
    member = "09350001202"
    
    seed["user"](captain)
    seed["user"](member)
    
    team = _create_team(client, seed, captain)
    _invite_and_accept(client, captain, member, team["id"])
    
    # Create payment
    r = client.post(BASE + "/", json={
        "team_id": team["id"],
        "amount": 200000,
        "currency": "IRR",
        "method": "EQUAL"
    }, headers=auth(captain))
    
    payment_id = r.json()["id"]
    
    # Check audit events exist in database
    from sqlmodel import Session, select
    from conftest import test_engine
    from app.models.split_payment import SplitPaymentAuditEvent
    
    with Session(test_engine) as s:
        audits = s.exec(
            select(SplitPaymentAuditEvent)
            .where(SplitPaymentAuditEvent.split_payment_id == payment_id)
            .order_by(SplitPaymentAuditEvent.created_at)
        ).all()
        
        assert len(audits) >= 1
        assert audits[0].action == "CREATED"
        assert audits[0].performed_by == captain


# ─────────────────────────── EDGE CASES ───────────────────────────

def test_create_split_with_zero_amount_blocked(client, seed):
    """Test that zero amount is rejected."""
    captain = "09350001301"
    seed["user"](captain)
    
    team = _create_team(client, seed, captain)
    
    r = client.post(BASE + "/", json={
        "team_id": team["id"],
        "amount": 0,
        "currency": "IRR",
        "method": "EQUAL"
    }, headers=auth(captain))
    
    assert r.status_code == 422, r.text


def test_create_split_negative_amount_blocked(client, seed):
    """Test that negative amount is rejected."""
    captain = "09350001401"
    seed["user"](captain)
    
    team = _create_team(client, seed, captain)
    
    r = client.post(BASE + "/", json={
        "team_id": team["id"],
        "amount": -100000,
        "currency": "IRR",
        "method": "EQUAL"
    }, headers=auth(captain))
    
    assert r.status_code == 422, r.text


def test_unauthorized_access_blocked(client, seed):
    """Test that non-team members cannot access split payments."""
    captain = "09350001501"
    stranger = "09350001502"
    
    seed["user"](captain)
    seed["user"](stranger)
    
    team = _create_team(client, seed, captain)
    
    # Create payment
    r = client.post(BASE + "/", json={
        "team_id": team["id"],
        "amount": 100000,
        "currency": "IRR",
        "method": "EQUAL"
    }, headers=auth(captain))
    
    payment_id = r.json()["id"]
    
    # Stranger tries to access
    r = client.get(f"{BASE}/{payment_id}", headers=auth(stranger))
    assert r.status_code == 403 or r.status_code == 404
