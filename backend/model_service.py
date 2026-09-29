from pathlib import Path
import os

import torch
from PIL import Image
from torchvision import models, transforms

CLASS_NAMES = [
    "Bacterial Blight",
    "Healthy",
    "Mosaic",
    "Red Rot",
    "Rust",
    "Smut",
    "Yellow Leaf",
]

SEVERITY = {
    "Bacterial Blight": "Severe",
    "Healthy": "Healthy",
    "Mosaic": "Moderate",
    "Red Rot": "Severe",
    "Rust": "Moderate",
    "Smut": "Severe",
    "Yellow Leaf": "Moderate",
}

TREATMENT = {
    "Bacterial Blight": ["Remove infected leaves", "Disinfect cutting tools", "Improve field sanitation"],
    "Healthy": ["Continue field monitoring", "Maintain balanced irrigation", "Keep the field weed-free"],
    "Mosaic": ["Remove infected plants", "Control vector insects", "Use disease-free planting material"],
    "Red Rot": ["Remove infected stools", "Improve field drainage", "Plant certified clean setts"],
    "Rust": ["Remove affected leaves", "Apply recommended fungicide", "Maintain field drainage"],
    "Smut": ["Remove infected stools", "Disinfect cutting tools", "Plant certified clean setts"],
    "Yellow Leaf": ["Remove severely affected leaves", "Check crop nutrition", "Monitor nearby plants"],
}

IMAGE_TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])


def build_model():
    model = models.mobilenet_v3_small(weights=None)
    model.classifier[3] = torch.nn.Linear(model.classifier[3].in_features, len(CLASS_NAMES))
    return model


class DiseaseModel:
    def __init__(self, checkpoint_path=None):
        default_path = Path(__file__).resolve().parent / "model_artifacts" / "sugarcane_mobilenet.pt"
        self.path = Path(checkpoint_path or os.getenv("MODEL_PATH", default_path))
        self.model = None
        if self.path.exists():
            checkpoint = torch.load(self.path, map_location="cpu", weights_only=True)
            self.model = build_model()
            self.model.load_state_dict(checkpoint["model_state"])
            self.model.eval()

    @property
    def available(self):
        return self.model is not None

    def predict(self, image_file):
        if not self.model:
            return None
        image = Image.open(image_file).convert("RGB")
        with torch.inference_mode():
            probabilities = torch.softmax(self.model(IMAGE_TRANSFORM(image).unsqueeze(0)), dim=1)[0]
        confidence, index = probabilities.max(dim=0)
        disease = CLASS_NAMES[index.item()]
        return {
            "disease": disease,
            "severity": SEVERITY[disease],
            "confidence": round(confidence.item(), 4),
            "treatment": TREATMENT[disease],
            "model": "MobileNetV3-small fine-tuned on sugarcane field images",
        }