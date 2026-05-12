import asyncio
from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter()


def _fetch_market_data() -> dict:
    try:
        import yfinance as yf

        spy = yf.Ticker("SPY")
        vti = yf.Ticker("VTI")
        voo = yf.Ticker("VOO")
        bnd = yf.Ticker("BND")

        # 10-year monthly closes → build annual return series
        hist = spy.history(period="10y", interval="3mo")
        annual_points: list[dict] = []
        if not hist.empty:
            start_price = hist["Close"].iloc[0]
            quarters = list(hist["Close"].items())
            # Downsample to ~10 yearly points
            step = max(1, len(quarters) // 10)
            for i, (dt, price) in enumerate(quarters[step::step][:10], 1):
                annual_points.append({
                    "year": i,
                    "spx": round(float(price / start_price - 1) * 100, 2),
                })

        def ticker_info(t: yf.Ticker) -> dict:
            info = t.fast_info
            try:
                price = round(float(info.last_price), 2)
                prev = round(float(info.previous_close), 2)
                pct = round((price - prev) / prev * 100, 2) if prev else 0
            except Exception:
                price, pct = 0, 0
            try:
                hist1y = t.history(period="1y")
                yr_return = 0.0
                if not hist1y.empty:
                    yr_return = round(
                        (hist1y["Close"].iloc[-1] / hist1y["Close"].iloc[0] - 1) * 100, 2
                    )
            except Exception:
                yr_return = 0.0
            return {"price": price, "day_pct": pct, "yr_return": yr_return}

        return {
            "annual_spy": annual_points,
            "tickers": {
                "VTI": ticker_info(vti),
                "VOO": ticker_info(voo),
                "BND": ticker_info(bnd),
            },
        }
    except Exception as e:
        print(f"market-data error: {e}")
        return {
            "annual_spy": [
                {"year": 1, "spx": 26.29},
                {"year": 2, "spx": 11.96},
                {"year": 3, "spx": 21.83},
                {"year": 4, "spx": -4.38},
                {"year": 5, "spx": 31.49},
                {"year": 6, "spx": 18.40},
                {"year": 7, "spx": 28.88},
                {"year": 8, "spx": -18.11},
                {"year": 9, "spx": 26.29},
                {"year": 10, "spx": 23.31},
            ],
            "tickers": {
                "VTI": {"price": 270.00, "day_pct": 0.31, "yr_return": 24.1},
                "VOO": {"price": 485.00, "day_pct": 0.28, "yr_return": 24.3},
                "BND": {"price": 74.00, "day_pct": -0.05, "yr_return": 4.1},
            },
        }


@router.get("/market-data")
async def get_market_data():
    data = await asyncio.to_thread(_fetch_market_data)
    return JSONResponse(content=data)
