# backend/tests/test_games_concurrency.py
"""تست همزمانی join — ظرفیت هرگز نقض نمی‌شود (۱۱/۱۰ غیرممکن).

با BEGIN IMMEDIATE در conftest، تراکنش‌های SQLite واقعاً serialize می‌شوند؛
بنابراین این تست رفتار race-safe سرویس را (شمارش قطعی زیر قفل) می‌سنجد.
"""
import threading

from fastapi.testclient import TestClient

from helpers import auth

BASE = "/api/v1/games"


def test_concurrent_join_respects_capacity(client, seed):
    from app.main import app

    owner = seed["user"]("09210000100")
    chain = seed["booking"](owner)
    r = client.post(f"{BASE}/", json={"booking_id": chain["booking"].id,
                                      "name": "بازی همزمان", "max_players": 3,
                                      "visibility": "public",
                                      "payment_mode": "organizer_pays"},
                    headers=auth(owner.phone))
    assert r.status_code == 201, r.text
    gid = r.json()["id"]

    # ظرفیت: ارگانایزر + ۲ جای خالی — ۵ نفر همزمان attempt می‌کنند
    phones = [f"0921000011{i}" for i in range(1, 6)]
    for p in phones:
        seed["user"](p)

    barrier = threading.Barrier(len(phones), timeout=30)
    results = {}

    def _join(idx):
        c = TestClient(app)  # هر ترد TestClient مستقل (event loop جدا)
        barrier.wait()
        results[idx] = c.post(f"{BASE}/{gid}/join", headers=auth(phones[idx]))

    threads = [threading.Thread(target=_join, args=(i,)) for i in range(len(phones))]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=90)

    assert len(results) == 5
    assert all(res.status_code == 200 for res in results.values()), \
        {i: (res.status_code, res.text) for i, res in results.items()}

    joined = [res for res in results.values()
              if res.json()["message"] == "به بازی پیوستید."]
    waitlisted = [res for res in results.values()
                  if "لیست انتظار" in res.json()["message"]]
    assert len(joined) == 2, "دقیقاً ۲ سهمیه خالی پر می‌شود"
    assert len(waitlisted) == 3

    # ثابت عدم‌نقض ظرفیت
    game = client.get(f"{BASE}/{gid}", headers=auth(owner.phone)).json()
    assert game["current_players"] == 3  # organizer + 2
    assert game["status"] == "full"

    ps = client.get(f"{BASE}/{gid}/participants", headers=auth(owner.phone)).json()
    assert len([p for p in ps if p["status"] == "accepted"]) == 3

    wl = client.get(f"{BASE}/{gid}/waitlist", headers=auth(owner.phone)).json()
    assert len(wl) == 3
    assert sorted(w["position"] for w in wl) == [1, 2, 3]


def test_concurrent_leave_and_join_keeps_invariant(client, seed):
    """خروج همزمان یک عضو + ورود چند نفر — شمارش نهایی درست بماند."""
    from app.main import app

    owner = seed["user"]("09210000120")
    chain = seed["booking"](owner)
    r = client.post(f"{BASE}/", json={"booking_id": chain["booking"].id,
                                      "name": "بازی رقابت", "max_players": 2,
                                      "visibility": "public",
                                      "payment_mode": "organizer_pays"},
                    headers=auth(owner.phone))
    gid = r.json()["id"]

    leaver = seed["user"]("09210000121")
    client.post(f"{BASE}/{gid}/join", headers=auth(leaver.phone))  # حالا full (2/2)

    joiners = [seed["user"](f"0921000013{i}") for i in range(1, 4)]
    barrier = threading.Barrier(len(joiners) + 1, timeout=30)
    results = {}

    def _leave():
        c = TestClient(app)
        barrier.wait()
        results["leave"] = c.post(f"{BASE}/{gid}/leave", headers=auth(leaver.phone))

    def _join(idx, phone):
        c = TestClient(app)
        barrier.wait()
        results[idx] = c.post(f"{BASE}/{gid}/join", headers=auth(phone))

    threads = [threading.Thread(target=_leave)]
    threads += [threading.Thread(target=_join, args=(i, u.phone))
                for i, u in enumerate(joiners)]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=90)

    assert results["leave"].status_code == 200
    game = client.get(f"{BASE}/{gid}", headers=auth(owner.phone)).json()
    assert game["current_players"] == 2  # هرگز بیشتر از ظرفیت
    assert game["status"] == "full"
    ps = client.get(f"{BASE}/{gid}/participants", headers=auth(owner.phone)).json()
    accepted = [p for p in ps if p["status"] == "accepted"]
    assert len(accepted) == 2
    assert leaver.id not in [p["user_id"] for p in accepted]
