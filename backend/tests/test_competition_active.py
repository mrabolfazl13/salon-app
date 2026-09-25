# تست اندپوینت عمومی رقابت‌های فعال — GET /competitions/active
from datetime import datetime, timedelta, timezone

from app.models.competition import PriceCompetition, CompetitionStatus


def _mk_comp(db, slot, venue, manager_id, price, hours_left):
    comp = PriceCompetition(
        slot_id=slot.id, venue_id=venue.id, venue_manager_id=manager_id,
        offered_price=price, status=CompetitionStatus.ACTIVE,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=hours_left),
    )
    db.add(comp)
    db.commit()
    db.refresh(comp)
    db.close()
    return comp


def test_active_competitions_grouped_and_filtered(client, seed, db):
    owner = seed["user"]("09300000001")
    bundle = seed["booking"](owner, price=400_000)
    slot, venue = bundle["slot"], bundle["venue"]

    _mk_comp(db, slot, venue, owner.id, 350_000, 5)
    _mk_comp(db, slot, venue, owner.id, 300_000, 2)
    _mk_comp(db, slot, venue, owner.id, 250_000, -1)  # منقضی — نباید بیاید

    owner2 = seed["user"]("09300000002")
    bundle2 = seed["booking"](owner2, price=600_000)
    _mk_comp(db, bundle2["slot"], bundle2["venue"], owner2.id, 550_000, 9)

    r = client.get("/api/v1/competitions/active")
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) == 2
    # نزدیک‌ترین مهلت اول
    assert items[0]["slot_id"] == slot.id
    assert items[0]["best_price"] == 300_000
    assert items[0]["bid_count"] == 2
    assert items[0]["venue_name"] == venue.name
