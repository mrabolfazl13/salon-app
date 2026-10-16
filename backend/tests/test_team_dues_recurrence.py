# backend/tests/test_team_dues_recurrence.py
"""B4: برنامه حق‌عضویت خودکار — endpoint پلن، job دوره، جریمه دیرکرد و اعلان‌ها.

معیار ledger: «با forward کردن تاریخ در تست، حصه و اعلان تولید می‌شود» —
این‌جا گذر زمان با پارامتر today= روی تابع سرویس و با لغزاندن due_date در DB
شبیه‌سازی می‌شود (بدون وابستگی به ساعت ماشین).
"""
from datetime import date, timedelta

from sqlmodel import Session, col, select

from conftest import test_engine
from helpers import auth, err_code
from app.unit_of_work import UnitOfWork
from app.models.team import TeamAuditAction, TeamAuditEvent, TeamDues
from app.services.team_service import TeamService

BASE = "/api/v1/teams"
CAP = "09370000201"
M1 = "09370000202"
M2 = "09370000203"


def _setup(client, seed, name="تیم پلن"):
    seed["user"](CAP)
    seed["user"](M1)
    seed["user"](M2)
    t = client.post(f"{BASE}/", json={"name": name, "visibility": "public"},
                    headers=auth(CAP)).json()
    for u in (M1, M2):
        mid = client.post(f"{BASE}/{t['id']}/invite", json={"phone": u},
                          headers=auth(CAP)).json()["member_id"]
        client.post(f"{BASE}/{t['id']}/invitations/{mid}/accept", headers=auth(u))
    return t


def _uid(phone):
    from app.models.user import User
    with Session(test_engine) as s:
        return s.exec(select(User).where(User.phone == phone)).first().id


def _plan(client, tid, phone=CAP, **over):
    body = {"dues_auto": True, "amount": 150000, "title": "حق عضویت",
            "due_day": 5, "late_fee_pct": 10}
    body.update(over)
    return client.put(f"{BASE}/{tid}/dues/plan", json=body, headers=auth(phone))


def _gen(client, tid, amount=150000, title="شارژ زمین", days=1):
    return client.post(f"{BASE}/{tid}/dues/generate",
                       json={"amount": amount, "title": title,
                             "due_date": str(date.today() + timedelta(days=days))},
                       headers=auth(CAP))


def _rows(tid, penalties=None):
    """ردیف‌های سهم تیم؛ penalties=None همه، True فقط جریمه‌ها، False فقط اصلی‌ها."""
    conds = [TeamDues.team_id == tid]
    if penalties is True:
        conds.append(col(TeamDues.penalty_for_id).is_not(None))
    elif penalties is False:
        conds.append(col(TeamDues.penalty_for_id).is_(None))
    with Session(test_engine) as s:
        return list(s.exec(select(TeamDues).where(*conds).order_by(TeamDues.id)).all())


def _backdate(tid, days, only_unpaid=True):
    """گذر زمان: سررسید سهم‌های اصلی را به گذشته میلغزاند."""
    target = date.today() - timedelta(days=days)
    with Session(test_engine) as s:
        conds = [TeamDues.team_id == tid, col(TeamDues.penalty_for_id).is_(None)]
        if only_unpaid:
            conds.append(TeamDues.is_paid == False)  # noqa: E712
        for due in s.exec(select(TeamDues).where(*conds)).all():
            due.due_date = target
            s.add(due)
        s.commit()


def _audits(tid):
    with Session(test_engine) as s:
        return list(s.exec(select(TeamAuditEvent).where(
            TeamAuditEvent.team_id == tid).order_by(TeamAuditEvent.id)).all())


# ─────────────────────────── endpoint پلن ───────────────────────────

def test_plan_requires_amount_and_manager(client, seed):
    t = _setup(client, seed)
    r = _plan(client, t["id"], amount=None)
    assert r.status_code == 400 and err_code(r) == "DUES_AMOUNT_REQUIRED"
    assert _plan(client, t["id"], due_day=29).status_code == 422
    assert _plan(client, t["id"], late_fee_pct=101).status_code == 422
    r = _plan(client, t["id"], phone=M2)
    assert r.status_code == 403, r.text
    r = _plan(client, t["id"])
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["dues_auto"] is True and body["amount"] == 150000
    assert body["due_day"] == 5 and body["late_fee_pct"] == 10
    detail = client.get(f"{BASE}/{t['id']}", headers=auth(CAP)).json()
    assert detail["dues_plan"]["dues_auto"] is True
    assert detail["dues_plan"]["title"] == "حق عضویت"
    assert detail["dues_plan"]["grace_days"] >= 0
    # خاموش کردن خودکار با همان payload قابل‌اجراست (مبلغ قبلی روی تیم می‌ماند)
    assert _plan(client, t["id"], dues_auto=False).json()["dues_auto"] is False
    kinds = [a.action for a in _audits(t["id"])]
    assert TeamAuditAction.DUES_PLAN_UPDATED in kinds


# ─────────────────────────── job دوره ───────────────────────────

def test_monthly_job_creates_period_share_once(client, seed):
    t = _setup(client, seed)
    assert _plan(client, t["id"]).status_code == 200
    with UnitOfWork() as uow:
        res, notes = TeamService.run_monthly_dues(uow, today=date(2026, 4, 2))
    assert res["created"] == 3 and res["skipped"] == 0, res
    rows = _rows(t["id"], penalties=False)
    assert len(rows) == 3
    assert {r.title for r in rows} == {"حق عضویت — 2026-04"}
    assert {r.due_date for r in rows} == {date(2026, 4, 5)}
    assert {r.amount for r in rows} == {150000}
    assert len(notes) == 3 and {n["notif_type"] for n in notes} == {"dues_created"}
    assert all("150000" in n["message"] for n in notes)
    # اجرای دوباره در همان دوره ⇒ ردیف دوم نمی‌سازد (job روزانه امن است)
    with UnitOfWork() as uow:
        res2, notes2 = TeamService.run_monthly_dues(uow, today=date(2026, 4, 3))
    assert res2["created"] == 0 and res2["skipped"] == 3, res2
    assert notes2 == []
    assert len(_rows(t["id"], penalties=False)) == 3
    assert TeamAuditAction.DUES_GENERATED in [a.action for a in _audits(t["id"])]


def test_monthly_job_rolls_to_next_period_when_due_day_passed(client, seed):
    t = _setup(client, seed)
    assert _plan(client, t["id"], due_day=5).status_code == 200
    with UnitOfWork() as uow:
        res, _ = TeamService.run_monthly_dues(uow, today=date(2026, 4, 20))
    assert res["created"] == 3
    rows = _rows(t["id"], penalties=False)
    assert {r.due_date for r in rows} == {date(2026, 5, 5)}
    assert {r.title for r in rows} == {"حق عضویت — 2026-05"}
    # دوره بعدی سررسیدِ گذشته ندارد ⇒ سهم «از بدو تولد معوق» ساخته نمی‌شود
    assert all(r.due_date >= date(2026, 4, 20) for r in rows)
    # اسفند/دی: پرش سال هم درست حساب می‌شود
    with UnitOfWork() as uow:
        res2, _ = TeamService.run_monthly_dues(uow, today=date(2026, 12, 20))
    assert res2["created"] == 3
    rows2 = _rows(t["id"], penalties=False)
    assert {r.due_date for r in rows2 if r.due_date.year == 2027} == {date(2027, 1, 5)}


def test_monthly_job_skips_team_without_amount_or_members(client, seed):
    t = _setup(client, seed)
    # پلن خاموش ⇒ هیچ سهمی ساخته نمی‌شود
    with UnitOfWork() as uow:
        res, _ = TeamService.run_monthly_dues(uow, today=date(2026, 4, 2))
    assert res["teams"] == 0 and res["created"] == 0
    # تیم خودکار با یک عضو فعال باقی‌مانده (بقیه حذف شدند) ⇒ فقط همان یک ردیف
    assert _plan(client, t["id"]).status_code == 200
    cap_uid = _uid(CAP)
    with Session(test_engine) as s:
        from app.models.team import TeamMember, TeamMemberStatus
        for m in s.exec(select(TeamMember)).all():
            if m.user_id != cap_uid:
                m.status = TeamMemberStatus.REMOVED
                s.add(m)
        s.commit()
    with UnitOfWork() as uow:
        res2, _ = TeamService.run_monthly_dues(uow, today=date(2026, 4, 2))
    # کاپیتان عضو فعال است ⇒ یک ردیف؛ تیم‌های بدون عضو در شمارش جدا دیده می‌شوند
    assert res2["created"] == 1 and res2["teams_without_members"] == 0, res2


# ─────────────────────────── جریمه دیرکرد ───────────────────────────

def test_late_fee_job_adds_single_penalty_and_notifies(client, seed):
    t = _setup(client, seed)
    assert _plan(client, t["id"], dues_auto=False, late_fee_pct=10).status_code == 200
    assert _gen(client, t["id"]).status_code == 201
    _backdate(t["id"], 5)
    with UnitOfWork() as uow:
        res, notes = TeamService.run_late_fees(uow)
    assert res["penalized"] == 3 and res["scanned"] == 3, res
    pens = _rows(t["id"], penalties=True)
    assert len(pens) == 3
    assert {p.amount for p in pens} == {15000}          # ۱۰٪ از ۱۵۰٬۰۰۰
    assert {p.penalty_for_id for p in pens} == {d.id for d in _rows(t["id"], penalties=False)}
    assert all(p.due_date == date.today() for p in pens)
    assert all(p.title.startswith("جریمه دیرکرد —") for p in pens)
    assert len(notes) == 3 and {n["notif_type"] for n in notes} == {"dues_late_fee"}
    assert all("۱۰٪" in n["message"] or "10٪" in n["message"] for n in notes)
    assert TeamAuditAction.DUES_LATE_FEE in [a.action for a in _audits(t["id"])]
    # اجرای دوباره ⇒ جریمه تکراری نمی‌سازد (ضدتکرار با لینک penalty_for_id)
    with UnitOfWork() as uow:
        res2, notes2 = TeamService.run_late_fees(uow)
    assert res2["penalized"] == 0 and notes2 == []
    assert len(_rows(t["id"], penalties=True)) == 3


def test_late_fee_respects_grace_period_and_zero_pct(client, seed):
    t = _setup(client, seed)
    assert _plan(client, t["id"], dues_auto=False, late_fee_pct=10).status_code == 200
    assert _gen(client, t["id"]).status_code == 201
    # فقط ۲ روز از سررسید گذشته — هنوز داخل مهلت (grace) است
    _backdate(t["id"], 2)
    with UnitOfWork() as uow:
        res, notes = TeamService.run_late_fees(uow)
    assert res["penalized"] == 0 and notes == []
    # درصد جریمه صفر ⇒ حتی با دیرکرد طولانی جریمه‌ای بسته نمی‌شود
    assert _plan(client, t["id"], dues_auto=False, late_fee_pct=0).status_code == 200
    _backdate(t["id"], 30)
    with UnitOfWork() as uow:
        res2, _ = TeamService.run_late_fees(uow)
    assert res2["penalized"] == 0 and res2["scanned"] == 0, res2


def test_late_fee_skips_paid_and_voided_dues(client, seed):
    t = _setup(client, seed)
    assert _plan(client, t["id"], dues_auto=False, late_fee_pct=20).status_code == 200
    assert _gen(client, t["id"]).status_code == 201
    originals = _rows(t["id"], penalties=False)
    # کاپیتان سهمش را پرداخت می‌کند؛ M1 سهمش باطل می‌شود
    r = client.post(f"{BASE}/{t['id']}/dues/{originals[0].id}/pay",
                    json={"method": "cash"}, headers=auth(CAP))
    assert r.status_code == 200, r.text
    r = client.delete(f"{BASE}/{t['id']}/dues/{originals[1].id}?reason=بخشودگی",
                      headers=auth(CAP))
    assert r.status_code == 200, r.text
    _backdate(t["id"], 10)
    with UnitOfWork() as uow:
        res, notes = TeamService.run_late_fees(uow)
    assert res["penalized"] == 1, res
    pens = _rows(t["id"], penalties=True)
    assert len(pens) == 1 and pens[0].amount == 30000    # ۲۰٪ از ۱۵۰٬۰۰۰
    assert pens[0].user_id == originals[2].user_id
    assert len(notes) == 1


# ─────────────────────────── wiring تسک/زمان‌بندی ───────────────────────────

def test_celery_task_runs_job_and_dispatches_notifications(client, seed,
                                                           sent_notifications):
    from app.tasks.team_dues_tasks import generate_monthly_team_dues

    t = _setup(client, seed)
    assert _plan(client, t["id"]).status_code == 200
    res = generate_monthly_team_dues()          # eager در تست (conftest)
    assert res["created"] == 3 and res["notified"] == 3, res
    # fixture از ابتدای تست (ساخت تیم/عضویت) هم اعلان capture کرده — فقط سهم‌ها را می‌بینیم
    dues_notes = [n for n in sent_notifications if n["type"] == "dues_created"]
    assert len(dues_notes) == 3
    assert {n["user_id"] for n in dues_notes} == {
        d.user_id for d in _rows(t["id"], penalties=False)}
    assert len(_rows(t["id"], penalties=False)) == 3


def test_jobs_registered_in_beat_schedule():
    from app.tasks.worker import celery_app

    assert "app.tasks.team_dues_tasks" in set(celery_app.conf.imports)
    names = set(celery_app.conf.beat_schedule)
    assert {"generate-monthly-team-dues", "apply-team-dues-late-fees"} <= names
