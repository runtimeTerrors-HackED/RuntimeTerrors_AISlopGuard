# Backend Service

FastAPI backend for scan orchestration and community actions.

## Run

macOS/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

Windows (PowerShell):

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn main:app --reload --port 8000
```

Health check:

```bash
curl http://localhost:8000/api/health
```

Windows (PowerShell) alternative:

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/health" -Method Get
```

## Endpoints

- `GET /api/health`
- `POST /api/scan`
- `POST /api/vote`
- `POST /api/list`
- `GET /api/history?userFingerprint=...`

## Notes

- Storage is in-memory (`app/db/memory_store.py`).
- Model score is pulled from `MODEL_SERVICE_URL`.
- Conservative mode is passed by mobile and affects verdict thresholds.
