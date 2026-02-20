# Feature Status (Implemented vs Pending)

This file is the source of truth for what is done right now.

## Implemented in Current MVP

- Mobile app with 3 screens:
  - Home (paste URL + conservative mode toggle),
  - Result (verdict + evidence + actions),
  - History (scan logs).
- Backend scan orchestration API:
  - `POST /api/scan`,
  - `POST /api/vote`,
  - `POST /api/list`,
  - `GET /api/history`.
- Multi-signal scoring:
  - platform signal,
  - community signal,
  - model signal.
- Conservative mode thresholds wired end-to-end.
- Model service:
  - image ONNX inference path,
  - video frame-sampling attempt when model and downloadable media exist,
  - safe fallback if unavailable.
- Training scripts for custom model export to ONNX.

## Not Yet Implemented (Known Roadmap)

- Share extension / direct "Share to app" intake on iOS and Android.
- Persistent production database (currently in-memory demo store).
- Authentication and user accounts.
- Advanced anti-abuse vote reputation/moderation.
- Guaranteed cross-platform real-time background scanning.
- Full native Android overlay/live mode.
