"""
ML Service — Lightweight FastAPI microservice exposing ML/DPI capabilities.
Node.js calls this service via HTTP. It does NOT manage the database.

Endpoints:
  POST /predict      — IF + XGBoost inference + SHAP
  POST /network      — DPI simulation (network event from transaction context)
  GET  /health
  GET  /model-info
"""
import sys
import os
import logging
import math
from typing import Optional, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Make existing backend modules importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Risk Manager — ML Service",
    description="Python ML/DPI microservice. Called by Node.js backend only.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# ── Load ML models at startup ─────────────────────────────────────────────────

FEATURE_COLUMNS = [
    "amount", "previous_transaction_avg", "amount_ratio",
    "failed_attempts", "transaction_frequency", "account_age_days",
    "previous_transaction_count", "is_new_device", "is_new_ip",
    "request_rate", "packet_size", "connection_count",
    "failed_request_count", "packet_count",
]

_isolation_forest = None
_xgboost = None
_shap_explainer = None
_if_loaded = False
_xgb_loaded = False


def _load_models():
    global _isolation_forest, _xgboost, _shap_explainer, _if_loaded, _xgb_loaded

    # Resolve model paths relative to this file
    base = os.path.dirname(os.path.abspath(__file__))
    root = os.path.join(base, "..", "ml", "models")
    if_path  = os.path.join(root, "isolation_forest.pkl")
    xgb_path = os.path.join(root, "xgboost_risk.json")

    if os.path.exists(if_path):
        try:
            import pickle
            with open(if_path, "rb") as f:
                _isolation_forest = pickle.load(f)
            _if_loaded = True
            logger.info("Isolation Forest model loaded from %s", if_path)
        except Exception as e:
            logger.warning("Could not load Isolation Forest: %s", e)
    else:
        logger.info("Isolation Forest model not found at %s — using rule-based fallback", if_path)

    if os.path.exists(xgb_path):
        try:
            import xgboost as xgb
            _xgboost = xgb.Booster()
            _xgboost.load_model(xgb_path)
            _xgb_loaded = True
            logger.info("XGBoost model loaded from %s", xgb_path)
            try:
                import shap
                _shap_explainer = shap.TreeExplainer(_xgboost)
                logger.info("SHAP TreeExplainer initialized.")
            except Exception as e:
                logger.warning("SHAP explainer not available: %s", e)
        except Exception as e:
            logger.warning("Could not load XGBoost: %s", e)
    else:
        logger.info("XGBoost model not found at %s — using rule-based fallback", xgb_path)


_load_models()


# ── Request/Response schemas ──────────────────────────────────────────────────

class PredictRequest(BaseModel):
    amount: float
    previous_transaction_avg: float = 0.0
    amount_ratio: float = 1.0
    failed_attempts: int = 0
    transaction_frequency: float = 0.0
    account_age_days: int = 365
    previous_transaction_count: int = 0
    is_new_device: int = 0
    is_new_ip: int = 0
    request_rate: float = 0.0
    packet_size: float = 300.0
    connection_count: int = 1
    failed_request_count: int = 0
    packet_count: int = 1


class ShapFactor(BaseModel):
    feature: str
    contribution: float
    direction: str  # "increases_risk" | "decreases_risk"


class PredictResponse(BaseModel):
    anomalyScore: float
    supervisedScore: float
    confidence: float
    shapFactors: List[ShapFactor]
    mlFallback: bool
    modelVersion: str


class NetworkRequest(BaseModel):
    # Transaction context for DPI simulation
    transaction_frequency: float = 1.0
    failed_attempts: int = 0
    amount: float = 1000.0
    previous_transaction_avg: float = 1000.0
    is_new_ip: bool = False
    is_new_device: bool = False
    ip_address: Optional[str] = None
    api_endpoint: Optional[str] = None
    http_method: Optional[str] = "POST"
    response_status: Optional[int] = 200
    user_id: Optional[str] = "USER_0001"


class NetworkResponse(BaseModel):
    requestRate: float
    failedRequests: int
    packetSize: float
    packetCount: int
    connectionCount: int
    endpoint: str
    responseStatus: int
    isSuspicious: bool
    networkRiskScore: float
    isSimulated: bool


# ── Helpers ───────────────────────────────────────────────────────────────────

def _features_to_array(features: dict):
    import numpy as np
    return np.array([[features.get(col, 0.0) for col in FEATURE_COLUMNS]], dtype=np.float32)


def _rule_based_anomaly(f: dict) -> float:
    score = 0.0
    ratio = f.get("amount_ratio", 1.0)
    if ratio > 5:
        score += 40
    elif ratio > 3:
        score += 20
    score += min(30, f.get("failed_attempts", 0) * 6)
    score += min(20, f.get("is_new_device", 0) * 20)
    score += min(10, f.get("is_new_ip", 0) * 10)
    return round(min(100.0, score), 2)


def _rule_based_supervised(f: dict) -> float:
    score = 0.0
    score += min(35, f.get("amount_ratio", 1.0) * 4)
    score += min(25, f.get("failed_attempts", 0) * 5)
    score += min(20, f.get("transaction_frequency", 0) * 2)
    score += f.get("is_new_device", 0) * 15
    score += f.get("is_new_ip", 0) * 10
    return round(min(100.0, score), 2)


def _compute_confidence(score: float) -> float:
    # Higher confidence at extremes
    if score >= 81 or score <= 15:
        return round(min(0.99, 0.85 + abs(score - 50) / 500), 2)
    return round(0.70 + abs(score - 50) / 200, 2)


SUSPICIOUS_ENDPOINTS_SET = {"/admin", "/.env", "/bulk-delete", "/batch", "/export/all", "/webhooks/override"}
COMMON_ENDPOINTS = [
    "/api/v1/payments/create", "/api/v1/payments/verify",
    "/api/v1/auth/token", "/api/v1/users/profile", "/api/v1/orders/status",
]
SUSPICIOUS_ENDPOINTS = [
    "/admin/users/bulk-delete", "/api/v1/payments/batch",
    "/api/v1/export/all", "/.env", "/api/v1/webhooks/override",
]


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "ai-risk-ml-service",
        "models": {
            "isolation_forest": _if_loaded,
            "xgboost": _xgb_loaded,
            "shap": _shap_explainer is not None,
        }
    }


@app.get("/model-info")
def model_info():
    return {
        "isolation_forest": {
            "loaded": _if_loaded,
            "features": FEATURE_COLUMNS if _if_loaded else [],
        },
        "xgboost": {
            "loaded": _xgb_loaded,
            "shap_available": _shap_explainer is not None,
            "features": FEATURE_COLUMNS if _xgb_loaded else [],
        },
        "fallback_active": not (_if_loaded and _xgb_loaded),
    }


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    features = req.model_dump()

    # ── Isolation Forest ──────────────────────────────────────────
    if _if_loaded:
        try:
            import numpy as np
            X = _features_to_array(features)
            raw = _isolation_forest.score_samples(X)[0]
            anomaly_score = round(max(0.0, min(100.0, (-raw + 0.5) * 100)), 2)
            ml_fallback = False
        except Exception as e:
            logger.warning("IF prediction failed: %s", e)
            anomaly_score = _rule_based_anomaly(features)
            ml_fallback = True
    else:
        anomaly_score = _rule_based_anomaly(features)
        ml_fallback = True

    # ── XGBoost + SHAP ────────────────────────────────────────────
    shap_factors: List[ShapFactor] = []
    if _xgb_loaded:
        try:
            import xgboost as xgb
            import numpy as np
            X = _features_to_array(features)
            dmatrix = xgb.DMatrix(X, feature_names=FEATURE_COLUMNS)
            proba = _xgboost.predict(dmatrix)[0]
            supervised_score = round(float(proba) * 100, 2)

            if _shap_explainer is not None:
                sv = _shap_explainer.shap_values(X)
                raw_shap = {col: float(sv[0][i]) for i, col in enumerate(FEATURE_COLUMNS)}
                # Sort by absolute contribution, return top 8
                sorted_shap = sorted(raw_shap.items(), key=lambda x: abs(x[1]), reverse=True)[:8]
                shap_factors = [
                    ShapFactor(
                        feature=k,
                        contribution=round(abs(v) * 100, 2),
                        direction="increases_risk" if v > 0 else "decreases_risk",
                    )
                    for k, v in sorted_shap
                ]
        except Exception as e:
            logger.warning("XGBoost prediction failed: %s", e)
            supervised_score = _rule_based_supervised(features)
            ml_fallback = True
    else:
        supervised_score = _rule_based_supervised(features)

    confidence = _compute_confidence(max(anomaly_score, supervised_score))

    return PredictResponse(
        anomalyScore=anomaly_score,
        supervisedScore=supervised_score,
        confidence=confidence,
        shapFactors=shap_factors,
        mlFallback=ml_fallback,
        modelVersion="xgb-v1" if _xgb_loaded else "rule-fallback-v1",
    )


@app.post("/network", response_model=NetworkResponse)
def analyze_network(req: NetworkRequest):
    """DPI simulation — generates synthetic network event from transaction context."""
    freq   = float(req.transaction_frequency or 0.0)
    failed = int(req.failed_attempts or 0)
    amount = float(req.amount or 0.0)
    avg    = float(req.previous_transaction_avg or 1.0)

    is_suspicious = (
        failed >= 3
        or freq > 8
        or req.is_new_ip
        or (avg > 0 and amount / avg > 5)
    )

    if is_suspicious:
        request_rate = min(100.0, max(freq * 2.5, 15.0))
    else:
        request_rate = min(5.0, max(freq * 1.2, 0.5))

    failed_request_count = failed * 2
    packet_size = min(8000.0, 300.0 + (amount / 10000.0) * 100.0)
    if is_suspicious:
        packet_size = min(8000.0, packet_size * 2.5)
    packet_count = max(2, int(request_rate))
    connection_count = max(1, int(packet_count * 0.4))

    if req.api_endpoint:
        endpoint = req.api_endpoint
    elif is_suspicious:
        idx = abs(hash(str(req.user_id))) % len(SUSPICIOUS_ENDPOINTS)
        endpoint = SUSPICIOUS_ENDPOINTS[idx]
    else:
        idx = abs(hash(str(req.user_id))) % len(COMMON_ENDPOINTS)
        endpoint = COMMON_ENDPOINTS[idx]

    response_status = req.response_status or (
        429 if freq > 20 else 401 if failed >= 5 else 200
    )

    # Network risk score (rule-based)
    net_score = 0.0
    if request_rate > 20:
        net_score += 40
    elif request_rate > 10:
        net_score += 20
    if failed_request_count > 10:
        net_score += 30
    elif failed_request_count > 4:
        net_score += 15
    if is_suspicious:
        net_score += 20
    if any(s in endpoint.lower() for s in SUSPICIOUS_ENDPOINTS_SET):
        net_score += 25
    net_score = round(min(100.0, net_score), 2)

    return NetworkResponse(
        requestRate=round(request_rate, 2),
        failedRequests=failed_request_count,
        packetSize=round(packet_size, 2),
        packetCount=packet_count,
        connectionCount=connection_count,
        endpoint=endpoint,
        responseStatus=response_status,
        isSuspicious=is_suspicious,
        networkRiskScore=net_score,
        isSimulated=True,
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
