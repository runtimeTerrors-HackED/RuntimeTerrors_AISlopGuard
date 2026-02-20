# Start Here (Full Beginner Setup)

This file is the safest way to get the whole project running from zero.

If you are new to React Native and FastAPI, do **exactly** these steps in order.

If your team is brand new to React Native/Expo, read this first:

- `docs/09_REACT_NATIVE_EXPO_BASICS.md`

## What Is Already Built

Current MVP supports:

- paste/share-style link scanning (manual link input),
- confidence-based verdict (`likely_ai`, `unclear`, `likely_human`),
- explainable evidence (platform + community + model + settings),
- creator allow/block overrides,
- community vote submission,
- per-user scan history.

Current MVP does **not** yet support:

- automatic background scanning inside Instagram/YouTube/TikTok apps,
- true cross-app floating wedge in production,
- persistent database (currently in-memory demo storage).

## Folder Map

- `mobile/` -> Expo React Native app (frontend)
- `backend/` -> FastAPI orchestration API
- `backend/model_service/` -> model inference API
- `backend/model_service/training/` -> model training scripts
- `docs/` -> onboarding + architecture + API docs

## Prerequisites (Install Before Running Anything)

Install these first:

- Node.js `18+` (recommended `20 LTS`)
- npm `9+`
- Python `3.10+` (recommended `3.11` or `3.12`)
- Xcode (for iOS simulator) and/or Android Studio (for Android emulator)

Quick version checks:

```bash
node -v
npm -v
python3 --version
```

On Windows, if `python3` is not found, use:

```powershell
py --version
```

## Step 1: Open 3 terminals

Use three terminal tabs/windows:

- Terminal A -> backend API (`:8000`)
- Terminal B -> model service (`:8010`)
- Terminal C -> mobile app (Expo)

## Step 2: Start backend API (Terminal A)

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

Windows (Command Prompt):

```cmd
cd backend
py -m venv .venv
.venv\Scripts\activate.bat
pip install -r requirements.txt
copy .env.example .env
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

What this does:

- creates isolated Python environment,
- installs backend dependencies,
- starts FastAPI API server with auto-reload.

Expected result:

- terminal shows `Uvicorn running on http://0.0.0.0:8000`

Health check from another terminal:

```bash
curl http://localhost:8000/api/health
```

Windows PowerShell alternative:

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/health" -Method Get
```

Expected response:

```json
{"ok":true}
```

## Step 3: Start model service (Terminal B)

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

Windows (Command Prompt):

```cmd
cd backend
.venv\Scripts\activate.bat
uvicorn model_service.main:app --reload --host 0.0.0.0 --port 8010
```

Health check:

```bash
curl http://localhost:8010/health
```

Windows PowerShell alternative:

```powershell
Invoke-RestMethod -Uri "http://localhost:8010/health" -Method Get
```

Expected response:

```json
{"ok":true}
```

## Step 4: Start mobile app (Terminal C)

```bash
cd mobile
npm install
npm run start
```

Choose one target:

- press `i` in Expo terminal for iOS simulator,
- press `a` for Android emulator,
- scan QR with Expo Go for physical phone.

## Step 5: Physical phone networking (important)

If you run app on a real phone, `localhost` will not work.

Use your computer LAN IP.

macOS/Linux:

```bash
EXPO_PUBLIC_API_URL=http://<your-computer-ip>:8000 npm run start
```

Windows (PowerShell):

```powershell
$env:EXPO_PUBLIC_API_URL="http://<your-computer-ip>:8000"
npm run start
```

Windows (Command Prompt):

```cmd
set EXPO_PUBLIC_API_URL=http://<your-computer-ip>:8000 && npm run start
```

Find LAN IP:

- macOS: `ipconfig getifaddr en0` (or `en1`)
- Windows: run `ipconfig` and use your active adapter's IPv4 address

## Step 6: End-to-end functional test

1. Open app home screen.
2. Paste a test URL, for example:
   - YouTube short URL,
   - direct image URL (`.jpg`, `.png`),
   - direct video URL (`.mp4`).
3. Tap `Scan Content`.
4. Confirm result screen shows:
   - verdict,
   - final score,
   - evidence list.
5. Tap `Always Allow This Creator`.
6. Scan same URL again and confirm allowlist override appears.
7. Vote `Mark as AI-generated`.
8. Open `History` and confirm records are visible.

## Common Errors and Fixes

### Error: Python SSL certificate failure on pip install

macOS fix:

```bash
/Applications/Python\ 3.*/Install\ Certificates.command
```

Then retry:

```bash
pip install -r requirements.txt
```

Windows fix (if needed):

```powershell
py -m pip install --upgrade pip certifi
```

### Error: Mobile app cannot connect to backend on real phone

Fix:

- use `EXPO_PUBLIC_API_URL=http://<LAN-IP>:8000`,
- ensure phone and laptop are on same Wi-Fi,
- ensure firewall allows port `8000`.

### Error: Model always shows fallback reason

This means:

- ONNX file is missing or invalid, or
- remote media URL cannot be downloaded.

Check if file exists:

`backend/model_service/artifacts/model.onnx`

## Expo vs Bare Workflow (Simple Decision)

Current project uses Expo for beginner speed.

Use Expo if you need:

- fast onboarding,
- fewer native setup issues,
- hackathon velocity.

Move to bare if you need:

- advanced background services,
- accessibility integrations,
- deep native Android/iOS modules.

To generate native folders later:

```bash
cd mobile
npx expo prebuild
```

## Final Checklist

Before demo, confirm all are true:

- backend health works,
- model service health works,
- mobile can scan and show verdict,
- allow/block and voting flows work,
- history shows previous scans.

## Training the Custom Model

For the full no-skip training flow, read:

- `docs/05_MODEL_TRAINING_GUIDE.md`
- `docs/08_KAGGLE_TRAINING_CELLS.md`

Remember:

- cloning repo gives scripts/code,
- adding dataset in Kaggle sidebar gives training data.
