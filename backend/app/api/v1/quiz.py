# backend/app/api/v1/quiz.py
"""چالش اطلاعات ورزشی هفتگی — سؤال‌های هفته + ثبت پاسخ و جایزه وفاداری."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.unit_of_work import get_unit_of_work, UnitOfWork
from app.models.user import User
from app.services.quiz_service import (
    QUIZ_POINTS_PER_CORRECT, answer_question, current_week_tag,
    get_week_status, parse_options, pick_week_questions,
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/quiz", tags=["Quiz"])


class QuizAnswerIn(BaseModel):
    question_id: int
    answer_index: int = Field(ge=0, le=3)


@router.get("/questions")
def weekly_questions(
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    week = current_week_tag()
    questions = pick_week_questions(uow, week)
    return {
        "week_tag": week,
        "points_per_correct": QUIZ_POINTS_PER_CORRECT,
        "questions": [
            {"id": q.id, "text": q.text, "options": parse_options(q)}
            for q in questions
        ],
        "status": get_week_status(uow, current_user.id, week),
    }


@router.post("/answer")
def submit_answer(
    data: QuizAnswerIn,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    result = answer_question(uow, current_user.id, data.question_id, data.answer_index)
    uow.commit()
    return result
