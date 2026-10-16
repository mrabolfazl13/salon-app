# backend/tests/test_shifts.py
"""شیفت پرسنل (P020) — تعارض، دروازهٔ دسترسی، خلاصهٔ ساعت کاری و خروجی ماهانه.

معیار پذیرش فیچر در همین فایل قفل می‌شود:
- «تعارض شیفت رد می‌شود» ⇒ test_overlap_* (هم‌سالنی و **دوسالنهٔ همان شخص**)
- «خروجی ماهانه قابل خروج» ⇒ test_export_csv_*
"""
from datetime import datetime

from sqlmodel import Session

from app.models.staff import StaffAssignment
from app.models.user import User, UserRole
from app.models.venue import Venue
from helpers import auth
from conftest import test_engine


def _fresh():
    return Session(test_engine)


def _user(phone, role=UserRole.USER):
    with _fresh() as s:
        u = User(phone=phone, full_name=f"پرسنل {phone}", hashed_password="x",
                 role=role, is_verified=True)
        s.add(u); s.commit(); s.refresh(u)
        return u


def _venue(manager_id, name="سالن شیفت"):
    with _fresh() as s:
        v = Venue(name=name, address="آ", latitude=35.7, longitude=51.4,
                  manager_id=manager_id)
        s.add(v); s.commit(); s.refresh(v)
        return v


def _assign(venue_id, user_id, created_by):
    with _fresh() as s:
        a = StaffAssignment(venue_id=venue_id, user_id=user_id,
                            position="reception", created_by=created_by)
        s.add(a); s.commit(); s.refresh(a)
        return a


def _env(client, tag):
    """مدیر + سالن + یک کارمند انتصاب‌گرفته (راه واقعی: endpoint کارکنان)."""
    manager = _user(f"09367000{tag}", UserRole.VENUE_MANAGER)
    venue = _venue(manager.id)
    staff = _user(f"09368110{tag}")
    _assign(venue.id, staff.id, manager.id)
    return {"manager": manager, "venue": venue, "staff": staff}


def _shift(client, env, start, end, user_id=None, venue_id=None):
    return client.post("/api/v1/shifts", headers=auth(env["manager"].phone), json={
        "venue_id": venue_id or env["venue"].id,
        "user_id": user_id or env["staff"].id,
        "starts_at": start.isoformat(),
        "ends_at": end.isoformat(),
    })


def _t(day, hour, minute=0):
    """ساعت naive = وقت تهران (قرارداد UI فارسی) — همان چیزی که کلاینت می‌فرستد."""
    return datetime(2026, 11, day, hour, minute)


# ─────────────────────────── ساخت و قرائت ───────────────────────────

def test_create_shift_returns_row_with_person_and_hours(client):
    env = _env(client, "01")
    r = _shift(client, env, _t(10, 16), _t(10, 20))
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["duration_min"] == 240
    assert body["status"] == "scheduled"
    assert body["user_name"] == f"پرسنل {env['staff'].phone}"
    assert body["position"] == "reception"
    # بازهٔ تهران همان چیزی است که مدیر تایپ کرده، نه UTC
    assert body["starts_at"].startswith("2026-11-10T16:00")


def test_shift_shorter_than_15_min_or_longer_than_12h_rejected(client):
    env = _env(client, "02")
    short = _shift(client, env, _t(11, 10), _t(11, 10, 10))
    assert short.status_code == 400
    assert "15" in short.json()["detail"]
    long = _shift(client, env, _t(12, 8), _t(12, 23))
    assert long.status_code == 400
    assert "720" in long.json()["detail"]


# ─────────────────────────── معیار ۱: تعارض ───────────────────────────

def test_overlap_in_same_venue_is_rejected(client):
    env = _env(client, "03")
    first = _shift(client, env, _t(15, 18), _t(15, 22))
    assert first.status_code == 201, first.text
    clash = _shift(client, env, _t(15, 21), _t(15, 23))
    assert clash.status_code == 400
    assert "تعارض شیفت" in clash.json()["detail"]
    assert f"#{first.json()['id']}" in clash.json()["detail"]


def test_overlap_across_two_venues_is_rejected(client):
    """شخص در دو سالن انتصاب فعال دارد ⇒ باز هم نمی‌تواند هم‌زمان دو جا باشد."""
    env = _env(client, "04")
    other_manager = _user("09367044004", UserRole.VENUE_MANAGER)
    other_venue = _venue(other_manager.id, "سالن دوم شیفت")
    _assign(other_venue.id, env["staff"].id, other_manager.id)

    a = _shift(client, env, _t(16, 9), _t(16, 13), venue_id=env["venue"].id)
    assert a.status_code == 201, a.text
    # مدیر سالن دوم (دروازهٔ خودش رد می‌شود، ولی تضاد سراسری است)
    b = client.post("/api/v1/shifts", headers=auth(other_manager.phone), json={
        "venue_id": other_venue.id, "user_id": env["staff"].id,
        "starts_at": _t(16, 12).isoformat(), "ends_at": _t(16, 15).isoformat()})
    assert b.status_code == 400, b.text
    assert "تعارض شیفت" in b.json()["detail"]


def test_adjacent_shifts_do_not_clash(client):
    env = _env(client, "05")
    assert _shift(client, env, _t(17, 8), _t(17, 16)).status_code == 201
    second = _shift(client, env, _t(17, 16), _t(17, 20))
    assert second.status_code == 201, second.text


def test_different_people_can_work_same_time(client):
    env = _env(client, "06")
    colleague = _user("09368120006")
    _assign(env["venue"].id, colleague.id, env["manager"].id)
    assert _shift(client, env, _t(18, 10), _t(18, 14)).status_code == 201
    ok = _shift(client, env, _t(18, 10), _t(18, 14), user_id=colleague.id)
    assert ok.status_code == 201, ok.text


def test_person_without_active_assignment_rejected(client):
    env = _env(client, "07")
    outsider = _user("09368130007")
    r = _shift(client, env, _t(19, 10), _t(19, 14), user_id=outsider.id)
    assert r.status_code == 400
    assert "کارمند فعال" in r.json()["detail"]


# ─────────────────────────── دروازهٔ دسترسی ───────────────────────────

def test_plain_user_without_staff_code_gets_403(client):
    env = _env(client, "08")
    outsider = _user("09368140008")
    r = client.get(f"/api/v1/shifts?venue_id={env['venue'].id}",
                   headers=auth(outsider.phone))
    assert r.status_code == 403


def test_reception_staff_without_staff_manage_gets_403(client):
    env = _env(client, "09")
    # کارمند موقعیت reception کد staff.manage ندارد ⇒ نمی‌تواند شیفت بچیند
    r = client.get(f"/api/v1/shifts?venue_id={env['venue'].id}",
                   headers=auth(env["staff"].phone))
    assert r.status_code == 403, r.text


def test_branch_manager_staff_can_plan_shifts(client):
    env = _env(client, "10")
    bm = _user("09368150010")
    with _fresh() as s:
        a = StaffAssignment(venue_id=env["venue"].id, user_id=bm.id,
                            position="branch_manager", created_by=env["manager"].id)
        s.add(a); s.commit()
    r = client.post("/api/v1/shifts", headers=auth(bm.phone), json={
        "venue_id": env["venue"].id, "user_id": env["staff"].id,
        "starts_at": _t(20, 8).isoformat(), "ends_at": _t(20, 16).isoformat()})
    assert r.status_code == 201, r.text


def test_unknown_venue_404(client):
    env = _env(client, "11")
    r = client.get("/api/v1/shifts?venue_id=999999", headers=auth(env["manager"].phone))
    assert r.status_code == 404


# ─────────────────────────── ویرایش و لغو ───────────────────────────

def test_update_window_conflict_rejected_then_ok(client):
    env = _env(client, "12")
    created = _shift(client, env, _t(21, 10), _t(21, 14)).json()
    other = _shift(client, env, _t(21, 16), _t(21, 18)).json()
    bad = client.put(f"/api/v1/shifts/{other['id']}", headers=auth(env["manager"].phone),
                     json={"starts_at": _t(21, 11).isoformat(),
                           "ends_at": _t(21, 13).isoformat()})
    assert bad.status_code == 400 and "تعارض" in bad.json()["detail"]
    good = client.put(f"/api/v1/shifts/{other['id']}", headers=auth(env["manager"].phone),
                      json={"starts_at": _t(21, 18).isoformat(),
                            "ends_at": _t(21, 20).isoformat(), "status": "done"})
    assert good.status_code == 200, good.text
    body = good.json()
    assert body["status"] == "done" and body["duration_min"] == 120


def test_cancel_frees_the_window_and_blocks_edit(client):
    env = _env(client, "13")
    created = _shift(client, env, _t(22, 9), _t(22, 13)).json()
    cancel = client.post(f"/api/v1/shifts/{created['id']}/cancel",
                         headers=auth(env["manager"].phone))
    assert cancel.status_code == 200, cancel.text
    assert cancel.json()["status"] == "cancelled"
    # لغوشده راه را برای شیفت جدید باز می‌کند
    again = _shift(client, env, _t(22, 9), _t(22, 13))
    assert again.status_code == 201, again.text
    edit = client.put(f"/api/v1/shifts/{created['id']}",
                      headers=auth(env["manager"].phone), json={"status": "done"})
    assert edit.status_code == 400
    assert "لغوشده" in edit.json()["detail"]


def test_cancel_is_idempotent_and_missing_shift_404(client):
    env = _env(client, "14")
    created = _shift(client, env, _t(23, 9), _t(23, 13)).json()
    assert client.post(f"/api/v1/shifts/{created['id']}/cancel",
                       headers=auth(env["manager"].phone)).status_code == 200
    twice = client.post(f"/api/v1/shifts/{created['id']}/cancel",
                        headers=auth(env["manager"].phone))
    assert twice.status_code == 400 and "از قبل" in twice.json()["detail"]
    missing = client.post("/api/v1/shifts/424242/cancel",
                          headers=auth(env["manager"].phone))
    assert missing.status_code == 404


# ─────────────────────────── فهرست و خلاصه ───────────────────────────

def test_list_window_and_status_filter(client):
    env = _env(client, "15")
    a = _shift(client, env, _t(24, 8), _t(24, 12)).json()
    b = _shift(client, env, _t(26, 8), _t(26, 12)).json()
    client.post(f"/api/v1/shifts/{b['id']}/cancel", headers=auth(env["manager"].phone))
    week = client.get(f"/api/v1/shifts?venue_id={env['venue'].id}"
                      f"&from=2026-11-23T00:00:00&to=2026-11-25T00:00:00",
                      headers=auth(env["manager"].phone)).json()
    assert [i["id"] for i in week["items"]] == [a["id"]]
    assert week["total"] == 1
    only_cancelled = client.get(f"/api/v1/shifts?venue_id={env['venue'].id}"
                                "&status=cancelled",
                                headers=auth(env["manager"].phone)).json()
    assert [i["id"] for i in only_cancelled["items"]] == [b["id"]]


def test_summary_counts_done_and_scheduled_separately(client):
    env = _env(client, "16")
    colleague = _user("09368160016")
    _assign(env["venue"].id, colleague.id, env["manager"].id)
    one = _shift(client, env, _t(1, 8), _t(1, 12)).json()   # ۲۴۰ دقیقه
    _shift(client, env, _t(2, 8), _t(2, 10), user_id=colleague.id)  # ۱۲۰
    client.put(f"/api/v1/shifts/{one['id']}", headers=auth(env["manager"].phone),
               json={"status": "done"})
    client.post(f"/api/v1/shifts/{one['id']}/cancel", headers=auth(env["manager"].phone))
    r = client.get(f"/api/v1/shifts/summary?venue_id={env['venue'].id}"
                   "&from=2026-11-01T00:00:00&to=2026-12-01T00:00:00",
                   headers=auth(env["manager"].phone))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["total_min"] == 120 and body["total_shifts"] == 2
    by_user = {row["user_id"]: row for row in body["per_staff"]}
    assert by_user[env["staff"].id]["cancelled"] == 1
    assert by_user[env["staff"].id]["scheduled_min"] == 0
    assert by_user[colleague.id]["scheduled_min"] == 120


# ─────────────────────────── معیار ۲: خروجی ماهانه ───────────────────────────

def test_export_csv_is_monthly_bom_and_persian(client):
    env = _env(client, "17")
    _shift(client, env, _t(5, 8), _t(5, 16))                 # آبان ⇒ در خروجی
    _shift(client, env, datetime(2026, 12, 5, 8), datetime(2026, 12, 5, 16))  # آذر ⇒ بیرون
    r = client.get(f"/api/v1/shifts/export?venue_id={env['venue'].id}&month=2026-11",
                   headers=auth(env["manager"].phone))
    assert r.status_code == 200, r.text
    assert r.headers["content-type"].startswith("text/csv")
    assert "attachment" in r.headers["content-disposition"]
    text = r.text
    assert text.startswith("\ufeff")          # BOM ⇒ Excel فارسی را می‌فهمد
    assert "شناسه,پرسنل" in text
    assert f"پرسنل {env['staff'].phone}" in text
    assert ",480,برنامه‌ریزی‌شده," in text
    assert "2026-12-05" not in text          # پنجرهٔ ماه واقعاً اعمال شده


def test_export_csv_shows_done_and_cancelled_labels(client):
    env = _env(client, "18")
    done = _shift(client, env, _t(6, 8), _t(6, 12)).json()
    cancelled = _shift(client, env, _t(7, 8), _t(7, 12)).json()
    client.put(f"/api/v1/shifts/{done['id']}", headers=auth(env["manager"].phone),
               json={"status": "done"})
    client.post(f"/api/v1/shifts/{cancelled['id']}/cancel",
                headers=auth(env["manager"].phone))
    text = client.get(f"/api/v1/shifts/export?venue_id={env['venue'].id}&month=2026-11",
                      headers=auth(env["manager"].phone)).text
    assert "انجام‌شده" in text and "لغوشده" in text


def test_export_rejects_bad_month_format(client):
    env = _env(client, "19")
    r = client.get(f"/api/v1/shifts/export?venue_id={env['venue'].id}&month=abān",
                   headers=auth(env["manager"].phone))
    assert r.status_code == 422


# ─────────────────────────── ممیزی و درجه‌بندی بازه ───────────────────────────

def test_export_is_audited(client):
    from sqlmodel import select

    from app.models.staff import SecurityAuditEvent
    env = _env(client, "20")
    client.get(f"/api/v1/shifts/export?venue_id={env['venue'].id}&month=2026-11",
               headers=auth(env["manager"].phone))
    with _fresh() as s:
        rows = s.exec(select(SecurityAuditEvent)
                      .where(SecurityAuditEvent.action == "shift.export")).all()
    assert len(rows) == 1
    assert rows[0].venue_id == env["venue"].id


def test_midnight_shift_spans_the_day_boundary(client):
    env = _env(client, "21")
    created = _shift(client, env, datetime(2026, 11, 9, 22), datetime(2026, 11, 10, 2))
    assert created.status_code == 201, created.text
    assert created.json()["duration_min"] == 240
    clash = _shift(client, env, datetime(2026, 11, 10, 1), datetime(2026, 11, 10, 6))
    assert clash.status_code == 400
