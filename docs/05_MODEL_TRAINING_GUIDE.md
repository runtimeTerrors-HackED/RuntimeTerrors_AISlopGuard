# Model Training Guide (Verified, Beginner-Friendly)

This guide is the trusted path for training the custom model before hackathon demo.

It is based on your **working Kaggle notebook flow**.

## Goal

Train a binary classifier:

- `ai` class -> AI-generated image
- `real` class -> real image

Then export to ONNX and run it in:

- `backend/model_service`

## Model + Dataset

- **Model:** `MobileNetV3-Large`
- **Dataset:** CIFAKE  
  `birdy654/cifake-real-and-ai-generated-synthetic-images`

## Why Kaggle for your team

For MacBook Air M2, Kaggle GPU is usually faster and more reliable for full runs.

For Windows users, the Kaggle notebook flow is the same because it runs on Kaggle's Linux environment in the cloud.

---

## Exact working cells

Use:

- `docs/08_KAGGLE_TRAINING_CELLS.md`

That file contains the exact cells your team validated:

1. clone repo
2. verify CIFAKE structure
3. install pinned dependencies
4. build `data/train|val|test`
5. train
6. export ONNX
7. verify artifacts

---

## What each cell does

## Cell 1

Clones your repo into Kaggle workspace.

## Cell 2

Checks the dataset path and required class folders exist:

- `train/FAKE`, `train/REAL`
- `test/FAKE`, `test/REAL`

## Cell 3

Installs exact libraries needed for training/export in Kaggle:

- `timm`
- `scikit-learn`
- `onnx`
- `tqdm`
- `onnxscript`

## Cell 4

Builds model-ready split folders under:

- `.../training/data/train/{ai,real}`
- `.../training/data/val/{ai,real}`
- `.../training/data/test/{ai,real}`

It also:

- applies caps for speed (`MAX_TRAIN_PER_CLASS`, `MAX_TEST_PER_CLASS`),
- balances class counts,
- writes `dataset_summary.json`.

## Cell 5

Prints final image counts per split/class so you can verify data prep.

## Cell 6

Runs training (`train.py`) and saves best checkpoint in `artifacts/best.pt`.

## Cell 7

Exports ONNX (`model.onnx`) from best checkpoint.

## Cell 8

Validates that ONNX and metrics artifacts are present.

---

## Understanding your training logs

If you see:

- training loss decreasing,
- validation loss mostly decreasing,
- val/test AUC near `0.99`,

then training is working well on CIFAKE.

Your run:

- `val AUC ~ 0.992`
- `test AUC ~ 0.991`
- `test F1 ~ 0.953`

is strong for this dataset.

## Why 8 epochs

`8` is a practical hackathon default:

- converges well on CIFAKE,
- finishes in reasonable time,
- avoids unnecessary long runs.

You can try 10-12 epochs, but gains are often smaller.

---

## Warning you saw: Hugging Face unauthenticated request

Warning:

`You are sending unauthenticated requests to the HF Hub...`

Meaning:

- pretrained assets are being fetched anonymously from HF.

Impact:

- usually non-fatal,
- may be slower or rate-limited.

What to do:

- okay to ignore for hackathon,
- or set `HF_TOKEN` in Kaggle Secrets for better reliability.

---

## Where to place `model.onnx` locally

After downloading from Kaggle, put the file here:

- `backend/model_service/artifacts/model.onnx`

This is where model service expects it.

Copy command examples:

macOS/Linux:

```bash
cp /path/to/Downloads/model.onnx backend/model_service/artifacts/model.onnx
```

Windows (PowerShell):

```powershell
Copy-Item "C:\path\to\Downloads\model.onnx" "backend\model_service\artifacts\model.onnx"
```

---

## Should you commit `model.onnx` to GitHub?

Recommended:

- avoid committing large model binaries in normal Git history.
- better options:
  - GitHub Release asset,
  - shared drive artifact,
  - Git LFS (if your team already uses it).

Hackathon shortcut:

- if the file is small enough and you need instant team setup, committing once is acceptable.

If you commit it, document:

- model source (CIFAKE run),
- training date,
- metrics snapshot.

---

## Team handoff checklist

- `model.onnx` placed in `backend/model_service/artifacts/`
- `metrics.json` and `thresholds.json` shared with team
- backend runs and returns inference
- docs are aligned (this file + `docs/08_KAGGLE_TRAINING_CELLS.md`)
