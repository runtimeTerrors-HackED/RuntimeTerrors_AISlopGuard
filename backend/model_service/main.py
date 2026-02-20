from fastapi import FastAPI
from pydantic import BaseModel, HttpUrl

from model_service.inference import infer_image_url, infer_video_url

app = FastAPI(title="AI Content Guardian Model Service", version="1.0.0")


class ImageRequest(BaseModel):
    imageUrl: HttpUrl


class VideoRequest(BaseModel):
    videoUrl: HttpUrl


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/infer-image")
def infer_image(payload: ImageRequest):
    return infer_image_url(str(payload.imageUrl))


@app.post("/infer-video")
def infer_video(payload: VideoRequest):
    return infer_video_url(str(payload.videoUrl))
