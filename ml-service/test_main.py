"""
Comprehensive test suite for the AI Risk Manager ML Service.

Tests cover:
  - Health & model-info endpoints
  - /predict endpoint: normal, high-risk, and boundary scenarios
  - /network endpoint: normal and suspicious transaction contexts
  - Rule-based fallback logic (no trained models required)
  - Response schema validation
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


# ── Fixtures ──────────────────────────────────────────────────────────────────

def normal_transaction():
    """A low-risk, normal transaction payload."""
    return {
        "amount": 150.0,
        "previous_transaction_avg": 120.0,
        "amount_ratio": 1.25,
        "failed_attempts": 0,
        "transaction_frequency": 1.0,
        "account_age_days": 730,
        "previous_transaction_count": 50,
        "is_new_device": 0,
        "is_new_ip": 0,
        "request_rate": 0.5,
        "packet_size": 300.0,
        "connection_count": 1,
        "failed_request_count": 0,
        "packet_count": 2,
    }


def high_risk_transaction():
    """A high-risk transaction with suspicious signals."""
    return {
        "amount": 50000.0,
        "previous_transaction_avg": 200.0,
        "amount_ratio": 10.0,          # 10x normal — very suspicious
        "failed_attempts": 5,
        "transaction_frequency": 12.0,
        "account_age_days": 5,
        "previous_transaction_count": 2,
        "is_new_device": 1,
        "is_new_ip": 1,
        "request_rate": 25.0,
        "packet_size": 6000.0,
        "connection_count": 20,
        "failed_request_count": 10,
        "packet_count": 25,
    }


# ── Health Endpoint ───────────────────────────────────────────────────────────

class TestHealthEndpoint:
    def test_health_check_returns_ok(self):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "ai-risk-ml-service"

    def test_health_check_contains_models_section(self):
        response = client.get("/health")
        data = response.json()
        assert "models" in data
        assert "isolation_forest" in data["models"]
        assert "xgboost" in data["models"]
        assert "shap" in data["models"]

    def test_health_model_flags_are_booleans(self):
        response = client.get("/health")
        models = response.json()["models"]
        assert isinstance(models["isolation_forest"], bool)
        assert isinstance(models["xgboost"], bool)
        assert isinstance(models["shap"], bool)


# ── Model Info Endpoint ───────────────────────────────────────────────────────

class TestModelInfoEndpoint:
    def test_model_info_returns_200(self):
        response = client.get("/model-info")
        assert response.status_code == 200

    def test_model_info_schema(self):
        response = client.get("/model-info")
        data = response.json()
        assert "isolation_forest" in data
        assert "xgboost" in data
        assert "fallback_active" in data
        assert isinstance(data["fallback_active"], bool)


# ── Predict Endpoint ──────────────────────────────────────────────────────────

class TestPredictEndpoint:
    def test_predict_returns_200_for_normal_transaction(self):
        response = client.post("/predict", json=normal_transaction())
        assert response.status_code == 200

    def test_predict_response_schema(self):
        response = client.post("/predict", json=normal_transaction())
        data = response.json()
        assert "anomalyScore" in data
        assert "supervisedScore" in data
        assert "confidence" in data
        assert "shapFactors" in data
        assert "mlFallback" in data
        assert "modelVersion" in data

    def test_predict_scores_in_valid_range(self):
        """All scores must be in [0, 100]."""
        response = client.post("/predict", json=normal_transaction())
        data = response.json()
        assert 0.0 <= data["anomalyScore"] <= 100.0
        assert 0.0 <= data["supervisedScore"] <= 100.0
        assert 0.0 <= data["confidence"] <= 1.0

    def test_predict_high_risk_produces_elevated_anomaly_score(self):
        """High amount_ratio + many failed attempts should produce elevated scores."""
        response = client.post("/predict", json=high_risk_transaction())
        data = response.json()
        # Rule-based fallback: amount_ratio=10 → +40 pts, failed=5 → +30 pts
        assert data["anomalyScore"] > 50, f"Expected >50, got {data['anomalyScore']}"

    def test_predict_high_risk_supervised_score_elevated(self):
        response = client.post("/predict", json=high_risk_transaction())
        data = response.json()
        assert data["supervisedScore"] > 30, f"Expected >30, got {data['supervisedScore']}"

    def test_predict_normal_lower_risk_than_high(self):
        """Low-risk transaction must score lower than high-risk transaction."""
        normal_resp = client.post("/predict", json=normal_transaction())
        high_resp = client.post("/predict", json=high_risk_transaction())
        assert normal_resp.json()["anomalyScore"] < high_resp.json()["anomalyScore"]

    def test_predict_shap_factors_list(self):
        """shapFactors should be a list (may be empty in fallback mode)."""
        response = client.post("/predict", json=normal_transaction())
        data = response.json()
        assert isinstance(data["shapFactors"], list)

    def test_predict_shap_factor_schema(self):
        """Each SHAP factor (when present) must have correct schema."""
        response = client.post("/predict", json=high_risk_transaction())
        data = response.json()
        for factor in data["shapFactors"]:
            assert "feature" in factor
            assert "contribution" in factor
            assert "direction" in factor
            assert factor["direction"] in ("increases_risk", "decreases_risk")

    def test_predict_model_version_string(self):
        response = client.post("/predict", json=normal_transaction())
        assert isinstance(response.json()["modelVersion"], str)
        assert len(response.json()["modelVersion"]) > 0

    def test_predict_zero_amount_does_not_crash(self):
        """Edge case: zero-amount transaction."""
        payload = normal_transaction()
        payload["amount"] = 0.0
        payload["amount_ratio"] = 0.0
        response = client.post("/predict", json=payload)
        assert response.status_code == 200

    def test_predict_missing_optional_fields_uses_defaults(self):
        """Only required field (amount) must be sufficient."""
        response = client.post("/predict", json={"amount": 500.0})
        assert response.status_code == 200

    def test_predict_invalid_payload_returns_422(self):
        """A completely invalid body should return validation error."""
        response = client.post("/predict", json={"not_a_field": "value"})
        # amount is required; missing it → 422 from pydantic
        assert response.status_code == 422


# ── Network Endpoint ──────────────────────────────────────────────────────────

class TestNetworkEndpoint:
    def test_network_returns_200_for_normal_context(self):
        response = client.post("/network", json={
            "transaction_frequency": 1.0,
            "failed_attempts": 0,
            "amount": 300.0,
            "previous_transaction_avg": 250.0,
            "is_new_ip": False,
            "is_new_device": False,
        })
        assert response.status_code == 200

    def test_network_response_schema(self):
        response = client.post("/network", json={
            "transaction_frequency": 1.0,
            "failed_attempts": 0,
            "amount": 300.0,
            "previous_transaction_avg": 250.0,
        })
        data = response.json()
        assert "requestRate" in data
        assert "failedRequests" in data
        assert "packetSize" in data
        assert "packetCount" in data
        assert "connectionCount" in data
        assert "endpoint" in data
        assert "responseStatus" in data
        assert "isSuspicious" in data
        assert "networkRiskScore" in data
        assert "isSimulated" in data

    def test_network_suspicious_when_many_failed_attempts(self):
        """failed_attempts >= 3 must flag the transaction as suspicious."""
        response = client.post("/network", json={
            "transaction_frequency": 1.0,
            "failed_attempts": 5,
            "amount": 500.0,
            "previous_transaction_avg": 500.0,
            "is_new_ip": False,
        })
        data = response.json()
        assert data["isSuspicious"] is True

    def test_network_suspicious_when_high_frequency(self):
        """transaction_frequency > 8 must flag as suspicious."""
        response = client.post("/network", json={
            "transaction_frequency": 15.0,
            "failed_attempts": 0,
            "amount": 200.0,
            "previous_transaction_avg": 200.0,
        })
        data = response.json()
        assert data["isSuspicious"] is True

    def test_network_suspicious_when_new_ip(self):
        """is_new_ip=True must flag as suspicious."""
        response = client.post("/network", json={
            "transaction_frequency": 1.0,
            "failed_attempts": 0,
            "amount": 200.0,
            "previous_transaction_avg": 200.0,
            "is_new_ip": True,
        })
        assert response.json()["isSuspicious"] is True

    def test_network_suspicious_has_elevated_risk_score(self):
        """Suspicious network context should produce elevated network risk score."""
        response = client.post("/network", json={
            "transaction_frequency": 20.0,
            "failed_attempts": 6,
            "amount": 50000.0,
            "previous_transaction_avg": 200.0,
            "is_new_ip": True,
        })
        data = response.json()
        assert data["networkRiskScore"] > 30

    def test_network_risk_score_in_valid_range(self):
        """Network risk score must always be in [0, 100]."""
        response = client.post("/network", json={
            "transaction_frequency": 100.0,
            "failed_attempts": 50,
            "amount": 999999.0,
            "previous_transaction_avg": 100.0,
            "is_new_ip": True,
        })
        score = response.json()["networkRiskScore"]
        assert 0.0 <= score <= 100.0

    def test_network_is_simulated_flag(self):
        """isSimulated must always be True (DPI is simulated, not real Scapy)."""
        response = client.post("/network", json={"amount": 100.0})
        assert response.json()["isSimulated"] is True

    def test_network_empty_payload_uses_defaults(self):
        """Empty body should use default values and not crash."""
        response = client.post("/network", json={})
        assert response.status_code == 200
