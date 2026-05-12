# SHEconomy

> AI-powered financial toolkit built for Gen-Z women to close the gender pay gap — one negotiation at a time.

Built at **FidHacks 2026**.

---

## What It Does

Women who don't negotiate their first salary lose an average of **$500,000** over their career. HerMoneyMoves gives every woman the tools to fight back:

| Tool | What it does |
|---|---|
| **Resume Fit Grader** | Upload a resume or paste a job posting — get a fit score, skill reframes, and salary ranges for matching roles |
| **Negotiation Simulator** | Practice with Jordan, an AI recruiter, across three escalating modes: guided choices → live text chat → voice negotiation |
| **Investment Simulator** | See how your salary compounds over 10 years with live market data, cost-of-living estimates, and a raise impact calculator |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Framer Motion, Recharts |
| Backend | Python 3.11+, FastAPI |
| AI | Google Gemini 2.0 Flash (chat, resume analysis, transcription), Gemini TTS |
| Market Data | Yahoo Finance (`yfinance`) |
| PDF Parsing | PyMuPDF |

---

## Project Structure

```
FidHacks/
├── backend/
│   ├── main.py                   # FastAPI app + CORS
│   └── routers/
│       ├── parse_resume.py       # Resume grading + job matching
│       ├── chat_negotiation.py   # Jordan AI recruiter chat
│       ├── invest_advice.py      # Personalized investment advice
│       ├── market_data.py        # Live ticker + S&P 500 data
│       ├── job_search.py         # Job search endpoint
│       ├── col_estimate.py       # AI cost-of-living estimator
│       ├── tts.py                # Gemini text-to-speech
│       └── transcribe.py        # Gemini audio transcription
└── frontend/
    ├── app/
    │   ├── page.tsx              # Home page
    │   ├── resume/               # Resume Grader page
    │   ├── negotiate/            # Negotiation Simulator pages
    │   │   ├── easy/             # Guided decision tree
    │   │   ├── medium/           # Live text chat
    │   │   └── hard/             # Voice negotiation
    │   └── invest/               # Investment Simulator page
    └── components/
        ├── ResumeGrader.tsx
        ├── InvestmentSimulator.tsx
        └── negotiation/
            ├── EasyMode.tsx
            ├── MediumMode.tsx
            ├── HardMode.tsx
            └── LockerRoom.tsx    # Inter-level transition screen
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- A [Google AI Studio API key](https://aistudio.google.com/) (Gemini)

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env and add your key
echo "GEMINI_API_KEY=your_key_here" > .env

uvicorn main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> The frontend expects the backend at `http://localhost:8000` by default.
> Override with `NEXT_PUBLIC_API_URL` in `frontend/.env.local`.

---

## Key Features

### Negotiation Simulator — Three Modes

- **Easy** — Multiple-choice decision tree with market context and coaching hints
- **Medium** — Free-text chat with Jordan, an AI recruiter who pushes back on weak asks
- **Hard** — Voice-to-voice negotiation using Gemini TTS + audio transcription; includes real-time speech coaching (confidence, filler words, hedging detection)

### Investment Simulator

- Live market tickers (SPY, QQQ, VTI) via Yahoo Finance
- AI cost-of-living estimator by city
- **Raise Impact Calculator** — drag a slider to see how a negotiated raise compounds over 10 years
- **Cost of Waiting** — interactive comparison of wealth destroyed by delaying investment 1–5 years
- **Milestone Tracker** — see when you hit $25k, $50k, $100k, $250k, $500k at your current rate
- Fixed 50/30/20 budget bar (all segments as % of net take-home)

### Resume Fit Grader

- PDF upload or paste job description
- Gemini-powered fit score, skill gap analysis, and salary range lookup
- Ranked list of matching roles with negotiation leverage points

---

## Inspiration

37% of women negotiate their salary every time, compared to 57% of men. That gap isn't a confidence problem — it's a practice problem. Nobody teaches young women how to negotiate, and the consequences compound silently: a woman who doesn't negotiate her first offer loses an average of $500,000 over her career, not just in salary but in every raise, bonus, and 401(k) match tied to that base.

We built HerMoneyMoves because we believe the pay gap closes one conversation at a time — and that conversation should be practiced somewhere safe before it happens in real life. We wanted to build something that didn't just inform women about the gap, but actually gave them the reps to close it.

## What It Does

HerMoneyMoves is a three-part AI toolkit targeted at Gen-Z women entering the workforce:

1. **Resume Fit Grader** — Upload a resume or paste a job posting. Gemini analyzes the fit, identifies skill gaps, reframes your experience using power language, and surfaces matching roles with real salary ranges and negotiation leverage points.

2. **Negotiation Simulator** — Practice salary negotiation with Jordan, an AI recruiter who is warm but firm and has a budget ceiling she'll never reveal. Three escalating difficulty levels: a guided decision tree (Easy), free-text chat (Medium), and full voice-to-voice negotiation (Hard). The Hard mode analyzes your speech in real time — flagging hedging language, filler words, and low-confidence phrasing — and gives coaching feedback between turns.

3. **Investment Simulator** — Enter your salary, city, and risk tolerance to see exactly how your money compounds over 10 years. Includes a raise impact calculator (drag a slider to see how a negotiated raise compounds), a "cost of waiting" interactive showing wealth destroyed by delaying 1–5 years, live market tickers, an AI cost-of-living estimator, and a milestone tracker.

## How We Built It

**Frontend:** Next.js 15 (App Router) with TypeScript, Tailwind CSS v4, Framer Motion for animations, and Recharts for interactive charts. The three negotiation modes each have a distinct UI — from a card-based decision tree to a voice call interface with a live waveform and mood-reactive AI avatar.

**Backend:** Python + FastAPI with a clean router-per-feature structure. Eight API endpoints handle everything from PDF parsing to real-time audio transcription.

**AI:** Google Gemini 2.0 Flash powers every AI feature — resume analysis, the Jordan recruiter persona, cost-of-living estimation, investment advice, audio transcription (multimodal), and text-to-speech synthesis (`gemini-2.5-flash-preview-tts`). One API key, one model family, consistent behavior across all features.

**Market data:** Yahoo Finance (`yfinance`) for live tickers and historical S&P 500 returns.

## Challenges We Ran Into

- **Voice pipeline latency:** Getting the record → transcribe → AI respond → TTS play loop to feel natural required careful state management. We handle it with a `ConnectionState` machine (idle → listening → thinking → speaking) and stream TTS audio as base64 so playback starts before the full response is generated.

- **Budget math:** The 50/30/20 budget bar was initially broken — we were plotting `contribution%` (a percentage of *disposable* income) against `needsPct` (a percentage of *net* income). The bar segments didn't add up to 100%. Fixed by normalizing all three segments against net take-home.

- **Consistent light-mode theming:** The project uses a Tailwind v4 `@theme` block to remap `violet` → custom pink (#F5CFF1) and `teal` → custom sage (#B2DBBF) globally. Several negotiation mode components had residual dark-alpha patterns (`bg-slate-900/60`, `text-violet-300`) that had to be systematically hunted down across three large component files.

- **Gemini multimodal audio:** The browser records audio as `audio/webm` via the MediaRecorder API. Getting Gemini to reliably transcribe short negotiation utterances (vs. long recordings) required prompt tuning to prevent it from adding unsolicited commentary to the transcript.

## Accomplishments That We're Proud Of

- A fully voice-capable negotiation simulator that works end-to-end: mic → Gemini transcription → Jordan AI response → Gemini TTS → browser playback, all in one round trip.
- The raise impact calculator directly connects the negotiation and investment tools — showing in real numbers how a $5,000 raise compounded over 10 years justifies the anxiety of the ask.
- A genuinely useful investment simulator with interactive features that go beyond a static calculator: live market data, city-level COL estimates, delay cost visualization, and milestone tracking.
- A cohesive, on-brand design system (pink/sage palette, Framer Motion transitions, celebratory locker room screens between negotiation rounds) that makes the app feel polished and intentional for its target audience.

## What We Learned

- Gemini's multimodal capabilities (text, audio in, audio out — all one API) dramatically simplify building voice-first features. What would have required Whisper + a separate TTS service collapsed into a single SDK.
- Designing for a specific user (young women entering the workforce) changes every product decision — from the tone of the AI recruiter persona to the color palette to the framing of statistics.
- The most impactful feature isn't always the most technically complex one. The raise impact slider — a 10-line calculation — was more "aha" than the voice pipeline.

## What's Next for HerMoneyMoves

- **Cohort mode:** Let a group of friends practice together and compare negotiated salaries — social accountability as a feature.
- **Offer letter analyzer:** Paste a real offer letter; get a line-by-line breakdown of what's negotiable, what's standard, and what's a red flag.
- **Streak & progress tracking:** Remember past sessions, track improvement in negotiation scores over time, and surface personalized coaching based on recurring weaknesses.
- **Company-specific intel:** Pull Glassdoor/Levels.fyi data to give Jordan realistic salary ceilings for specific companies and roles.
- **Mobile app:** The voice negotiation mode is a natural fit for mobile — practice on the commute to the interview.
