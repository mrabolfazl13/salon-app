# tests/test_quiz.py — چالش اطلاعات ورزشی هفتگی
import json

from app.models.quiz import QuizQuestion
from app.services.quiz_service import current_week_tag
from tests.helpers import auth


def _seed_questions(db, n=4):
    ids = []
    for i in range(n):
        q = QuizQuestion(
            text=f"سؤال {i}",
            options=json.dumps([f"گزینه {j}" for j in range(4)]),
            correct_index=i % 4,
            is_active=True,
        )
        db.add(q)
        db.commit()
        db.refresh(q)
        ids.append(q.id)
    db.close()
    return ids


def test_questions_no_correct_leak(client, seed, db):
    user = seed["user"]("09301000001")
    _seed_questions(db, 4)

    r = client.get("/api/v1/quiz/questions", headers=auth(user.phone))
    assert r.status_code == 200
    body = r.json()
    assert body["points_per_correct"] == 10
    assert 1 <= len(body["questions"]) <= 3
    for q in body["questions"]:
        assert "correct_index" not in q
        assert len(q["options"]) == 4


def test_answer_correct_awards_once(client, seed, db):
    user = seed["user"]("09301000002")
    ids = _seed_questions(db, 4)
    q0 = ids[0]

    # first: pick the right answer for question 0 (correct_index == 0)
    r = client.post("/api/v1/quiz/answer", headers=auth(user.phone),
                    json={"question_id": q0, "answer_index": 0})
    assert r.status_code == 200
    assert r.json()["correct"] is True
    assert r.json()["points_awarded"] == 10
    assert r.json()["balance"] == 10

    # replay same question this week -> 409
    r2 = client.post("/api/v1/quiz/answer", headers=auth(user.phone),
                     json={"question_id": q0, "answer_index": 0})
    assert r2.status_code == 409
