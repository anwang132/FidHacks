import os
import json
import re
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


class InvestAdviceRequest(BaseModel):
    salary: int
    location: str
    contribution_pct: float
    risk: str
    monthly_invest: float
    final_wealth: float
    user_context: str


LOCATION_LABELS = {
    "high": "a high cost-of-living city (like NYC or San Francisco)",
    "average": "an average cost-of-living city (like Denver or Austin)",
    "low": "a low cost-of-living city (like Raleigh or Columbus)",
}

RISK_LABELS = {
    "conservative": "conservative (bonds and stable index funds, ~4% avg return)",
    "moderate": "moderate (diversified stocks, ~7% avg return — historical S&P 500 average)",
    "aggressive": "aggressive (growth stocks, ~10% avg return with higher volatility)",
}

FALLBACK = [
    {"title": "Max your 401(k) match first", "advice": "Always contribute enough to get your full employer match — it's an instant 50–100% return on that money with zero risk."},
    {"title": "Open a Roth IRA", "advice": "You can contribute up to $7,000/year post-tax. Withdrawals in retirement are completely tax-free, which is ideal when you're in a lower bracket now."},
    {"title": "Build a 3–6 month emergency fund first", "advice": "Keep 3–6 months of expenses in a high-yield savings account (HYSA) before aggressively investing — this prevents you from selling investments at a loss in a crisis."},
    {"title": "Invest in low-cost index funds", "advice": "VTI or VTSAX give you exposure to the entire US stock market at under 0.05% expense ratio — most active fund managers can't beat them over 10+ year periods."},
]


@router.post("/invest-advice")
async def invest_advice(req: InvestAdviceRequest):
    location_label = LOCATION_LABELS.get(req.location, req.location)
    risk_label = RISK_LABELS.get(req.risk, req.risk)

    prompt = f"""You are a warm, practical financial advisor for Gen-Z women entering their careers.

The user has shared this about themselves:
"{req.user_context}"

Their current financial snapshot:
- Annual salary: ${req.salary:,}
- Location: {location_label}
- Monthly investment: ~${req.monthly_invest:,.0f}/month ({req.contribution_pct:.0f}% of take-home)
- Risk profile: {risk_label}
- Projected 10-year wealth: ${req.final_wealth:,.0f}

Give exactly 4 specific, personalized pieces of advice tailored to what they said about themselves.
Be concrete — mention real accounts (Roth IRA, 401k, HYSA, index funds like VTI/VTSAX).
Be encouraging but honest. Keep each piece of advice to 2 sentences max.

Return ONLY a valid JSON array — no markdown, no explanation:
[
  {{"title": "Short title", "advice": "Two sentence advice."}},
  {{"title": "Short title", "advice": "Two sentence advice."}},
  {{"title": "Short title", "advice": "Two sentence advice."}},
  {{"title": "Short title", "advice": "Two sentence advice."}}
]"""

    try:
        response = await get_client().aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=600,
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )
        raw = response.text
        match = re.search(r"\[[\s\S]*\]", raw)
        if not match:
            raise ValueError("No JSON array in response")
        return JSONResponse(content={"advice": json.loads(match.group())})
    except Exception as e:
        print(f"invest-advice error: {e}")
        return JSONResponse(content={"advice": FALLBACK})
