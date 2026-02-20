# Model Service

This service provides model scores to the backend.

## Run

```bash
cd backend
source .venv/bin/activate
uvicorn model_service.main:app --reload --port 8010
```

## Endpoints

- `GET /health`
- `POST /infer-image` with `{ "imageUrl": "https://..." }`
- `POST /infer-video` with `{ "videoUrl": "https://..." }`

## ONNX model integration

Place your trained model at:

`backend/model_service/artifacts/model.onnx`

Behavior summary:

- if ONNX exists, image requests use ONNX model inference,
- video requests attempt frame sampling + ONNX scoring when direct media download is possible,
- if inference path fails, service returns safe fallback heuristic score so demo still works.

## Training

Use training scripts in:

`backend/model_service/training/`
