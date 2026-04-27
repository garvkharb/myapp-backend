from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Note, User
from app.dependencies import get_current_user
from app.services.firebase import upload_file, delete_file

router = APIRouter()

@router.get("")
def get_notes(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        notes = db.query(Note).filter(Note.user_id == user.id)\
                   .order_by(Note.created_at.desc()).all()
        return [{"id": n.id, "filename": n.filename, "subject": n.subject,
                 "file_type": n.file_type, "storage_url": n.storage_url,
                 "created_at": str(n.created_at)} for n in notes]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_note(
    file: UploadFile = File(...),
    subject: str = Form("General"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        content = await file.read()
        ext = file.filename.rsplit(".", 1)[-1].lower()
        file_type = "pdf" if ext == "pdf" else "image"
        url = upload_file(content, file.filename, file.content_type)
        note = Note(user_id=user.id, filename=file.filename,
                    subject=subject, file_type=file_type, storage_url=url)
        db.add(note)
        db.commit()
        db.refresh(note)
        return {
            "id": note.id,
            "filename": note.filename,
            "subject": note.subject,
            "file_type": note.file_type,
            "storage_url": note.storage_url,
            "created_at": str(note.created_at)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{note_id}")
def delete_note(note_id: int, user: User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    try:
        note = db.query(Note).filter(Note.id == note_id, Note.user_id == user.id).first()
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")
        try:
            delete_file(note.storage_url)
        except:
            pass
        db.delete(note)
        db.commit()
        return {"deleted": note_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
