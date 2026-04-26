from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, date
from app.database import get_db
from app.models.models import Progress, StudyPlan, User
from app.services.auth_service import get_current_user

router = APIRouter()

class UpdateProgressRequest(BaseModel):
    task_id: str
    hours_spent: float = 0.0

@router.get("/")
def get_progress(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plan = db.query(StudyPlan).filter(StudyPlan.user_id == current_user.id).order_by(StudyPlan.created_at.desc()).first()
    if not plan:
        return {"message": "No plan found", "stats": {}}
    prog = db.query(Progress).filter(Progress.plan_id == plan.id).first()
    if not prog:
        return {"message": "No progress found"}
    all_tasks = [t for w in (plan.plan_data.get("weekly_plan") or []) for t in w.get("tasks", [])]
    total = len(all_tasks)
    completed = len(prog.completed_tasks or [])
    pct = round((completed / total * 100) if total else 0, 1)
    return {"completed_tasks": prog.completed_tasks, "total_tasks": total, "completion_pct": pct, "streak_days": prog.streak_days, "total_hours": prog.total_hours, "last_active": str(prog.last_active) if prog.last_active else None}

@router.post("/update")
def update_progress(body: UpdateProgressRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plan = db.query(StudyPlan).filter(StudyPlan.user_id == current_user.id).order_by(StudyPlan.created_at.desc()).first()
    if not plan:
        raise HTTPException(status_code=404, detail="No plan found")
    prog = db.query(Progress).filter(Progress.plan_id == plan.id).first()
    if not prog:
        raise HTTPException(status_code=404, detail="No progress record found")
    completed = list(prog.completed_tasks or [])
    if body.task_id not in completed:
        completed.append(body.task_id)
    today = date.today()
    last = prog.last_active.date() if prog.last_active else None
    if last == today:
        pass
    elif last and (today - last).days == 1:
        prog.streak_days = (prog.streak_days or 0) + 1
    else:
        prog.streak_days = 1
    prog.completed_tasks = completed
    prog.total_hours = (prog.total_hours or 0) + body.hours_spent
    prog.last_active = datetime.utcnow()
    db.commit()
    return {"completed_tasks": completed, "streak_days": prog.streak_days, "total_hours": prog.total_hours}

@router.delete("/reset/{plan_id}")
def reset_plan(plan_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    prog = db.query(Progress).filter(Progress.plan_id == plan_id, Progress.user_id == current_user.id).first()
    if prog:
        prog.completed_tasks = []
        prog.streak_days = 0
        prog.total_hours = 0.0
        prog.last_active = None
        db.commit()
    return {"detail": "Plan reset successfully"}