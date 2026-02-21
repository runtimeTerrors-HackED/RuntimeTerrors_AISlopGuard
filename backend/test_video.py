import requests
import pprint

paramas = {
  "userFingerprint": "anon_1771620259216_zrdsdsd2",
}

r = requests.get("http://localhost:8000/api/list", json=paramas)
pprint.pprint(r.json())