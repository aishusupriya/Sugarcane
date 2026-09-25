from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AgriScan Mock API", version="0.1.0")
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
    "Rust": {"severity": "Moderate", "confidence": 0.882},
    "Mosaic": {"severity": "Moderate", "confidence": 0.848},
    "Smut": {"severity": "Severe", "confidence": 0.896},
    "Yellow Leaf": {"severity": "Moderate", "confidence": 0.821},
    "Wilt": {"severity": "Severe", "confidence": 0.875},
}


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "agriscan-mock-api"}


@app.post("/predict")
async def predict(
    rgb_image: UploadFile = File(...),
    thermal_image: Optional[UploadFile] = File(None),
    field_name: str = Form("Northfield farm"),
):
    # Deterministic demo response; replace this body with model inference later.
    return {
        "disease": "Rust",
        "severity": DISEASES["Rust"]["severity"],
        "confidence": DISEASES["Rust"]["confidence"],
        "thermal_available": thermal_image is not None,
        "field_name": field_name,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "treatment": [
            "Remove affected leaves",
            "Apply recommended fungicide",
            "Maintain field drainage",
        ],
        "filename": rgb_image.filename,
    }
