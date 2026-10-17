# backend/tests/test_split_payment_expiry_and_cancel.py
"""`EXPIRED`، `OVERDUE` و `CANCELLED` حالا تولید می‌شوند (گرهٔ C11.6.2 — راند ۲۶).

تا پیش از این راند هر سه فقط در enum تعریف بودند: `grep` در `app/` هیچ نویسنده‌ای
برای‌شان نداشت، پس یک پرداخت اشتراکی بعد از گذشتن مهلت تا ابد `PENDING`/`PARTIAL`
می‌ماند — با وجود اینکه UI از قبل چیپ «مهلت گذشته» را داشت. این فایل همان سه حالت
را با نگهبان‌های statement می‌سنجد:

  1. sweep (`expire_overdue`): سهمِ پرداخت‌نشده ⇒ OVERDUE، پدرِ ناقص ⇒ EXPIRED؛
     به `COMPLETED` و ردیفِ بی‌مهلت دست نمی‌زند و دوباره‌اجرا چیزی عوض نمی‌کند.
  2. لغو (`POST /{id}/cancel`): فقط سازنده یا سرپرست، فقط تا وقتی پولی گرفته نشده؛
     سهمِ پرداخت‌شده ⇒ ۴۰۰ با پیامِ بازگشت وجه (X4)، و لغوِ دوباره ⇒ ۴۰۰.
  3. پدرِ لغوشده دیگر سهمِ پرداختی نمی‌گیرد (نگهبانِ داخل UPDATE، نه read-check).
"""
from datetime import datetime, timedelta, timezone

from sqlmodel import Session, select

from conftest import test_engine
from helpers import auth
from app.models.split_payment import (
    ShareStatus,
    SplitPaymentAuditEvent,
    SplitPaymentShare,
    SplitPaymentStatus,
    TeamSplitPayment,
)
from app.models.user import User, UserRole
from app.services.split_payment_service import cancel_split_payment, expire_overdue
from test_split_payments import _create_team, _invite_and_accept

BASE = "/api/v1/split-payments"


def _future(minutes: int) -> datetime:
    return datetime.now(timezone.utc) + timedelta(minutes=minutes)


def _split(client, seed, tag, members=3, deadline=None, overdue_min=None, amount=300_000):
    """پرداخت اشتراکی EQUAL با `members` عضو؛ برمی‌گرداند (payment_id, phones, share_ids).

    `deadline` در API باید آینده باشد (قصدِ خودِ API است)، پس «گذشته از مهلت» را
    با `overdue_min` بعد از ساخت به گذشته می‌بریم — همان کاری که در production
    زمان انجام می‌دهد، نه یک فرضِ تستی.
    """
    phones = [f"0935{tag}{i:03d}" for i in range(1, members + 1)]
    for p in phones:
        seed["user"](p)
    team = _create_team(client, seed, phones[0])
    for p in phones[1:]:
        _invite_and_accept(client, phones[0], p, team["id"])
    body = {"team_id": team["id"], "amount": amount, "method": "EQUAL"}
    if deadline is not None:
        body["deadline"] = deadline.isoformat()
    r = client.post(BASE + "/", json=body, headers=auth(phones[0]))
    assert r.status_code == 201, r.text
    data = r.json()
    if overdue_min is not None:
        sp = TeamSplitPayment.__table__
        with Session(test_engine) as s:
            s.execute(sp.update().where(sp.c.id == data["id"]).values(
                deadline=datetime.now(timezone.utc) - timedelta(minutes=overdue_min)))
            s.commit()
    return data["id"], phones, [s["id"] for s in data["shares"]]


def _payment(payment_id: int) -> TeamSplitPayment:
    with Session(test_engine) as s:
        return s.get(TeamSplitPayment, payment_id)


def _sweep() -> dict:
    """همان چیزی که beat هر ساعت صدا می‌زند، ولی روی engine تست."""
    with Session(test_engine) as s:
        return expire_overdue(s)


def _user_id(phone: str) -> int:
    with Session(test_engine) as s:
        return s.exec(select(User).where(User.phone == phone)).first().id


def _share(share_id: int) -> SplitPaymentShare:
    with Session(test_engine) as s:
        return s.get(SplitPaymentShare, share_id)


def _pay(client, payment_id, share_id, phone):
    return client.post(f"{BASE}/{payment_id}/shares/{share_id}/pay",
                       json={}, headers=auth(phone))


# ─────────── ۱) sweep: مهلت گذشته ───────────

def test_sweep_marks_past_deadline_shares_overdue_and_parent_expired(client, seed):
    pid, phones, shares = _split(client, seed, "801", overdue_min=1)
    out = _sweep()

    assert out == {"shares_overdue": 3, "payments_expired": 1}
    assert _payment(pid).status == SplitPaymentStatus.EXPIRED
    assert all(_share(sid).status == ShareStatus.OVERDUE for sid in shares)


def test_sweep_ignores_a_split_without_a_deadline(client, seed):
    pid, phones, shares = _split(client, seed, "802")
    assert _sweep() == {"shares_overdue": 0, "payments_expired": 0}
    assert _payment(pid).status == SplitPaymentStatus.PENDING
    assert _share(shares[0]).status == ShareStatus.PENDING


def test_sweep_ignores_a_split_whose_deadline_is_still_ahead(client, seed):
    pid, _, shares = _split(client, seed, "803", deadline=_future(60))
    _sweep()
    assert _payment(pid).status == SplitPaymentStatus.PENDING
    assert _share(shares[0]).status == ShareStatus.PENDING


def test_sweep_never_touches_a_settled_split(client, seed):
    """COMPLETED نباید EXPIRED شود — همان predicate ای که در WHERE نشسته است."""
    pid, phones, shares = _split(client, seed, "804", overdue_min=5)
    for sid, phone in zip(shares, phones):
        assert _pay(client, pid, sid, phone).status_code == 200
    assert _payment(pid).status == SplitPaymentStatus.COMPLETED

    out = _sweep()
    assert out["payments_expired"] == 0
    assert _payment(pid).status == SplitPaymentStatus.COMPLETED
    assert all(_share(sid).status == ShareStatus.PAID for sid in shares)


def test_sweep_leaves_a_paid_share_paid_and_marks_only_the_unpaid_ones(client, seed):
    pid, phones, shares = _split(client, seed, "805", overdue_min=5)
    assert _pay(client, pid, shares[0], phones[0]).status_code == 200
    assert _payment(pid).status == SplitPaymentStatus.PARTIAL

    out = _sweep()
    assert out == {"shares_overdue": 2, "payments_expired": 1}
    assert _share(shares[0]).status == ShareStatus.PAID
    assert _share(shares[1]).status == ShareStatus.OVERDUE
    assert _payment(pid).status == SplitPaymentStatus.EXPIRED
    assert _payment(pid).paid_amount == 100_000     # شمارنده دست‌نخورده می‌ماند


def test_sweep_is_idempotent(client, seed):
    pid, _, shares = _split(client, seed, "806", overdue_min=5)
    first = _sweep()
    second = _sweep()
    assert first["payments_expired"] == 1
    assert second == {"shares_overdue": 0, "payments_expired": 0}
    assert _share(shares[0]).status == ShareStatus.OVERDUE


def test_late_payment_after_expiry_is_still_accepted(client, seed):
    """تصمیمِ محصول: پولِ آمده از برچسبِ مهلت مهم‌تر است ⇒ sweep پدر را برمی‌گرداند."""
    pid, phones, shares = _split(client, seed, "807", overdue_min=5)
    _sweep()
    assert _payment(pid).status == SplitPaymentStatus.EXPIRED

    assert _pay(client, pid, shares[0], phones[0]).status_code == 200
    assert _share(shares[0]).status == ShareStatus.PAID
    assert _payment(pid).status == SplitPaymentStatus.PARTIAL


def test_sweep_after_a_late_payment_expires_it_again(client, seed):
    pid, phones, shares = _split(client, seed, "808", overdue_min=5)
    _sweep()
    assert _pay(client, pid, shares[0], phones[0]).status_code == 200

    out = _sweep()
    assert out["payments_expired"] == 1
    assert _payment(pid).status == SplitPaymentStatus.EXPIRED
    assert _share(shares[1]).status == ShareStatus.OVERDUE
    assert _share(shares[0]).status == ShareStatus.PAID


# ─────────── ۲) لغو ───────────

def test_creator_can_cancel_a_split_nobody_has_paid(client, seed):
    pid, phones, shares = _split(client, seed, "811", deadline=_future(30))
    r = client.post(f"{BASE}/{pid}/cancel", json={"note": "انصراف تیم"}, headers=auth(phones[0]))
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "CANCELLED"
    assert _payment(pid).status == SplitPaymentStatus.CANCELLED
    assert _payment(pid).note == "انصراف تیم"

    with Session(test_engine) as s:
        events = s.exec(select(SplitPaymentAuditEvent)
                        .where(SplitPaymentAuditEvent.split_payment_id == pid)).all()
    assert [e.action for e in events] == ["CREATED", "CANCELLED"]
    assert events[1].performed_by == phones[0]


def test_cancelling_twice_is_refused_with_a_clear_message(client, seed):
    pid, phones, _ = _split(client, seed, "812")
    assert client.post(f"{BASE}/{pid}/cancel", headers=auth(phones[0])).status_code == 200
    r = client.post(f"{BASE}/{pid}/cancel", headers=auth(phones[0]))
    assert r.status_code == 400
    assert "از قبل لغو شده" in r.json()["detail"]


def test_a_cancelled_split_still_accepts_no_share_payment(client, seed):
    pid, phones, shares = _split(client, seed, "813")
    assert client.post(f"{BASE}/{pid}/cancel", headers=auth(phones[0])).status_code == 200

    r = _pay(client, pid, shares[0], phones[0])
    assert r.status_code == 400
    assert "لغو شده" in r.json()["detail"]
    assert _share(shares[0]).status == ShareStatus.PENDING
    assert _payment(pid).paid_amount == 0


def test_cancel_is_refused_once_any_share_is_paid(client, seed):
    """ابطالِ ردیفِ دارای پول یعنی تکلیفِ پرداختِ عضو نامعلوم — بازگشت وجه X4 است."""
    pid, phones, shares = _split(client, seed, "814")
    assert _pay(client, pid, shares[0], phones[0]).status_code == 200

    r = client.post(f"{BASE}/{pid}/cancel", headers=auth(phones[0]))
    assert r.status_code == 400
    assert "بازگشت وجه" in r.json()["detail"]
    assert _payment(pid).status == SplitPaymentStatus.PARTIAL
    assert _payment(pid).paid_amount == 100_000
    assert _share(shares[0]).status == ShareStatus.PAID


def test_cancel_of_a_settled_split_is_refused(client, seed):
    pid, phones, shares = _split(client, seed, "815")
    for sid, phone in zip(shares, phones):
        assert _pay(client, pid, sid, phone).status_code == 200
    r = client.post(f"{BASE}/{pid}/cancel", headers=auth(phones[0]))
    assert r.status_code == 400
    assert "تکمیل‌شده" in r.json()["detail"]
    assert _payment(pid).status == SplitPaymentStatus.COMPLETED


def test_only_the_creator_or_a_super_admin_may_cancel(client, seed):
    pid, phones, _ = _split(client, seed, "816")
    r = client.post(f"{BASE}/{pid}/cancel", headers=auth(phones[1]))
    assert r.status_code == 403
    assert "لغو کند" in r.json()["detail"]
    assert _payment(pid).status == SplitPaymentStatus.PENDING

    admin = seed["user"]("0935816900", role=UserRole.SUPER_ADMIN)
    r = client.post(f"{BASE}/{pid}/cancel", headers=auth(admin.phone))
    assert r.status_code == 200, r.text
    assert _payment(pid).status == SplitPaymentStatus.CANCELLED


def test_an_expired_unpaid_split_can_still_be_cancelled(client, seed):
    """EXPIRED هنوز باز است: ثبتِ لغو برای بایگانیِ مالی درست است."""
    pid, phones, _ = _split(client, seed, "817", overdue_min=5)
    _sweep()
    r = client.post(f"{BASE}/{pid}/cancel", headers=auth(phones[0]))
    assert r.status_code == 200, r.text
    assert _payment(pid).status == SplitPaymentStatus.CANCELLED


def test_cancelling_someone_elses_split_is_403_before_any_write(client, seed):
    """۴۰۳ نباید ردیفِ ممیزیِ «لغو» بسازد."""
    pid, phones, _ = _split(client, seed, "818")
    other = seed["user"]("0935818900", role=UserRole.USER)
    r = client.post(f"{BASE}/{pid}/cancel", headers=auth(other.phone))
    assert r.status_code == 403
    with Session(test_engine) as s:
        assert s.exec(select(SplitPaymentAuditEvent)
                      .where(SplitPaymentAuditEvent.split_payment_id == pid,
                             SplitPaymentAuditEvent.action == "CANCELLED")).first() is None


def test_missing_payment_is_404(client, seed):
    seed["user"]("0935819001")
    r = client.post(f"{BASE}/499999/cancel", headers=auth("0935819001"))
    assert r.status_code == 404
    assert r.json()["detail"] == "پرداخت اشتراکی یافت نشد"


# ─────────── ۳) شکلِ statement (نگهبانِ read-modify-write) ───────────

def test_sweep_writes_two_guarded_statements(client, seed):
    """هیچ‌کدام از دو نوشتن read-modify-write روی آبجکت نیست؛ predicate در SQL است."""
    _split(client, seed, "821", overdue_min=5)
    statements = []

    from sqlalchemy import event

    @event.listens_for(test_engine, "before_cursor_execute")
    def _recv(conn, cursor, statement, parameters, context, executemany):
        statements.append(statement)

    try:
        _sweep()
    finally:
        event.remove(test_engine, "before_cursor_execute", _recv)

    ups = [st for st in statements if st.strip().lower().startswith("update split_payment_shares")]
    upd = [st for st in statements if st.strip().lower().startswith("update team_split_payments")]
    assert len(ups) == 1 and len(upd) == 1
    share_sql = " ".join(ups[0].lower().split())
    parent_sql = " ".join(upd[0].lower().split())
    assert "in (select" in share_sql             # فقط پدرِ بازِ گذشته از مهلت
    assert "status = ?" in share_sql             # فقط PENDING ⇒ OVERDUE
    assert "status in (?, ?)" in parent_sql      # پدرِ PENDING/PARTIAL
    assert "select count" in parent_sql          # «هنوز سهمِ پرداخت‌نشده دارد»


def test_cancel_update_carries_its_own_money_guard(client, seed):
    """`paid_amount = 0` و شمارشِ سهمِ PAID داخلِ WHERE نشسته‌اند، نه در Python."""
    pid, phones, _ = _split(client, seed, "822")
    statements = []

    from sqlalchemy import event

    @event.listens_for(test_engine, "before_cursor_execute")
    def _recv(conn, cursor, statement, parameters, context, executemany):
        statements.append(statement)

    try:
        with Session(test_engine) as s:
            out = cancel_split_payment(s, pid, actor_id=_user_id(phones[0]),
                                       actor_phone=phones[0])
    finally:
        event.remove(test_engine, "before_cursor_execute", _recv)

    assert out == "cancelled"
    assert _payment(pid).status == SplitPaymentStatus.CANCELLED
    ups = [st for st in statements if st.strip().lower().startswith("update team_split_payments")]
    assert len(ups) == 1
    low = " ".join(ups[0].lower().split())
    assert "paid_amount = ?" in low
    assert "select count" in low                 # شمارشِ سهمِ PAID هم در SQL
    assert "split_payment_audit_events" in " ".join(st.lower() for st in statements)
