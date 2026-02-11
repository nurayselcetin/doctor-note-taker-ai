from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from .. import models, auth
from ..database import get_db
from ..routers.auth import get_current_doctor

router = APIRouter(
    prefix="/assistants",
    tags=["assistants"],
    responses={404: {"description": "Not found"}},
)

# --- Schemas ---
from datetime import datetime
from pydantic import BaseModel

class AssistantCreate(BaseModel):
    name: str
    password: str

class AssistantResponse(BaseModel):
    id: int
    name: str
    created_at: datetime | None = None
    
    class Config:
        from_attributes = True

class AssistantVerify(BaseModel):
    assistant_id: int
    password: str

# --- Endpoints ---

@router.post("/", response_model=AssistantResponse)
def create_assistant(
    assistant: AssistantCreate, 
    db: Session = Depends(get_db), 
    current_doctor: models.Doctor = Depends(get_current_doctor)
):
    # Check if name exists for this doctor
    existing = db.query(models.Assistant).filter(
        models.Assistant.doctor_id == current_doctor.id,
        models.Assistant.name == assistant.name
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Bu isimde bir asistan zaten var.")
    
    hashed_pw = auth.get_password_hash(assistant.password)
    new_assistant = models.Assistant(
        name=assistant.name,
        hashed_password=hashed_pw,
        doctor_id=current_doctor.id
    )
    db.add(new_assistant)
    db.commit()
    db.refresh(new_assistant)
    return new_assistant

@router.get("/", response_model=List[AssistantResponse])
def get_assistants(
    db: Session = Depends(get_db), 
    current_doctor: models.Doctor = Depends(get_current_doctor)
):
    assistants = db.query(models.Assistant).filter(models.Assistant.doctor_id == current_doctor.id).all()
    return assistants

@router.post("/verify")
def verify_assistant_password(
    credentials: AssistantVerify,
    db: Session = Depends(get_db)
):
    assistant = db.query(models.Assistant).filter(models.Assistant.id == credentials.assistant_id).first()
    if not assistant:
        raise HTTPException(status_code=404, detail="Asistan bulunamadı")
    
    if not auth.verify_password(credentials.password, assistant.hashed_password):
        raise HTTPException(status_code=401, detail="Hatalı şifre")
        
    return {"message": "Doğrulama başarılı", "verified": True}

@router.delete("/{assistant_id}")
def delete_assistant(
    assistant_id: int,
    db: Session = Depends(get_db), 
    current_doctor: models.Doctor = Depends(get_current_doctor)
):
    assistant = db.query(models.Assistant).filter(
        models.Assistant.id == assistant_id, 
        models.Assistant.doctor_id == current_doctor.id
    ).first()
    
    if not assistant:
        raise HTTPException(status_code=404, detail="Silinecek asistan bulunamadı")
        
    db.delete(assistant)
    db.commit()
    return {"message": "Asistan silindi"}

# --- Feedback Management ---

class FeedbackVerify(BaseModel):
    password: str
    content: Optional[str] = None

@router.patch("/feedback/{feedback_id}")
def update_feedback(
    feedback_id: int,
    data: FeedbackVerify,
    db: Session = Depends(get_db)
):
    feedback = db.query(models.StudentFeedback).filter(models.StudentFeedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Yorum bulunamadı")
    
    # Verify ownership (assistant must exist)
    if not feedback.assistant_id:
        raise HTTPException(status_code=403, detail="Bu yorum düzenlenemez (Eski veri)")
        
    assistant = db.query(models.Assistant).filter(models.Assistant.id == feedback.assistant_id).first()
    if not assistant:
         raise HTTPException(status_code=404, detail="Asistan bulunamadı")

    # Verify Password
    if not auth.verify_password(data.password, assistant.hashed_password):
        raise HTTPException(status_code=403, detail="Hatalı şifre")
    
    # Update
    if data.content:
        feedback.content = data.content
        
    db.commit()
    return {"message": "Yorum güncellendi"}

@router.delete("/feedback/{feedback_id}")
def delete_feedback(
    feedback_id: int,
    data: FeedbackVerify, # Reusing schema effectively for password
    db: Session = Depends(get_db)
):
    feedback = db.query(models.StudentFeedback).filter(models.StudentFeedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Yorum bulunamadı")
    
    # Verify ownership
    if not feedback.assistant_id:
        raise HTTPException(status_code=403, detail="Bu yorum silinemez (Eski veri)")
        
    assistant = db.query(models.Assistant).filter(models.Assistant.id == feedback.assistant_id).first()
    if not assistant:
         raise HTTPException(status_code=404, detail="Asistan bulunamadı")

    # Verify Password
    if not auth.verify_password(data.password, assistant.hashed_password):
        raise HTTPException(status_code=403, detail="Hatalı şifre")
    
    # Delete
    db.delete(feedback)
    db.commit()
    return {"message": "Yorum silindi"}
