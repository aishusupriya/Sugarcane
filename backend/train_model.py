"""Train a sugarcane disease classifier from the two downloaded Kaggle datasets.

Example:
python train_model.py --dataset-root C:\\path\\to\\Sugarcane_leafs \
  --smut-root C:\\path\\to\\Sugarcane Smut Dataset --epochs 5
"""

import argparse
import random
from collections import defaultdict
from pathlib import Path

import torch
from PIL import Image, ImageFile
from torch import nn
from torch.utils.data import DataLoader, Dataset
from torchvision import models, transforms

ImageFile.LOAD_TRUNCATED_IMAGES = True
CLASS_NAMES = ["Bacterial Blight", "Healthy", "Mosaic", "Red Rot", "Rust", "Smut", "Yellow Leaf"]
LABEL_MAP = {
    "BacterialBlights": "Bacterial Blight",
    "Healthy": "Healthy",
    "healthy_leaves": "Healthy",
    "Mosaic": "Mosaic",
    "RedRot": "Red Rot",
    "Rust": "Rust",
    "smut": "Smut",
    "Yellow": "Yellow Leaf",
}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


class ImageDataset(Dataset):
    def __init__(self, items, transform):
        self.items = items
        self.transform = transform

    def __len__(self):
        return len(self.items)

    def __getitem__(self, index):
        path, label = self.items[index]
        return self.transform(Image.open(path).convert("RGB")), label


def collect_images(roots):
    items = []
    for root in roots:
        for folder in Path(root).iterdir():
            label = LABEL_MAP.get(folder.name)
            if not label:
                continue
            for path in folder.rglob("*"):
                if path.suffix.lower() in IMAGE_EXTENSIONS:
                    items.append((path, CLASS_NAMES.index(label)))
    if not items:
        raise RuntimeError("No labeled images found. Check both dataset roots.")
    return items


def split_items(items, validation_fraction, seed):
    random.seed(seed)
    grouped = defaultdict(list)
    for item in items:
        grouped[item[1]].append(item)
    train, validation = [], []
    for class_items in grouped.values():
        random.shuffle(class_items)
        count = max(1, int(len(class_items) * validation_fraction))
        validation.extend(class_items[:count])
        train.extend(class_items[count:])
    random.shuffle(train)
    random.shuffle(validation)
    return train, validation


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset-root", required=True)
    parser.add_argument("--smut-root", required=True)
    parser.add_argument("--output", default="model_artifacts/sugarcane_mobilenet.pt")
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--validation-fraction", type=float, default=0.2)
    parser.add_argument("--max-per-class", type=int, default=0)
    args = parser.parse_args()

    torch.manual_seed(42)
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(10),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    validation_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    items = collect_images([args.dataset_root, args.smut_root])
    if args.max_per_class:
        grouped = defaultdict(list)
        for item in items:
            grouped[item[1]].append(item)
        random.seed(42)
        items = [item for class_items in grouped.values() for item in random.sample(class_items, min(args.max_per_class, len(class_items)))]
    train_items, validation_items = split_items(items, args.validation_fraction, 42)
    train_loader = DataLoader(ImageDataset(train_items, transform), batch_size=args.batch_size, shuffle=True, num_workers=0)
    validation_loader = DataLoader(ImageDataset(validation_items, validation_transform), batch_size=args.batch_size, num_workers=0)

    model = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)
    for parameter in model.features.parameters():
        parameter.requires_grad = False
    model.classifier[3] = nn.Linear(model.classifier[3].in_features, len(CLASS_NAMES))
    optimizer = torch.optim.AdamW(model.classifier[3].parameters(), lr=0.001)
    loss_function = nn.CrossEntropyLoss()

    for epoch in range(args.epochs):
        model.train()
        for images, labels in train_loader:
            optimizer.zero_grad()
            loss_function(model(images), labels).backward()
            optimizer.step()
        model.eval()
        correct = total = 0
        with torch.inference_mode():
            for images, labels in validation_loader:
                predictions = model(images).argmax(dim=1)
                correct += (predictions == labels).sum().item()
                total += labels.numel()
        print(f"epoch {epoch + 1}/{args.epochs} validation_accuracy={correct / total:.4f}")

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    torch.save({"model_state": model.state_dict(), "classes": CLASS_NAMES}, output)
    print(f"saved checkpoint: {output.resolve()}")


if __name__ == "__main__":
    main()