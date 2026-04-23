# ════════════════════════════════════════════════════
#  Weav AI — FastAPI Backend
#  Run: uvicorn main:app --reload --port 8000
# ════════════════════════════════════════════════════

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict
import mysql.connector
import bcrypt
import jwt
import os
import hashlib
import random
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Weav AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Config ───────────────────────────────────────────
JWT_SECRET  = os.getenv("JWT_SECRET", "weav-ai-secret-change-in-production")
JWT_EXPIRY  = int(os.getenv("JWT_EXPIRY_HOURS", 72))
DB_HOST     = os.getenv("DB_HOST", "localhost")
DB_USER     = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME     = os.getenv("DB_NAME", "weavai")

# ─── DB Connection ────────────────────────────────────
def get_db():
    conn = mysql.connector.connect(
        host=DB_HOST, user=DB_USER,
        password=DB_PASSWORD, database=DB_NAME
    )
    try:
        yield conn
    finally:
        conn.close()

# ─── JWT Utils ────────────────────────────────────────
security = HTTPBearer()

def create_token(user_id: int, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRY)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ─── Pydantic Schemas ─────────────────────────────────
class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class MeasurementCreate(BaseModel):
    bust: float
    waist: float
    hips: float
    height: Optional[float] = None
    weight: Optional[float] = None
    age: Optional[int] = None
    body_type: Optional[str] = None
    unit: str = "cm"

class FeedbackCreate(BaseModel):
    brand: str
    category: str
    recommended_size: str
    actual_fit: str
    notes: Optional[str] = None

class PricePredictRequest(BaseModel):
    category: str
    sizes: Dict[str, str]
    salt: int = 0

# ─── Price Prediction Config ──────────────────────────
BRAND_TIER = {
    "H&M": 1.00,
    "Puma": 1.30,
    "Zara": 1.42,
    "Levi's": 1.55,
    "Adidas": 1.62,
    "Nike": 1.78,
}

CAT_BASE_PRICE = {
    "tops": 1399,
    "bottoms": 2199,
    "dresses": 2499,
    "sports_bras": 1199,
    "hoodies": 2799,
    "accessories": 749,
    "outerwear": 5299,
    "footwear": 3799,
}

SIZE_PRICE_MULT = {"XS": 1.00, "S": 1.00, "M": 1.00, "L": 1.025, "XL": 1.05, "XXL": 1.08}
SIZE_STOCK_MULT = {"XS": 0.78, "S": 1.00, "M": 1.00, "L": 0.92, "XL": 0.74, "XXL": 0.58}
PRICE_BUCKET_SECONDS = 6 * 60 * 60

# ─── Size Matching Algorithm ──────────────────────────
def match_size(bust: float, waist: float, hips: float, charts: list) -> str:
    """Rule-based size matching. Prioritises waist, then bust, then hips."""
    for row in charts:
        b_ok = row["bust_min"]  <= bust  <= row["bust_max"]
        w_ok = row["waist_min"] <= waist <= row["waist_max"]
        h_ok = row["hips_min"]  <= hips  <= row["hips_max"]
        if w_ok or b_ok or h_ok:
            return row["size_label"]
    # Fallback — closest waist midpoint
    best, min_diff = charts[0]["size_label"], float("inf")
    for row in charts:
        mid  = (row["waist_min"] + row["waist_max"]) / 2
        diff = abs(waist - mid)
        if diff < min_diff:
            min_diff = diff
            best = row["size_label"]
    return best

def _seeded_random(*parts) -> random.Random:
    seed_text = ":".join(str(p) for p in parts)
    seed = int(hashlib.sha256(seed_text.encode()).hexdigest()[:16], 16)
    return random.Random(seed)

def _price_trend_multiplier(category: str, rand: random.Random) -> float:
    now = datetime.now()
    is_weekend = now.weekday() >= 5
    evening_demand = 1.03 if 18 <= now.hour <= 23 else 1.0
    weekend_sale = 0.94 if is_weekend else 1.0
    volatility = 0.10 if category in {"footwear", "outerwear"} else 0.07
    return weekend_sale * evening_demand * (1 - volatility / 2 + rand.random() * volatility)

def predict_brand_price(brand: str, category: str, size: str, salt: int = 0) -> dict:
    normalized_size = (size or "M").upper()
    bucket = int(datetime.utcnow().timestamp() // PRICE_BUCKET_SECONDS)
    rand = _seeded_random(brand, category, normalized_size, bucket, salt)
    tier = BRAND_TIER.get(brand, 1.25)
    base = CAT_BASE_PRICE.get(category, 1399)
    size_mult = SIZE_PRICE_MULT.get(normalized_size, 1.0)
    stock_mult = SIZE_STOCK_MULT.get(normalized_size, 1.0)
    trend_mult = _price_trend_multiplier(category, rand)

    total_items = 8 + int(rand.random() * 22)
    prices = []
    for _ in range(total_items):
        sample = rand.random()
        spread = 0.65 + sample * 0.9 if sample < 0.82 else 1.4 + (sample - 0.82) * 3.1
        prices.append(round(base * tier * size_mult * trend_mult * spread * (0.92 + rand.random() * 0.18)))
    prices.sort()

    in_stock = max(1, round(total_items * stock_mult * (0.75 + rand.random() * 0.25)))
    median = prices[len(prices) // 2]
    avg = round(sum(prices) / len(prices))

    return {
        "brand": brand,
        "size": normalized_size,
        "totalItems": total_items,
        "inStock": in_stock,
        "min": prices[0],
        "max": prices[-1],
        "avg": avg,
        "median": median,
        "bucket": bucket,
    }

# ════════════════════════════════════════════════════
#  AUTH ROUTES
# ════════════════════════════════════════════════════
@app.post("/auth/signup", tags=["Auth"])
def signup(body: SignupRequest, db=Depends(get_db)):
    cur = db.cursor(dictionary=True)
    cur.execute("SELECT id FROM users WHERE email=%s", (body.email,))
    if cur.fetchone():
        raise HTTPException(status_code=409, detail="Email already registered")
    hashed = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()
    cur.execute(
        "INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s)",
        (body.name, body.email, hashed)
    )
    db.commit()
    user_id = cur.lastrowid
    token   = create_token(user_id, body.email)
    return {"token": token, "user": {"id": user_id, "name": body.name, "email": body.email}}

@app.post("/auth/login", tags=["Auth"])
def login(body: LoginRequest, db=Depends(get_db)):
    cur = db.cursor(dictionary=True)
    cur.execute("SELECT * FROM users WHERE email=%s", (body.email,))
    user = cur.fetchone()
    stored_hash = user.get("password_hash") if user else None
    if not user or not stored_hash or not bcrypt.checkpw(body.password.encode(), stored_hash.encode()):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user["id"], user["email"])
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"]}}

@app.get("/auth/me", tags=["Auth"])
def me(payload=Depends(verify_token), db=Depends(get_db)):
    cur = db.cursor(dictionary=True)
    cur.execute("SELECT id, name, email, created_at FROM users WHERE id=%s", (payload["sub"],))
    user = cur.fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ════════════════════════════════════════════════════
#  MEASUREMENTS ROUTES
# ════════════════════════════════════════════════════
@app.post("/measurements", tags=["Measurements"])
def save_measurement(body: MeasurementCreate, payload=Depends(verify_token), db=Depends(get_db)):
    cur = db.cursor(dictionary=True)
    cur.execute(
        """INSERT INTO measurements
           (user_id, bust, waist, hips, height, weight, age, body_type, unit)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
        (payload["sub"], body.bust, body.waist, body.hips,
         body.height, body.weight, body.age, body.body_type, body.unit)
    )
    db.commit()
    return {"id": cur.lastrowid, "message": "Measurement saved successfully"}

@app.get("/measurements", tags=["Measurements"])
def get_measurements(payload=Depends(verify_token), db=Depends(get_db)):
    cur = db.cursor(dictionary=True)
    cur.execute(
        "SELECT * FROM measurements WHERE user_id=%s ORDER BY created_at DESC LIMIT 10",
        (payload["sub"],)
    )
    rows = cur.fetchall()
    # Convert decimals to float for JSON
    for r in rows:
        for k in ["bust","waist","hips","height","weight"]:
            if r.get(k): r[k] = float(r[k])
    return rows

# ════════════════════════════════════════════════════
#  SIZE RECOMMENDATION ROUTE
# ════════════════════════════════════════════════════
@app.get("/recommend", tags=["Recommendations"])
def recommend(
    bust: float, waist: float, hips: float,
    category: str = "tops",
    payload=Depends(verify_token),
    db=Depends(get_db)
):
    cur = db.cursor(dictionary=True)
    cur.execute("SELECT id, name, logo, site_url FROM brands")
    brands = cur.fetchall()
    cur.execute("SELECT id FROM categories WHERE slug=%s", (category,))
    category_row = cur.fetchone()
    category_id = category_row["id"] if category_row else None

    results = []
    for brand in brands:
        cur.execute(
            """SELECT size_label, bust_min, bust_max, waist_min, waist_max, hips_min, hips_max
               FROM size_charts WHERE brand_id=%s
               ORDER BY sort_order ASC, bust_min ASC""",
            (brand["id"],)
        )
        charts = cur.fetchall()
        if charts:
            size = match_size(bust, waist, hips, charts)
        else:
            size = "N/A"

        # Get shop URL for category
        link_row = None
        if category_id:
            cur.execute(
                "SELECT shop_url FROM brand_category_links WHERE brand_id=%s AND category_id=%s",
                (brand["id"], category_id)
            )
            link_row = cur.fetchone()
        shop_url = link_row["shop_url"] if link_row else brand["site_url"]

        results.append({
            "brand":    brand["name"],
            "logo":     brand["logo"],
            "size":     size,
            "shop_url": shop_url,
            "category": category,
        })

    return {"recommendations": results, "measurements": {"bust":bust,"waist":waist,"hips":hips}}

# ════════════════════════════════════════════════════
#  BRANDS ROUTE
# ════════════════════════════════════════════════════
@app.get("/brands", tags=["Brands"])
def get_brands(db=Depends(get_db)):
    cur = db.cursor(dictionary=True)
    cur.execute("SELECT id, name, logo, site_url FROM brands")
    return cur.fetchall()

# ════════════════════════════════════════════════════
#  FEEDBACK ROUTE
# ════════════════════════════════════════════════════
@app.post("/feedback", tags=["Feedback"])
def submit_feedback(body: FeedbackCreate, payload=Depends(verify_token), db=Depends(get_db)):
    cur = db.cursor(dictionary=True)
    cur.execute("SELECT id FROM brands WHERE name=%s", (body.brand,))
    brand_row = cur.fetchone()
    cur.execute("SELECT id FROM categories WHERE slug=%s", (body.category,))
    category_row = cur.fetchone()
    cur.execute(
        """INSERT INTO feedback (user_id, brand_id, category_id, recommended_size, actual_fit, notes)
           VALUES (%s,%s,%s,%s,%s,%s)""",
        (payload["sub"], brand_row["id"] if brand_row else None, category_row["id"] if category_row else None,
         body.recommended_size, body.actual_fit, body.notes)
    )
    db.commit()
    return {"message": "Feedback submitted. Thank you!"}

# ════════════════════════════════════════════════════
#  PRICE PREDICTION ROUTE
# ════════════════════════════════════════════════════
@app.post("/price/predict", tags=["Prices"])
def price_predict(body: PricePredictRequest):
    category = body.category or "tops"
    analyses = [
        predict_brand_price(brand, category, size, body.salt)
        for brand, size in body.sizes.items()
        if brand in BRAND_TIER
    ]
    if not analyses:
        raise HTTPException(status_code=400, detail="No valid brand sizes supplied")

    medians = [a["median"] for a in analyses]
    cheapest = min(analyses, key=lambda a: a["median"])
    priciest = max(analyses, key=lambda a: a["median"])
    savings = priciest["median"] - cheapest["median"]
    total_samples = sum(a["totalItems"] for a in analyses)
    total_stock = sum(a["inStock"] for a in analyses)

    outfit_categories = ["tops", "bottoms", "hoodies", "footwear"]
    outfit = []
    for brand, size in body.sizes.items():
        if brand not in BRAND_TIER:
            continue
        total = sum(
            predict_brand_price(brand, outfit_cat, size, body.salt)["median"]
            for outfit_cat in outfit_categories
        )
        outfit.append({"brand": brand, "total": total})
    outfit.sort(key=lambda row: row["total"])

    return {
        "source": "backend_price_predictor",
        "category": category,
        "updated_at": datetime.now().strftime("%I:%M %p"),
        "total_samples": total_samples,
        "total_stock": total_stock,
        "cheapest": cheapest["brand"],
        "savings": savings,
        "savings_pct": round((savings / priciest["median"]) * 100) if medians and priciest["median"] else 0,
        "analyses": sorted(analyses, key=lambda a: a["median"]),
        "outfit": outfit,
    }

@app.get("/")
def root():
    return {"app": "Weav AI", "version": "1.0.0", "status": "running"}
