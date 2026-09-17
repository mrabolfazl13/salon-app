# backend/tests/test_teams_crud.py
"""تست ساخت/نمایش/ویرایش/غیرفعال‌سازی تیم — قوانین visibility یکتای نام."""
from helpers import auth, err_code

BASE = "/api/v1/teams"
C = "09350000001"
P = "09350000002"


def _exists(phone):
    from sqlmodel import Session, select
    from conftest import test_engine
    from app.models.user import User
    with Session(test_engine) as s:
        return s.exec(select(User).where(User.phone == phone)).first() is not None


def _create(client, seed, phone, name="تیم هفته", **overrides):
    if not _exists(phone):
        seed["user"](phone)
    body = {"name": name, "sport": "futsal", "visibility": "private"}
    body.update(overrides)
    return client.post(f"{BASE}/", json=body, headers=auth(phone))


# ─────────────────────────── create / read ───────────────────────────

def test_create_team_captain_membership(client, seed):
    r = _create(client, seed, C, "تیم آرش")
    assert r.status_code == 201, r.text
    t = r.json()
    assert t["my_role"] == "captain"
    assert t["my_status"] == "active"
    assert t["member_count"] == 1
    assert t["is_active"] is True
    assert t["visibility"] == "private"
    assert t["captain_name"] == "کاربر " + C
    mine = client.get(f"{BASE}/", headers=auth(C)).json()
    assert len(mine) == 1 and mine[0]["id"] == t["id"] and mine[0]["my_role"] == "captain"


def test_duplicate_name_per_captain_blocked(client, seed):
    assert _create(client, seed, C, "تیم تکراری").status_code == 201
    r = _create(client, seed, C, "تیم تکراری")
    assert r.status_code == 409
    assert err_code(r) == "TEAM_NAME_TAKEN"
    # همان نام با کاپیتان دیگر مجاز است
    assert _create(client, seed, P, "تیم تکراری").status_code == 201


def test_private_team_hidden_from_stranger(client, seed):
    t = _create(client, seed, C, "تیم محرمانه", visibility="private").json()
    stranger = "09350000003"
    seed["user"](stranger)
    r = client.get(f"{BASE}/{t['id']}", headers=auth(stranger))
    assert r.status_code == 403
    assert err_code(r) == "PRIVATE_TEAM"
    assert client.get(f"{BASE}/{t['id']}", headers=auth(C)).status_code == 200


def test_discover_shows_only_public_active(client, seed):
    t_pub = _create(client, seed, C, "تیم همگانی", visibility="public").json()
    t_priv = _create(client, seed, P, "تیم خصوصی").json()
    s4 = "09350000004"
    seed["user"](s4)
    disc = client.get(f"{BASE}/discover", headers=auth(s4)).json()
    ids = [i["id"] for i in disc["items"]]
    assert t_pub["id"] in ids and t_priv["id"] not in ids
    assert disc["total"] >= 1
    by_search = client.get(f"{BASE}/discover?search=همگانی", headers=auth(C)).json()
    assert [i["id"] for i in by_search["items"]] == [t_pub["id"]]
    wrong_sport = client.get(f"{BASE}/discover?sport=padel", headers=auth(C)).json()
    assert wrong_sport["items"] == []


def test_team_not_found(client, seed):
    _create(client, seed, C, "تیمکوچولو")
    assert client.get(f"{BASE}/99999", headers=auth(C)).status_code == 404


# ─────────────────────────── update ───────────────────────────

def test_update_team_permissions(client, seed):
    t = _create(client, seed, C, "تیم ویرایش", visibility="public").json()
    other = "09350000005"
    seed["user"](other)
    r = client.put(f"{BASE}/{t['id']}", json={"name": "دست‌درازی"},
                   headers=auth(other))
    assert r.status_code == 403
    assert err_code(r) == "NOT_A_MEMBER"
    r = client.put(f"{BASE}/{t['id']}", json={"name": "تیم ویرایش۲",
                                              "visibility": "private"},
                   headers=auth(C))
    assert r.status_code == 200, r.text
    assert r.json()["name"] == "تیم ویرایش۲"
    assert r.json()["visibility"] == "private"


def test_update_empty_changes_rejected(client, seed):
    t = _create(client, seed, C, "تیم بی‌تغییر").json()
    r = client.put(f"{BASE}/{t['id']}", json={}, headers=auth(C))
    assert r.status_code == 400
    assert err_code(r) == "NO_CHANGES"


# ─────────────────────────── deactivate ───────────────────────────

def test_deactivate_only_captain_soft(client, seed):
    t = _create(client, seed, C, "تیم خداحافظ", visibility="public").json()
    member = "09350000006"
    seed["user"](member)
    cid = client.post(f"{BASE}/{t['id']}/invite", json={"phone": member},
                      headers=auth(C), ).json()["member_id"]
    client.post(f"{BASE}/{t['id']}/invitations/{cid}/accept", headers=auth(member))
    assert client.delete(f"{BASE}/{t['id']}/deactivate",
                         headers=auth(member)).status_code == 403
    r = client.delete(f"{BASE}/{t['id']}/deactivate", headers=auth(C))
    assert r.status_code == 200, r.text
    assert r.json()["open_dues"] == 0
    detail = client.get(f"{BASE}/{t['id']}", headers=auth(member)).json()
    assert detail["is_active"] is False
    late = "09350000007"
    seed["user"](late)
    r2 = client.post(f"{BASE}/{t['id']}/invite", json={"phone": late},
                     headers=auth(C))
    assert r2.status_code == 409
    assert err_code(r2) == "TEAM_INACTIVE"
    ids = [i["id"] for i in client.get(f"{BASE}/discover",
                                       headers=auth(C)).json()["items"]]
    assert t["id"] not in ids