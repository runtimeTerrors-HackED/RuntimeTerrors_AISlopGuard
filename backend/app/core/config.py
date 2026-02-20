from pydantic import BaseModel
from dotenv import load_dotenv
import os

load_dotenv()


class Settings(BaseModel):
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))
    youtube_api_key: str = os.getenv("YOUTUBE_API_KEY", "")
    model_service_url: str = os.getenv("MODEL_SERVICE_URL", "http://localhost:8010")
    model_timeout_seconds: int = int(os.getenv("MODEL_TIMEOUT_SECONDS", "8"))


settings = Settings()
