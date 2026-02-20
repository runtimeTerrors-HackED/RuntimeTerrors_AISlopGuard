# Kaggle Training Cells (Exact Working Version)

These are the exact cells that worked for your CIFAKE setup.

These cells are identical for macOS and Windows users because they run inside Kaggle's cloud notebook environment.

Dataset path:

- `/kaggle/input/datasets/birdy654/cifake-real-and-ai-generated-synthetic-images`

Expected structure:

- `train/FAKE`
- `train/REAL`
- `test/FAKE`
- `test/REAL`

---

## Cell 1: Clone repo

```bash
!git clone https://github.com/royayush1/temp.git /kaggle/working/hacked
```

If folder already exists:

```bash
!rm -rf /kaggle/working/hacked
!git clone https://github.com/royayush1/temp.git /kaggle/working/hacked
```

## Cell 2: Verify dataset folders

```python
from pathlib import Path

ROOT = Path("/kaggle/input/datasets/birdy654/cifake-real-and-ai-generated-synthetic-images")
assert ROOT.exists(), f"Missing root: {ROOT}"

required = [
    ROOT/"train"/"FAKE", ROOT/"train"/"REAL",
    ROOT/"test"/"FAKE",  ROOT/"test"/"REAL",
]
for p in required:
    assert p.exists(), f"Missing: {p}"

print("train/FAKE:", len(list((ROOT/"train"/"FAKE").glob("*"))))
print("train/REAL:", len(list((ROOT/"train"/"REAL").glob("*"))))
print("test/FAKE :", len(list((ROOT/"test"/"FAKE").glob("*"))))
print("test/REAL :", len(list((ROOT/"test"/"REAL").glob("*"))))
```

## Cell 3: Install dependencies (pinned)

```bash
!pip install -q timm==1.0.19 scikit-learn==1.7.2 onnx==1.19.0 tqdm==4.67.1 onnxscript
```

Notes:

- if you see `torchaudio requires torch==...`, it is usually safe for this flow.

## Cell 4: Build `data/train|val|test`

```python
import random
import shutil
import json
from pathlib import Path
from tqdm.auto import tqdm

ROOT = Path("/kaggle/input/datasets/birdy654/cifake-real-and-ai-generated-synthetic-images")
OUT  = Path("/kaggle/working/hacked/backend/model_service/training/data")

# Speed/size knobs (change if needed)
MAX_TRAIN_PER_CLASS = 12000   # quick test: 4000
MAX_TEST_PER_CLASS  = 4000    # quick test: 2000

random.seed(42)

def list_files(folder: Path):
    return [p for p in folder.iterdir() if p.is_file()]

train_ai   = list_files(ROOT/"train"/"FAKE")
train_real = list_files(ROOT/"train"/"REAL")
test_ai    = list_files(ROOT/"test"/"FAKE")
test_real  = list_files(ROOT/"test"/"REAL")

random.shuffle(train_ai); random.shuffle(train_real)
random.shuffle(test_ai); random.shuffle(test_real)

if MAX_TRAIN_PER_CLASS > 0:
    train_ai = train_ai[:MAX_TRAIN_PER_CLASS]
    train_real = train_real[:MAX_TRAIN_PER_CLASS]
if MAX_TEST_PER_CLASS > 0:
    test_ai = test_ai[:MAX_TEST_PER_CLASS]
    test_real = test_real[:MAX_TEST_PER_CLASS]

n_train = min(len(train_ai), len(train_real))
n_test  = min(len(test_ai), len(test_real))
train_ai, train_real = train_ai[:n_train], train_real[:n_train]
test_ai, test_real   = test_ai[:n_test], test_real[:n_test]

# split train into train/val (keep test as test)
val_frac = 0.1 / 0.9
val_count = int(n_train * val_frac)
train_count = n_train - val_count

train_ai_split   = train_ai[:train_count]
val_ai_split     = train_ai[train_count:]
train_real_split = train_real[:train_count]
val_real_split   = train_real[train_count:]

if OUT.exists():
    shutil.rmtree(OUT)

for split in ["train", "val", "test"]:
    for cls in ["ai", "real"]:
        (OUT/split/cls).mkdir(parents=True, exist_ok=True)

def copy_list(files, split, cls):
    for i, src in enumerate(tqdm(files, desc=f"Copying {split}/{cls}", unit="img")):
        ext = src.suffix.lower() if src.suffix else ".jpg"
        dst = OUT/split/cls/f"{cls}_{i:07d}{ext}"
        shutil.copy2(src, dst)

copy_list(train_ai_split,   "train", "ai")
copy_list(val_ai_split,     "val",   "ai")
copy_list(test_ai,          "test",  "ai")
copy_list(train_real_split, "train", "real")
copy_list(val_real_split,   "val",   "real")
copy_list(test_real,        "test",  "real")

summary = {
    "source_root": str(ROOT),
    "output_root": str(OUT),
    "train_per_class": train_count,
    "val_per_class": val_count,
    "test_per_class": n_test
}
print(json.dumps(summary, indent=2))

with open(OUT/"dataset_summary.json", "w") as f:
    json.dump(summary, f, indent=2)
```

## Cell 5: Verify counts

```python
from pathlib import Path

OUT = Path("/kaggle/working/hacked/backend/model_service/training/data")
for split in ["train", "val", "test"]:
    for cls in ["ai", "real"]:
        count = len(list((OUT/split/cls).glob("*")))
        print(f"{split}/{cls}: {count}")
```

## Cell 6: Train

```bash
%%bash
set -e
cd /kaggle/working/hacked/backend/model_service/training
python train.py --data-dir data --out-dir artifacts --epochs 8 --batch-size 64 --lr 1e-4
```

If OOM:

```bash
%%bash
set -e
cd /kaggle/working/hacked/backend/model_service/training
python train.py --data-dir data --out-dir artifacts --epochs 8 --batch-size 32 --lr 1e-4
```

## Cell 7: Export ONNX

```bash
%%bash
set -e
cd /kaggle/working/hacked/backend/model_service/training
python export_onnx.py --checkpoint artifacts/best.pt --out /kaggle/working/model.onnx
```

## Cell 8: Verify artifacts

```bash
!ls -la /kaggle/working/model.onnx
!ls -la /kaggle/working/hacked/backend/model_service/training/artifacts
!cat /kaggle/working/hacked/backend/model_service/training/artifacts/metrics.json
```

---

## Download after training

Download:

- `/kaggle/working/model.onnx`
- `/kaggle/working/hacked/backend/model_service/training/artifacts/metrics.json`
- `/kaggle/working/hacked/backend/model_service/training/artifacts/thresholds.json`

## Extra warning you may see

`Warning: You are sending unauthenticated requests to the HF Hub...`

Meaning:

- Hugging Face token is not set.

Usually safe for hackathon.

Optional:

- set `HF_TOKEN` in Kaggle Secrets for higher limits/faster downloads.
