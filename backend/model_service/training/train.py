from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import timm
import torch
from sklearn.metrics import f1_score, precision_score, recall_score, roc_auc_score
from torch import nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from tqdm import tqdm


def get_device() -> torch.device:
    if torch.backends.mps.is_available():
        return torch.device("mps")
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


class BinaryImageFolder(datasets.ImageFolder):
    def __init__(self, root: Path, transform, positive_class: str):
        super().__init__(root=str(root), transform=transform)
        if positive_class not in self.class_to_idx:
            raise ValueError(
                f"Class '{positive_class}' is missing in {root}. Found classes: {list(self.class_to_idx)}"
            )
        self.positive_index = self.class_to_idx[positive_class]

    def __getitem__(self, index: int):
        image, label = super().__getitem__(index)
        binary_label = 1.0 if label == self.positive_index else 0.0
        return image, torch.tensor([binary_label], dtype=torch.float32)


def make_loaders(data_dir: Path, batch_size: int):
    train_transforms = transforms.Compose(
        [
            transforms.RandomResizedCrop(224, scale=(0.7, 1.0)),
            transforms.RandomHorizontalFlip(),
            transforms.ColorJitter(0.15, 0.15, 0.15, 0.05),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ]
    )

    eval_transforms = transforms.Compose(
        [
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ]
    )

    train_dataset = BinaryImageFolder(data_dir / "train", train_transforms, positive_class="ai")
    val_dataset = BinaryImageFolder(data_dir / "val", eval_transforms, positive_class="ai")
    test_dataset = BinaryImageFolder(data_dir / "test", eval_transforms, positive_class="ai")

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=2)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=2)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=2)
    return train_loader, val_loader, test_loader


def evaluate(model, loader, loss_fn, device):
    model.eval()
    running_loss = 0.0
    labels: list[float] = []
    probs: list[float] = []

    with torch.no_grad():
        for images, targets in loader:
            images = images.to(device)
            targets = targets.to(device)
            logits = model(images)
            loss = loss_fn(logits, targets)
            probabilities = torch.sigmoid(logits)

            running_loss += loss.item() * images.shape[0]
            labels.extend(targets.squeeze(1).cpu().numpy().tolist())
            probs.extend(probabilities.squeeze(1).cpu().numpy().tolist())

    avg_loss = running_loss / max(1, len(loader.dataset))
    return avg_loss, np.array(labels), np.array(probs)


def best_threshold(labels: np.ndarray, probs: np.ndarray) -> tuple[float, float]:
    best_t = 0.5
    best_f1 = -1.0
    for threshold in np.arange(0.30, 0.91, 0.01):
        preds = (probs >= threshold).astype(int)
        f1 = f1_score(labels, preds, zero_division=0)
        if f1 > best_f1:
            best_f1 = f1
            best_t = float(threshold)
    return best_t, best_f1


def metrics_at_threshold(labels: np.ndarray, probs: np.ndarray, threshold: float) -> dict:
    preds = (probs >= threshold).astype(int)
    return {
        "auc": float(roc_auc_score(labels, probs)) if len(np.unique(labels)) > 1 else 0.0,
        "f1": float(f1_score(labels, preds, zero_division=0)),
        "precision": float(precision_score(labels, preds, zero_division=0)),
        "recall": float(recall_score(labels, preds, zero_division=0)),
        "threshold": float(threshold),
    }


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", type=Path, default=Path("data"))
    parser.add_argument("--out-dir", type=Path, default=Path("artifacts"))
    parser.add_argument("--epochs", type=int, default=8)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--lr", type=float, default=1e-4)
    return parser.parse_args()


def main():
    args = parse_args()
    args.out_dir.mkdir(parents=True, exist_ok=True)
    device = get_device()
    print("=== Training Started ===")
    print(f"Using device: {device}")
    print(
        f"Config -> data_dir={args.data_dir}, out_dir={args.out_dir}, "
        f"epochs={args.epochs}, batch_size={args.batch_size}, lr={args.lr}"
    )

    train_loader, val_loader, test_loader = make_loaders(args.data_dir, args.batch_size)
    print(
        "Dataset sizes -> "
        f"train={len(train_loader.dataset)}, val={len(val_loader.dataset)}, test={len(test_loader.dataset)}"
    )

    model = timm.create_model("mobilenetv3_large_100", pretrained=True, num_classes=1).to(device)
    loss_fn = nn.BCEWithLogitsLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)

    best_val_auc = -1.0
    best_checkpoint = args.out_dir / "best.pt"

    for epoch in range(1, args.epochs + 1):
        model.train()
        running_train_loss = 0.0
        for images, targets in tqdm(train_loader, desc=f"Epoch {epoch}/{args.epochs}"):
            images = images.to(device)
            targets = targets.to(device)

            optimizer.zero_grad()
            logits = model(images)
            loss = loss_fn(logits, targets)
            loss.backward()
            optimizer.step()

            running_train_loss += loss.item() * images.shape[0]

        train_loss = running_train_loss / max(1, len(train_loader.dataset))
        val_loss, val_labels, val_probs = evaluate(model, val_loader, loss_fn, device)
        val_auc = float(roc_auc_score(val_labels, val_probs)) if len(np.unique(val_labels)) > 1 else 0.0

        print(
            f"epoch={epoch} train_loss={train_loss:.4f} "
            f"val_loss={val_loss:.4f} val_auc={val_auc:.4f}"
        )

        if val_auc > best_val_auc:
            best_val_auc = val_auc
            torch.save(
                {"state_dict": model.state_dict(), "model_name": "mobilenetv3_large_100"},
                best_checkpoint,
            )
            print(f"Saved best checkpoint: {best_checkpoint}")

    # Reload best checkpoint for threshold tuning and final metrics.
    checkpoint = torch.load(best_checkpoint, map_location=device)
    model.load_state_dict(checkpoint["state_dict"])

    _, val_labels, val_probs = evaluate(model, val_loader, loss_fn, device)
    tuned_threshold, val_f1 = best_threshold(val_labels, val_probs)

    _, test_labels, test_probs = evaluate(model, test_loader, loss_fn, device)
    test_metrics = metrics_at_threshold(test_labels, test_probs, tuned_threshold)

    with open(args.out_dir / "thresholds.json", "w", encoding="utf-8") as file:
        json.dump(
            {
                "model_decision_threshold": tuned_threshold,
                "ai_threshold_high": 0.80,
                "unclear_threshold": 0.55,
            },
            file,
            indent=2,
        )

    with open(args.out_dir / "metrics.json", "w", encoding="utf-8") as file:
        json.dump(
            {
                "best_val_auc": best_val_auc,
                "best_val_f1_at_tuned_threshold": val_f1,
                "test_metrics": test_metrics,
            },
            file,
            indent=2,
        )

    print(f"Best val AUC: {best_val_auc:.4f}")
    print(f"Tuned threshold (best val F1): {tuned_threshold:.2f}")
    print(f"Test metrics: {json.dumps(test_metrics)}")
    print(f"Training done. Artifacts written to {args.out_dir.resolve()}")
    print("=== Training Finished ===")


if __name__ == "__main__":
    main()
