import os
import json
import re
import asyncio
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from google import genai
from google.genai import types

router = APIRouter()

_client: genai.Client | None = None


def get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    return _client


class COLRequest(BaseModel):
    city: str


PROMPT = """\
You are a cost-of-living data analyst. Estimate realistic monthly living expenses for a single professional renting a 1-bedroom apartment in the given city.

City: {city}

Return ONLY this exact JSON structure — no markdown fences, no commentary:
{{
  "city_label": "City, ST",
  "breakdown": {{
    "rent": 1800,
    "food": 600,
    "transport": 400,
    "healthcare": 250,
    "utilities": 150,
    "other": 800
  }},
  "col_tier": "average",
  "context": "One sentence explaining the primary cost driver in this city."
}}

Requirements:
- All breakdown values are monthly USD integers representing realistic 2024-2025 costs
- col_tier must be exactly "high", "average", or "low"
  - "high": NYC, SF, LA, Boston, Seattle, Miami, Washington DC, Chicago, San Jose
  - "low": small Midwestern/Southern cities, rural areas
  - "average": everything else
- rent: realistic 1BR monthly rent for a non-luxury apartment
- transport: monthly cost (transit pass OR car payment + insurance + gas)
- Do NOT include annual_total or monthly_total — those will be computed\
"""


def _extract_json(text: str) -> dict:
    """Extract and parse the first complete JSON object from text."""
    # Strip markdown fences if present
    text = re.sub(r"```(?:json)?", "", text).strip()
    # Find the outermost { ... }
    start = text.find("{")
    if start == -1:
        raise ValueError("No JSON object found")
    depth = 0
    for i, ch in enumerate(text[start:], start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return json.loads(text[start : i + 1])
    raise ValueError("Unclosed JSON object")


def _normalize(data: dict) -> dict:
    """Compute monthly_total and annual_total from the breakdown."""
    breakdown = data.get("breakdown", {})
    # Ensure all breakdown values are ints
    breakdown = {k: int(v) for k, v in breakdown.items() if isinstance(v, (int, float))}
    data["breakdown"] = breakdown
    monthly = sum(breakdown.values())
    data["monthly_total"] = monthly
    data["annual_total"] = monthly * 12
    # Fallback col_tier if missing or invalid
    if data.get("col_tier") not in ("high", "average", "low"):
        data["col_tier"] = "high" if monthly > 4200 else "low" if monthly < 2500 else "average"
    return data


@router.post("/cost-of-living")
async def estimate_col(req: COLRequest):
    city = req.city.strip()[:120]
    if not city:
        return JSONResponse(status_code=400, content={"error": "City name is required."})

    for model in ("gemini-2.5-flash",):
        for attempt in range(2):
            try:
                client = get_client()
                resp = await asyncio.wait_for(
                    client.aio.models.generate_content(
                        model=model,
                        contents=PROMPT.format(city=city),
                        config=types.GenerateContentConfig(
                            max_output_tokens=400,
                            thinking_config=types.ThinkingConfig(thinking_budget=0),
                        ),
                    ),
                    timeout=15,
                )
                raw = resp.text or ""
                data = _extract_json(raw)
                data = _normalize(data)
                # Ensure city_label is set
                if not data.get("city_label"):
                    data["city_label"] = city.title()
                print(f"[col-estimate] {city} → ${data['monthly_total']}/mo ({data['col_tier']})")
                return JSONResponse(content=data)
            except asyncio.TimeoutError:
                break  # try next model
            except Exception as e:
                msg = str(e)
                print(f"[col-estimate] {model} attempt {attempt+1}: {type(e).__name__}: {msg[:120]}")
                if "503" in msg or "UNAVAILABLE" in msg.lower() or "overload" in msg.lower():
                    if attempt == 0:
                        await asyncio.sleep(1)
                        continue
                    break
                # Non-retryable error — try next model
                break

    return JSONResponse(
        status_code=503,
        content={"error": "The AI is busy right now. Please try again in a moment."},
    )
