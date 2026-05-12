import os
import json
import re
from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
from google import genai
from google.genai import types

router = APIRouter()

_client: genai.Client | None = None


def get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    return _client


FALLBACK = {
    "reframed_skills": [
        "Led cross-functional initiatives driving measurable outcomes",
        "Managed stakeholder communications and project timelines",
        "Executed data-driven strategies with budget ownership",
        "Built and mentored high-performance team members",
        "Delivered complex technical solutions under tight deadlines",
    ],
    "suggested_salary": 85000,
    "job_matches": [
        {
            "title": "Product Manager",
            "company_type": "Tech / Mid-stage Startup",
            "fit_score": 88,
            "fit_label": "Strong Match",
            "match_reasons": ["Leadership and execution experience aligns", "Cross-functional coordination is core to this role"],
            "gap_areas": ["Deepen technical product knowledge"],
            "salary_range": "$90,000 – $120,000",
        },
        {
            "title": "Operations Manager",
            "company_type": "Enterprise / Corporate",
            "fit_score": 82,
            "fit_label": "Strong Match",
            "match_reasons": ["Stakeholder management experience is highly relevant", "Budget ownership background is a strong signal"],
            "gap_areas": ["Build experience with enterprise tooling"],
            "salary_range": "$85,000 – $110,000",
        },
        {
            "title": "Strategy & Analytics Lead",
            "company_type": "Consulting / Agency",
            "fit_score": 74,
            "fit_label": "Good Match",
            "match_reasons": ["Data-driven mindset translates well", "Project delivery background is valued"],
            "gap_areas": ["Quantify impact metrics more explicitly"],
            "salary_range": "$80,000 – $105,000",
        },
        {
            "title": "Program Manager",
            "company_type": "Government / Nonprofit",
            "fit_score": 70,
            "fit_label": "Good Match",
            "match_reasons": ["Team leadership experience is transferable", "Communication skills are a differentiator"],
            "gap_areas": ["Gain familiarity with public sector workflows"],
            "salary_range": "$75,000 – $95,000",
        },
        {
            "title": "Growth Manager",
            "company_type": "Early-stage Startup",
            "fit_score": 63,
            "fit_label": "Stretch Role",
            "match_reasons": ["Execution mindset maps to growth roles", "Adaptability is a plus in startup environments"],
            "gap_areas": ["Build hands-on growth/marketing tooling experience"],
            "salary_range": "$80,000 – $115,000",
        },
    ],
}


def extract_text_from_pdf(data: bytes) -> str:
    try:
        import fitz
        doc = fitz.open(stream=data, filetype="pdf")
        return "\n".join(page.get_text() for page in doc)
    except Exception:
        return ""


@router.post("/parse-resume")
async def parse_resume(
    file: UploadFile | None = File(None),
    jobTitle: str = Form(""),
    jobDescription: str = Form(""),
):
    resume_text = ""

    if file:
        raw = await file.read()
        if file.content_type == "application/pdf" or (file.filename or "").endswith(".pdf"):
            resume_text = extract_text_from_pdf(raw)
        else:
            resume_text = raw.decode("utf-8", errors="ignore")

    context_block = ""
    if resume_text:
        context_block += f'\nResume:\n"""\n{resume_text[:3500]}\n"""'
    if jobDescription.strip():
        context_block += f'\n\nJob posting the user wants to evaluate:\n"""\n{jobDescription.strip()[:1500]}\n"""'
    elif jobTitle.strip():
        context_block += f"\n\nTarget role: {jobTitle.strip()}"

    if not context_block:
        context_block = "\nTarget role: Software Engineer (no resume provided)"

    prompt = f"""You are a job market analyst and career coach specializing in helping women land well-compensated roles.

{context_block}

Analyze the resume and return a JSON object that:
1. Reframes the person's experience in corporate, high-impact language
2. Identifies 5 real, realistic job titles that fit this person's background, scored by fit

{"If a specific job posting was provided, include it as the first match and score it precisely against the resume." if jobDescription.strip() else "Generate 5 realistic matching job titles and company contexts."}

Return ONLY valid JSON — no markdown, no explanation — with exactly this shape:
{{
  "reframed_skills": [
    "5 bullet points reframing their experience in leadership/budget/impact language"
  ],
  "suggested_salary": 85000,
  "job_matches": [
    {{
      "title": "Exact Job Title",
      "company_type": "Company type or industry (e.g. 'Tech / Series B Startup')",
      "fit_score": 88,
      "fit_label": "Strong Match",
      "match_reasons": ["Specific reason 1", "Specific reason 2"],
      "gap_areas": ["One concrete skill or experience gap"],
      "salary_range": "$85,000 – $110,000"
    }}
  ]
}}

Rules:
- reframed_skills: exactly 5 items, corporate-ready, begin with strong action verbs
- suggested_salary: integer, realistic mid-market USD annual salary for this person
- job_matches: exactly 5 items sorted by fit_score descending
- fit_score: 0-100 integer
- fit_label: "Excellent Match" (90+), "Strong Match" (75-89), "Good Match" (60-74), "Stretch Role" (below 60)
- match_reasons: exactly 2 specific, resume-grounded reasons
- gap_areas: exactly 1 actionable gap
- salary_range: realistic range for that specific role and market"""

    try:
        response = await get_client().aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=2048,
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )
        raw_text = response.text
        json_match = re.search(r"\{[\s\S]*\}", raw_text)
        if not json_match:
            raise ValueError("No JSON in response")
        return JSONResponse(content=json.loads(json_match.group()))
    except Exception as e:
        print(f"parse-resume error: {e}")
        return JSONResponse(content=FALLBACK)
