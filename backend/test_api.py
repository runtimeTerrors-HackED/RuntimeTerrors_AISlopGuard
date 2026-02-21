import requests
import pprint

paramas = {
  "url": "https://www.youtube.com/watch?v=OlNv7OY9thM",
  "userFingerprint": "anon_123",
  "conservativeMode": True
}

r = requests.post("http://localhost:8000/api/scan", json=paramas)
pprint.pprint(r.json())