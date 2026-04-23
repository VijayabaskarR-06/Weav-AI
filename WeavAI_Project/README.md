# Weav AI - Your Personal Tailor

Women's clothing size recommendation app with a browser demo, FastAPI backend, MySQL database, phpMyAdmin DB viewer, and React Native/Expo frontend.

## What Runs Where

```text
Browser demo:   ../WeavAI_FINAL_FIXED.html
Backend API:    http://localhost:8000
API docs:       http://localhost:8000/docs
MySQL DB:       localhost:3306
phpMyAdmin:     http://localhost:8080
React Native:   WeavAI_Project/frontend
```

## Current Local Credentials

```text
Database: weavai
MySQL user: weavai_user
MySQL password: weavai_pass_2024
MySQL root password: weavai_root_2024
```

## Recommended Run - Browser Demo + Backend + SQL

Run these from the project root:

```bash
cd /Users/vijayabaskar/Downloads/weavaifinaledition
```

Start Docker Desktop first, then start MySQL:

```bash
docker start weavai_mysql
```

Start phpMyAdmin if you want a database GUI:

```bash
docker start weavai_phpmyadmin
```

If `weavai_phpmyadmin` does not exist yet, create it:

```bash
docker run -d --name weavai_phpmyadmin \
  --network weavai_project_default \
  -e PMA_HOST=weavai_mysql \
  -e PMA_USER=weavai_user \
  -e PMA_PASSWORD=weavai_pass_2024 \
  -p 8080:80 \
  phpmyadmin/phpmyadmin
```

Start the FastAPI backend:

```bash
cd WeavAI_Project/backend
.venv/bin/uvicorn main:app --port 8000
```

Open the browser demo:

```text
http://127.0.0.1:5500/WeavAI_FINAL_FIXED.html
```

The browser demo now connects to:

```text
http://localhost:8000
```

It uses backend/MySQL for signup, login, measurement saving, feedback, recommendations, and price prediction. It also has localStorage fallback if the backend is offline.

## First-Time Setup

If `.venv` does not exist:

```bash
cd WeavAI_Project/backend
/opt/homebrew/bin/python3.11 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

Why Python 3.11? The pinned FastAPI/Pydantic versions work cleanly with Python 3.11. Python 3.14 may fail while building `pydantic-core`.

If MySQL container does not exist:

```bash
cd WeavAI_Project
docker compose up -d db
```

If the database is empty, import the schema:

```bash
docker exec -i weavai_mysql mysql -uweavai_user -pweavai_pass_2024 weavai < backend/schema.sql
```

## Check That Everything Works

Backend health:

```bash
curl http://127.0.0.1:8000/
```

Expected:

```json
{"app":"Weav AI","version":"1.0.0","status":"running"}
```

Check brands from SQL:

```bash
curl http://127.0.0.1:8000/brands
```

Check price predictor:

```bash
curl -X POST http://127.0.0.1:8000/price/predict \
  -H "Content-Type: application/json" \
  -d '{"category":"tops","sizes":{"Nike":"M","H&M":"M","Zara":"M"},"salt":1}'
```

Check MySQL tables:

```bash
docker exec -it weavai_mysql mysql -uweavai_user -pweavai_pass_2024 weavai
```

Inside MySQL:

```sql
SHOW TABLES;
SELECT * FROM users;
SELECT * FROM measurements;
SELECT * FROM feedback;
```

## View Database in Browser

Open:

```text
http://127.0.0.1:8080
```

Login:

```text
Server: weavai_mysql
Username: weavai_user
Password: weavai_pass_2024
```

Then select the `weavai` database and inspect:

```text
users
measurements
brands
size_charts
feedback
```

To prove SQL is working:

1. Open `WeavAI_FINAL_FIXED.html`.
2. Create a new account with a unique email.
3. Complete measurements.
4. Open phpMyAdmin.
5. Check `weavai.users` and `weavai.measurements`.

## Backend API Routes

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/` | Health check |
| `POST` | `/auth/signup` | Create account, save user to MySQL, return JWT |
| `POST` | `/auth/login` | Login, verify bcrypt password, return JWT |
| `GET` | `/auth/me` | Get current user from JWT |
| `POST` | `/measurements` | Save measurements to MySQL |
| `GET` | `/measurements` | Get latest measurements |
| `GET` | `/recommend` | Recommend sizes for all brands |
| `GET` | `/brands` | List brands from MySQL |
| `POST` | `/feedback` | Save fit feedback to MySQL |
| `POST` | `/price/predict` | Backend price predictor |

Protected routes require:

```text
Authorization: Bearer <JWT_TOKEN>
```

The browser demo handles this automatically after signup/login.

## React Native / Expo Frontend

The mobile frontend lives in:

```bash
cd WeavAI_Project/frontend
```

Install dependencies:

```bash
npm install
```

Set API base URL in `app.json` or `src/services/api.js`.

For simulator/web on the same machine:

```text
http://localhost:8000
```

For a real phone using Expo Go, use your computer LAN IP:

```text
http://192.168.x.x:8000
```

Start Expo:

```bash
npx expo start
```

Then:

```text
w = web
i = iOS simulator
a = Android emulator
Scan QR = Expo Go on phone
```

## Docker Compose Option

You can also run services through compose:

```bash
cd WeavAI_Project
docker compose up -d db
docker compose up -d phpmyadmin
```

For the backend, the currently verified path is local Python:

```bash
cd WeavAI_Project/backend
.venv/bin/uvicorn main:app --port 8000
```

This avoids rebuilding the older Docker API image while developing.

## Troubleshooting

If port `8000` is already used:

```bash
lsof -i :8000
```

Stop the old process if needed:

```bash
kill -9 <PID>
```

If port `3306` is already used:

```bash
docker ps
```

Make sure `weavai_mysql` is the MySQL container using it.

If the browser says backend DB unavailable:

1. Check backend is running: `curl http://127.0.0.1:8000/`
2. Refresh the browser page.
3. Sign out and sign in again to get a backend JWT token.

If phpMyAdmin does not open:

```bash
docker ps
docker start weavai_phpmyadmin
```

Then open:

```text
http://127.0.0.1:8080
```

## Tech Stack

| Layer | Technology |
| --- | --- |
| Browser demo | HTML, CSS, JavaScript |
| Backend | Python, FastAPI |
| Database | MySQL 8 |
| Auth | JWT, bcrypt |
| DB GUI | phpMyAdmin |
| Mobile app | React Native, Expo |
| HTTP client | Axios/fetch |
| Containers | Docker |

## Project Team

- Vijayabaskar R - Backend, FastAPI, MySQL, JWT auth, recommendation logic
- Ananya Kaushal - Frontend, React Native, UI design, Expo setup
