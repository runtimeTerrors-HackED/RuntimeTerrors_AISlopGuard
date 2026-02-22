# Backend connection checklist

Your app is set to **http://172.28.10.37:8000**. Follow these in order.

---

## 1. Backend must be running

In a terminal:

```bash
cd "/Users/heenz/Desktop/Uni/Winter 2026/Hackathon/AISlopGuard/backend"
./run.sh
```

Leave it open. You should see: `Uvicorn running on http://0.0.0.0:8000`.

If you see `[Backend] GET /api/health -> 200` when you open the app on the phone, the backend is getting the request and the problem is likely on the phone side (see step 4).

---

## 2. Same Wi‑Fi

Your **phone** and **Mac** must be on the **same Wi‑Fi network**.

- If the phone is on **cellular** or a **different Wi‑Fi**, it cannot reach `172.28.10.37` (that’s a local network address).
- Turn off cellular data on the phone and use Wi‑Fi only, and make sure it’s the same network as the Mac.

---

## 3. Confirm your Mac’s IP

In a **new** terminal (backend stays running in the other one):

```bash
ipconfig getifaddr en0
```

- If it prints **172.28.10.37** → your `.env` is correct; keep going.
- If it prints something else (e.g. **192.168.1.5**):
  1. Update **`AISlopGuard/mobile/.env`**: set `EXPO_PUBLIC_API_URL=http://THAT_IP:8000`
  2. Restart Expo with cache clear:  
     `cd AISlopGuard/mobile && npx expo start --tunnel --clear`
  3. Reload the app on the phone.

---

## 4. Test from your Mac

With the backend running, in a terminal:

```bash
curl http://172.28.10.37:8000/api/health
```

- You should see: `{"ok":true}`  
  → Backend is listening. If the phone still says “Not connected”, try step 5 (firewall).
- If `curl` fails or hangs → backend isn’t bound correctly or something else is wrong; check the terminal where `./run.sh` is running for errors.

---

## 5. Mac firewall

If the phone is on the same Wi‑Fi and `curl` from the Mac works, but the app still says “Not connected”, the firewall may be blocking the phone.

- **System Settings → Network → Firewall** (or **Security & Privacy → Firewall**)
- Either:
  - **Allow** “Python” or “uvicorn” (or whatever runs the backend) for **incoming** connections, or
  - Temporarily **turn the firewall off**, reload the app, and see if it shows “Connected”. Then turn the firewall back on and add the allow rule above.

---

## 6. University / public Wi‑Fi

On some campus or public Wi‑Fi, devices cannot talk to each other (client isolation). In that case:

- `172.28.10.37` will never work from the phone.
- You need to expose the backend to the internet, e.g. with **ngrok**:
  ```bash
  # Install ngrok, then:
  ngrok http 8000
  ```
  Use the `https://xxxx.ngrok.io` URL it gives you in **`mobile/.env`**:
  ```
  EXPO_PUBLIC_API_URL=https://xxxx.ngrok.io
  ```
  Restart Expo with `--clear` and reload the app.

---

## Quick recap

| Step | Check |
|------|--------|
| 1 | Backend running with `./run.sh` |
| 2 | Phone and Mac on same Wi‑Fi |
| 3 | Mac IP matches `.env` (run `ipconfig getifaddr en0`) |
| 4 | `curl http://172.28.10.37:8000/api/health` returns `{"ok":true}` |
| 5 | Firewall allows incoming to port 8000 (or Python/uvicorn) |
| 6 | If on locked-down Wi‑Fi, use ngrok and set that URL in `.env` |
