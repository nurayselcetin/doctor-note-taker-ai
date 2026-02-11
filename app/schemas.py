from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class DoctorBase(BaseModel):
    username: str
    email: EmailStr

class DoctorCreate(DoctorBase):
    password: str

class Doctor(DoctorBase):
    id: int
    created_at: datetime
    profile_picture: Optional[str] = None
    
    class Config:
        from_attributes = True

class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class DiagnosisBase(BaseModel):
    name: str
    details: Optional[str] = None

class Diagnosis(DiagnosisBase):
    id: int
    date: datetime
    class Config:
        from_attributes = True

class MedicationBase(BaseModel):
    name: str
    dosage: Optional[str] = None

class Medication(MedicationBase):
    id: int
    start_date: datetime
    end_date: Optional[datetime] = None
    class Config:
        from_attributes = True

class NoteBase(BaseModel):
    transcription: Optional[str] = None
    summary: Optional[str] = None

class StudentFeedbackBase(BaseModel):
    content: str
    assistant_name: Optional[str] = None

class StudentFeedback(StudentFeedbackBase):
    id: int
    note_id: int
    assistant_id: Optional[int] = None
    created_at: datetime
    class Config:
        from_attributes = True

class NoteCreate(NoteBase):
    pass

class Note(NoteBase):
    id: int
    patient_id: int
    audio_file_path: Optional[str] = None
    created_at: datetime
    risks: Optional[List[dict]] = []
    suggestions: Optional[List[str]] = []
    education_notes: Optional[List[str]] = []
    student_feedback: Optional[str] = None 
    assistant_name: Optional[str] = None
    feedbacks: List[StudentFeedback] = []

    class Config:
        from_attributes = True

class PatientBase(BaseModel):
    name: str
    birth_date: Optional[datetime] = None

class PatientCreate(PatientBase):
    pass

class Patient(PatientBase):
    id: int
    unique_id: Optional[str] = None
    created_at: datetime
    notes: List[Note] = []
    diagnoses: List[Diagnosis] = []
    medications: List[Medication] = []

    class Config:
        from_attributes = True

class PatientCheck(BaseModel):
    id: int
    name: str
    unique_id: Optional[str] = None
    last_visit_date: Optional[datetime] = None

