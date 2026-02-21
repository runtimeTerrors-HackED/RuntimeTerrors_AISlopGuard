# Connect the app on your phone to the backend

## 1. Get your Mac’s IP (same Wi‑Fi as the phone)

In Terminal:

```bash
ipconfig getifaddr en0
```

If that’s empty, try `en1`. Use the number it prints (e.g. `192.168.1.5` or `172.28.10.37`).

## 2. Point the app at your backend

Edit **`mobile/.env`** and set:

```
EXPO_PUBLIC_API_URL=http://YOUR_IP:8000
```

Example: `EXPO_PUBLIC_API_URL=http://172.28.10.37:8000`  
No trailing slash. Replace `YOUR_IP` with the IP from step 1.

## 3. Start the backend

From the **backend** folder:

```bash
cd AISlopGuard/backend
./run.sh
```

Leave this running. You should see something like: `Uvicorn running on http://0.0.0.0:8000`.

## 4. Restart Expo (so it picks up `.env`)

From the **mobile** folder:

```bash
cd AISlopGuard/mobile
npx expo start --tunnel --clear
```

Reload the app on your phone (shake → Reload, or close and reopen in Expo Go).

## 5. Check on the phone

On the home screen you’ll see:

- **Backend: Connected** (green) — backend is reachable; scan and history will work.
- **Backend: Not connected** (red) — tap the status to retry; if it stays red, see below.

The URL shown under it is the one the app is using.

## If it still says “Not connected”

- **Phone and Mac on the same Wi‑Fi** when using a LAN IP (e.g. `172.28.10.37`). If the phone is on cellular or another network, it can’t reach that IP.
- **Correct IP:** Run `ipconfig getifaddr en0` again and update `EXPO_PUBLIC_API_URL` in `.env`, then restart Expo with `--clear` and reload the app.
- **Backend running:** In the backend terminal you should see `[Backend] GET /api/health -> 200` when the app loads. If you don’t, the request isn’t reaching the backend (wrong IP or firewall).
- **Firewall:** System Settings → Network → Firewall — allow your Terminal/Python or temporarily turn the firewall off to test.

## Optional: see every API request

- **App:** Metro terminal shows `[API] request` / `[API] ok` / `[API] request failed` for each call.
- **Backend:** Backend terminal shows `[Backend] METHOD /path -> status (from IP)` for each request.
