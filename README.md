# 🪡 Weav AI — Complete Full-Stack Setup Guide
**Your Personal Tailor | React Native + FastAPI + MySQL**
**Students: Vijayabaskar R & Ananya Kaushal**

---

## 📁 PROJECT STRUCTURE

```
weavai/
├── backend/
│   ├── main.py              ← FastAPI (all 15 API routes)
│   ├── schema.sql           ← MySQL (8 tables + 48 shop links + size charts)
│   ├── requirements.txt     ← Python packages
│   ├── Dockerfile           ← Docker container
│   └── .env                 ← Your config (fill this in)
│
├── frontend/
│   ├── App.js               ← React Native root
│   ├── package.json
│   └── src/
│       ├── screens/
│       │   ├── AuthScreen.js    ← Login / Signup (real JWT auth)
│       │   ├── HomeScreen.js    ← Dashboard + DB history
│       │   ├── MeasureScreen.js ← 3-step wizard → saves to MySQL
│       │   └── ResultsScreen.js ← Sizes + categories + feedback
│       ├── services/api.js      ← Axios (all 15 API calls)
│       ├── context/AuthContext.js ← JWT + AsyncStorage session
│       ├── navigation/AppNavigator.js
│       └── theme.js             ← Colors, spacing
│
├── docker-compose.yml       ← Run everything with one command
└── README.md                ← This file
```

---

## 🗄️ WHAT GETS STORED IN THE DATABASE

| Table | What's saved |
|-------|-------------|
| `users` | Name, email, hashed password (bcrypt), created_at |
| `measurements` | Bust, waist, hips, height, weight, age, body_type (cm) |
| `recommendations` | Brand, size, confidence %, shop URL per session |
| `feedback` | Fit rating, notes, rating (1-5 stars) |
| `brands` | 6 brands with logos and URLs |
| `categories` | 8 categories (tops → footwear) |
| `size_charts` | 36 size chart rows (6 brands × 6 sizes each) |
| `brand_category_links` | 48 shop URLs (6 brands × 8 categories) |

---

## 🚀 OPTION 1: Run with Docker (Easiest — 1 command)

### Prerequisites
- Install Docker Desktop: https://docker.com/get-started

### Run everything:
```bash
cd weavai
docker-compose up --build
```

**That's it! Everything starts automatically:**
- MySQL on port 3306 (auto-creates database + seeds data)
- FastAPI on http://localhost:8000
- phpMyAdmin on http://localhost:8080 (view your database visually)

**View the API docs:** http://localhost:8000/docs

---

## 🚀 OPTION 2: Run Manually (Step by step)

### STEP 1 — Install MySQL

**Windows:** https://dev.mysql.com/downloads/installer/
**Mac:**
```bash
brew install mysql
brew services start mysql
mysql_secure_installation
```
**Linux:**
```bash
sudo apt install mysql-server -y
sudo systemctl start mysql
```

### STEP 2 — Create the Database
```bash
mysql -u root -p < weavai/backend/schema.sql
# Enter your MySQL root password when prompted
```

Verify it worked:
```bash
mysql -u root -p weavai -e "SHOW TABLES; SELECT COUNT(*) FROM size_charts;"
```
Expected output: 8 tables, 36 size chart rows ✅

### STEP 3 — Configure Backend
Edit `backend/.env`:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_PASSWORD_HERE
DB_NAME=weavai
JWT_SECRET=weav-ai-any-long-random-string-here
```

### STEP 4 — Run FastAPI Backend
```bash
cd weavai/backend

# Create Python virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install packages
pip install -r requirements.txt

# Start server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Test: Open http://localhost:8000
Expected: `{"app":"Weav AI","version":"1.0.0","status":"running"}`

Full API docs: http://localhost:8000/docs ✅

### STEP 5 — Run React Native App
```bash
# Install Node.js from nodejs.org first

cd weavai/frontend
npm install

# Update your IP in src/services/api.js:
# Android emulator: 'http://10.0.2.2:8000'
# iOS simulator:    'http://localhost:8000'
# Physical phone:   'http://YOUR_COMPUTER_IP:8000'
#   (find IP: ipconfig on Windows, ifconfig on Mac)

npx expo start
```

Then:
- Press `a` → Android emulator
- Press `i` → iOS simulator  
- Scan QR with **Expo Go** app on your phone

---

## 🔑 HOW TO LOGIN

### Test Account (works immediately):
Register via the app with:
```
Name:     Any name (e.g. Ananya Kaushal)
Email:    test@weavai.com
Password: test123
```

Or use the **Postman** approach to pre-create a user:
```
POST http://localhost:8000/auth/signup
Body: {"name":"Ananya","email":"test@weavai.com","password":"test123"}
```

### Google Sign In:
In development this auto-fills with test credentials.
For production Google OAuth, add your Google Client ID to the app.

---

## 📡 ALL API ROUTES

| Method | Route | Auth | What it does |
|--------|-------|------|--------------|
| POST | `/auth/signup` | ❌ | Register new user |
| POST | `/auth/login` | ❌ | Login → returns JWT token |
| GET | `/auth/me` | ✅ | Get user profile + latest measurement |
| POST | `/auth/forgot-password` | ❌ | Request password reset |
| POST | `/auth/reset-password` | ❌ | Confirm password reset |
| POST | `/measurements` | ✅ | Save body measurements to MySQL |
| GET | `/measurements` | ✅ | Get measurement history |
| GET | `/measurements/{id}` | ✅ | Get single measurement |
| GET | `/recommend` | ✅ | Get sizes for all brands (1 category) |
| GET | `/recommend/all-categories` | ✅ | Get sizes for ALL 8 categories |
| POST | `/recommend/save` | ✅ | Save recommendations to MySQL |
| GET | `/brands` | ❌ | List all brands |
| GET | `/brands/{name}/sizes` | ❌ | Get brand-specific size chart |
| GET | `/categories` | ❌ | List all 8 categories |
| GET | `/categories/{slug}/links` | ❌ | Get all shop URLs for category |
| POST | `/feedback` | ✅ | Submit fit rating |
| GET | `/feedback/my` | ✅ | Get user's feedback history |
| GET | `/history` | ✅ | Get saved recommendations |
| GET | `/health` | ❌ | Check if DB is connected |

### Example API calls with Postman:

**1. Login:**
```json
POST /auth/login
{"email":"test@weavai.com","password":"test123"}
→ Copy the "token" from response
```

**2. Add Authorization header:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**3. Save measurements:**
```json
POST /measurements
{"bust":88,"waist":70,"hips":96,"height":165,"weight":60,"age":22,"body_type":"Hourglass","unit":"cm"}
```

**4. Get recommendations:**
```
GET /recommend?bust=88&waist=70&hips=96&category=tops
```

---

## 🗄️ VIEW YOUR DATABASE (phpMyAdmin)

With Docker running, go to: **http://localhost:8080**
- Server: mysql
- Username: root  
- Password: weavai_root_2024

Or via command line:
```bash
mysql -u root -p weavai
SHOW TABLES;
SELECT * FROM users;
SELECT * FROM measurements;
SELECT * FROM recommendations;
SELECT * FROM feedback;
```

---

## 🌐 DEPLOY TO THE INTERNET

### Backend (Railway — free tier):
```bash
cd weavai/backend
# Push to GitHub first
railway login
railway init
railway up
# Add env vars in Railway dashboard
```

### Backend (Render.com):
1. Push to GitHub
2. render.com → New Web Service → connect repo
3. Build: `pip install -r requirements.txt`
4. Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables

### Database (PlanetScale or Railway MySQL):
Free MySQL in cloud — update DB_HOST in .env

### Mobile App (Expo EAS):
```bash
npm install -g eas-cli
eas login
eas build --platform android  # Creates .apk
eas build --platform ios      # Creates .ipa
```

---

## 🔧 TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| `Can't connect to MySQL` | Check `.env` password, run `mysql -u root -p` to verify |
| `Port 8000 in use` | `kill -9 $(lsof -ti:8000)` or use `--port 8001` |
| `401 Unauthorized` | Token expired — login again to get new token |
| `App can't reach API` | Update BASE_URL in `api.js` with correct IP |
| `expo: command not found` | `npm install -g expo-cli` |
| Docker compose fails | Run `docker-compose down -v` then `up --build` again |

---

## ✅ OJT DEMO CHECKLIST

- [ ] Show signup → login flow (JWT stored)
- [ ] Show measurement entry → data saved to MySQL
- [ ] Show size recommendations → 6 brands × 8 categories
- [ ] Show `/docs` Swagger for all 19 API routes
- [ ] Show phpMyAdmin with real user data in tables
- [ ] Show feedback submission → saved to DB
- [ ] Show measurement history on Home screen (loaded from DB)
- [ ] Deploy to Railway/Render for public URL

**Tech Stack (as per PRD):**
✅ React Native | ✅ FastAPI (Python) | ✅ MySQL | ✅ Axios | ✅ JWT Auth | ✅ Brand APIs
