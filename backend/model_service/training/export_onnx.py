from __future__ import annotations

import argparse
from pathlib import Path

import timm
import torch


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    return parser.parse_args()


def main():
    args = parse_args()
    print("=== ONNX Export Started ===")
    if not args.checkpoint.exists():
        raise FileNotFoundError(f"Checkpoint not found: {args.checkpoint}")

    print(f"Checkpoint: {args.checkpoint.resolve()}")
    print(f"Output path: {args.out.resolve()}")
    device = torch.device("cpu")
    model = timm.create_model("mobilenetv3_large_100", pretrained=False, num_classes=1)
    checkpoint = torch.load(args.checkpoint, map_location=device)
    model.load_state_dict(checkpoint["state_dict"])
    model.eval()

    args.out.parent.mkdir(parents=True, exist_ok=True)
    dummy_input = torch.randn(1, 3, 224, 224)
    # Prefer legacy exporter path to avoid requiring onnxscript on some environments.
    try:
        torch.onnx.export(
            model,
            dummy_input,
            str(args.out),
            input_names=["input"],
            output_names=["logits"],
            dynamic_axes={"input": {0: "batch"}, "logits": {0: "batch"}},
            opset_version=17,
            dynamo=False,
        )
        print("Export mode: legacy ONNX exporter (dynamo=False).")
    except TypeError:
        # Fallback for environments where the dynamo kwarg does not exist.
        torch.onnx.export(
            model,
            dummy_input,
            str(args.out),
            input_names=["input"],
            output_names=["logits"],
            dynamic_axes={"input": {0: "batch"}, "logits": {0: "batch"}},
            opset_version=17,
        )
        print("Export mode: default ONNX exporter.")
    print(f"ONNX model exported to: {args.out.resolve()}")
    print("=== ONNX Export Finished ===")


if __name__ == "__main__":
    main()
