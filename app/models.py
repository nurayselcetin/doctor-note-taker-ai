from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    unique_id = Column(String, unique=True, index=True, nullable=True) # Unique 6-digit code
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    notes = relationship("Note", back_populates="patient", cascade="all, delete-orphan")
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True) # Link patient to doctor
    doctor = relationship("Doctor", back_populates="patients")
    
    # New fields
    birth_date = Column(DateTime(timezone=True), nullable=True)
    
    diagnoses = relationship("Diagnosis", back_populates="patient", cascade="all, delete-orphan")
    medications = relationship("Medication", back_populates="patient", cascade="all, delete-orphan")

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    profile_picture = Column(String, nullable=True) # specialized profile image path
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patients = relationship("Patient", back_populates="doctor")
    assistants = relationship("Assistant", back_populates="doctor")

class Assistant(Base):
    __tablename__ = "assistants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    hashed_password = Column(String)
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    doctor = relationship("Doctor", back_populates="assistants")
    feedbacks = relationship("StudentFeedback", back_populates="assistant")

class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    audio_file_path = Column(String, nullable=True) # Path to the stored audio file
    transcription = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    student_feedback = Column(Text, nullable=True) # Assistant/Student commentary
    assistant_name = Column(String, nullable=True) # Name of the assistant who wrote feedback
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", back_populates="notes")
    feedbacks = relationship("StudentFeedback", back_populates="note", cascade="all, delete-orphan")

class Diagnosis(Base):
    __tablename__ = "diagnoses"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    name = Column(String, index=True)
    date = Column(DateTime(timezone=True), server_default=func.now())
    details = Column(Text, nullable=True)

    patient = relationship("Patient", back_populates="diagnoses")

class Medication(Base):
    __tablename__ = "medications"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    name = Column(String, index=True)
    dosage = Column(String, nullable=True)
    start_date = Column(DateTime(timezone=True), server_default=func.now())
    end_date = Column(DateTime(timezone=True), nullable=True)
    
    patient = relationship("Patient", back_populates="medications")

class StudentFeedback(Base):
    __tablename__ = "student_feedback"

    id = Column(Integer, primary_key=True, index=True)
    note_id = Column(Integer, ForeignKey("notes.id"))
    assistant_id = Column(Integer, ForeignKey("assistants.id"), nullable=True)
    assistant_name = Column(String, nullable=True)
    content = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    note = relationship("Note", back_populates="feedbacks")
    assistant = relationship("Assistant", back_populates="feedbacks")

