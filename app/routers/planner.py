from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.database import get_db
from app.models.models import StudyPlan, Progress, User
from app.services.auth_service import get_current_user
from app.services.ai_service import generate_study_plan

router = APIRouter()

class PlanRequest(BaseModel):
    subjects: List[str]
    exam_date: str
    daily_hours: float
    notes: Optional[str] = ""

@router.post("/generate")
def create_plan(body: PlanRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plan_data = generate_study_plan(body.subjects, body.exam_date, body.daily_hours, body.notes)
    plan = StudyPlan(user_id=current_user.id, subjects=body.subjects, exam_date=body.exam_date, daily_hours=body.daily_hours, plan_data=plan_data)
    db.add(plan)
    db.commit()
    db.refresh(plan)
    prog = Progress(user_id=current_user.id, plan_id=plan.id, completed_tasks=[])
    db.add(prog)
    db.commit()
    return {"id": plan.id, "plan": plan_data}

@router.get("/")
def get_latest_plan(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plan = db.query(StudyPlan).filter(StudyPlan.user_id == current_user.id).order_by(StudyPlan.created_at.desc()).first()
    if not plan:
        raise HTTPException(status_code=404, detail="No study plan found")
    return {"id": plan.id, "subjects": plan.subjects, "exam_date": plan.exam_date, "daily_hours": plan.daily_hours, "plan": plan.plan_data}

from app.services.ai_service import generate_study_plan, genetic_algorithm_timetable
from app.services.auth_service import get_current_user

@router.post("/genetic-timetable")
def create_genetic_timetable(body: PlanRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Get weak subjects from mock test history
    from app.models.models import MockTest
    from app.services.ai_service import knn_recommend_topics
    
    tests = db.query(MockTest).filter(
        MockTest.user_id == current_user.id,
        MockTest.completed == True
    ).all()
    
    test_data = [{"subject": t.subject, "score": t.score, "total": len(t.questions or [])} for t in tests]
    weak_subjects = knn_recommend_topics(test_data)

    result = genetic_algorithm_timetable(
        subjects=body.subjects,
        exam_date_str=body.exam_date,
        daily_hours=body.daily_hours,
        weak_subjects=weak_subjects
    )

    # Save plan
    plan = StudyPlan(
        user_id=current_user.id,
        subjects=body.subjects,
        exam_date=body.exam_date,
        daily_hours=body.daily_hours,
        plan_data=result
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    prog = Progress(user_id=current_user.id, plan_id=plan.id, completed_tasks=[])
    db.add(prog)
    db.commit()

    return {"id": plan.id, "timetable": result}