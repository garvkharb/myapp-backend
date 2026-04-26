from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.models import ChatMessage, User
from app.services.auth_service import get_current_user
from app.services.ai_service import chat_with_filter

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

@router.post("/message")
def send_message(
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    history_rows = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.desc())
        .limit(20)
        .all()
    )
    history = [{"role": r.role, "content": r.content} for r in reversed(history_rows)]
    reply = chat_with_filter(history, body.message)
    db.add(ChatMessage(user_id=current_user.id, role="user", content=body.message))
    db.add(ChatMessage(user_id=current_user.id, role="assistant", content=reply))
    db.commit()
    return {"reply": reply}

@router.get("/history")
def get_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.asc())
        .limit(100)
        .all()
    )
    return [{"role": m.role, "content": m.content, "created_at": str(m.created_at)} for m in messages]

@router.delete("/history")
def clear_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id).delete()
    db.commit()
    return {"detail": "Chat history cleared"}