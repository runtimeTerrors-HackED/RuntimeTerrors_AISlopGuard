# AI Content Guardian (Hackathon MVP)

This repository contains a complete **Share-to-Scan** MVP for AI image/video detection:

- `mobile/` -> React Native (Expo + TypeScript) app
- `backend/` -> FastAPI backend for scan scoring, history, votes, and allow/block lists
- `docs/` -> beginner-friendly implementation and handoff documentation

## What This MVP Does

1. User pastes a YouTube/Instagram/TikTok/image/video link in the mobile app.
2. App calls backend `POST /api/scan`.
3. Backend combines:
   - platform signal (for YouTube: synthetic disclosure when available),
   - community signal (crowd votes),
   - model signal (from model service fallback).
4. App shows verdict, confidence, and exact reasons.
5. User can:
   - allow/block creator,
   - vote AI / not-AI / unsure,
   - view personal scan history.

## Current Scope (Important)

Implemented now:

- Expo React Native mobile app,
- backend scoring orchestration,
- model service with ONNX integration and fallback,
- in-memory votes/lists/history,
- conservative mode threshold control.

Not implemented yet:

- passive cross-app background scanning,
- store-ready Android overlay pipeline,
- production database and authentication.

## Quick Start

### 1) Run backend

macOS/Linux:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Windows (PowerShell):

```powershell
cd backend
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2) Run model service (optional but recommended)

macOS/Linux:

```bash
cd backend
source .venv/bin/activate
uvicorn model_service.main:app --reload --host 0.0.0.0 --port 8010
```

Windows (PowerShell):

```powershell
cd backend
.venv\Scripts\Activate.ps1
uvicorn model_service.main:app --reload --host 0.0.0.0 --port 8010
```

If model service is down, backend still works with a neutral fallback score.

### 3) Run mobile app

```bash
cd mobile
npm install
npm run start
```

Set API URL for physical device:

macOS/Linux:

```bash
EXPO_PUBLIC_API_URL=http://<your-laptop-ip>:8000 npm run start
```

Windows (PowerShell):

```powershell
$env:EXPO_PUBLIC_API_URL="http://<your-laptop-ip>:8000"
npm run start
```

## Important Notes

- Current backend storage is in-memory (demo-friendly). Restarting backend clears history/votes/lists.
- For production, replace in-memory storage with Postgres/Supabase.
- Model service currently supports ONNX inference if `backend/model_service/artifacts/model.onnx` exists.
- For physical device testing, set `EXPO_PUBLIC_API_URL` to your laptop LAN IP.
- Keep model artifacts (`model.onnx`) out of normal git commits unless intentionally versioning with Git LFS or release assets.

## Documentation

- `docs/00_START_HERE.md`
- `docs/01_MOBILE_BEGINNER_GUIDE.md`
- `docs/02_BACKEND_MODEL_GUIDE.md`
- `docs/03_API_REFERENCE.md`
- `docs/04_HACKATHON_DEMO_SCRIPT.md`
- `docs/05_MODEL_TRAINING_GUIDE.md`
- `docs/06_EXPO_VS_BARE.md`
- `docs/07_FEATURE_STATUS.md`
- `docs/08_KAGGLE_TRAINING_CELLS.md`
- `docs/09_REACT_NATIVE_EXPO_BASICS.md`
- `docs/10_BEGINNER_MASTER_TASK_LIST.md`
