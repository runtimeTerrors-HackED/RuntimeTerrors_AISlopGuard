# Backend + Model Guide (Detailed)

This file explains exactly how backend decisions are made.

## High-Level Request Flow

When mobile calls `POST /api/scan`, backend does this:

1. Parse URL (`app/services/url_parser.py`).
2. Build canonical IDs (`platform`, `canonical_id`, `creator_id`, `content_id`).
3. Check user creator override list:
   - allow -> immediate `likely_human`
   - block -> immediate `likely_ai`
4. If no override, compute signals:
   - platform signal,
   - community signal,
   - model signal.
5. Combine weighted scores.
6. Apply conservative-mode thresholds.
7. Save result into history.
8. Return full response with evidence.

## File Responsibilities

### `backend/main.py`

- creates FastAPI app,
- adds CORS middleware,
- mounts API router.

### `app/api/routes.py`

All public endpoints:

- `POST /api/scan`
- `POST /api/vote`
- `POST /api/list`
- `GET /api/history`

### `app/services/scan_orchestrator.py`

Core business logic:

- signal collection,
- weighting,
- verdict,
- evidence list.

### `app/services/scoring.py`

Contains:

- score formula,
- verdict thresholds.

Conservative-mode behavior:

- conservative `ON`:
  - `likely_ai >= 0.85`
  - `unclear >= 0.60`
- conservative `OFF`:
  - `likely_ai >= 0.80`
  - `unclear >= 0.55`

### `app/db/memory_store.py`

In-memory demo storage for:

- user lists,
- votes,
- history.

Important:

- data is lost on backend restart.

## Signal Definitions

### Platform signal

File: `app/services/platform_signals.py`

For YouTube:

- calls YouTube Data API,
- checks `status.containsSyntheticMedia`.

For non-YouTube:

- returns neutral score (`0.5`) with explanation.

### Community signal

File: `app/services/community.py`

- aggregates weighted votes:
  - `ai`
  - `not_ai`
  - `unsure`
- computes normalized score.

### Model signal

File: `app/services/model_client.py`

- calls model service endpoint:
  - image URL -> `/infer-image`
  - otherwise -> `/infer-video`
- if model service fails, returns neutral fallback score.

## Final Score Formula

```text
final_score = 0.50 * platform_score + 0.30 * community_score + 0.20 * model_score
```

Why this weighting:

- platform signals are highest trust when available,
- community helps fast adaptation,
- model is helpful but not treated as sole truth.

## Model Service Details

Model service is in `backend/model_service/`.

Endpoints:

- `POST /infer-image`
- `POST /infer-video`

Behavior:

- image:
  - tries ONNX model inference,
  - falls back to heuristic if ONNX/model input fails.
- video:
  - tries download + frame sampling + ONNX scoring,
  - falls back to heuristic if unavailable or blocked.

## Connect Trained Model

1. Train and export ONNX model.
2. Copy to `backend/model_service/artifacts/model.onnx`.
3. Restart model service.
4. Run scan and verify result evidence says ONNX inference path was used.

## Production Upgrades (Post-Hackathon)

1. Replace memory store with Postgres/Supabase.
2. Add vote abuse controls (rate limits + trust reputation).
3. Cache expensive model responses by content ID.
4. Add async queue for heavy video processing.
5. Add structured logging and monitoring.
