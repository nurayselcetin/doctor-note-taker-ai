from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from jose import JWTError, jwt
import os
import shutil
import uuid

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@router.post("/register", response_model=schemas.Doctor)
def register_doctor(doctor: schemas.DoctorCreate, db: Session = Depends(get_db)):
    db_doctor = db.query(models.Doctor).filter(models.Doctor.username == doctor.username).first()
    if db_doctor:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = auth.get_password_hash(doctor.password)
    new_doctor = models.Doctor(
        username=doctor.username,
        email=doctor.email,
        hashed_password=hashed_password
    )
    db.add(new_doctor)
    db.commit()
    db.refresh(new_doctor)
    return new_doctor

@router.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    doctor = db.query(models.Doctor).filter(models.Doctor.username == form_data.username).first()
    if not doctor or not auth.verify_password(form_data.password, doctor.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": doctor.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

async def get_current_doctor(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = auth.decode_access_token(token)
        if payload is None:
            raise credentials_exception
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    doctor = db.query(models.Doctor).filter(models.Doctor.username == username).first()
    if doctor is None:
        raise credentials_exception
    return doctor

class PasswordVerification(schemas.BaseModel):
    password: str

@router.post("/verify-password")
def verify_user_password(verification: PasswordVerification, current_doctor: models.Doctor = Depends(get_current_doctor)):
    if not auth.verify_password(verification.password, current_doctor.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect password")
    return {"verified": True}

@router.get("/me")
def read_users_me(current_doctor: models.Doctor = Depends(get_current_doctor), db: Session = Depends(get_db)):
    patient_count = db.query(models.Patient).filter(models.Patient.doctor_id == current_doctor.id).count()
    return {
        "username": current_doctor.username,
        "email": current_doctor.email,
        "profile_picture": current_doctor.profile_picture,
        "patient_count": patient_count
    }

@router.post("/change-password")
def change_password(password_data: schemas.PasswordChange, current_doctor: models.Doctor = Depends(get_current_doctor), db: Session = Depends(get_db)):
    if not auth.verify_password(password_data.current_password, current_doctor.hashed_password):
        raise HTTPException(status_code=400, detail="Mevcut şifre hatalı")
    
    current_doctor.hashed_password = auth.get_password_hash(password_data.new_password)
    db.commit()
    return {"message": "Şifre başarıyla değiştirildi"}

@router.post("/upload-profile-picture")
async def upload_profile_picture(file: UploadFile = File(...), current_doctor: models.Doctor = Depends(get_current_doctor), db: Session = Depends(get_db)):
    UPLOAD_DIR = "static/uploads/profiles"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"{current_doctor.username}_{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Delete old profile picture if exists
    if current_doctor.profile_picture:
        old_path = current_doctor.profile_picture.lstrip("/")
        if os.path.exists(old_path) and "default" not in old_path:
             try:
                 os.remove(old_path)
             except:
                 pass

    # Save relative path to DB
    db_path = f"/{file_path}"
    current_doctor.profile_picture = db_path
    db.commit()
    
    return {"file_path": db_path}
