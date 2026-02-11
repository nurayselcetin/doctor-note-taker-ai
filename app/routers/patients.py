from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/patients",
    tags=["patients"],
    responses={404: {"description": "Not found"}},
)

from ..routers.auth import get_current_doctor

import random

def generate_unique_id(db: Session, max_retries=10):
    for _ in range(max_retries):
        code = str(random.randint(100000, 999999))
        if not db.query(models.Patient).filter(models.Patient.unique_id == code).first():
            return code
    raise HTTPException(status_code=500, detail="Could not generate unique ID")

@router.get("/check", response_model=List[schemas.PatientCheck])
def check_patient_name(name: str, db: Session = Depends(get_db), current_doctor: models.Doctor = Depends(get_current_doctor)):
    existing_patients = db.query(models.Patient).filter(
        models.Patient.doctor_id == current_doctor.id,
        models.Patient.name.ilike(name)
    ).all()
    
    result = []
    for p in existing_patients:
        last_note = db.query(models.Note).filter(models.Note.patient_id == p.id).order_by(models.Note.created_at.desc()).first()
        last_visit = last_note.created_at if last_note else p.created_at
        result.append({
            "id": p.id,
            "name": p.name,
            "unique_id": p.unique_id,
            "last_visit_date": last_visit
        })
    return result

@router.post("/", response_model=schemas.Patient)
def create_patient(patient: schemas.PatientCreate, db: Session = Depends(get_db), current_doctor: models.Doctor = Depends(get_current_doctor)):
    # Logic: Only create if explicitly requested (client handles duplicates now)
    unique_id = generate_unique_id(db)
    db_patient = models.Patient(name=patient.name, doctor_id=current_doctor.id, unique_id=unique_id)
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

@router.get("/", response_model=List[schemas.Patient])
def read_patients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_doctor: models.Doctor = Depends(get_current_doctor)):
    # Only show patients belonging to the doctor
    patients = db.query(models.Patient).filter(models.Patient.doctor_id == current_doctor.id).offset(skip).limit(limit).all()
    return patients

@router.get("/search", response_model=List[schemas.Patient])
def search_patients(
    query: str, 
    db: Session = Depends(get_db), 
    current_doctor: models.Doctor = Depends(get_current_doctor)
):
    # Smart Search (Clinical Memory)
    # Search in Patient Name, Diagnostics, and Notes content
    search_term = f"%{query}%"
    
    patients = db.query(models.Patient).outerjoin(models.Note).filter(
        models.Patient.doctor_id == current_doctor.id,
        (models.Patient.name.ilike(search_term)) | 
        (models.Note.transcription.ilike(search_term)) |
        (models.Note.summary.ilike(search_term))
    ).distinct().all()
    
    return patients

@router.get("/{patient_id}", response_model=schemas.Patient)
def read_patient(patient_id: int, db: Session = Depends(get_db), current_doctor: models.Doctor = Depends(get_current_doctor)):
    db_patient = db.query(models.Patient).filter(models.Patient.id == patient_id, models.Patient.doctor_id == current_doctor.id).first()
    if db_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return db_patient

@router.delete("/{patient_id}")
def delete_patient(patient_id: int, db: Session = Depends(get_db), current_doctor: models.Doctor = Depends(get_current_doctor)):
    db_patient = db.query(models.Patient).filter(models.Patient.id == patient_id, models.Patient.doctor_id == current_doctor.id).first()
    if db_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    db.delete(db_patient)
    db.commit()
    return {"message": "Patient deleted"}
