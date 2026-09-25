# backend/app/models/quiz.py
"""چالش اطلاعات ورزشی هفتگی — سؤال‌ها یک‌هفته‌ای با یک پاسخ برای هر کاربر.

هفته با برچسب ISO (مانند «2026-W39») شناسایی می‌شود؛ پاسخ هر سؤال برای هر
کاربر فقط یک‌بار در همان هفته مجاز است (قید یکتایی). پاسخ درست → امتیاز وفاداری
با reason=quiz و source_type=quiz_attempt (منحصر‌به‌فرد، idempotent).
"""
from sqlmodel import SQLModel, Field, UniqueConstraint
from typing import Optional
from datetime import datetime, timezone


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class QuizQuestion(SQLModel, table=True):
    __tablename__ = "quiz_questions"

    id: Optional[int] = Field(default=None, primary_key=True)
    text: str = Field(max_length=300)
    options: str = Field(description="JSON آرایه‌ی ۴ گزینه‌ای به همان ترتیبِ correct_index")
    correct_index: int = Field(ge=0, le=3)
    is_active: bool = Field(default=True, index=True)
    created_at: datetime = Field(default_factory=_utcnow)


class QuizAttempt(SQLModel, table=True):
    __tablename__ = "quiz_attempts"
    __table_args__ = (
        UniqueConstraint("user_id", "question_id", "week_tag", name="uq_quiz_attempt_week"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    question_id: int = Field(foreign_key="quiz_questions.id", index=True)
    week_tag: str = Field(max_length=12, index=True)
    answer_index: int
    is_correct: bool
    points_awarded: int = Field(default=0)
    created_at: datetime = Field(default_factory=_utcnow)
