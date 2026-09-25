# backend/app/repositories/quiz_repository.py
from sqlmodel import Session, select
from typing import List, Optional

from app.models.quiz import QuizQuestion, QuizAttempt
from app.repositories.base import BaseRepository


class QuizQuestionRepository(BaseRepository[QuizQuestion]):

    def __init__(self, session: Session):
        super().__init__(QuizQuestion, session)

    def list_active(self) -> List[QuizQuestion]:
        stmt = (
            select(QuizQuestion)
            .where(QuizQuestion.is_active == True)  # noqa: E712
            .order_by(QuizQuestion.id)
        )
        return self.session.exec(stmt).all()


class QuizAttemptRepository(BaseRepository[QuizAttempt]):

    def __init__(self, session: Session):
        super().__init__(QuizAttempt, session)

    def get_week_attempts(self, user_id: int, week_tag: str) -> List[QuizAttempt]:
        stmt = select(QuizAttempt).where(
            QuizAttempt.user_id == user_id,
            QuizAttempt.week_tag == week_tag,
        )
        return self.session.exec(stmt).all()

    def get_attempt(self, user_id: int, question_id: int, week_tag: str) -> Optional[QuizAttempt]:
        stmt = select(QuizAttempt).where(
            QuizAttempt.user_id == user_id,
            QuizAttempt.question_id == question_id,
            QuizAttempt.week_tag == week_tag,
        )
        return self.session.exec(stmt).first()
