import os
import json
import re
import asyncio
from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
from google import genai
from google.genai import types

router = APIRouter()

_client: genai.Client | None = None

MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]


def get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    return _client


ANALYSIS_PROMPT = """You are a job market analyst and career coach specializing in helping women land well-compensated roles.

{context}

Analyze the resume carefully and return a JSON object that:
1. Reframes the person's specific experience in corporate, high-impact language
2. Identifies 5 realistic job titles that fit this person's actual background, scored by fit

{job_instruction}

Return ONLY valid JSON — no markdown, no explanation:
{{
  "reframed_skills": [
    "5 bullet points reframing their experience, beginning with strong action verbs"
  ],
  "suggested_salary": 85000,
  "job_matches": [
    {{
      "title": "Exact Job Title",
      "company_type": "Industry or company stage (e.g. 'Tech / Series B Startup')",
      "fit_score": 88,
      "fit_label": "Strong Match",
      "match_reasons": ["Specific reason from the resume", "Second specific reason"],
      "gap_areas": ["One concrete actionable gap"],
      "salary_range": "$85,000 – $110,000"
    }}
  ]
}}

Rules:
- reframed_skills: exactly 5 items grounded in this person's actual experience
- suggested_salary: realistic mid-market USD annual integer
- job_matches: exactly 5 items sorted by fit_score descending
- fit_score: 0-100 integer
- fit_label: "Excellent Match" (90+), "Strong Match" (75-89), "Good Match" (60-74), "Stretch Role" (below 60)
- match_reasons: exactly 2 reasons that reference specific skills or experience from the resume
- gap_areas: exactly 1 item
- salary_range: realistic range for that role and market"""


def _build_context(job_title: str, job_description: str) -> tuple[str, str]:
    job_instruction = (
        "The user submitted a specific job posting — include it as the first match and score it precisely against the resume."
        if job_description.strip()
        else "Generate 5 realistic matching job titles based on this person's actual background."
    )
    if job_description.strip():
        context = f'Job posting to evaluate:\n"""\n{job_description.strip()[:1500]}\n"""'
    elif job_title.strip():
        context = f"Target role: {job_title.strip()}"
    else:
        context = "No specific target role provided — suggest the best-fit roles based solely on the resume content."
    return context, job_instruction


async def _call_gemini(contents, max_tokens: int = 2048) -> str:
    """Try each model in order, retrying once on 503."""
    client = get_client()
    config = types.GenerateContentConfig(
        max_output_tokens=max_tokens,
        thinking_config=types.ThinkingConfig(thinking_budget=0),
    )
    last_err = None
    for model in MODELS:
        for attempt in range(2):
            try:
                resp = await client.aio.models.generate_content(
                    model=model, contents=contents, config=config
                )
                return resp.text
            except Exception as e:
                last_err = e
                msg = str(e)
                if "503" in msg or "UNAVAILABLE" in msg or "overload" in msg.lower():
                    if attempt == 0:
                        await asyncio.sleep(2)
                        continue  # retry same model once
                    break  # try next model
                raise  # non-503 error — re-raise immediately
    raise last_err


@router.post("/parse-resume")
async def parse_resume(
    file: UploadFile | None = File(None),
    jobTitle: str = Form(""),
    jobDescription: str = Form(""),
):
    file_bytes: bytes | None = None
    mime_type = "text/plain"

    if file and file.filename:
        raw = await file.read()
        if raw:
            file_bytes = raw
            fname = (file.filename or "").lower()
            ct = (file.content_type or "").lower()
            if "pdf" in ct or fname.endswith(".pdf"):
                mime_type = "application/pdf"
            elif "word" in ct or fname.endswith(".docx"):
                mime_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            else:
                mime_type = "text/plain"

    context, job_instruction = _build_context(jobTitle, jobDescription)
    prompt_text = ANALYSIS_PROMPT.format(context=context, job_instruction=job_instruction)

    # Build contents: multimodal when file present, plain string otherwise
    if file_bytes:
        contents = [
            types.Part.from_bytes(data=file_bytes, mime_type=mime_type),
            types.Part.from_text(text=prompt_text),
        ]
    else:
        contents = prompt_text

    try:
        raw_text = await _call_gemini(contents)
        json_match = re.search(r"\{[\s\S]*\}", raw_text)
        if not json_match:
            raise ValueError("No JSON in response")
        return JSONResponse(content=json.loads(json_match.group()))
    except Exception as e:
        print(f"[parse-resume] error: {type(e).__name__}: {e}")
        return JSONResponse(
            status_code=503,
            content={"error": "The AI is temporarily busy. Please try again in a moment."},
        )
