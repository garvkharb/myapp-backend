from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.models import MockTest, User
from app.services.auth_service import get_current_user
from app.services.ai_service import generate_mock_test, parse_uploaded_test, knn_recommend_topics

router = APIRouter()

class GenerateTestRequest(BaseModel):
    subject: str
    topic: str
    num_questions: int = 10
    difficulty: str = "medium"

class SubmitTestRequest(BaseModel):
    test_id: int
    answers: dict

@router.post("/generate")
def generate_test(body: GenerateTestRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    questions = generate_mock_test(body.subject, body.topic, body.num_questions, body.difficulty)
    test = MockTest(
        user_id=current_user.id,
        title=f"{body.subject} — {body.topic}",
        subject=body.subject,
        questions=questions
    )
    db.add(test)
    db.commit()
    db.refresh(test)
    return {"id": test.id, "title": test.title, "questions": questions}

@router.post("/submit")
def submit_test(body: SubmitTestRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    test = db.query(MockTest).filter(MockTest.id == body.test_id, MockTest.user_id == current_user.id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    questions = test.questions or []
    correct = sum(1 for q in questions if body.answers.get(q["id"], "").upper() == q.get("correct_answer", "").upper())
    score = round((correct / len(questions)) * 100, 1) if questions else 0
    test.score = score
    test.completed = True
    db.commit()
    results = [{"id": q["id"], "correct": body.answers.get(q["id"], "").upper() == q.get("correct_answer", "").upper(), "explanation": q.get("explanation", "")} for q in questions]
    return {"score": score, "correct": correct, "total": len(questions), "results": results}

@router.get("/")
def get_tests(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tests = db.query(MockTest).filter(MockTest.user_id == current_user.id).order_by(MockTest.created_at.desc()).all()
    return [{"id": t.id, "title": t.title, "subject": t.subject, "score": t.score, "completed": t.completed, "created_at": str(t.created_at)} for t in tests]

@router.get("/recommendations")
def get_recommendations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tests = db.query(MockTest).filter(
        MockTest.user_id == current_user.id,
        MockTest.completed == True
    ).order_by(MockTest.created_at.asc()).all()
    
    test_data = [{"subject": t.subject, "score": t.score, "total": len(t.questions or [])} for t in tests]
    recommendations = knn_recommend_topics(test_data)
    
    return {"recommendations": recommendations, "total_tests": len(tests)}