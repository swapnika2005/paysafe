from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import joblib
import numpy as np
import os
import time
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="SafePay Fraud Detection API",
    version="v1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "http://localhost:3000","http://frontend:80"],
    allow_methods=["*"],
    allow_headers=["*"],
)


model = None
scaler = None
feature_names = None

@app.on_event("startup")
async def load_model():
    global model, scaler, feature_names
    try:
        model = joblib.load("model/safepay_fraud_model.pkl")
        scaler = joblib.load("model/safepay_scaler.pkl")
        feature_names = joblib.load("model/safepay_features.pkl")
        print(f"✅ Model loaded: {type(model).__name__}")
        print(f"✅ Features: {feature_names}")
    except Exception as e:
        print(f"❌ Model load failed: {e}")
        raise RuntimeError(e)


class FraudFeatures(BaseModel):
    amount: float = Field(..., gt=0)
    hour_of_day: int = Field(..., ge=0, le=23)
    sender_txn_count: int = Field(..., ge=0)
    receiver_txn_count: int = Field(..., ge=0)

class PredictRequest(BaseModel):
    features: FraudFeatures

class PredictResponse(BaseModel):
    is_fraud: bool
    risk_score: float
    reasons: List[str]
    model_version: str
    processing_time_ms: float


def build_features(f: FraudFeatures) -> np.ndarray:
    # Scale amount using saved scaler
    scaled_amount = scaler.transform([[f.amount]])[0][0]

    # Build array in exact order model was trained on
    # ['scaled_amount', 'hour_of_day',
    #  'sender_txn_count', 'receiver_txn_count']
    return np.array([[
        scaled_amount,
        f.hour_of_day,
        f.sender_txn_count,
        f.receiver_txn_count,
    ]])

def get_reasons(f: FraudFeatures, score: float) -> List[str]:
    reasons = []
    if f.amount > 100000:
        reasons.append("Unusually large transaction amount")
    elif f.amount > 50000:
        reasons.append("High value transaction")
    if 0 <= f.hour_of_day <= 5:
        reasons.append("Transaction at unusual hour (midnight-5AM)")
    if f.receiver_txn_count == 0:
        reasons.append("First-time receiver")
    if f.sender_txn_count > 50 and f.amount > 50000:
        reasons.append("High transaction velocity with large amount")
    if f.amount > 10000 and f.hour_of_day < 6:
        reasons.append("Large amount at unusual hour")
    if score > 90:
        reasons.append("Multiple high-risk signals detected")
    return reasons or ["Automated pattern detection"]


@app.get("/health")
async def health():
    return {
        "status": "healthy" if model else "degraded",
        "model_loaded": model is not None,
        "model_type": type(model).__name__ if model else None,
        "features": feature_names,
        "version": "v1.0.0",
    }

@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    if not model:
        raise HTTPException(503, "Model not loaded")

    start = time.time()

    features = build_features(request.features)
    prediction = model.predict(features)[0]
    proba = model.predict_proba(features)[0]

    # proba = [prob_legit, prob_fraud]
    fraud_probability = float(proba[1])
    risk_score = round(fraud_probability * 100, 2)
    is_fraud = bool(prediction == 1)

    # Business rule override
    if (request.features.amount > 200000
            and request.features.hour_of_day < 5):
        is_fraud = True
        risk_score = max(risk_score, 85.0)

    reasons = get_reasons(request.features, risk_score)
    ms = round((time.time() - start) * 1000, 2)

    return PredictResponse(
        is_fraud=is_fraud,
        risk_score=risk_score,
        reasons=reasons,
        model_version="v1.0.0",
        processing_time_ms=ms
    )

@app.get("/")
async def root():
    return {
        "service": "SafePay Fraud Detection API",
        "docs": "/docs",
        "health": "/health"
    }
