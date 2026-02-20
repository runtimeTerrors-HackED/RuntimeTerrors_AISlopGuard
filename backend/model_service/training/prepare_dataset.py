from __future__ import annotations

import argparse
import json
import random
import shutil
from dataclasses import dataclass
from pathlib import Path

from tqdm import tqdm

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


@dataclass
class CifakeLayout:
    root: Path
    train_fake: Path
    train_real: Path
    test_fake: Path
    test_real: Path


def parse_args():
    parser = argparse.ArgumentParser(
        description="Build balanced train/val/test folders with ai and real classes."
    )
    parser.add_argument(
        "--input-root",
        type=Path,
        required=True,
        help="Folder containing raw images (can be nested in many subfolders).",
    )
    parser.add_argument(
        "--output-root",
        type=Path,
        default=Path("data"),
        help="Output folder where train/val/test folders will be created.",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for reproducible shuffling.",
    )
    parser.add_argument(
        "--train-ratio",
        type=float,
        default=0.8,
        help="Train split ratio.",
    )
    parser.add_argument(
        "--val-ratio",
        type=float,
        default=0.1,
        help="Validation split ratio.",
    )
    parser.add_argument(
        "--test-ratio",
        type=float,
        default=0.1,
        help="Test split ratio.",
    )
    parser.add_argument(
        "--max-per-class",
        type=int,
        default=0,
        help=(
            "Optional cap per class for TRAIN pool before val split. "
            "Use 0 for no cap."
        ),
    )
    parser.add_argument(
        "--max-test-per-class",
        type=int,
        default=0,
        help="Optional cap per class for TEST pool. Use 0 for no cap.",
    )
    parser.add_argument(
        "--dataset-format",
        choices=["auto", "cifake", "generic"],
        default="auto",
        help="auto tries CIFAKE layout first, then generic keyword mode.",
    )
    parser.add_argument(
        "--real-keywords",
        type=str,
        default="real,human,authentic,true,natural",
        help="Comma-separated keywords to detect real class from file path (generic mode).",
    )
    parser.add_argument(
        "--ai-keywords",
        type=str,
        default="ai,fake,synthetic,generated,gan,diffusion",
        help="Comma-separated keywords to detect ai class from file path (generic mode).",
    )
    return parser.parse_args()


def list_images(root: Path) -> list[Path]:
    return [p for p in root.rglob("*") if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS]


def make_split_counts(total: int, train_ratio: float, val_ratio: float, test_ratio: float):
    train_count = int(total * train_ratio)
    val_count = int(total * val_ratio)
    test_count = total - train_count - val_count
    if test_count < 0:
        raise ValueError("Split ratios produce negative test count. Check ratios.")
    return train_count, val_count, test_count


def reset_output_root(output_root: Path):
    if output_root.exists():
        shutil.rmtree(output_root)
    for split in ["train", "val", "test"]:
        for label in ["ai", "real"]:
            (output_root / split / label).mkdir(parents=True, exist_ok=True)


def copy_many(items: list[Path], dst_root: Path, split: str, label: str):
    dst_dir = dst_root / split / label
    for idx, src in enumerate(tqdm(items, desc=f"Copying {label} -> {split}", unit="img")):
        dst = dst_dir / f"{label}_{idx:07d}{src.suffix.lower()}"
        shutil.copy2(src, dst)


def copy_explicit_splits(
    output_root: Path,
    label: str,
    train_paths: list[Path],
    val_paths: list[Path],
    test_paths: list[Path],
):
    copy_many(train_paths, output_root, "train", label)
    copy_many(val_paths, output_root, "val", label)
    copy_many(test_paths, output_root, "test", label)


def _child_case_insensitive(parent: Path, target_names: set[str]) -> Path | None:
    if not parent.exists() or not parent.is_dir():
        return None
    for child in parent.iterdir():
        if child.is_dir() and child.name.lower() in target_names:
            return child
    return None


def detect_cifake_layout(input_root: Path) -> CifakeLayout | None:
    candidate_roots: list[Path] = []
    if input_root.exists():
        candidate_roots.append(input_root)

    # Handle nested mounts like /kaggle/input/datasets/birdy654/cifake...
    if input_root.exists() and input_root.is_dir():
        for child in input_root.rglob("*"):
            if child.is_dir() and child.name.lower() in {"train", "test"}:
                candidate_roots.append(child.parent)

    seen = set()
    unique_candidates = []
    for root in candidate_roots:
        key = str(root.resolve())
        if key not in seen:
            seen.add(key)
            unique_candidates.append(root)

    for root in unique_candidates:
        train_dir = _child_case_insensitive(root, {"train"})
        test_dir = _child_case_insensitive(root, {"test"})
        if train_dir is None or test_dir is None:
            continue

        train_fake = _child_case_insensitive(train_dir, {"fake", "ai"})
        train_real = _child_case_insensitive(train_dir, {"real"})
        test_fake = _child_case_insensitive(test_dir, {"fake", "ai"})
        test_real = _child_case_insensitive(test_dir, {"real"})

        if all([train_fake, train_real, test_fake, test_real]):
            return CifakeLayout(
                root=root,
                train_fake=train_fake,
                train_real=train_real,
                test_fake=test_fake,
                test_real=test_real,
            )

    return None


def split_train_val(train_paths: list[Path], train_ratio: float, val_ratio: float):
    denom = train_ratio + val_ratio
    if denom <= 0:
        raise ValueError("train_ratio + val_ratio must be > 0 for CIFAKE mode.")
    val_share = val_ratio / denom
    val_count = int(len(train_paths) * val_share)
    train_count = len(train_paths) - val_count
    return train_paths[:train_count], train_paths[train_count:]


def classify_paths_generic(
    image_paths: list[Path],
    real_keywords: list[str],
    ai_keywords: list[str],
) -> tuple[list[Path], list[Path], list[Path]]:
    real_paths: list[Path] = []
    ai_paths: list[Path] = []
    unknown_paths: list[Path] = []

    for path in image_paths:
        parts = [part.lower() for part in path.parts]
        hits: list[tuple[int, str]] = []

        for idx, part in enumerate(parts):
            if any(keyword in part for keyword in real_keywords):
                hits.append((idx, "real"))
            if any(keyword in part for keyword in ai_keywords):
                hits.append((idx, "ai"))

        if not hits:
            unknown_paths.append(path)
            continue

        deepest_index = max(index for index, _ in hits)
        deepest_labels = {label for index, label in hits if index == deepest_index}

        if deepest_labels == {"real"}:
            real_paths.append(path)
        elif deepest_labels == {"ai"}:
            ai_paths.append(path)
        else:
            unknown_paths.append(path)

    return real_paths, ai_paths, unknown_paths


def run_cifake_mode(args, layout: CifakeLayout):
    print("Detected CIFAKE layout.")
    print(f"CIFAKE root: {layout.root}")
    print(f"TRAIN/FAKE: {layout.train_fake}")
    print(f"TRAIN/REAL: {layout.train_real}")
    print(f"TEST/FAKE:  {layout.test_fake}")
    print(f"TEST/REAL:  {layout.test_real}")

    train_real_paths = list_images(layout.train_real)
    train_ai_paths = list_images(layout.train_fake)
    test_real_paths = list_images(layout.test_real)
    test_ai_paths = list_images(layout.test_fake)

    print(
        "Raw CIFAKE counts -> "
        f"train_real={len(train_real_paths)}, train_ai={len(train_ai_paths)}, "
        f"test_real={len(test_real_paths)}, test_ai={len(test_ai_paths)}"
    )

    random.shuffle(train_real_paths)
    random.shuffle(train_ai_paths)
    random.shuffle(test_real_paths)
    random.shuffle(test_ai_paths)

    if args.max_per_class > 0:
        train_real_paths = train_real_paths[: args.max_per_class]
        train_ai_paths = train_ai_paths[: args.max_per_class]
        print(f"Applied TRAIN cap per class: {args.max_per_class}")

    if args.max_test_per_class > 0:
        test_real_paths = test_real_paths[: args.max_test_per_class]
        test_ai_paths = test_ai_paths[: args.max_test_per_class]
        print(f"Applied TEST cap per class: {args.max_test_per_class}")

    train_balanced = min(len(train_real_paths), len(train_ai_paths))
    test_balanced = min(len(test_real_paths), len(test_ai_paths))
    train_real_paths = train_real_paths[:train_balanced]
    train_ai_paths = train_ai_paths[:train_balanced]
    test_real_paths = test_real_paths[:test_balanced]
    test_ai_paths = test_ai_paths[:test_balanced]
    print(f"Balanced counts -> train_per_class={train_balanced}, test_per_class={test_balanced}")

    real_train, real_val = split_train_val(train_real_paths, args.train_ratio, args.val_ratio)
    ai_train, ai_val = split_train_val(train_ai_paths, args.train_ratio, args.val_ratio)

    print(
        "Final split per class -> "
        f"train={len(real_train)}, val={len(real_val)}, test={len(test_real_paths)}"
    )
    print("Resetting output folders...")
    reset_output_root(args.output_root)
    print("Copying files to output split folders...")
    copy_explicit_splits(args.output_root, "real", real_train, real_val, test_real_paths)
    copy_explicit_splits(args.output_root, "ai", ai_train, ai_val, test_ai_paths)

    summary = {
        "mode": "cifake",
        "input_root": str(args.input_root.resolve()),
        "resolved_cifake_root": str(layout.root.resolve()),
        "output_root": str(args.output_root.resolve()),
        "counts": {
            "train_per_class": len(real_train),
            "val_per_class": len(real_val),
            "test_per_class": len(test_real_paths),
        },
        "caps": {
            "max_per_class_train": args.max_per_class,
            "max_per_class_test": args.max_test_per_class,
        },
        "note": "test split sourced from CIFAKE TEST folder; val split sampled from TRAIN folder.",
    }
    return summary


def run_generic_mode(args):
    print("Using generic keyword-based dataset mode.")
    real_keywords = [k.strip().lower() for k in args.real_keywords.split(",") if k.strip()]
    ai_keywords = [k.strip().lower() for k in args.ai_keywords.split(",") if k.strip()]

    print("Scanning images recursively...")
    all_images = list_images(args.input_root)
    print(f"Found total image files: {len(all_images)}")
    real_paths, ai_paths, unknown_paths = classify_paths_generic(all_images, real_keywords, ai_keywords)
    print(
        "Class detection summary before balancing -> "
        f"real={len(real_paths)}, ai={len(ai_paths)}, unknown={len(unknown_paths)}"
    )

    if len(real_paths) == 0 or len(ai_paths) == 0:
        raise ValueError(
            "Could not detect both classes from path keywords.\n"
            f"Found real={len(real_paths)}, ai={len(ai_paths)}, unknown={len(unknown_paths)}.\n"
            "Use --real-keywords and --ai-keywords to match your folder names."
        )

    random.shuffle(real_paths)
    random.shuffle(ai_paths)

    if args.max_per_class > 0:
        real_paths = real_paths[: args.max_per_class]
        ai_paths = ai_paths[: args.max_per_class]

    balanced_count = min(len(real_paths), len(ai_paths))
    real_paths = real_paths[:balanced_count]
    ai_paths = ai_paths[:balanced_count]
    print(f"Balanced per-class count: {balanced_count}")

    train_count, val_count, test_count = make_split_counts(
        balanced_count, args.train_ratio, args.val_ratio, args.test_ratio
    )
    print(f"Split counts per class -> train={train_count}, val={val_count}, test={test_count}")

    print("Resetting output folders...")
    reset_output_root(args.output_root)
    print("Copying files to output split folders...")
    copy_explicit_splits(
        args.output_root,
        "real",
        real_paths[:train_count],
        real_paths[train_count : train_count + val_count],
        real_paths[train_count + val_count :],
    )
    copy_explicit_splits(
        args.output_root,
        "ai",
        ai_paths[:train_count],
        ai_paths[train_count : train_count + val_count],
        ai_paths[train_count + val_count :],
    )

    summary = {
        "mode": "generic",
        "input_root": str(args.input_root.resolve()),
        "output_root": str(args.output_root.resolve()),
        "detected": {
            "all_images": len(all_images),
            "real_detected": len(real_paths),
            "ai_detected": len(ai_paths),
            "unknown_skipped": len(unknown_paths),
        },
        "splits_per_class": {
            "train": train_count,
            "val": val_count,
            "test": test_count,
        },
        "keywords": {
            "real_keywords": real_keywords,
            "ai_keywords": ai_keywords,
        },
    }
    return summary


def main():
    args = parse_args()
    print("=== Dataset Preparation Started ===")
    print(f"Input root: {args.input_root}")
    print(f"Output root: {args.output_root}")
    print(f"Dataset format mode: {args.dataset_format}")
    print(f"Split ratios: train={args.train_ratio}, val={args.val_ratio}, test={args.test_ratio}")
    print(
        f"Caps -> train max per class: {args.max_per_class if args.max_per_class > 0 else 'no cap'}, "
        f"test max per class: {args.max_test_per_class if args.max_test_per_class > 0 else 'no cap'}"
    )

    total_ratio = args.train_ratio + args.val_ratio + args.test_ratio
    if abs(total_ratio - 1.0) > 1e-6:
        raise ValueError("train-ratio + val-ratio + test-ratio must equal 1.0")

    random.seed(args.seed)

    if not args.input_root.exists():
        raise FileNotFoundError(f"Input folder does not exist: {args.input_root}")

    summary = None
    if args.dataset_format in {"auto", "cifake"}:
        layout = detect_cifake_layout(args.input_root)
        if layout is not None:
            summary = run_cifake_mode(args, layout)
        elif args.dataset_format == "cifake":
            raise ValueError(
                "CIFAKE mode was requested but CIFAKE folder structure was not detected.\n"
                "Expected structure: <root>/TRAIN/{FAKE,REAL} and <root>/TEST/{FAKE,REAL}"
            )

    if summary is None:
        summary = run_generic_mode(args)

    with open(args.output_root / "dataset_summary.json", "w", encoding="utf-8") as file:
        json.dump(summary, file, indent=2)

    print(json.dumps(summary, indent=2))
    print("Dataset preparation complete.")
    print("=== Dataset Preparation Finished ===")


if __name__ == "__main__":
    main()
