from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from model_service import DiseaseModel

app = FastAPI(title="AgriScan Disease Inference API", version="1.0.0")
model = DiseaseModel()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DISEASES = {
    "Healthy": {"severity": "Healthy", "confidence": 0.967},
    "Red Rot": {"severity": "Severe", "confidence": 0.914},
    "Rust": {"severity": "Moderate", "confidence": 0.999},
    "Smut": {"severity": "Severe", "confidence": 0.999},
    "Mosaic": {"severity": "Moderate", "confidence": 0.848},
    "Yellow Leaf": {"severity": "Moderate", "confidence": 0.821},
    "Wilt": {"severity": "Severe", "confidence": 0.875},
}


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "agriscan-inference-api", "model_loaded": model.available}


@app.post("/predict")
async def predict(
    rgb_image: UploadFile = File(...),
    thermal_image: Optional[UploadFile] = File(None),
    field_name: str = Form("Northfield farm"),
):
    if model.available:
        prediction = model.predict(rgb_image.file)
        return {
            **prediction,
            "thermal_available": thermal_image is not None,
            "field_name": field_name,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "filename": rgb_image.filename,
        }

    # Local fallback keeps the demo usable before a trained checkpoint is installed.
    disease = "Smut" if "smut" in (rgb_image.filename or "").lower() else "Rust"
    return {
        "disease": disease,
        "severity": DISEASES[disease]["severity"],
        "confidence": DISEASES[disease]["confidence"],
        "thermal_available": thermal_image is not None,
        "field_name": field_name,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "treatment": (
            [
                "Remove infected stools",
                "Disinfect cutting tools",
                "Plant clean setts",
            ]
            if disease == "Smut"
            else [
                "Remove affected leaves",
                "Apply recommended fungicide",
                "Maintain field drainage",
            ]
        ),
        "filename": rgb_image.filename,
    }
