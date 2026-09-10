# backend/tests/test_games_payments.py
"""تست پرداخت سهمی (split) — خلاصه، پرداخت mock، دابل‌پیمنت، احراز مالکیت سهم."""
from helpers import auth, err_code

BASE = "/api/v1/games"


def _split_game(client, seed, phone="09210000200", max_players=5, mode="split_payment"):
    owner = seed["user"](phone)
    chain = seed["booking"](owner)  # payment_amount=500_000 → سهم 100_000
    r = client.post(f"{BASE}/", json={"booking_id": chain["booking"].id,
                                      "name": "بازی پرداخت", "max_players": max_players,
                                      "visibility": "public", "payment_mode": mode},
                    headers=auth(phone))
    assert r.status_code == 201, r.text
    return owner, r.json()["id"]


def _pid(client, gid, headers, user_id):
    ps = client.get(f"{BASE}/{gid}/participants", headers=headers).json()
    return next(p["id"] for p in ps if p["user_id"] == user_id)


def test_split_summary_and_pay(client, seed):
    owner, gid = _split_game(client, seed)
    oh = auth(owner.phone)
    summary = client.get(f"{BASE}/{gid}/payments", headers=oh).json()
    assert summary["payment_mode"] == "split_payment"
    assert summary["total_price"] == 500_000
    assert summary["price_per_player"] == 100_000
    assert summary["pending_count"] == 1  # سهم ارگانایزر از ساخت
    assert summary["paid_count"] == 0

    mate = seed["user"]("09210000210")
    assert client.post(f"{BASE}/{gid}/join", headers=auth(mate.phone)).status_code == 200
    summary = client.get(f"{BASE}/{gid}/payments", headers=oh).json()
    assert summary["pending_count"] == 2  # با join سهم ساخته می‌شود

    pid = _pid(client, gid, auth(mate.phone), mate.id)
    pay = client.post(f"{BASE}/{gid}/payments/{pid}/pay", headers=auth(mate.phone))
    assert pay.status_code == 200, pay.text
    payment = pay.json()["payment"]
    assert payment["status"] == "paid"
    assert payment["amount"] == 100_000
    assert payment["payment_reference"].startswith("MOCK-")

    summary = client.get(f"{BASE}/{gid}/payments", headers=oh).json()
    assert summary["paid_count"] == 1 and summary["pending_count"] == 1


def test_double_pay_rejected(client, seed):
    owner, gid = _split_game(client, seed)
    mate = seed["user"]("09210000211")
    client.post(f"{BASE}/{gid}/join", headers=auth(mate.phone))
    pid = _pid(client, gid, auth(mate.phone), mate.id)
    assert client.post(f"{BASE}/{gid}/payments/{pid}/pay",
                       headers=auth(mate.phone)).status_code == 200
    again = client.post(f"{BASE}/{gid}/payments/{pid}/pay", headers=auth(mate.phone))
    assert again.status_code == 409
    assert err_code(again) == "PAYMENT_ALREADY_PAID"


def test_cannot_pay_others_share(client, seed):
    owner, gid = _split_game(client, seed)
    mate = seed["user"]("09210000212")
    client.post(f"{BASE}/{gid}/join", headers=auth(mate.phone))
    pid = _pid(client, gid, auth(owner.phone), mate.id)
    r = client.post(f"{BASE}/{gid}/payments/{pid}/pay", headers=auth(owner.phone))
    assert r.status_code == 403
    assert err_code(r) == "NOT_AUTHORIZED"


def test_pay_requires_auth(client, seed):
    owner, gid = _split_game(client, seed)
    assert client.get(f"{BASE}/{gid}/payments").status_code == 401


def test_participant_not_found(client, seed):
    owner, gid = _split_game(client, seed)
    r = client.post(f"{BASE}/{gid}/payments/999999/pay", headers=auth(owner.phone))
    assert r.status_code == 404
    assert err_code(r) == "PARTICIPANT_NOT_FOUND"


def test_organizer_pays_mode_no_split(client, seed):
    owner, gid = _split_game(client, seed, phone="09210000220", mode="organizer_pays")
    oh = auth(owner.phone)
    summary = client.get(f"{BASE}/{gid}/payments", headers=oh).json()
    assert summary["payment_mode"] == "organizer_pays"
    assert summary["price_per_player"] is None
    assert summary["payments"] == []
    pid = _pid(client, gid, oh, owner.id)
    r = client.post(f"{BASE}/{gid}/payments/{pid}/pay", headers=oh)
    assert r.status_code == 400
    assert err_code(r) == "PAYMENT_NOT_REQUIRED"


def test_free_mode_no_payments(client, seed):
    owner, gid = _split_game(client, seed, phone="09210000230", mode="free")
    oh = auth(owner.phone)
    summary = client.get(f"{BASE}/{gid}/payments", headers=oh).json()
    assert summary["payments"] == []
    assert summary["pending_count"] == 0
    pid = _pid(client, gid, oh, owner.id)
    r = client.post(f"{BASE}/{gid}/payments/{pid}/pay", headers=oh)
    assert r.status_code == 400
    assert err_code(r) == "PAYMENT_NOT_REQUIRED"


def test_participant_payment_status_reflected(client, seed):
    owner, gid = _split_game(client, seed, phone="09210000240")
    mate = seed["user"]("09210000241")
    client.post(f"{BASE}/{gid}/join", headers=auth(mate.phone))
    pid = _pid(client, gid, auth(mate.phone), mate.id)
    client.post(f"{BASE}/{gid}/payments/{pid}/pay", headers=auth(mate.phone))
    ps = client.get(f"{BASE}/{gid}/participants", headers=auth(owner.phone)).json()
    by_user = {p["user_id"]: p for p in ps}
    assert by_user[mate.id]["payment_status"] == "paid"
    assert by_user[owner.id]["payment_status"] == "pending"
