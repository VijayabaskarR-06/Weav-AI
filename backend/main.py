# ═══════════════════════════════════════════════════════════
#  WEAV AI — FastAPI Backend
#  Run: uvicorn main:app --reload --host 0.0.0.0 --port 8000
# ═══════════════════════════════════════════════════════════

from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
import mysql.connector
from mysql.connector import pooling
import bcrypt
import jwt
import os
import secrets
from datetime import datetime, timedelta
from dotenv import load_dotenv
import logging

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("weavai")

# ─── App ─────────────────────────────────────────────────
app = FastAPI(
    title="Weav AI API",
    description="Your Personal Tailor — Size Recommendation Engine",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Config ──────────────────────────────────────────────
JWT_SECRET  = os.getenv("JWT_SECRET", "weav-ai-change-this-in-production-2024")
JWT_EXPIRY  = int(os.getenv("JWT_EXPIRY_HOURS", 72))
DB_CONFIG   = {
    "host":     os.getenv("DB_HOST", "localhost"),
    "user":     os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "weavai"),
    "charset":  "utf8mb4",
    "autocommit": False,
}

# ─── DB Connection Pool ───────────────────────────────────
try:
    db_pool = pooling.MySQLConnectionPool(
        pool_name="weavai_pool",
        pool_size=10,
        **DB_CONFIG
    )
    logger.info("✅ MySQL connection pool created")
except Exception as e:
    logger.error(f"❌ DB pool error: {e}")
    db_pool = None

def get_db():
    conn = db_pool.get_connection() if db_pool else mysql.connector.connect(**DB_CONFIG)
    try:
        yield conn
    finally:
        if conn.is_connected():
            conn.close()

# ─── JWT ─────────────────────────────────────────────────
security = HTTPBearer()

def create_token(user_id: int, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRY),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def verify_token(cred: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(cred.credentials, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired. Please login again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token.")

# ─── Size Matching Algorithm ──────────────────────────────
def match_size(bust: float, waist: float, hips: float, charts: list) -> dict:
    """
    Rule-based size matching algorithm.
    Prioritises waist match, then bust, then hips.
    Returns size label + confidence score.
    """
    for size in charts:
        w_ok = size["waist_min"] <= waist <= size["waist_max"]
        b_ok = size["bust_min"]  <= bust  <= size["bust_max"]
        h_ok = size["hips_min"]  <= hips  <= size["hips_max"]
        matches = sum([w_ok, b_ok, h_ok])
        if matches >= 2:
            confidence = 95 if matches == 3 else 85
            return {"size": size["size_label"], "confidence": confidence}
        if w_ok:
            return {"size": size["size_label"], "confidence": 80}
        if b_ok:
            return {"size": size["size_label"], "confidence": 75}

    # Fallback: closest waist midpoint
    best, min_diff = charts[0], float("inf")
    for s in charts:
        diff = abs(waist - (s["waist_min"] + s["waist_max"]) / 2)
        if diff < min_diff:
            min_diff = diff
            best = s
    return {"size": best["size_label"], "confidence": 65}

# ─── Pydantic Models ─────────────────────────────────────
class SignupRequest(BaseModel):
    name:     str        = Field(..., min_length=2, max_length=120)
    email:    EmailStr
    password: str        = Field(..., min_length=6)

class LoginRequest(BaseModel):
    email:    EmailStr
    password: str

class MeasurementCreate(BaseModel):
    bust:      float = Field(..., gt=0, le=200)
    waist:     float = Field(..., gt=0, le=200)
    hips:      float = Field(..., gt=0, le=200)
    height:    Optional[float] = Field(None, gt=0, le=300)
    weight:    Optional[float] = Field(None, gt=0, le=500)
    age:       Optional[int]   = Field(None, ge=10, le=120)
    body_type: Optional[str]   = None
    unit:      str             = "cm"

class FeedbackCreate(BaseModel):
    brand_name:       str
    category_slug:    str
    recommended_size: str
    actual_fit:       str
    notes:            Optional[str] = None
    rating:           Optional[int] = Field(None, ge=1, le=5)

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token:        str
    new_password: str = Field(..., min_length=6)

# ═══════════════════════════════════════════════════════════
#  AUTH ROUTES
# ═══════════════════════════════════════════════════════════
@app.post("/auth/signup", tags=["Auth"], summary="Register a new user")
def signup(body: SignupRequest, db=Depends(get_db)):
    cur = db.cursor(dictionary=True)
    cur.execute("SELECT id FROM users WHERE email = %s", (body.email,))
    if cur.fetchone():
        raise HTTPException(409, "Email already registered. Please sign in.")
    pw_hash = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()
    cur.execute(
        "INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s)",
        (body.name.strip(), body.email, pw_hash)
    )
    db.commit()
    uid   = cur.lastrowid
    token = create_token(uid, body.email)
    return {
        "token": token,
        "user": {"id": uid, "name": body.name.strip(), "email": body.email}
    }

@app.post("/auth/login", tags=["Auth"], summary="Login and get JWT token")
def login(body: LoginRequest, db=Depends(get_db)):
    cur = db.cursor(dictionary=True)
    cur.execute("SELECT * FROM users WHERE email = %s AND is_active = 1", (body.email,))
    user = cur.fetchone()
    if not user:
        raise HTTPException(401, "No account found with this email.")
    if not bcrypt.checkpw(body.password.encode(), user["password_hash"].encode()):
        raise HTTPException(401, "Incorrect password. Please try again.")
    token = create_token(user["id"], user["email"])
    return {
        "token": token,
        "user": {"id": user["id"], "name": user["name"], "email": user["email"]}
    }

@app.get("/auth/me", tags=["Auth"], summary="Get current user profile")
def me(payload=Depends(verify_token), db=Depends(get_db)):
    cur = db.cursor(dictionary=True)
    cur.execute(
        "SELECT id, name, email, provider, created_at FROM users WHERE id = %s",
        (payload["sub"],)
    )
    user = cur.fetchone()
    if not user:
        raise HTTPException(404, "User not found.")
    # Attach latest measurement
    cur.execute(
        "SELECT * FROM measurements WHERE user_id = %s ORDER BY created_at DESC LIMIT 1",
        (payload["sub"],)
    )
    latest = cur.fetchone()
    if latest:
        for k in ["bust","waist","hips","height","weight"]:
            if latest.get(k): latest[k] = float(latest[k])
    user["latest_measurement"] = latest
    return user

@app.post("/auth/forgot-password", tags=["Auth"])
def forgot_password(body: PasswordResetRequest, db=Depends(get_db)):
    cur = db.cursor(dictionary=True)
    cur.execute("SELECT id FROM users WHERE email = %s", (body.email,))
    user = cur.fetchone()
    if not user:
        # Don't reveal if email exists
        return {"message": "If that email exists, a reset link has been sent."}
    token = secrets.token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(hours=1)
    cur.execute(
        "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (%s, %s, %s)",
        (user["id"], token, expires)
    )
    db.commit()
    # In production: send email with token
    return {"message": "Reset token generated.", "token": token}  # Remove token from prod

@app.post("/auth/reset-password", tags=["Auth"])
def reset_password(body: PasswordResetConfirm, db=Depends(get_db)):
    cur = db.cursor(dictionary=True)
    cur.execute(
        "SELECT * FROM password_reset_tokens WHERE token = %s AND used = 0 AND expires_at > NOW()",
        (body.token,)
    )
    row = cur.fetchone()
    if not row:
        raise HTTPException(400, "Invalid or expired reset token.")
    pw_hash = bcrypt.hashpw(body.new_password.encode(), bcrypt.gensalt()).decode()
    cur.execute("UPDATE users SET password_hash = %s WHERE id = %s", (pw_hash, row["user_id"]))
    cur.execute("UPDATE password_reset_tokens SET used = 1 WHERE id = %s", (row["id"],))
    db.commit()
    return {"message": "Password reset successfully. Please login."}

# ═══════════════════════════════════════════════════════════
#  MEASUREMENTS ROUTES
# ═══════════════════════════════════════════════════════════
@app.post("/measurements", tags=["Measurements"], summary="Save body measurements")
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
    measurement_id = cur.lastrowid
    return {
        "id": measurement_id,
        "message": "Measurements saved successfully.",
        "data": body.dict()
    }

@app.get("/measurements", tags=["Measurements"], summary="Get measurement history")
def get_measurements(limit: int = 10, payload=Depends(verify_token), db=Depends(get_db)):
    cur = db.cursor(dictionary=True)
    cur.execute(
        "SELECT * FROM measurements WHERE user_id = %s ORDER BY created_at DESC LIMIT %s",
        (payload["sub"], limit)
    )
    rows = cur.fetchall()
    for r in rows:
        for k in ["bust","waist","hips","height","weight"]:
            if r.get(k) is not None: r[k] = float(r[k])
    return {"measurements": rows, "count": len(rows)}

@app.get("/measurements/{mid}", tags=["Measurements"])
def get_measurement(mid: int, payload=Depends(verify_token), db=Depends(get_db)):
    cur = db.cursor(dictionary=True)
    cur.execute(
        "SELECT * FROM measurements WHERE id = %s AND user_id = %s",
        (mid, payload["sub"])
    )
    row = cur.fetchone()
    if not row:
        raise HTTPException(404, "Measurement not found.")
    for k in ["bust","waist","hips","height","weight"]:
        if row.get(k) is not None: row[k] = float(row[k])
    return row

# ═══════════════════════════════════════════════════════════
#  SIZE RECOMMENDATION ENGINE
# ═══════════════════════════════════════════════════════════
@app.get("/recommend", tags=["Recommendations"], summary="Get size recommendations for all brands")
def recommend(
    bust: float, waist: float, hips: float,
    category: str = "tops",
    payload=Depends(verify_token),
    db=Depends(get_db)
):
    if bust <= 0 or waist <= 0 or hips <= 0:
        raise HTTPException(400, "Bust, waist, and hips must be positive values.")

    cur = db.cursor(dictionary=True)

    # Get all active brands
    cur.execute("SELECT id, name, logo, site_url FROM brands")
    brands = cur.fetchall()

    # Get category
    cur.execute("SELECT id, slug, label FROM categories WHERE slug = %s", (category,))
    cat = cur.fetchone()
    if not cat:
        raise HTTPException(404, f"Category '{category}' not found.")

    results = []
    for brand in brands:
        # Get size chart
        cur.execute(
            """SELECT size_label, bust_min, bust_max, waist_min, waist_max, hips_min, hips_max
               FROM size_charts WHERE brand_id = %s ORDER BY sort_order""",
            (brand["id"],)
        )
        charts = cur.fetchall()
        if not charts:
            continue

        # Convert decimals
        for c in charts:
            for k in ["bust_min","bust_max","waist_min","waist_max","hips_min","hips_max"]:
                c[k] = float(c[k])

        result = match_size(bust, waist, hips, charts)

        # Get shop URL for this category
        cur.execute(
            """SELECT bcl.shop_url FROM brand_category_links bcl
               WHERE bcl.brand_id = %s AND bcl.category_id = %s""",
            (brand["id"], cat["id"])
        )
        link = cur.fetchone()
        shop_url = link["shop_url"] if link else brand["site_url"]

        results.append({
            "brand":      brand["name"],
            "logo":       brand["logo"],
            "size":       result["size"],
            "confidence": result["confidence"],
            "shop_url":   shop_url,
            "category":   cat["slug"],
            "category_label": cat["label"],
        })

    return {
        "recommendations": results,
        "measurements": {"bust": bust, "waist": waist, "hips": hips},
        "category": category,
        "total_brands": len(results),
    }

@app.get("/recommend/all-categories", tags=["Recommendations"])
def recommend_all(
    bust: float, waist: float, hips: float,
    payload=Depends(verify_token), db=Depends(get_db)
):
    """Get recommendations for ALL 8 categories at once."""
    cur = db.cursor(dictionary=True)
    cur.execute("SELECT slug FROM categories ORDER BY sort_order")
    categories = [r["slug"] for r in cur.fetchall()]

    all_results = {}
    for cat in categories:
        cur.execute("SELECT id FROM categories WHERE slug = %s", (cat,))
        cat_row = cur.fetchone()
        cur.execute("SELECT id, name, logo, site_url FROM brands")
        brands = cur.fetchall()
        brand_results = []
        for brand in brands:
            cur.execute(
                "SELECT size_label,bust_min,bust_max,waist_min,waist_max,hips_min,hips_max FROM size_charts WHERE brand_id=%s ORDER BY sort_order",
                (brand["id"],)
            )
            charts = cur.fetchall()
            for c in charts:
                for k in ["bust_min","bust_max","waist_min","waist_max","hips_min","hips_max"]:
                    c[k] = float(c[k])
            if charts:
                r = match_size(bust, waist, hips, charts)
                cur.execute("SELECT shop_url FROM brand_category_links WHERE brand_id=%s AND category_id=%s",(brand["id"],cat_row["id"]))
                link = cur.fetchone()
                brand_results.append({
                    "brand": brand["name"], "logo": brand["logo"],
                    "size": r["size"], "confidence": r["confidence"],
                    "shop_url": link["shop_url"] if link else brand["site_url"],
                })
        all_results[cat] = brand_results

    return {"all_categories": all_results, "measurements": {"bust":bust,"waist":waist,"hips":hips}}

# Save recommendations to DB
@app.post("/recommend/save", tags=["Recommendations"])
def save_recommendations(
    bust: float, waist: float, hips: float,
    measurement_id: int, category: str = "tops",
    payload=Depends(verify_token), db=Depends(get_db)
):
    cur = db.cursor(dictionary=True)
    cur.execute("SELECT id FROM categories WHERE slug = %s", (category,))
    cat = cur.fetchone()
    if not cat: raise HTTPException(404, "Category not found.")

    cur.execute("SELECT id, name FROM brands")
    brands = cur.fetchall()
    saved = 0
    for brand in brands:
        cur.execute("SELECT size_label,bust_min,bust_max,waist_min,waist_max,hips_min,hips_max FROM size_charts WHERE brand_id=%s ORDER BY sort_order",(brand["id"],))
        charts = cur.fetchall()
        for c in charts:
            for k in ["bust_min","bust_max","waist_min","waist_max","hips_min","hips_max"]: c[k]=float(c[k])
        if not charts: continue
        r = match_size(bust, waist, hips, charts)
        cur.execute("SELECT shop_url FROM brand_category_links bcl WHERE bcl.brand_id=%s AND bcl.category_id=%s",(brand["id"],cat["id"]))
        link = cur.fetchone()
        cur.execute(
            "INSERT INTO recommendations (user_id,measurement_id,brand_id,category_id,recommended_size,confidence_pct,shop_url) VALUES (%s,%s,%s,%s,%s,%s,%s)",
            (payload["sub"],measurement_id,brand["id"],cat["id"],r["size"],r["confidence"],link["shop_url"] if link else None)
        )
        saved += 1
    db.commit()
    return {"saved": saved, "message": f"Saved {saved} recommendations to database."}

# ═══════════════════════════════════════════════════════════
#  BRANDS & CATEGORIES
# ═══════════════════════════════════════════════════════════
@app.get("/brands", tags=["Brands"], summary="Get all supported brands")
def get_brands(db=Depends(get_db)):
    cur = db.cursor(dictionary=True)
    cur.execute("SELECT id, name, logo, country, site_url FROM brands ORDER BY name")
    return {"brands": cur.fetchall()}

@app.get("/brands/{brand_name}/sizes", tags=["Brands"])
def get_brand_sizes(brand_name: str, db=Depends(get_db)):
    cur = db.cursor(dictionary=True)
    cur.execute("SELECT id FROM brands WHERE name = %s", (brand_name,))
    brand = cur.fetchone()
    if not brand: raise HTTPException(404, f"Brand '{brand_name}' not found.")
    cur.execute("SELECT size_label,bust_min,bust_max,waist_min,waist_max,hips_min,hips_max FROM size_charts WHERE brand_id=%s ORDER BY sort_order",(brand["id"],))
    rows = cur.fetchall()
    for r in rows:
        for k in ["bust_min","bust_max","waist_min","waist_max","hips_min","hips_max"]: r[k]=float(r[k])
    return {"brand": brand_name, "size_chart": rows}

@app.get("/categories", tags=["Categories"])
def get_categories(db=Depends(get_db)):
    cur = db.cursor(dictionary=True)
    cur.execute("SELECT slug, label, icon FROM categories ORDER BY sort_order")
    return {"categories": cur.fetchall()}

@app.get("/categories/{slug}/links", tags=["Categories"])
def get_category_links(slug: str, db=Depends(get_db)):
    cur = db.cursor(dictionary=True)
    cur.execute("""
        SELECT b.name brand, b.logo, bcl.shop_url
        FROM brand_category_links bcl
        JOIN brands b ON b.id = bcl.brand_id
        JOIN categories c ON c.id = bcl.category_id
        WHERE c.slug = %s
    """, (slug,))
    return {"category": slug, "links": cur.fetchall()}

# ═══════════════════════════════════════════════════════════
#  FEEDBACK
# ═══════════════════════════════════════════════════════════
@app.post("/feedback", tags=["Feedback"])
def submit_feedback(body: FeedbackCreate, payload=Depends(verify_token), db=Depends(get_db)):
    cur = db.cursor(dictionary=True)
    cur.execute("SELECT id FROM brands WHERE name = %s", (body.brand_name,))
    brand = cur.fetchone()
    cur.execute("SELECT id FROM categories WHERE slug = %s", (body.category_slug,))
    cat = cur.fetchone()
    cur.execute(
        """INSERT INTO feedback (user_id,brand_id,category_id,recommended_size,actual_fit,notes,rating)
           VALUES (%s,%s,%s,%s,%s,%s,%s)""",
        (payload["sub"], brand["id"] if brand else None, cat["id"] if cat else None,
         body.recommended_size, body.actual_fit, body.notes, body.rating)
    )
    db.commit()
    return {"message": "Thank you! Your feedback helps improve recommendations."}

@app.get("/feedback/my", tags=["Feedback"])
def my_feedback(payload=Depends(verify_token), db=Depends(get_db)):
    cur = db.cursor(dictionary=True)
    cur.execute("""
        SELECT f.id, b.name brand, c.label category, f.recommended_size,
               f.actual_fit, f.rating, f.notes, f.created_at
        FROM feedback f
        LEFT JOIN brands b ON b.id = f.brand_id
        LEFT JOIN categories c ON c.id = f.category_id
        WHERE f.user_id = %s ORDER BY f.created_at DESC
    """, (payload["sub"],))
    return {"feedback": cur.fetchall()}

# ═══════════════════════════════════════════════════════════
#  USER HISTORY
# ═══════════════════════════════════════════════════════════
@app.get("/history", tags=["History"])
def get_history(payload=Depends(verify_token), db=Depends(get_db)):
    cur = db.cursor(dictionary=True)
    cur.execute("""
        SELECT r.id, b.name brand, b.logo, c.label category, c.slug,
               r.recommended_size, r.confidence_pct, r.shop_url, r.created_at
        FROM recommendations r
        JOIN brands b ON b.id = r.brand_id
        JOIN categories c ON c.id = r.category_id
        WHERE r.user_id = %s ORDER BY r.created_at DESC LIMIT 50
    """, (payload["sub"],))
    rows = cur.fetchall()
    return {"history": rows, "count": len(rows)}

# ═══════════════════════════════════════════════════════════
#  HEALTH CHECK
# ═══════════════════════════════════════════════════════════
@app.get("/", tags=["Health"])
def root():
    return {"app": "Weav AI", "version": "1.0.0", "status": "running", "docs": "/docs"}

@app.get("/health", tags=["Health"])
def health(db=Depends(get_db)):
    try:
        cur = db.cursor()
        cur.execute("SELECT 1")
        return {"status": "healthy", "database": "connected", "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        return JSONResponse(status_code=503, content={"status": "unhealthy", "error": str(e)})

# Error handlers
@app.exception_handler(404)
async def not_found(request: Request, exc):
    return JSONResponse(status_code=404, content={"detail": "Route not found."})

@app.exception_handler(500)
async def server_error(request: Request, exc):
    return JSONResponse(status_code=500, content={"detail": "Internal server error."})
