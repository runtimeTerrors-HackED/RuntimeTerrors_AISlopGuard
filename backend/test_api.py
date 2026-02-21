import requests
import pprint

paramas = {
  "url": "https://www.tiktok.com/@longliveai/video/7559491915780001046",
  "userFingerprint": "anon_123",
  "conservativeMode": True
}

r = requests.post("http://localhost:8000/api/scan", json=paramas)
pprint.pprint(r.json())