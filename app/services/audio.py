import shutil
import os
import time
from fastapi import UploadFile
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class AudioService:
    @staticmethod
    def save_audio(file: UploadFile) -> str:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return file_path

    @staticmethod
    def transcribe(audio_path: str) -> str:
        if not GEMINI_API_KEY:
             return "Uyarı: API Anahtarı bulunamadı. Lütfen .env dosyasını kontrol edin. (Mock Data: Hasta baş ağrısı şikayetiyle geldi.)"
        
        try:
            # Upload the file to Gemini
            mime_type = "audio/wav" # default
            if audio_path.endswith(".webm"):
                mime_type = "audio/webm"
            elif audio_path.endswith(".mp4"):
                mime_type = "audio/mp4"
            elif audio_path.endswith(".ogg"):
                mime_type = "audio/ogg"
            elif audio_path.endswith(".mp3"):
                mime_type = "audio/mp3"

            file_size = os.path.getsize(audio_path)
            print(f"Uploading file: {audio_path} (Size: {file_size} bytes, Mime: {mime_type})")

            if file_size < 100:
                raise Exception("Audio file is too small or empty.")

            audio_file = genai.upload_file(path=audio_path, mime_type=mime_type)
            
            # Wait for the file to be active
            print(f"Waiting for file processing: {audio_file.name}")
            while audio_file.state.name == "PROCESSING":
                time.sleep(1)
                audio_file = genai.get_file(audio_file.name)
            
            if audio_file.state.name != "ACTIVE":
                raise Exception(f"File upload failed with state: {audio_file.state.name}")
            
            # Using Gemini 2.0 Flash (Stable)
            model = genai.GenerativeModel('gemini-2.0-flash')
            
            prompt = "Bu ses kaydını kelimesi kelimesine tam ve doğru bir şekilde transkribe et (yazıya dök). Sadece konuşulan metni ver."
            response = model.generate_content([prompt, audio_file])
            
            return response.text
        except Exception as e:
            print(f"Transcription Error: {e}")
            return f"Transkripsiyon hatası: {str(e)}"

audio_service = AudioService()
