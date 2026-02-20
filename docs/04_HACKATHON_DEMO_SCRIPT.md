# Hackathon Demo Script (Detailed, 5-7 minutes)

Use this exact script if your presenter is nervous.

## 1) Problem Statement (30-45 sec)

Say:

> "Users are flooded with low-quality AI-generated media, but current blockers are too aggressive and often hide normal content.  
> People need a tool that is transparent, reversible, and user-controlled."

## 2) Product Summary (45 sec)

Say:

> "AI Content Guardian scans content links and returns a confidence-based verdict using three signals: platform metadata, community votes, and AI model inference.  
> Every decision is explainable, and users can always override with allow/block controls."

## 3) Architecture Slide (45 sec)

Show:

- mobile app (Expo React Native),
- backend orchestrator (FastAPI),
- model service (FastAPI + ONNX),
- weighted scoring pipeline.

Say:

> "We do not rely on keyword matching or a single black-box model."

## 4) Live Demo Walkthrough (3-4 min)

### Step A: Run scan

1. Open `Home`.
2. Paste test URL.
3. Tap `Scan Content`.
4. Highlight:
   - verdict label,
   - final score,
   - confidence,
   - evidence breakdown.

### Step B: Show user control

1. Tap `Always Allow This Creator`.
2. Scan same content again.
3. Show immediate allowlist override evidence.

### Step C: Show crowdsourcing

1. Tap `Mark as AI-generated`.
2. Explain this updates community signal.

### Step D: Show auditability

1. Open `History`.
2. Show previous scans are logged per user fingerprint.

## 5) Why This Is Better (45 sec)

Say:

- "Explainable verdicts, not blind filtering."
- "User can override in one tap."
- "Community + platform + model signals reduce false positives."
- "Conservative mode makes threshold stricter for safer blocking."

## 6) Honest Limitations (30 sec)

Say:

- "Current data storage is in-memory for hackathon speed."
- "Automatic passive cross-app scanning is not in this MVP."
- "For some platforms, direct media retrieval can fail due access restrictions."

## 7) Next Steps (30 sec)

- Add Supabase/Postgres persistence.
- Add authenticated user accounts.
- Improve anti-abuse trust weighting.
- Expand video inference coverage and queue-based processing.
