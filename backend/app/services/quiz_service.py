# backend/app/services/quiz_service.py
"""منطق چالش هفتگی: انتخاب سؤال‌های هفته، تصحیح پاسخ و جایزه وفاداری."""
import json
from datetime import date
from typing import List

from fastapi import HTTPException

from app.unit_of_work import UnitOfWork
from app.models.quiz import QuizQuestion
from app.models.loyalty import LoyaltyReason

QUIZ_POINTS_PER_CORRECT = 10
QUIZ_QUESTIONS_PER_WEEK = 3


def current_week_tag() -> str:
    iso = date.today().isocalendar()
    return f"{iso.year}-W{iso.week:02d}"


def _week_number(week_tag: str) -> int:
    return int(week_tag.replace("-", "").replace("W", ""))


def parse_options(question: QuizQuestion) -> List[str]:
    try:
        opts = json.loads(question.options)
    except (TypeError, ValueError):
        return []
    return [str(o) for o in opts] if isinstance(opts, list) else []


def pick_week_questions(uow: UnitOfWork, week_tag: str, count: int = QUIZ_QUESTIONS_PER_WEEK) -> List[QuizQuestion]:
    """انتخاب قطعی (نه تصادفی) سؤال‌های هفته — همه کاربران یک سؤال مشترک دارند."""
    active = uow.quiz_questions.list_active()
    if not active:
        return []
    start = _week_number(week_tag) % len(active)
    picked = []
    i = start
    while len(picked) < count:
        picked.append(active[i % len(active)])
        i += 1
        if i - start >= len(active):
            break
    return picked


def get_week_status(uow: UnitOfWork, user_id: int, week_tag: str) -> dict:
    attempts = uow.quiz_attempts.get_week_attempts(user_id, week_tag)
    return {
        "answered_question_ids": [a.question_id for a in attempts],
        "correct_count": sum(1 for a in attempts if a.is_correct),
        "points_earned": sum(a.points_awarded for a in attempts),
    }


def answer_question(uow: UnitOfWork, user_id: int, question_id: int, answer_index: int) -> dict:
    if answer_index < 0 or answer_index > 3:
        raise HTTPException(status_code=400, detail="گزینه نامعتبر است")

    question = uow.quiz_questions.get_by_id(question_id)
    if not question or not question.is_active:
        raise HTTPException(status_code=404, detail="سؤال یافت نشد")

    week_tag = current_week_tag()
    if uow.quiz_attempts.get_attempt(user_id, question_id, week_tag):
        raise HTTPException(status_code=409, detail="شما همین هفته به این سؤال پاسخ داده‌اید")

    is_correct = answer_index == question.correct_index
    points = QUIZ_POINTS_PER_CORRECT if is_correct else 0

    attempt = uow.quiz_attempts.create({
        "user_id": user_id,
        "question_id": question_id,
        "week_tag": week_tag,
        "answer_index": answer_index,
        "is_correct": is_correct,
        "points_awarded": points,
    })

    awarded = 0
    if is_correct:
        row = uow.loyalty.add_points(
            user_id, points, LoyaltyReason.QUIZ,
            source_type="quiz_attempt", source_id=attempt.id,
        )
        awarded = points if row else 0

    return {
        "correct": is_correct,
        "correct_index": question.correct_index,
        "points_awarded": awarded,
        "balance": uow.loyalty.balance(user_id),
    }
