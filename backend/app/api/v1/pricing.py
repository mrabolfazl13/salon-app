# backend/app/api/v1/pricing.py
"""CRUD قوانین قیمت‌گذاری + پیش‌نمایش — مدیر-گیت و سالن-اسکوپ.

این مسیر تنها مبدأ تعریف قیمت است؛ هیچ نقطه‌ی دیگری از کلاینت مبلغ
نمی‌پذیرد (برخورد سرور با «قیمت هرگز سمت کلاینت محاسبه/افزایش نمی‌شود»).
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel

from app.unit_of_work import get_unit_of_work, UnitOfWork
from app.models.pricing_rule import ModifierType, PricingRule
from app.models.user import User
from app.schemas.pricing import (
    PricingPreviewRequest, PricingPreviewResponse,
    PricingRuleCreate, PricingRuleResponse, PricingRuleUpdate,
)
from app.services.pricing_service import PricingService
from app.utils.auth import get_current_user
from app.utils.permissions import Perm
from app.utils.staff_access import ensure_venue_permission, log_security_event
from app.utils.venue_guard import manager_venue_ids

router = APIRouter(prefix="/pricing", tags=["Pricing"])


class _VenueDefaultPrice(BaseModel):
    default_slot_price: int


def _validate_rule_payload(modifier_type, value: int, start_time, end_time, label: str = ""):
    if value == 0:
        raise HTTPException(status_code=400, detail="مقدار قانون نمی‌تواند صفر باشد")
    if modifier_type == ModifierType.PERCENT and abs(value) > 10000:
        raise HTTPException(
            status_code=400, detail="درصد قانون باید بین ۱۰۰-٪ و ۱۰۰+٪ باشد")
    if modifier_type == ModifierType.ABSOLUTE and value <= 0:
        raise HTTPException(
            status_code=400, detail="قیمت مطلق قانون باید مثبت باشد")
    if start_time is not None and end_time is not None and start_time >= end_time:
        raise HTTPException(
            status_code=400, detail="ساعت شروع بازه باید قبل از پایان باشد")


def _rule_response(rule: PricingRule) -> PricingRuleResponse:
    return PricingRuleResponse(
        id=rule.id, venue_id=rule.venue_id, day_of_week=rule.day_of_week,
        start_time=rule.start_time, end_time=rule.end_time,
        holiday_applies=rule.holiday_applies,
        modifier_type=rule.modifier_type.value if hasattr(rule.modifier_type, "value") else str(rule.modifier_type),
        value=rule.value, priority=rule.priority, is_active=rule.is_active,
        label=rule.label or "",
    )


@router.get("/rules", response_model=List[PricingRuleResponse])
def list_rules(
    request: Request,
    venue_id: int = Query(...),
    include_inactive: bool = Query(False),
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    ensure_venue_permission(uow, current_user, venue_id,
                            [Perm.PRICING_MANAGE], request)
    rules = uow.pricing_rules.get_active_for_venue(venue_id)
    if include_inactive:
        from app.repositories.pricing_rule_repository import PricingRuleRepository
        rules = [r for r in PricingRuleRepository(uow.session).get_all(
            venue_id=venue_id, limit=200, order_by="priority") ]
    return [_rule_response(r) for r in rules]


@router.post("/rules", response_model=PricingRuleResponse)
def create_rule(
    data: PricingRuleCreate,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    ensure_venue_permission(uow, current_user, data.venue_id,
                            [Perm.PRICING_MANAGE], request)
    _validate_rule_payload(data.modifier_type, data.value,
                           data.start_time, data.end_time)
    rule = uow.pricing_rules.create({
        "venue_id": data.venue_id,
        "day_of_week": data.day_of_week,
        "start_time": data.start_time,
        "end_time": data.end_time,
        "holiday_applies": data.holiday_applies,
        "modifier_type": data.modifier_type,
        "value": data.value,
        "priority": data.priority,
        "label": data.label,
        "is_active": data.is_active,
    })
    log_security_event(uow, "pricing.rule_created", current_user.id,
                       target_type="pricing_rule", target_id=rule.id,
                       venue_id=data.venue_id,
                       data={"value": data.value,
                             "modifier_type": str(data.modifier_type)},
                       request=request)
    uow.commit()
    return _rule_response(rule)


@router.put("/rules/{rule_id}", response_model=PricingRuleResponse)
def update_rule(
    rule_id: int,
    data: PricingRuleUpdate,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    rule = uow.pricing_rules.get_by_id(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="قانون قیمت‌گذاری یافت نشد")
    ensure_venue_permission(uow, current_user, rule.venue_id,
                            [Perm.PRICING_MANAGE], request)
    log_security_event(uow, "pricing.rule_updated", current_user.id,
                       target_type="pricing_rule", target_id=rule_id,
                       venue_id=rule.venue_id,
                       data=data.model_dump(exclude_unset=True),
                       request=request)
    changes = data.model_dump(exclude_unset=True)
    mt = changes.get("modifier_type", rule.modifier_type)
    val = changes.get("value", rule.value)
    st = changes.get("start_time", rule.start_time)
    et = changes.get("end_time", rule.end_time)
    if "value" in changes or "modifier_type" in changes:
        _validate_rule_payload(mt, val, st, et)
    if changes:
        rule = uow.pricing_rules.update(rule_id, changes)
    uow.commit()
    return _rule_response(rule)


@router.delete("/rules/{rule_id}")
def delete_rule(
    rule_id: int,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    rule = uow.pricing_rules.get_by_id(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="قانون قیمت‌گذاری یافت نشد")
    ensure_venue_permission(uow, current_user, rule.venue_id,
                            [Perm.PRICING_MANAGE], request)
    log_security_event(uow, "pricing.rule_deleted", current_user.id,
                       target_type="pricing_rule", target_id=rule_id,
                       venue_id=rule.venue_id, request=request)
    uow.pricing_rules.delete(rule_id, soft_delete=False)
    uow.commit()
    return {"message": "Rule deleted"}


@router.post("/preview", response_model=PricingPreviewResponse)
def preview_price(
    data: PricingPreviewRequest,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """پیش‌نمایش موتور قیمت — همان کدی که در رزرو اجرا می‌شود."""
    ensure_venue_permission(uow, current_user, data.venue_id,
                            [Perm.PRICING_MANAGE], request)
    base = PricingService.venue_base_price(uow.session, data.venue_id) \
        if data.base_price is None else data.base_price
    final, rules, _ids = PricingService.resolve_price_detail(
        uow.session, data.venue_id, data.slot_date, data.start_time,
        base_price=base, duration=data.duration)
    return PricingPreviewResponse(
        venue_id=data.venue_id, slot_date=data.slot_date,
        start_time=data.start_time, base_price=base, final_price=final,
        is_holiday=PricingService.is_holiday(uow.session, data.slot_date, data.venue_id),
        rules=rules,
    )


@router.put("/venue/{venue_id}/default-price")
def set_default_price(
    venue_id: int,
    data: _VenueDefaultPrice,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """مبنای پیش‌فرض قیمت سانس سالن (برای تولید خودکار + قوانین)."""
    ensure_venue_permission(uow, current_user, venue_id,
                            [Perm.PRICING_MANAGE], request)
    if data.default_slot_price <= 0:
        raise HTTPException(status_code=400, detail="مبلغ پایه باید مثبت باشد")
    log_security_event(uow, "pricing.default_price_changed", current_user.id,
                       target_type="venue", target_id=venue_id, venue_id=venue_id,
                       data={"default_slot_price": data.default_slot_price},
                       request=request)
    uow.venues.update(venue_id, {"default_slot_price": data.default_slot_price})
    uow.commit()
    return {"venue_id": venue_id, "default_slot_price": data.default_slot_price}