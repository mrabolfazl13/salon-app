# backend/tests/test_split_payment_settlement.py
"""جمع سهم‌ها باید **دقیقاً** مبلغ کل پرداخت اشتراکی را بپوشاند (بازبینی #4 — راند ۱۵).

روش PERCENTAGE سهم هر عضو را `int(amount * pct / 100)` می‌ساخت، یعنی کسری هر سهم
دور ریخته می‌شد. با سه سهم ۳۳٫۳۳۳۳٪ از ۱۰۰ ریال، جمع سهم‌ها ۹۹ می‌ماند ⇒ «باقی‌مانده»
هرگز صفر نمی‌شود، حتی وقتی همهٔ اعضا پرداخت کرده‌اند، و پرداخت‌کنندۀ آخر همیشه
اندازهٔ دورشدن‌ها بدهکار/بدیعتمان می‌ماند. EQUAL این مشکل را ندارد چون باقیماندهٔ
تقسیمِ صحیح را بین اعضا پخش می‌کند — قاعدهٔ همین تست همان قاعده است.
"""
from helpers import auth
from test_split_payments import _create_team, _invite_and_accept

BASE = "/api/v1/split-payments"


def _team3(client, seed, phones):
    """کاپیتان + دو عضو = سه عضو فعال، و شناسۀ کاربری‌شان به ترتیبِ فهرست اعضا."""
    for p in phones:
        seed["user"](p)
    team = _create_team(client, seed, phones[0])
    for p in phones[1:]:
        _invite_and_accept(client, phones[0], p, team["id"])
    members = client.get(f"/api/v1/teams/{team['id']}/members",
                         headers=auth(phones[0])).json()
    return team["id"], [m["user_id"] for m in members], phones[0]


def _post_percentage(client, headers, team_id, user_ids, amount, pct):
    return client.post(BASE + "/", json={
        "team_id": team_id,
        "amount": amount,
        "method": "PERCENTAGE",
        "percentage_shares": [{"user_id": u, "percentage": pct} for u in user_ids],
    }, headers=headers)


def _percentage_split(client, headers, team_id, user_ids, amount, pct):
    r = _post_percentage(client, headers, team_id, user_ids, amount, pct)
    assert r.status_code == 201, r.text
    return r.json()


# ─────────── ۱) دقیق بودن جمع سهم‌ها ───────────

def test_percentage_shares_sum_exactly_to_the_total(client, seed):
    tid, ids, cap = _team3(client, seed, ["09350000701", "09350000702", "09350000703"])
    data = _percentage_split(client, auth(cap), tid, ids, 100, 100 / 3)

    amounts = [s["amount"] for s in data["shares"]]
    assert sum(amounts) == data["amount"] == 100
    assert sorted(amounts) == [33, 33, 34]  # یک ریال به بزرگ‌ترین کسَر می‌رسد


def test_identical_percentages_do_not_drift_by_more_than_one_rial(client, seed):
    """سهم‌های با درصدِ یکسان نباید یکی ۳۳ و دیگری ۳۴ِ نامتوازن باشد (بیش از ۱ ریال)."""
    tid, ids, cap = _team3(client, seed, ["09350000711", "09350000712", "09350000713"])
    data = _percentage_split(client, auth(cap), tid, ids, 1000001, 100 / 3)

    amounts = [s["amount"] for s in data["shares"]]
    assert sum(amounts) == data["amount"]
    assert max(amounts) - min(amounts) <= 1


def test_uneven_percentages_still_reconcile(client, seed):
    """درصدهای نامتعارف (مثل ۱/۷ برای هفت عضو) هم باید به مبلغ کل بخورند."""
    phones = [f"093500007{20+i:02d}" for i in range(8)]
    for p in phones:
        seed["user"](p)
    team = _create_team(client, seed, phones[0])
    for p in phones[1:]:
        _invite_and_accept(client, phones[0], p, team["id"])
    ids = [m["user_id"] for m in client.get(
        f"/api/v1/teams/{team['id']}/members", headers=auth(phones[0])).json()]
    assert len(ids) == 8

    data = _percentage_split(client, auth(phones[0]), team["id"], ids, 999_999, 100 / 8)
    assert sum(s["amount"] for s in data["shares"]) == 999_999


# ─────────── ۲) تسویهٔ کامل ⇒ باقی‌مانده صفر ───────────

def test_paying_every_share_settles_the_split_to_zero_remainder(client, seed):
    """مسیر پول: هر سه سهم پرداخته می‌شود ⇒ COMPLETED و باقی‌ماندۀ صفر."""
    tid, ids, cap = _team3(client, seed, ["09350000801", "09350000802", "09350000803"])
    data = _percentage_split(client, auth(cap), tid, ids, 100, 100 / 3)
    phones = ["09350000801", "09350000802", "09350000803"]

    for share, phone in zip(data["shares"], phones):
        r = client.post(f"{BASE}/{data['id']}/shares/{share['id']}/pay",
                        json={"note": "واریز"}, headers=auth(phone))
        assert r.status_code == 200, r.text

    detail = client.get(f"{BASE}/{data['id']}", headers=auth(cap)).json()
    assert detail["status"] == "COMPLETED"
    assert detail["total_paid"] == detail["amount"]
    assert detail["remaining"] == 0
    assert all(s["status"] == "PAID" for s in detail["shares"])


# ─────────── ۳) گواهِ قاعدۀ از پیش درست (EQUAL) ───────────

def test_equal_split_remainder_rule_is_the_reference(client, seed):
    """EQUAL از قبل باقیمانده را پخش می‌کند؛ PERCENTAGE باید همان قاعده را بگیرد."""
    tid, ids, cap = _team3(client, seed, ["09350000811", "09350000812", "09350000813"])
    r = client.post(f"{BASE}/", json={"team_id": tid, "amount": 100, "method": "EQUAL"},
                    headers=auth(cap))
    assert r.status_code == 201, r.text
    data = r.json()
    assert sum(s["amount"] for s in data["shares"]) == 100
    assert sorted(s["amount"] for s in data["shares"]) == [33, 33, 34]


# ─────────── ۴) سهمِ صفری که جدول را می‌ترکاند ───────────

def test_a_split_that_cannot_give_every_member_a_rial_is_rejected(client, seed):
    """`CheckConstraint(share.amount > 0)` با سهمِ صفر IntegrityError می‌داد (۵۰۰)."""
    tid, ids, cap = _team3(client, seed, ["09350000821", "09350000822", "09350000823"])
    r = client.post(f"{BASE}/", json={"team_id": tid, "amount": 2, "method": "EQUAL"},
                    headers=auth(cap))
    assert r.status_code == 422, r.text
    assert "ریال" in r.json()["detail"]


def test_percentage_of_a_too_small_total_is_rejected(client, seed):
    """همان قاعده برای PERCENTAGE: ۲ ریال × ۳۳٪ ⇒ سه سهم صفر."""
    tid, ids, cap = _team3(client, seed, ["09350000831", "09350000832", "09350000833"])
    r = _post_percentage(client, auth(cap), tid, ids, 2, 100 / 3)
    assert r.status_code == 422, r.text
    assert "ریال" in r.json()["detail"]
