from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from typing import List, Optional

from app.database import get_session
from app.unit_of_work import get_unit_of_work, UnitOfWork
from app.schemas.review import ReviewCreate, ReviewResponse, VenueRatingSummary
from app.repositories.review_repository import ReviewRepository
from app.utils.auth import get_current_user
from app.models.user import User
from app.models.review import Review

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.get("/venue/{venue_id}", response_model=List[ReviewResponse])
def get_venue_reviews(
    venue_id: int,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_session)
):
    """دریافت نظرات یک سالن"""
    review_repo = ReviewRepository(session)
    reviews = review_repo.get_by_venue(venue_id, limit=limit, offset=offset)
    result = []
    for r in reviews:
        user_name = r.user.full_name if r.user else None
        venue_name = r.venue.name if r.venue else None
        result.append(ReviewResponse(
            id=r.id,
            venue_id=r.venue_id,
            user_id=r.user_id,
            rating=r.rating,
            comment=r.comment,
            created_at=r.created_at,
            user_name=user_name,
            venue_name=venue_name
        ))
    return result


@router.get("/venue/{venue_id}/summary", response_model=VenueRatingSummary)
def get_venue_rating_summary(
    venue_id: int,
    session: Session = Depends(get_session)
):
    """دریافت خلاصه امتیازات یک سالن"""
    review_repo = ReviewRepository(session)
    summary = review_repo.get_rating_summary(venue_id)
    return VenueRatingSummary(**summary)


@router.get("/my", response_model=List[ReviewResponse])
def get_my_reviews(
    limit: int = Query(50, ge=1, le=200),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """دریافت نظرات کاربر جاری"""
    review_repo = ReviewRepository(session)
    reviews = review_repo.get_by_user(current_user.id, limit=limit)
    result = []
    for r in reviews:
        venue_name = r.venue.name if r.venue else None
        result.append(ReviewResponse(
            id=r.id,
            venue_id=r.venue_id,
            user_id=r.user_id,
            rating=r.rating,
            comment=r.comment,
            created_at=r.created_at,
            user_name=current_user.full_name,
            venue_name=venue_name
        ))
    return result


@router.post("/", response_model=ReviewResponse, status_code=201)
def create_review(
    review_data: ReviewCreate,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user)
):
    """ثبت نظر جدید برای یک سالن (فقط کاربران عادی)"""
    # بررسی وجود سالن
    venue = uow.venues.get_by_id(review_data.venue_id)
    if not venue:
        raise HTTPException(status_code=404, detail="سالن مورد نظر یافت نشد")

    # بررسی تکراری نبودن نظر
    existing = uow.reviews.get_user_venue_review(current_user.id, review_data.venue_id)
    if existing:
        raise HTTPException(
            status_code=400,
            detail="شما قبلاً برای این سالن نظر ثبت کرده‌اید. می‌توانید نظر قبلی را ویرایش کنید."
        )

    review = Review(
        venue_id=review_data.venue_id,
        user_id=current_user.id,
        rating=review_data.rating,
        comment=review_data.comment
    )
    created = uow.reviews.create(review)
    uow.commit()

    return ReviewResponse(
        id=created.id,
        venue_id=created.venue_id,
        user_id=created.user_id,
        rating=created.rating,
        comment=created.comment,
        created_at=created.created_at,
        user_name=current_user.full_name,
        venue_name=venue.name
    )


@router.put("/{review_id}", response_model=ReviewResponse)
def update_review(
    review_id: int,
    review_data: ReviewCreate,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user)
):
    """ویرایش نظر خود"""
    review = uow.reviews.get_by_id(review_id)
    if not review:
        raise HTTPException(status_code=404, detail="نظر مورد نظر یافت نشد")
    if review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="شما فقط می‌توانید نظر خود را ویرایش کنید")

    updated = uow.reviews.update(review_id, {
        "rating": review_data.rating,
        "comment": review_data.comment
    })
    uow.commit()
    venue = uow.venues.get_by_id(updated.venue_id)

    return ReviewResponse(
        id=updated.id,
        venue_id=updated.venue_id,
        user_id=updated.user_id,
        rating=updated.rating,
        comment=updated.comment,
        created_at=updated.created_at,
        user_name=current_user.full_name,
        venue_name=venue.name if venue else None
    )


@router.delete("/{review_id}")
def delete_review(
    review_id: int,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user)
):
    """حذف نظر خود"""
    review = uow.reviews.get_by_id(review_id)
    if not review:
        raise HTTPException(status_code=404, detail="نظر مورد نظر یافت نشد")
    if review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="شما فقط می‌توانید نظر خود را حذف کنید")

    uow.reviews.delete(review_id)
    uow.commit()
    return {"message": "نظر با موفقیت حذف شد"}