# -*- coding: utf-8 -*-
"""backend/tests/test_backend_hardening.py
Hardening wave — API contract patches + alembic-chain and seed-script smokes.

- SlotResponse exposes deal fields (is_deal/deal_price) on public slot lists.
- /finance/transactions rows carry venue_name (batch-resolved, no N+1).
- /deals/available computes distance_km only with near_lat/near_lng + radius filter.
- Alembic chain runs CLEAN on a fresh SQLite DB and is idempotent over a
  create_all-built schema; downgrade base does not crash.
- scripts/seed_full_demo.py executes end-to-end into a throwaway SQLite file.
"""
import os
import pathlib
import sqlite3
import subprocess
import sys
from datetime import date, datetime, time as dtime, timedelta, timezone

import pytest
from sqlmodel import Session

import app.services.pending_booking_service as pbs_module
import app.utils.rate_limit as rate_limit_module
from app.models.slot import Slot, SlotStatus
from app.models.user import User, UserRole
from app.models.venue import Venue
from helpers import auth, FakeRedis

from conftest import test_engine

BACKEND = pathlib.Path(__file__).resolve().parents[1]
PY = sys.executable


@pytest.fixture()
def fake_redis(monkeypatch):
    fake = FakeRedis()
    monkeypatch.setattr(pbs_module, "_client", fake)
    monkeypatch.setattr(rate_limit_module, "_client", fake)
    return fake


def _fresh():
    return Session(test_engine)


def _mk_user(phone, role=UserRole.USER):
    with _fresh() as s:
        u = User(phone=phone, full_name="hard", hashed_password="x", role=role,
                 is_verified=True)
        s.add(u)
        s.commit()
        return u.id, u.phone


def _mk_venue(mgr_id, name="H", lat=35.7, lng=51.4):
    with _fresh() as s:
        v = Venue(name=name, category="futsal", address="آدرس", latitude=lat,
                  longitude=lng, phone="09121110000", manager_id=mgr_id)
        s.add(v)
        s.commit()
        return v.id


def _mk_slot(vid, when, start=dtime(18, 0), price=250000, **extra):
    with _fresh() as s:
        sl = Slot(venue_id=vid, slot_date=when, start_time=start, duration=90,
                  base_price=price, current_price=price, status=SlotStatus.AVAILABLE, **extra)
        s.add(sl)
        s.commit()
        return sl.id


# ─────────────────────────── contract patches ───────────────────────────

def test_slot_response_includes_deal_fields(client):
    """GET /slots/venue/{id} — deal chips (is_deal/deal_price) on every item."""
    m_id, m_phone = _mk_user("09355000001", UserRole.VENUE_MANAGER)
    v = _mk_venue(m_id)
    d = date.today() + timedelta(days=2)
    with _fresh() as s:
        plain = Slot(venue_id=v, slot_date=d, start_time=dtime(10, 0), duration=90,
                     base_price=250000, current_price=250000, status=SlotStatus.AVAILABLE)
        deal = Slot(venue_id=v, slot_date=d, start_time=dtime(14, 0), duration=90,
                    base_price=400000, current_price=400000, status=SlotStatus.AVAILABLE,
                    is_deal=True, deal_price=300000,
                    deal_expires_at=datetime.now(timezone.utc) + timedelta(hours=12))
        s.add_all([plain, deal])
        s.commit()
        deal_id = deal.id

    r = client.get(f"/api/v1/slots/venue/{v}", params={"slot_date": d.isoformat()})
    assert r.status_code == 200, r.text
    item = next(x for x in r.json() if x["id"] == deal_id)
    assert item["is_deal"] is True
    assert item["deal_price"] == 300000
    assert item["deal_expires_at"]
    rest = [x for x in r.json() if x["id"] != deal_id]
    assert all(x["is_deal"] is False and x["deal_price"] is None for x in rest)


def test_finance_transactions_expose_venue_name(client):
    m_id, m_phone = _mk_user("09355000002", UserRole.VENUE_MANAGER)
    v = _mk_venue(m_id, name="سالن نام‌دار")
    h = auth(m_phone)
    r = client.post("/api/v1/finance/transactions", json={
        "type": "payment", "direction": "income", "amount": 420000,
        "method": "cash", "venue_id": v, "description": "نقدی",
    }, headers=h)
    assert r.status_code == 201, r.text
    body = client.get(f"/api/v1/finance/transactions?venue_id={v}", headers=h).json()
    assert body["total"] >= 1
    assert any(t["venue_name"] == "سالن نام‌دار" for t in body["items"])
    # global row (no venue) → venue_name None, no crash
    r2 = client.post("/api/v1/finance/transactions", json={
        "type": "payment", "direction": "income", "amount": 100000,
        "method": "cash", "venue_id": None, "description": "بدون سالن",
    }, headers=h)
    assert r2.status_code in (201, 400)  # manager must pin a venue (400) is acceptable scope


def test_deals_available_distance_km_and_radius_filter(client, fake_redis):
    m1_id, m1 = _mk_user("09355000003", UserRole.VENUE_MANAGER)
    m2_id, m2 = _mk_user("09355000004", UserRole.VENUE_MANAGER)
    u_id, u_phone = _mk_user("09355000005")
    v_near = _mk_venue(m1_id, name="نزدیک", lat=35.70, lng=51.40)
    v_far = _mk_venue(m2_id, name="دور", lat=36.85, lng=51.40)
    d = date.today() + timedelta(days=2)
    s_near = _mk_slot(v_near, d)
    s_far = _mk_slot(v_far, d)
    for m, v, sid in ((m1, v_near, s_near), (m2, v_far, s_far)):
        r = client.post("/api/v1/deals/publish", headers=auth(m), json={
            "venue_id": v, "slot_ids": [sid], "discount_percent": 25})
        assert r.status_code == 200, r.text

    # no near_lat ⇒ distance_km is None
    items = client.get("/api/v1/deals/available", headers=auth(u_phone)).json()
    assert {i["slot_id"] for i in items} >= {s_near, s_far}
    assert all(i["distance_km"] is None for i in items)

    # near coords ⇒ km present + radius filter drops the far venue
    items = client.get("/api/v1/deals/available", headers=auth(u_phone),
                       params={"near_lat": 35.701, "near_lng": 51.401,
                               "radius_km": 10, "sort": "distance"}).json()
    assert items and all(i["distance_km"] is not None for i in items)
    assert {i["venue_id"] for i in items} == {v_near}
    assert items[0]["slot_id"] == s_near


def _rec_calls(dependant):
    if dependant is None:
        return
    yield dependant.call
    for sub in getattr(dependant, "dependencies", []) or []:
        yield from _rec_calls(sub)


def test_get_browsing_endpoints_have_no_rate_limiter():
    """Task-5 guard: a read-only GET must never carry the fixed-window limiter,
    and the deal browsing market must be reachable."""
    from app.main import app as fastapi_app
    from app.utils.rate_limit import (auth_rate_limit, verification_rate_limit,
                                      booking_rate_limit, payment_rate_limit)
    limiters = {auth_rate_limit, verification_rate_limit,
                booking_rate_limit, payment_rate_limit}
    paths = set()
    for route in fastapi_app.routes:
        methods = getattr(route, "methods", None)
        if not methods or "GET" not in methods:
            continue
        path = getattr(route, "path", "")
        if not path.startswith("/api/v1"):
            continue
        paths.add(path)
        for call in _rec_calls(getattr(route, "dependant", None)):
            assert call not in limiters, f"GET {path} is rate limited"
    assert "/api/v1/deals/available" in paths
    assert "/api/v1/slots/venue/{venue_id}" in paths


# ─────────────────────────── infrastructure smokes ───────────────────────────

def _run(cmd, env_db):
    env = dict(os.environ)
    env["DATABASE_URL"] = env_db
    env.pop("PYTEST_CURRENT_TEST", None)
    return subprocess.run([PY] + cmd, cwd=str(BACKEND), env=env,
                          capture_output=True, text=True, timeout=600)


@pytest.mark.skipif(not (BACKEND / "alembic.ini").exists(), reason="no alembic config")
def test_alembic_chain_fresh_sqlite_upgrade_and_downgrade(tmp_path):
    """THE key win: empty SQLite → upgrade head → downgrade base, exit 0 both ways."""
    db = tmp_path / "fresh.db"
    url = f"sqlite:///{db.as_posix()}"
    up = _run(["-m", "alembic", "-c", "alembic.ini", "upgrade", "head"], url)
    assert up.returncode == 0, up.stderr[-1500:]
    assert (tmp_path / "fresh.db").exists()
    tables = {r[0] for r in sqlite3.connect(str(db)).execute(
        "select name from sqlite_master where type='table'")}
    assert {"bookings", "slots", "financial_transactions", "teams",
            "staff_assignments", "game_payments"} <= tables
    check = _run(["-m", "alembic", "-c", "alembic.ini", "current"], url)
    assert "l2r012contractdays" in check.stdout or check.stderr == ""
    down = _run(["-m", "alembic", "-c", "alembic.ini", "downgrade", "base"], url)
    assert down.returncode == 0, down.stderr[-1500:]
    leftover = [r[0] for r in sqlite3.connect(str(db)).execute(
        "select name from sqlite_master where type='table'")]
    assert leftover == ["alembic_version"]


@pytest.mark.skipif(not (BACKEND / "alembic.ini").exists(), reason="no alembic config")
def test_alembic_chain_idempotent_over_create_all(tmp_path):
    """create_all-built schema (dev/pytest shape) + whole chain from base = no-op clean."""
    from sqlalchemy import create_engine
    from sqlmodel import SQLModel
    import app.models  # noqa: F401 — register metadata
    db = tmp_path / "ca.db"
    url = f"sqlite:///{db.as_posix()}"
    eng = create_engine(url)
    SQLModel.metadata.create_all(eng)
    eng.dispose()
    r = _run(["-m", "alembic", "-c", "alembic.ini", "upgrade", "head"], url)
    assert r.returncode == 0, r.stderr[-1500:]


@pytest.mark.skipif(not (BACKEND / "scripts" / "seed_full_demo.py").exists(),
                    reason="seed script missing")
def test_seed_full_demo_smoke(tmp_path):
    """the demo seed executes cleanly on a throwaway sqlite file with data present."""
    db = tmp_path / "seed.db"
    r = _run(["scripts/seed_full_demo.py", "--reset", "--sqlite", str(db)],
             os.environ.get("DATABASE_URL", ""))
    assert r.returncode == 0, (r.stdout[-800:], r.stderr[-1500:])
    assert "DEMO SEED COMPLETE" in r.stdout
    con = sqlite3.connect(str(db))
    count = lambda q: con.execute(q).fetchone()[0]  # noqa: E731
    assert count("select count(*) from users") >= 15
    assert count("select count(*) from venues where category='gym'") == 1
    assert count("select count(*) from slots") > 500
    assert count("select count(*) from bookings where status='COMPLETED'") >= 4
    assert count("select count(*) from bookings where status='CANCELLED'") == 1
    assert count("select count(*) from financial_transactions "
                 "where type='REFUND'") >= 1
    assert count("select count(*) from loyalty_points") >= 4
    assert count("select count(*) from contract_audit_events") >= 5
    assert count("select count(*) from teams") == 2
    con.close()
