from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from .database import engine, Base
from .routers import patients, notes, auth, assistants

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Doktor Not Alma Asistanı")

# Include Routers
app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(notes.router)
app.include_router(assistants.router)

# Mount Static Files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def read_landing():
    return FileResponse('templates/landing.html')

@app.get("/login")
async def read_login():
    return FileResponse('templates/login.html')

@app.get("/dashboard")
async def read_dashboard():
    return FileResponse('templates/index.html')
