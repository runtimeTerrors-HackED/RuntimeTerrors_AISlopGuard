# Training Folder

This folder contains scripts to train and export your custom image classifier.

## Important

If training in Kaggle:

- cloning repo gives you code,
- adding data in Kaggle sidebar gives you dataset.

You need both.

For the exact verified Kaggle notebook cells, follow:

- `docs/08_KAGGLE_TRAINING_CELLS.md`

## Quick Local Commands

```bash
cd backend/model_service/training
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

python prepare_dataset.py --input-root data/raw --dataset-format cifake --output-root data --max-per-class 4000 --max-test-per-class 2000
python train.py --data-dir data --out-dir artifacts --epochs 4 --batch-size 32 --lr 1e-4
python export_onnx.py --checkpoint artifacts/best.pt --out ../artifacts/model.onnx
```

Then, if time remains:

```bash
python prepare_dataset.py --input-root data/raw --dataset-format cifake --output-root data --max-per-class 12000 --max-test-per-class 4000
python train.py --data-dir data --out-dir artifacts --epochs 8 --batch-size 64 --lr 1e-4
python export_onnx.py --checkpoint artifacts/best.pt --out ../artifacts/model.onnx
```

Expected outputs:

- `artifacts/best.pt`
- `artifacts/thresholds.json`
- `artifacts/metrics.json`
- `backend/model_service/artifacts/model.onnx`
