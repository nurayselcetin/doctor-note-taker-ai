from .ai import ai_service

def analyze_risk(text: str, education_mode: bool = False, language: str = "tr") -> dict:
    # Use Gemini for comprehensive analysis
    # It returns { "risks": [...], "suggestions": [...], "education_notes": [...] }
    return ai_service.analyze_clinical_context(text, education_mode=education_mode, language=language)
