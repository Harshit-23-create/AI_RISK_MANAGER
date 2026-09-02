"""
Training script for Isolation Forest anomaly detection model.
Run this from the project root: python ml/training/train_isolation_forest.py
"""
import os
import sys
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))

FEATURE_COLUMNS = [
    "amount", "previous_transaction_avg", "amount_ratio",
    "failed_attempts", "transaction_frequency", "account_age_days",
    "previous_transaction_count", "is_new_device", "is_new_ip",
    "request_rate", "packet_size", "connection_count",
    "failed_request_count", "packet_count",
]

N_NORMAL = 5000
N_SUSPICIOUS = 500

rng = np.random.default_rng(42)


def generate_training_data():
    """Generate synthetic training data with known labels."""
    # Normal transactions
    normal = pd.DataFrame({
        "amount": rng.lognormal(7.5, 0.6, N_NORMAL),
        "previous_transaction_avg": rng.lognormal(7.5, 0.5, N_NORMAL),
        "amount_ratio": rng.uniform(0.5, 2.0, N_NORMAL),
        "failed_attempts": rng.choice([0, 1], N_NORMAL, p=[0.93, 0.07]),
        "transaction_frequency": rng.uniform(0.1, 3.0, N_NORMAL),
        "account_age_days": rng.integers(60, 2000, N_NORMAL),
        "previous_transaction_count": rng.integers(5, 300, N_NORMAL),
        "is_new_device": rng.choice([0, 1], N_NORMAL, p=[0.97, 0.03]),
        "is_new_ip": rng.choice([0, 1], N_NORMAL, p=[0.95, 0.05]),
        "request_rate": rng.uniform(0.5, 5.0, N_NORMAL),
        "packet_size": rng.uniform(200, 1200, N_NORMAL),
        "connection_count": rng.integers(1, 15, N_NORMAL),
        "failed_request_count": rng.choice([0, 1, 2], N_NORMAL, p=[0.7, 0.2, 0.1]),
        "packet_count": rng.integers(2, 30, N_NORMAL),
        "label": 0,
    })

    # Suspicious transactions (various attack patterns)
    suspicious = pd.DataFrame({
        "amount": rng.uniform(50000, 600000, N_SUSPICIOUS),
        "previous_transaction_avg": rng.uniform(500, 3000, N_SUSPICIOUS),
        "amount_ratio": rng.uniform(5.0, 50.0, N_SUSPICIOUS),
        "failed_attempts": rng.integers(5, 20, N_SUSPICIOUS),
        "transaction_frequency": rng.uniform(10, 40, N_SUSPICIOUS),
        "account_age_days": rng.integers(0, 10, N_SUSPICIOUS),
        "previous_transaction_count": rng.integers(0, 5, N_SUSPICIOUS),
        "is_new_device": rng.choice([0, 1], N_SUSPICIOUS, p=[0.2, 0.8]),
        "is_new_ip": rng.choice([0, 1], N_SUSPICIOUS, p=[0.1, 0.9]),
        "request_rate": rng.uniform(20, 100, N_SUSPICIOUS),
        "packet_size": rng.uniform(800, 5000, N_SUSPICIOUS),
        "connection_count": rng.integers(20, 200, N_SUSPICIOUS),
        "failed_request_count": rng.integers(8, 40, N_SUSPICIOUS),
        "packet_count": rng.integers(50, 600, N_SUSPICIOUS),
        "label": 1,
    })

    return pd.concat([normal, suspicious], ignore_index=True).sample(frac=1, random_state=42)


def main():
    print("Generating training data...")
    df = generate_training_data()
    X = df[FEATURE_COLUMNS].values
    y = df["label"].values

    print(f"Dataset: {len(df)} samples ({df['label'].sum()} suspicious, {(~df['label'].astype(bool)).sum()} normal)")

    # Train Isolation Forest
    print("Training Isolation Forest...")
    model = IsolationForest(
        contamination=0.09,
        n_estimators=200,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X)

    # Evaluate using anomaly scores
    scores = model.score_samples(X)
    predictions = model.predict(X)  # -1 = anomaly, 1 = normal
    
    pred_labels = (predictions == -1).astype(int)
    print("\nClassification Report:")
    print(classification_report(y, pred_labels, target_names=["normal", "suspicious"]))

    # Save model
    os.makedirs("models", exist_ok=True)
    model_path = "models/isolation_forest.pkl"
    with open(model_path, "wb") as f:
        pickle.dump(model, f)
    print(f"\nModel saved: {model_path}")


if __name__ == "__main__":
    main()
