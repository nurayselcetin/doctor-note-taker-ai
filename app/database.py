from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

import os

if os.environ.get("VERCEL"):
    SQLALCHEMY_DATABASE_URL = "sqlite:////tmp/doctor_notes.db"
else:
    SQLALCHEMY_DATABASE_URL = "sqlite:///./doctor_notes.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
