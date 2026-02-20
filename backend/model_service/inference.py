from __future__ import annotations

from pathlib import Path
from typing import Any
import math
import tempfile

import cv2
import numpy as np
import onnxruntime as ort
import requests
from PIL import Image
from io import BytesIO


MODEL_PATH = Path(__file__).parent / "artifacts" / "model.onnx"
_SESSION: ort.InferenceSession | None = None


def _confidence_band(score: float) -> str:
    if score >= 0.80:
        return "high"
    if score >= 0.55:
        return "medium"
    return "low"


def _heuristic_score_from_url(url: str) -> float:
    lowered = url.lower()
    keywords = ["ai", "midjourney", "stable-diffusion", "generated", "synth"]
    matches = sum(1 for keyword in keywords if keyword in lowered)
    if matches == 0:
        return 0.45
    return min(0.95, 0.55 + (0.1 * matches))


def _load_session() -> ort.InferenceSession | None:
    global _SESSION
    if _SESSION is not None:
        return _SESSION
    if not MODEL_PATH.exists():
        return None
    _SESSION = ort.InferenceSession(str(MODEL_PATH))
    return _SESSION


def _preprocess_image(raw_bytes: bytes) -> np.ndarray:
    image = Image.open(BytesIO(raw_bytes)).convert("RGB").resize((224, 224))
    return _preprocess_image_array(np.asarray(image))


def _preprocess_image_array(image_rgb: np.ndarray) -> np.ndarray:
    if image_rgb.ndim != 3:
        raise ValueError("Expected HWC image array.")
    arr = np.asarray(image_rgb).astype(np.float32) / 255.0
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    arr = (arr - mean) / std
    arr = np.transpose(arr, (2, 0, 1))
    arr = np.expand_dims(arr, axis=0)
    return arr


def _run_onnx_model(raw_bytes: bytes) -> float | None:
    session = _load_session()
    if session is None:
        return None
    try:
        tensor = _preprocess_image(raw_bytes)
        input_name = session.get_inputs()[0].name
        output = session.run(None, {input_name: tensor})[0]
        logits = float(np.ravel(output)[0])
        return 1.0 / (1.0 + math.exp(-logits))
    except Exception:
        return None


def _run_onnx_model_from_rgb(image_rgb: np.ndarray) -> float | None:
    session = _load_session()
    if session is None:
        return None
    try:
        resized = cv2.resize(image_rgb, (224, 224), interpolation=cv2.INTER_AREA)
        tensor = _preprocess_image_array(resized)
        input_name = session.get_inputs()[0].name
        output = session.run(None, {input_name: tensor})[0]
        logits = float(np.ravel(output)[0])
        return 1.0 / (1.0 + math.exp(-logits))
    except Exception:
        return None


def _extract_video_frame_scores(video_path: str, max_frames: int = 10) -> list[float]:
    capture = cv2.VideoCapture(video_path)
    if not capture.isOpened():
        return []

    frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
    if frame_count <= 0:
        capture.release()
        return []

    frame_indexes = np.linspace(0, frame_count - 1, num=min(max_frames, frame_count), dtype=int)
    scores: list[float] = []
    for index in frame_indexes:
        capture.set(cv2.CAP_PROP_POS_FRAMES, int(index))
        ok, frame_bgr = capture.read()
        if not ok or frame_bgr is None:
            continue
        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        score = _run_onnx_model_from_rgb(frame_rgb)
        if score is not None:
            scores.append(float(max(0.0, min(1.0, score))))

    capture.release()
    return scores


def _download_video_to_temp_file(url: str, max_bytes: int = 40 * 1024 * 1024) -> str | None:
    try:
        with requests.get(url, stream=True, timeout=12) as response:
            response.raise_for_status()
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_file:
                temp_path = temp_file.name
                downloaded = 0
                for chunk in response.iter_content(chunk_size=8192):
                    if not chunk:
                        continue
                    downloaded += len(chunk)
                    if downloaded > max_bytes:
                        Path(temp_path).unlink(missing_ok=True)
                        return None
                    temp_file.write(chunk)
                return temp_path
    except Exception:
        return None


def infer_image_url(url: str) -> dict[str, Any]:
    try:
        response = requests.get(url, timeout=6)
        response.raise_for_status()
        model_score = _run_onnx_model(response.content)
    except Exception:
        model_score = None

    if model_score is None:
        model_score = _heuristic_score_from_url(url)
        reason = "Used URL fallback heuristic because ONNX inference is unavailable."
    else:
        reason = "Used ONNX image model inference."

    return {
        "score": float(max(0.0, min(1.0, model_score))),
        "confidenceBand": _confidence_band(model_score),
        "reason": reason,
    }


def infer_video_url(url: str) -> dict[str, Any]:
    if _load_session() is None:
        score = _heuristic_score_from_url(url)
        return {
            "score": score,
            "confidenceBand": _confidence_band(score),
            "reason": "ONNX model not found; used URL heuristic fallback.",
        }

    video_path = _download_video_to_temp_file(url)
    if video_path is None:
        score = _heuristic_score_from_url(url)
        return {
            "score": score,
            "confidenceBand": _confidence_band(score),
            "reason": "Video download failed or exceeded size cap; used URL heuristic fallback.",
        }

    frame_scores = _extract_video_frame_scores(video_path)
    Path(video_path).unlink(missing_ok=True)

    if not frame_scores:
        score = _heuristic_score_from_url(url)
        return {
            "score": score,
            "confidenceBand": _confidence_band(score),
            "reason": "Could not extract model-usable frames; used URL heuristic fallback.",
        }

    sorted_scores = sorted(frame_scores, reverse=True)
    top_k = sorted_scores[: min(5, len(sorted_scores))]
    score = float(np.mean(top_k))
    return {
        "score": score,
        "confidenceBand": _confidence_band(score),
        "reason": f"ONNX frame sampling used ({len(frame_scores)} frames analyzed).",
    }
