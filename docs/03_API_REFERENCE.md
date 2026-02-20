# API Reference

Base URL: `http://localhost:8000`

All requests and responses are JSON.

## Windows note (PowerShell)

Most examples below use Bash-style `curl` with `\` line continuation.
On Windows PowerShell, use `Invoke-RestMethod` (or run these commands in Git Bash).

Quick PowerShell examples:

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/health" -Method Get
```

```powershell
$body = @{
  url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  userFingerprint = "anon_demo"
  conservativeMode = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/scan" -Method Post -ContentType "application/json" -Body $body
```

## Authentication

Current hackathon MVP does **not** require auth token.

Production recommendation:

- add JWT auth or API key,
- map `userFingerprint` to authenticated user profile.

## `POST /api/scan`

Request:

```json
{
  "url": "https://youtube.com/shorts/abc123",
  "userFingerprint": "anon_123",
  "conservativeMode": true
}
```

Response (example):

```json
{
  "contentId": "youtube:abc123",
  "platform": "youtube",
  "canonicalId": "abc123",
  "creatorId": "youtube_creator_abc123",
  "verdict": "unclear",
  "finalScore": 0.66,
  "confidenceBand": "medium",
  "platformScore": 0.5,
  "communityScore": 0.7,
  "modelScore": 0.8,
  "evidence": [
    { "source": "platform", "message": "YouTube synthetic disclosure not available for this video.", "strength": "low" },
    { "source": "community", "message": "Community weighted votes -> ai: 2.0, not_ai: 0.0, unsure: 0.0", "strength": "low" },
    { "source": "model", "message": "Model score 0.80 (high).", "strength": "high" },
    { "source": "settings", "message": "Conservative mode is ON (stricter AI threshold).", "strength": "medium" }
  ],
  "scannedAt": "2026-02-20T00:00:00Z"
}
```

Common failure cases:

- `422` if URL/fingerprint are invalid or missing.
- `500` only for unexpected server crashes.

Test with curl:

```bash
curl -X POST http://localhost:8000/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "userFingerprint":"anon_demo",
    "conservativeMode": true
  }'
```

## `POST /api/vote`

Request:

```json
{
  "contentId": "youtube:abc123",
  "userFingerprint": "anon_123",
  "vote": "ai"
}
```

Response:

```json
{
  "ok": true,
  "updatedCommunityScore": 0.75
}
```

Test with curl:

```bash
curl -X POST http://localhost:8000/api/vote \
  -H "Content-Type: application/json" \
  -d '{
    "contentId":"youtube:abc123",
    "userFingerprint":"anon_demo",
    "vote":"ai"
  }'
```

## `POST /api/list`

Request:

```json
{
  "creatorId": "youtube_creator_abc123",
  "userFingerprint": "anon_123",
  "listType": "allow"
}
```

Response:

```json
{
  "ok": true
}
```

Test with curl:

```bash
curl -X POST http://localhost:8000/api/list \
  -H "Content-Type: application/json" \
  -d '{
    "creatorId":"youtube_creator_abc123",
    "userFingerprint":"anon_demo",
    "listType":"allow"
  }'
```

## `GET /api/history?userFingerprint=anon_123`

Response:

```json
[
  {
    "contentId": "youtube:abc123",
    "platform": "youtube",
    "canonicalId": "abc123",
    "creatorId": "youtube_creator_abc123",
    "verdict": "unclear",
    "finalScore": 0.66,
    "confidenceBand": "medium",
    "platformScore": 0.5,
    "communityScore": 0.7,
    "modelScore": 0.8,
    "evidence": [],
    "scannedAt": "2026-02-20T00:00:00Z"
  }
]
```

Test with curl:

```bash
curl "http://localhost:8000/api/history?userFingerprint=anon_demo"
```

## `GET /api/health`

Response:

```json
{
  "ok": true
}
```

## Data Contract Notes

- `verdict` is one of:
  - `likely_ai`
  - `unclear`
  - `likely_human`
- `confidenceBand` is one of:
  - `high`
  - `medium`
  - `low`
- `evidence[].source` is one of:
  - `platform`
  - `community`
  - `model`
  - `user_list`
  - `settings`
