import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini if API key is available
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

import time
import functools
from google.api_core import exceptions

def retry_on_quota_error(max_retries=3, initial_delay=1):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            delay = initial_delay
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except exceptions.ResourceExhausted as e:
                    if attempt == max_retries - 1:
                        raise e
                    print(f"Quota exceeded, retrying in {delay}s...")
                    time.sleep(delay)
                    delay *= 2  # Exponential backoff
                except Exception as e:
                    # Reraise other exceptions immediately or handle them
                    # For safety, if it's a 429-like error from underlying lib that isn't ResourceExhausted class
                    if "429" in str(e):
                         if attempt == max_retries - 1:
                            raise e
                         print(f"429 error, retrying in {delay}s...")
                         time.sleep(delay)
                         delay *= 2
                    else:
                        raise e
            return func(*args, **kwargs)
        return wrapper
    return decorator

class AIService:
    @staticmethod
    @retry_on_quota_error()
    def summarize_note(text: str, language: str = "tr") -> str:
        if not GEMINI_API_KEY:
            return "AI API Key not configured. Using mock summary."
        
        try:
            model = genai.GenerativeModel('gemini-2.0-flash')
            
            if language == 'tr':
                lang_instruction = "CRITICAL: RESPONSE MUST BE 100% TURKISH. Do not use English headers or terms."
                headers = """
                Format:
                ## Özet
                (Kısa paragraf)
                
                ## Tıbbi Bulgular
                (Semptomlar, Tanı, Tedavi - Madde işaretli)
                
                ## ICD-10 Kodları
                (Olası kodlar)
                """
            else:
                lang_instruction = "CRITICAL: RESPONSE MUST BE 100% ENGLISH. Do not use Turkish headers or terms."
                headers = """
                Format:
                ## Summary
                (Short paragraph)
                
                ## Clinical Findings
                (Symptoms, Diagnosis, Treatment - Bullet points)
                
                ## ICD-10 Codes
                (Possible codes)
                """
            
            prompt = f"""Summarize the doctor's note below.
            
            {lang_instruction}
            
            {headers}
            
            Text:
            {text}"""
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Error generating summary: {str(e)}"

    @staticmethod
    @retry_on_quota_error()
    def summarize_patient_history(notes_text: list[str], language: str = "tr") -> str:
        if not GEMINI_API_KEY:
            return "Mock Patient History Summary"

        try:
            combined_text = "\n---\n".join(notes_text)
            model = genai.GenerativeModel('gemini-2.0-flash')
            
            if language == 'tr':
                lang_instruction = "CRITICAL: Yanıt tamamen TÜRKÇE olmalı. Tüm tıbbi terimleri ve notları Türkçe'ye çevirerek özetle."
            else:
                lang_instruction = "CRITICAL: Response must be entirely in ENGLISH. You MUST TRANSLATE all Turkish input text into English before summarizing. Do not output any Turkish text."
            
            prompt = f"""
            Act as a Senior Clinical Educator. Analyze the patient history below.
            
            {lang_instruction}
            
            STRUCTURE:
            1. Clinical History Summary (Chronological)
            2. Deep Clinical Analysis & Pathophysiology
            3. Differential Diagnosis
            4. Clinical Pearls
            5. Critical Warnings
            
            Notes:
            {combined_text}
            """
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            if "429" in str(e) or "Resource exhausted" in str(e):
                # This catch block is redundant if decorator captures it, 
                # but since we catch Exception inside the method, the decorator might not catch it if we swallow it here.
                # We should re-raise 429s to let decorator handle them.
                raise e 
            return f"Error generating history summary: {str(e)}"

    @staticmethod
    @retry_on_quota_error()
    def analyze_clinical_context(text: str, education_mode: bool = False, language: str = "tr") -> dict:
        if not GEMINI_API_KEY:
            return {
                "risks": [],
                "suggestions": ["API Key Missing"],
                "education_notes": []
            }
        
        try:
            model = genai.GenerativeModel('gemini-2.0-flash')
            
            if language == 'tr':
                lang_instruction = """
                CRITICAL INSTRUCTION: OUTPUT MUST BE 100% TURKISH.
                - Do NOT use English words.
                - Translate all medical terms to Turkish where appropriate.
                - The 'message' fields in JSON must be in TURKISH.
                - The 'suggestions' and 'education_notes' list items must be in TURKISH.
                """
            else:
                lang_instruction = """
                CRITICAL INSTRUCTION: OUTPUT MUST BE 100% ENGLISH.
                - Do NOT use Turkish words.
                - The 'message' fields in JSON must be in ENGLISH.
                - The 'suggestions' and 'education_notes' list items must be in ENGLISH.
                """
            
            education_instruction = ""
            if education_mode:
                education_instruction = """
                3. **EDUCATION MODE (DEEP ANALYSIS)**:
                   - **RATIONALE**: Explain why the doctor chose this.
                   - **SYMPTOM-SUSPICION MATCH**: Match symptoms to suspicions.
                   - **COMPARATIVE**: Compare choices.
                   - **SOCRATIC Q**: Ask a thought-provoking question.
                """

            prompt = f"""
            Act as a 'Consultant AI' (Medical Advisor). Analyze the doctor-patient conversation.
            
            {lang_instruction}
            
            TASKS:
            1. **RISK ANALYSIS & SAFETY**:
               - **EMERGENCY DETECTION**: If words like "Severe Pain", "High Fever", "Chest Pain", "Shortness of Breath" appear, mark as 'critical'.
               - Check for drug interactions or allergies.
            
            2. **SUGGESTIONS**:
               - Suggest concrete medication names if none given.
               - Suggest alternatives.

            {education_instruction}
            
            IMPORTANT:
            - Never give a definitive diagnosis. Say "Suspected X".
            
            Text:
            {text}
            
            Respond in valid JSON ONLY:
            {{
                "risks": [
                    {{ "message": "...", "level": "critical" | "warning" | "info", "type": "emergency" | "clinical" }}
                ],
                "suggestions": ["...", "..."],
                "education_notes": ["...", "..."]
            }}
            """
            response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            import json
            return json.loads(response.text)
        except Exception as e:
            if "429" in str(e) or "Resource exhausted" in str(e):
                raise e
            return {"risks": [], "suggestions": [f"AI Error: {str(e)}"]}

    @staticmethod
    def generate_clinical_case(language: str = "tr") -> dict:
        # Not adding retry here to avoid long wait times for a "random case" generator which is optional
        if not GEMINI_API_KEY:
            is_tr = language == 'tr'
            return {
                "name": "Demo Hasta (Offline)" if is_tr else "Demo Patient (Offline)",
                "transcription": "Hasta 45 yaşında erkek. 3 gündür devam eden göğüs ağrısı şikayeti ile başvurdu. Ağrı eforla artıyor, dinlenmekle geçiyor. Özgeçmişinde hipertansiyon var. Sigara kullanıyor. EKG'de V1-V4 derivasyonlarında ST depresyonu izlendi. Troponin T negatif. Efor testi planlandı." if is_tr else "Patient is a 45-year-old male. Presented with chest pain lasting for 3 days. Pain worsens with exertion, relieved by rest. History of hypertension. Smoker. ECG showed ST depression in V1-V4 leads. Troponin T negative. Stress test planned.",
                "summary": "Hasta tipik anjina pektoris tanımı ile uyumlu göğüs ağrısı tarifliyor. Risk faktörleri mevcut. İlk tetkiklerde akut MI bulgusu yok ancak iskemik kalp hastalığı şüphesi yüksek." if is_tr else "Patient describes chest pain consistent with typical angina pectoris. Risk factors present. Initial workup negative for acute MI, but high suspicion for ischemic heart disease."
            }

        try:
            model = genai.GenerativeModel('gemini-2.0-flash')
            
            lang_instruction = """
            OUTPUT LANGUAGE: TURKISH.
            The JSON content (name, transcription, summary) MUST be in TURKISH.
            Name should be a Turkish name.
            """ if language == 'tr' else """
            OUTPUT LANGUAGE: ENGLISH.
            The JSON content (name, transcription, summary) MUST be in ENGLISH.
            Name should be an English name.
            """
            
            prompt = f"""
            Create a random, challenging, and educational clinical case scenario for medical students.
            
            {lang_instruction}
            
            Output strictly valid JSON:
            {{
                "name": "Name Surname",
                "transcription": "Doctor's dictation or doctor-patient conversation text. (Detailed, medical terms, at least 3-4 sentences)",
                "summary": "Brief medical summary of the case."
            }}
            
            Select randomly from: Cardiology, Neurology, Internal Medicine, or Pulmonology.
            """
            response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            import json
            return json.loads(response.text)
        except Exception as e:
            return {
                "name": "Hata Vakası" if language == 'tr' else "Error Case",
                "transcription": f"AI Error: {str(e)}",
                "summary": "System error."
            }

    @staticmethod
    @retry_on_quota_error()
    def translate_text(text: str, target_language: str = "en") -> str:
        if not GEMINI_API_KEY or not text:
            return text
            
        # Log translation request
        text_preview = text[:50] + "..." if len(text) > 50 else text
        print(f"[TRANSLATION] Translating to {target_language}: {text_preview}")
        
        try:
            model = genai.GenerativeModel('gemini-2.0-flash')
            prompt = f"""Translate the following medical text to {'English' if target_language == 'en' else 'Turkish'}. 
            Maintain professional medical terminology. Return ONLY the translated text.
            
            Text:
            {text}"""
            
            response = model.generate_content(prompt)
            result = response.text.strip()
            print(f"[TRANSLATION] Success: {result[:50]}...")
            return result
        except Exception as e:
            print(f"[TRANSLATION] Error: {str(e)}")
            return text

ai_service = AIService()
