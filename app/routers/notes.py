from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
import io
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from .. import models, schemas, auth
from ..database import get_db
from ..services.audio import audio_service
from ..services.ai import ai_service
from ..services.risk_analyzer import analyze_risk

router = APIRouter(
    prefix="/notes",
    tags=["notes"],
    responses={404: {"description": "Not found"}},
)

from ..routers.auth import get_current_doctor

@router.post("/", response_model=schemas.Note)
def create_note(
    patient_id: int = Form(...),
    education_mode: bool = Form(False),
    language: str = Form("tr"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_doctor: models.Doctor = Depends(get_current_doctor)
):
    # Verify patient belongs to doctor
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id, models.Patient.doctor_id == current_doctor.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # 1. Save Audio
    file_path = audio_service.save_audio(file)
    
    # 2. Transcribe
    transcription = audio_service.transcribe(file_path)
    
    # 3. Analyze Risks (Now returns {risks, suggestions, education_notes})
    # Pass language to risk analyzer
    analysis_result = analyze_risk(transcription, education_mode=education_mode, language=language)
    risks = analysis_result.get("risks", [])
    suggestions = analysis_result.get("suggestions", [])
    education_notes = analysis_result.get("education_notes", [])

    # 4. Save to DB (Dictation only)
    db_note = models.Note(
        patient_id=patient_id,
        audio_file_path=file_path,
        transcription=transcription,
        summary=None # Summary will be generated on demand
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    
    # Attach to response object
    db_note.risks = risks
    db_note.suggestions = suggestions
    db_note.education_notes = education_notes
    
    return db_note

@router.get("/patient/{patient_id}", response_model=List[schemas.Note])
def read_notes_for_patient(patient_id: int, language: str = "tr", db: Session = Depends(get_db)):
    notes = db.query(models.Note).filter(models.Note.patient_id == patient_id).order_by(models.Note.created_at.desc()).all()
    
    if language == "en":
        # Translate notes on-the-fly without saving to DB
        try:
            for note in notes:
                # Translate basic fields
                if note.transcription:
                    try:
                        note.transcription = ai_service.translate_text(note.transcription, "en")
                    except Exception as e:
                        print(f"Translation error for transcription: {e}")
                        # Keep original text if translation fails
                
                if note.summary:
                    try:
                        note.summary = ai_service.translate_text(note.summary, "en")
                    except Exception as e:
                        print(f"Translation error for summary: {e}")
                
                # Translate risks (only if attribute exists - it's not a DB column)
                if hasattr(note, 'risks') and note.risks:
                    try:
                        new_risks = []
                        for risk in note.risks:
                            if isinstance(risk, dict):
                                new_risk = risk.copy()
                                if "message" in new_risk:
                                    new_risk["message"] = ai_service.translate_text(new_risk["message"], "en")
                                new_risks.append(new_risk)
                            else:
                                new_risks.append(risk)
                        note.risks = new_risks
                    except Exception as e:
                        print(f"Translation error for risks: {e}")

                # Translate suggestions (only if attribute exists)
                if hasattr(note, 'suggestions') and note.suggestions:
                    try:
                        note.suggestions = [ai_service.translate_text(s, "en") for s in note.suggestions if s]
                    except Exception as e:
                        print(f"Translation error for suggestions: {e}")

                # Translate education notes (only if attribute exists)
                if hasattr(note, 'education_notes') and note.education_notes:
                    try:
                        note.education_notes = [ai_service.translate_text(e, "en") for e in note.education_notes if e]
                    except Exception as e:
                        print(f"Translation error for education_notes: {e}")

                # Translate feedbacks (regular relationship field)
                if note.feedbacks:
                    try:
                        for fb in note.feedbacks:
                            if fb.content:
                                fb.content = ai_service.translate_text(fb.content, "en")
                    except Exception as e:
                        print(f"Translation error for feedbacks: {e}")
        
        except Exception as e:
            print(f"General translation error: {e}")
            # Continue and return notes even if translation fails
    
    return notes


class NoteFeedback(BaseModel):
    feedback: str
    assistant_id: int | None = None
    password: str | None = None
    # Legacy support (optional, can be removed if frontend is fully updated)
    assistant_name: str | None = None

@router.patch("/{note_id}/feedback")
def update_student_feedback(note_id: int, feedback_data: NoteFeedback, db: Session = Depends(get_db)):
    db_note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Verify Assistant if ID provided
    assistant_name_to_save = feedback_data.assistant_name
    assistant_id_to_save = None
    
    if feedback_data.assistant_id:
        assistant = db.query(models.Assistant).filter(models.Assistant.id == feedback_data.assistant_id).first()
        if not assistant:
             raise HTTPException(status_code=404, detail="Asistan bulunamadı")
        
        if not feedback_data.password:
             raise HTTPException(status_code=401, detail="Şifre gerekli")
             
        if not auth.verify_password(feedback_data.password, assistant.hashed_password):
             raise HTTPException(status_code=403, detail="Hatalı asistan şifresi")
             
        assistant_name_to_save = assistant.name
        assistant_id_to_save = assistant.id
    
    # Create new feedback entry
    db_feedback = models.StudentFeedback(
        note_id=note_id,
        content=feedback_data.feedback,
        assistant_name=assistant_name_to_save,
        assistant_id=assistant_id_to_save
    )
    db.add(db_feedback)
    
    # Update legacy fields for display
    db_note.student_feedback = feedback_data.feedback
    db_note.assistant_name = assistant_name_to_save
    
    db.commit()
    db.refresh(db_feedback)
    
    return {
        "message": "Feedback added", 
        "feedback": db_feedback.content, 
        "assistant_name": db_feedback.assistant_name,
        "created_at": db_feedback.created_at
    }

@router.post("/generate-ai-case", response_model=schemas.Note)
def generate_ai_case(
    language: str = "tr", # Added language param
    db: Session = Depends(get_db),
    current_doctor: models.Doctor = Depends(get_current_doctor)
):
    # 1. Generate Case Content
    case_data = ai_service.generate_clinical_case(language=language)
    
    # 2. Create or Find Patient (We can create a new 'Demo' patient every time or reuse)
    from ..routers.patients import generate_unique_id
    
    unique_id = generate_unique_id(db)
    # Handle Fallback Name
    base_name = case_data.get("name", "Demo Hasta" if language == 'tr' else "Demo Patient")
    
    patient = models.Patient(
        name=f"{base_name} ({unique_id})",
        doctor_id=current_doctor.id,
        unique_id=unique_id
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    
    # 3. Create Note
    # Also analyze risks for education
    analysis = ai_service.analyze_clinical_context(case_data["transcription"], education_mode=True, language=language)
    
    db_note = models.Note(
        patient_id=patient.id,
        transcription=case_data["transcription"],
        summary=case_data["summary"],
        audio_file_path=None # Virtual case
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    
    # Attach analysis results temporarily for response
    db_note.risks = analysis.get("risks", [])
    db_note.suggestions = analysis.get("suggestions", [])
    db_note.education_notes = analysis.get("education_notes", [])
    
    return db_note

@router.post("/{note_id}/summarize", response_model=schemas.Note)
def summarize_single_note(note_id: int, language: str = "tr", db: Session = Depends(get_db)):
    db_note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if not db_note:
         raise HTTPException(status_code=404, detail="Note not found")
    
    if not db_note.transcription:
        raise HTTPException(status_code=400, detail="Note has no transcription to summarize")

    summary = ai_service.summarize_note(db_note.transcription, language=language)
    
    db_note.summary = summary
    db.commit()
    db.refresh(db_note)
    return db_note

@router.get("/patient/{patient_id}/summarize")
def summarize_patient_history(patient_id: int, language: str = "tr", db: Session = Depends(get_db)):
    notes = db.query(models.Note).filter(models.Note.patient_id == patient_id).all()
    if not notes:
        return {"summary": "No notes found for this patient."}
    
    notes_text = [n.transcription for n in notes if n.transcription]
    try:
        summary = ai_service.summarize_patient_history(notes_text, language=language)
    except Exception as e:
        if "429" in str(e) or "Resource exhausted" in str(e):
             detail = "AI servisi şu anda çok yoğun (kota aşıldı). Lütfen 1-2 dakika sonra tekrar deneyin." if language == "tr" else "AI service is busy (quota exceeded). Please try again in 1-2 minutes."
             raise HTTPException(status_code=429, detail=detail)
        raise e
        
    return {"summary": summary}

@router.get("/assistants", response_model=List[str])
def get_assistants(db: Session = Depends(get_db)):
    # 1. Get assistant names from Notes
    note_assistants = db.query(models.Note.assistant_name).filter(models.Note.assistant_name != None).distinct().all()
    
    # 2. Get assistant names from Feedback
    feedback_assistants = db.query(models.StudentFeedback.assistant_name).filter(models.StudentFeedback.assistant_name != None).distinct().all()
    
    # 3. Merge and deduplicate
    names = set()
    for (name,) in note_assistants:
        if name and name.strip():
            names.add(name.strip())
            
    for (name,) in feedback_assistants:
        if name and name.strip():
            names.add(name.strip())
            
    return sorted(list(names))

@router.get("/assistant/{assistant_name}", response_model=List[schemas.Note])
def get_notes_by_assistant(assistant_name: str, db: Session = Depends(get_db)):
    # Search in both Notes and Feedbacks
    # 1. Notes where assistant_name matches
    # 2. Notes where a related feedback has assistant_name match
    
    # We can use a join or union. Let's do a join logic.
    notes_query = db.query(models.Note).outerjoin(models.StudentFeedback).filter(
        (models.Note.assistant_name == assistant_name) | 
        (models.StudentFeedback.assistant_name == assistant_name)
    ).distinct()
    
    return notes_query.all()

class NoteUpdate(BaseModel):
    transcription: Optional[str] = None
    summary: Optional[str] = None

@router.delete("/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db)):
    db_note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Optional: Delete audio file from disk if exists
    # if db_note.audio_file_path and os.path.exists(db_note.audio_file_path):
    #     os.remove(db_note.audio_file_path)

    db.delete(db_note)
    db.commit()
    return {"message": "Note deleted successfully"}

@router.patch("/{note_id}", response_model=schemas.Note)
def update_note(note_id: int, note_update: NoteUpdate, db: Session = Depends(get_db)):
    db_note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    if note_update.transcription is not None:
        db_note.transcription = note_update.transcription
    if note_update.summary is not None:
        db_note.summary = note_update.summary
        
    db.commit()
    db.refresh(db_note)
    return db_note

@router.get("/{note_id}/pdf")
def export_note_pdf(note_id: int, db: Session = Depends(get_db)):
    db_note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")

    # Register UTF-8 Font (Roboto)
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    import os

    try:
        # Calculate absolute path to fonts directory to avoid CWD issues
        # notes.py is in app/routers/, so we go up two levels to app/
        current_dir = os.path.dirname(os.path.abspath(__file__)) # .../app/routers
        app_dir = os.path.dirname(current_dir) # .../app
        font_dir = os.path.join(app_dir, "static", "fonts")
        
        pdfmetrics.registerFont(TTFont('Roboto', os.path.join(font_dir, 'Roboto-Regular.ttf')))
        pdfmetrics.registerFont(TTFont('Roboto-Bold', os.path.join(font_dir, 'Roboto-Bold.ttf')))
        has_font = True
    except Exception as e:
        print(f"Font loading error: {e}")
        # Add fallback to Helvetica if Roboto fails, to prevent 500 Error
        has_font = False

    import html
    import re
    import os

    def clean_for_pdf(text):
        if not text: return ""
        safe_text = html.escape(str(text))
        safe_text = safe_text.replace('\n', '<br/>')
        safe_text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', safe_text)
        return safe_text

    try:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        
        # --- ROBUST FONT REGISTRATION ---
        current_dir = os.path.dirname(os.path.abspath(__file__))
        app_dir = os.path.dirname(current_dir)
        font_dir = os.path.join(app_dir, "static", "fonts")
        
        # Using DejaVuSans which has better default Turkish support than Roboto in ReportLab
        font_reg = os.path.join(font_dir, 'DejaVuSans.ttf')
        font_bold = os.path.join(font_dir, 'DejaVuSans-Bold.ttf')
        
        has_font = False
        if os.path.exists(font_reg) and os.path.exists(font_bold):
            try:
                pdfmetrics.registerFont(TTFont('DejaVuSans', font_reg))
                pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', font_bold))
                has_font = True
            except Exception as e:
                print(f"Font Reg Error: {e}")

        # --- CUSTOM STYLES ---
        styles = getSampleStyleSheet()
        
        if has_font:
            normal_style = ParagraphStyle(
                'TurkishNormal',
                parent=styles['Normal'],
                fontName='DejaVuSans',
                fontSize=10,
                leading=14
            )
            title_style = ParagraphStyle(
                'TurkishTitle',
                parent=styles['Title'],
                fontName='DejaVuSans-Bold',
                fontSize=18,
                leading=22,
                spaceAfter=12
            )
            heading_style = ParagraphStyle(
                'TurkishHeading',
                parent=styles['Heading2'],
                fontName='DejaVuSans-Bold',
                fontSize=14,
                leading=18,
                spaceBefore=12,
                spaceAfter=6
            )
        else:
            # Fallback to defaults (will show squares for chars but won't crash)
            normal_style = styles['Normal']
            title_style = styles['Title']
            heading_style = styles['Heading2']

        story = []

        # Title
        story.append(Paragraph(f"Hasta Görüşme Raporu - {db_note.created_at.strftime('%d.%m.%Y')}", title_style))
        story.append(Spacer(1, 12))

        # Patient Info
        if db_note.patient:
            story.append(Paragraph(f"<b>Hasta:</b> {clean_for_pdf(db_note.patient.name)}", normal_style))
            story.append(Spacer(1, 12))

        # Summary
        if db_note.summary:
            story.append(Paragraph("<b>AI Özeti:</b>", heading_style))
            story.append(Paragraph(clean_for_pdf(db_note.summary), normal_style))
            story.append(Spacer(1, 12))

        # Transcription
        if db_note.transcription:
            story.append(Paragraph("<b>Görüşme Metni:</b>", heading_style))
            story.append(Paragraph(clean_for_pdf(db_note.transcription), normal_style))
            story.append(Spacer(1, 12))

        doc.build(story)
        buffer.seek(0)
        
        return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=note_{note_id}.pdf"})
    
    except Exception as e:
        print(f"PDF Gen Error: {e}")
        err_buffer = io.BytesIO(f"PDF Error: {str(e)}".encode('utf-8'))
        return StreamingResponse(err_buffer, media_type="text/plain", status_code=500)

