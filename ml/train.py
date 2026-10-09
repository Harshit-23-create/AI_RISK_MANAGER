#!/usr/bin/env python3
"""
ML Model Training Entry Point — AI Risk Manager
================================================

This script trains both ML models used by the AI Risk Manager and saves
them to the `ml/models/` directory, which is then consumed by the Python
FastAPI ML microservice.

Models trained:
  1. Isolation Forest  → ml/models/isolation_forest.pkl
  2. XGBoost Classifier → ml/models/xgboost_risk.json

Usage:
  # From the project root:
  python ml/train.py

  # Or from the ml/ directory:
  cd ml && python train.py

Requirements (install in ml-service venv or globally):
  pip install scikit-learn xgboost shap numpy pandas
"""

import os
import sys
import subprocess
import time

# ── Resolve paths ─────────────────────────────────────────────────────────────

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
TRAINING_DIR = os.path.join(SCRIPT_DIR, "training")
MODELS_DIR = os.path.join(SCRIPT_DIR, "models")

os.makedirs(MODELS_DIR, exist_ok=True)

print("=" * 60)
print("  AI Risk Manager — ML Model Training Pipeline")
print("=" * 60)
print(f"  Training scripts : {TRAINING_DIR}")
print(f"  Model output dir : {MODELS_DIR}")
print("=" * 60)


def run_training_script(script_name: str, description: str) -> bool:
    """Run a training script and return True if it succeeded."""
    script_path = os.path.join(TRAINING_DIR, script_name)

    if not os.path.exists(script_path):
        print(f"\n[SKIP] {script_name} not found at {script_path}")
        return False

    print(f"\n[STEP] Training: {description}")
    print(f"       Script  : {script_path}")
    print("-" * 50)

    start = time.time()
    result = subprocess.run(
        [sys.executable, script_path],
        capture_output=False,  # let stdout/stderr stream live
        cwd=SCRIPT_DIR,
    )
    elapsed = time.time() - start

    if result.returncode == 0:
        print(f"\n[OK] {description} — completed in {elapsed:.1f}s")
        return True
    else:
        print(f"\n[FAIL] {description} — exit code {result.returncode}")
        return False


# ── Step 1: Isolation Forest ──────────────────────────────────────────────────
step1_ok = run_training_script(
    "train_isolation_forest.py",
    "Isolation Forest (unsupervised anomaly detection)"
)

# ── Step 2: XGBoost Classifier ────────────────────────────────────────────────
step2_ok = run_training_script(
    "train_xgboost.py",
    "XGBoost Risk Classifier (supervised binary classification)"
)

# ── Summary ───────────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("  Training Summary")
print("=" * 60)
print(f"  Isolation Forest : {'✓ OK' if step1_ok else '✗ FAILED'}")
print(f"  XGBoost          : {'✓ OK' if step2_ok else '✗ FAILED'}")

# List what's in models dir
print(f"\n  Files in {MODELS_DIR}:")
for fname in sorted(os.listdir(MODELS_DIR)):
    fpath = os.path.join(MODELS_DIR, fname)
    size_kb = os.path.getsize(fpath) / 1024
    print(f"    {fname} ({size_kb:.1f} KB)")

if step1_ok and step2_ok:
    print("\n[DONE] All models trained successfully.")
    print("       Start the ML service: cd ml-service && uvicorn main:app --reload --port 8001")
    sys.exit(0)
else:
    print("\n[WARN] One or more models failed to train.")
    print("       The ML service will fall back to rule-based scoring.")
    sys.exit(1)
