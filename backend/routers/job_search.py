import os
import json
import re
from fastapi import APIRouter
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
    "jobs": [
        {"title": "Associate Product Manager", "company": "Figma", "location": "San Francisco, CA", "salary_range": "$95,000 – $115,000", "level": "Entry Level", "tags": ["Product Strategy", "Agile", "User Research"], "url": "https://www.linkedin.com/jobs/search/?keywords=associate+product+manager"},
        {"title": "Junior Software Engineer", "company": "Stripe", "location": "New York, NY (Hybrid)", "salary_range": "$110,000 – $135,000", "level": "Entry Level", "tags": ["Python", "React", "APIs"], "url": "https://www.linkedin.com/jobs/search/?keywords=junior+software+engineer"},
        {"title": "Data Analyst", "company": "Spotify", "location": "Remote — US", "salary_range": "$75,000 – $95,000", "level": "Entry Level", "tags": ["SQL", "Tableau", "Python"], "url": "https://www.linkedin.com/jobs/search/?keywords=data+analyst+entry+level"},
        {"title": "Operations Associate", "company": "Airbnb", "location": "San Francisco, CA", "salary_range": "$70,000 – $90,000", "level": "Entry Level", "tags": ["Excel", "Process Improvement", "Stakeholders"], "url": "https://www.linkedin.com/jobs/search/?keywords=operations+associate"},
        {"title": "Marketing Analyst", "company": "HubSpot", "location": "Boston, MA (Hybrid)", "salary_range": "$65,000 – $85,000", "level": "Entry Level", "tags": ["Google Analytics", "SEO", "Content"], "url": "https://www.linkedin.com/jobs/search/?keywords=marketing+analyst"},
    ]
}


@router.get("/job-search")
async def job_search(role: str = "Software Engineer"):
    prompt = f"""You are a job market data specialist. Generate 5 realistic, current job postings for the role: "{role}".

Use real, well-known tech or finance companies (mix of Big Tech, startups, consulting). Make locations varied (NYC, SF, Remote, Austin, Boston, hybrid, etc.).

Return ONLY a valid JSON object — no markdown, no explanation:
{{
  "jobs": [
    {{
      "title": "Specific Job Title",
      "company": "Real Company Name",
      "location": "City, ST or Remote",
      "salary_range": "$XX,000 – $XX,000",
      "level": "Entry Level",
      "tags": ["Skill 1", "Skill 2", "Skill 3"],
      "url": "https://www.linkedin.com/jobs/search/?keywords={role.replace(' ', '+')}"
    }}
  ]
}}

Rules:
- All 5 jobs should be Entry Level or new grad level
- Salary ranges should be realistic for 2025 US market
- Tags should be real skills for that role (3 per job)
- Company names must be real, well-known companies
- Mix remote, hybrid, and on-site locations"""

    try:
        response = await get_client().aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=800,
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )
        raw = response.text
        match = re.search(r"\{[\s\S]*\}", raw)
        if not match:
            raise ValueError("No JSON in response")
        return JSONResponse(content=json.loads(match.group()))
    except Exception as e:
        print(f"job-search error: {e}")
        return JSONResponse(content=FALLBACK)
