# backend/tests/test_game_payment_reminder.py
"""یادآوری پرداخت سهم — گیرندگان فقط بدهکاران (بدون فراخوان)، اعلان این‌اپ،
اجازه سازمان‌ده/مدیر (عضو معمولی ۴۰۳) و خنک‌سر یک‌دقیقه‌ای هر فراخوان."""
import pytest
from sqlmodel import Session, select

import app.services.pending_booking_service as pbs
import app.utils.rate_limit as rl
from conftest import test_engine
from helpers import auth, err_code, FakeRedis

BASE = "/api/v1/games"


@pytest.fixture()
def fake_redis(monkeypatch):
    fake = FakeRedis()
    monkeypatch.setattr(rl, "_client", fake)
    monkeypatch.setattr(pbs, "_client", fake)
    return fake


def _setup(client, seed, tag):
    """ارگانایزر + ۳ عضو؛ یکی پرداخت‌کرده — دو سهم پرداخت‌نشده (فراخوان除外)."""
    owner = seed["user"](f"093801000{tag}0")
    chain = seed["booking"](owner)
    r = client.post(f"{BASE}/", json={"booking_id": chain["booking"].id,
                                      "name": "بازی یادآوری", "max_players": 6,
                                      "visibility": "public",
                                      "payment_mode": "split_payment"},
                    headers=auth(owner.phone))
    assert r.status_code == 201, r.text
    gid = r.json()["id"]
    members = [seed["user"](f"093801000{tag}{i}") for i in (1, 2, 3)]
    for mk in members:
        assert client.post(f"{BASE}/{gid}/join", headers=auth(mk.phone)).status_code == 200
    ps = client.get(f"{BASE}/{gid}/participants", headers=auth(owner.phone)).json()
    pid = next(p["id"] for p in ps if p["user_id"] == members[0].id)
    assert client.post(f"{BASE}/{gid}/payments/{pid}/pay",
                       headers=auth(members[0].phone)).status_code == 200
    return owner, gid, members


def test_remind_sends_to_unpaid_excludes_caller(client, seed, fake_redis, sent_notifications):
    owner, gid, members = _setup(client, seed, "1")
    oh = auth(owner.phone)
    r = client.post(f"{BASE}/{gid}/payments/remind", headers=oh)
    assert r.status_code == 200, r.text
    assert r.json() == {"sent": 2}

    reminders = [n for n in sent_notifications
                 if n["type"] == "game_payment_reminder"]
    assert {n["user_id"] for n in reminders} == {members[1].id, members[2].id}
    for n in reminders:
        assert n["title"] == "یادآوری پرداخت سهم بازی"
        assert "سالن تست" in n["message"]          # نام سالن
        assert "شهریور 1405" in n["message"] or "1405" in n["message"]  # تاریخ جلالی
        assert f"{n['data']['amount']:,}" in n["message"]
        assert n["data"]["game_id"] == gid
    # سهم پرداخت‌شده (members[0]) و خودِ فراخوان پیام نمی‌گیرند
    assert members[0].id not in {n["user_id"] for n in reminders}
    assert owner.id not in {n["user_id"] for n in reminders}
    # در دیتابیس هم ردیف اعلان ساخته شده (تست‌ها capture می‌کنند — چک ساختار payload)
    assert all(isinstance(n["user_id"], int) for n in reminders)


def test_remind_denied_for_plain_member(client, seed, fake_redis):
    owner, gid, members = _setup(client, seed, "2")
    r = client.post(f"{BASE}/{gid}/payments/remind", headers=auth(members[1].phone))
    assert r.status_code == 403
    assert err_code(r) == "NOT_AUTHORIZED"
    # عضو ادمین‌شده می‌تواند
    assert client.patch(f"{BASE}/{gid}/participants/{members[1].id}",
                        json={"role": "admin"}, headers=auth(owner.phone)).status_code == 200
    r = client.post(f"{BASE}/{gid}/payments/remind", headers=auth(members[1].phone))
    assert r.status_code == 200, r.text
    assert r.json() == {"sent": 2}


def test_remind_throttled_once_per_minute(client, seed, fake_redis):
    owner, gid, _ = _setup(client, seed, "3")
    oh = auth(owner.phone)
    assert client.post(f"{BASE}/{gid}/payments/remind", headers=oh).status_code == 200
    second = client.post(f"{BASE}/{gid}/payments/remind", headers=oh)
    assert second.status_code == 429
    assert "یک یادآوری" in second.json()["detail"]
    # فراخوان دیگر (مجاز) قفل نمی‌خورد — کلید per-caller است
    admin = seed["user"]("093801009390")
    assert client.post(f"{BASE}/{gid}/join", headers=auth(admin.phone)).status_code == 200
    assert client.patch(f"{BASE}/{gid}/participants/{admin.id}",
                        json={"role": "admin"}, headers=oh).status_code == 200
    r = client.post(f"{BASE}/{gid}/payments/remind", headers=auth(admin.phone))
    assert r.status_code == 200, r.text


def test_remind_graceful_without_redis(client, seed):
    # بدون FakeRedis — اتصال ناموفق Redis ⇒ آزاد عبور (degrade graceful)
    def _boom():
        raise ConnectionError("no redis")
    import app.utils.rate_limit as rl_mod
    orig = rl_mod._get_redis
    rl_mod._get_redis = _boom
    try:
        owner = seed["user"]("093801000400")
        chain = seed["booking"](owner)
        r = client.post(f"{BASE}/", json={"booking_id": chain["booking"].id,
                                          "name": "بازی بدون ریدیس", "max_players": 6,
                                          "visibility": "public",
                                          "payment_mode": "split_payment"},
                        headers=auth(owner.phone))
        gid = r.json()["id"]
        m1 = seed["user"]("093801000401")
        client.post(f"{BASE}/{gid}/join", headers=auth(m1.phone))
        ok = client.post(f"{BASE}/{gid}/payments/remind", headers=auth(owner.phone))
        assert ok.status_code == 200 and ok.json() == {"sent": 1}
        again = client.post(f"{BASE}/{gid}/payments/remind", headers=auth(owner.phone))
        assert again.status_code == 200  # بدون ریدیس خنک‌سر وجود ندارد
    finally:
        rl_mod._get_redis = orig