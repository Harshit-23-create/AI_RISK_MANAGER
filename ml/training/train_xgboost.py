"""
Training script for XGBoost risk classification model.
Run from project root: python ml/training/train_xgboost.py
Outputs:
  - ml/models/xgboost_risk.json   (trained model)
  - ml/models/xgboost_metrics.json (evaluation metrics)
"""
import os
import sys
import json
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))

FEATURE_COLUMNS = [
    "amount", "previous_transaction_avg", "amount_ratio",
    "failed_attempts", "transaction_frequency", "account_age_days",
    "previous_transaction_count", "is_new_device", "is_new_ip",
    "request_rate", "packet_size", "connection_count",
    "failed_request_count", "packet_count",
]

N_NORMAL = 7000
N_SUSPICIOUS = 2000
N_HIGH_RISK = 1000

rng = np.random.default_rng(42)


def generate_dataset() -> pd.DataFrame:
    normal = pd.DataFrame({
        "amount": rng.lognormal(7.5, 0.6, N_NORMAL),
        "previous_transaction_avg": rng.lognormal(7.5, 0.5, N_NORMAL),
        "amount_ratio": rng.uniform(0.5, 1.8, N_NORMAL),
        "failed_attempts": rng.choice([0, 1], N_NORMAL, p=[0.93, 0.07]),
        "transaction_frequency": rng.uniform(0.1, 2.5, N_NORMAL),
        "account_age_days": rng.integers(90, 2000, N_NORMAL),
        "previous_transaction_count": rng.integers(5, 300, N_NORMAL),
        "is_new_device": rng.choice([0, 1], N_NORMAL, p=[0.97, 0.03]),
        "is_new_ip": rng.choice([0, 1], N_NORMAL, p=[0.96, 0.04]),
        "request_rate": rng.uniform(0.2, 5.0, N_NORMAL),
        "packet_size": rng.uniform(200, 1200, N_NORMAL),
        "connection_count": rng.integers(1, 12, N_NORMAL),
        "failed_request_count": rng.integers(0, 3, N_NORMAL),
        "packet_count": rng.integers(2, 25, N_NORMAL),
        "label": 0,  # 0=normal, 1=suspicious, 2=high_risk
    })

    suspicious = pd.DataFrame({
        "amount": rng.lognormal(10.0, 1.0, N_SUSPICIOUS),
        "previous_transaction_avg": rng.uniform(500, 5000, N_SUSPICIOUS),
        "amount_ratio": rng.uniform(2.5, 8.0, N_SUSPICIOUS),
        "failed_attempts": rng.integers(2, 7, N_SUSPICIOUS),
        "transaction_frequency": rng.uniform(5, 15, N_SUSPICIOUS),
        "account_age_days": rng.integers(7, 60, N_SUSPICIOUS),
        "previous_transaction_count": rng.integers(1, 15, N_SUSPICIOUS),
        "is_new_device": rng.choice([0, 1], N_SUSPICIOUS, p=[0.5, 0.5]),
        "is_new_ip": rng.choice([0, 1], N_SUSPICIOUS, p=[0.4, 0.6]),
        "request_rate": rng.uniform(8, 25, N_SUSPICIOUS),
        "packet_size": rng.uniform(600, 3000, N_SUSPICIOUS),
        "connection_count": rng.integers(10, 60, N_SUSPICIOUS),
        "failed_request_count": rng.integers(4, 15, N_SUSPICIOUS),
        "packet_count": rng.integers(20, 100, N_SUSPICIOUS),
        "label": 1,
    })

    high_risk = pd.DataFrame({
        "amount": rng.uniform(100000, 1000000, N_HIGH_RISK),
        "previous_transaction_avg": rng.uniform(200, 2000, N_HIGH_RISK),
        "amount_ratio": rng.uniform(10.0, 100.0, N_HIGH_RISK),
        "failed_attempts": rng.integers(8, 20, N_HIGH_RISK),
        "transaction_frequency": rng.uniform(20, 60, N_HIGH_RISK),
        "account_age_days": rng.integers(0, 7, N_HIGH_RISK),
        "previous_transaction_count": rng.integers(0, 3, N_HIGH_RISK),
        "is_new_device": np.ones(N_HIGH_RISK, dtype=int),
        "is_new_ip": np.ones(N_HIGH_RISK, dtype=int),
        "request_rate": rng.uniform(30, 100, N_HIGH_RISK),
        "packet_size": rng.uniform(1500, 8000, N_HIGH_RISK),
        "connection_count": rng.integers(50, 300, N_HIGH_RISK),
        "failed_request_count": rng.integers(15, 50, N_HIGH_RISK),
        "packet_count": rng.integers(100, 1000, N_HIGH_RISK),
        "label": 2,
    })

    return pd.concat([normal, suspicious, high_risk], ignore_index=True).sample(frac=1, random_state=42)


def train_binary_model(df: pd.DataFrame):
    """Train binary classifier: normal (0) vs risky (1+)."""
    df = df.copy()
    df["binary_label"] = (df["label"] > 0).astype(int)

    X = df[FEATURE_COLUMNS].values.astype(np.float32)
    y = df["binary_label"].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    dtrain = xgb.DMatrix(X_train, label=y_train, feature_names=FEATURE_COLUMNS)
    dtest = xgb.DMatrix(X_test, label=y_test, feature_names=FEATURE_COLUMNS)

    params = {
        "objective": "binary:logistic",
        "eval_metric": ["logloss", "auc"],
        "max_depth": 6,
        "learning_rate": 0.05,
        "n_estimators": 300,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
        "min_child_weight": 3,
        "scale_pos_weight": N_NORMAL / (N_SUSPICIOUS + N_HIGH_RISK),
        "seed": 42,
    }

    evals = [(dtrain, "train"), (dtest, "test")]
    model = xgb.train(
        params, dtrain,
        num_boost_round=300,
        evals=evals,
        early_stopping_rounds=20,
        verbose_eval=50,
    )

    # Evaluate
    y_pred_proba = model.predict(dtest)
    y_pred = (y_pred_proba > 0.5).astype(int)

    print("\n=== XGBoost Binary Classifier Metrics ===")
    print(classification_report(y_test, y_pred, target_names=["normal", "risky"]))
    auc = roc_auc_score(y_test, y_pred_proba)
    print(f"ROC-AUC: {auc:.4f}")

    metrics = {
        "roc_auc": round(auc, 4),
        "n_train": len(X_train),
        "n_test": len(X_test),
        "best_iteration": model.best_iteration,
        "feature_importance": model.get_score(importance_type="gain"),
    }

    return model, metrics


def main():
    print("Generating dataset...")
    df = generate_dataset()
    print(f"Dataset: {len(df)} samples | Labels: {df['label'].value_counts().to_dict()}")

    model, metrics = train_binary_model(df)

    os.makedirs("models", exist_ok=True)
    model.save_model("models/xgboost_risk.json")
    print("\nModel saved: models/xgboost_risk.json")

    with open("models/xgboost_metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)
    print("Metrics saved: models/xgboost_metrics.json")
    print(f"\nROC-AUC: {metrics['roc_auc']}")


if __name__ == "__main__":
    main()
