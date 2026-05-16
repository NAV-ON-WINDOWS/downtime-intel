import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from datetime import datetime, timedelta, timezone
import joblib
import os

MODEL_PATH = "model.pkl"

def train_model():
    df = pd.read_csv("ai4i2020.csv")
    df.columns = df.columns.str.strip()

    feature_cols = [
        'Air temperature [K]',
        'Process temperature [K]',
        'Rotational speed [rpm]',
        'Torque [Nm]',
        'Tool wear [min]'
    ]

    target_col = 'Machine failure'

    X = df[feature_cols].fillna(0)
    y = df[target_col]

    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42
    )
    model.fit(X, y)
    joblib.dump(model, MODEL_PATH)
    print("Model trained and saved.")
    return model

def load_model():
    if os.path.exists(MODEL_PATH):
        return joblib.load(MODEL_PATH)
    print("No model found, training now...")
    return train_model()

def predict_next_failure(machine_id: str, downtime_logs: list):
    print("Received logs:", len(downtime_logs))

    if len(downtime_logs) < 3:
        return {
            "machine_id": machine_id,
            "predicted_failure_date": None,
            "predicted_duration_minutes": 0,
            "confidence_score": 0.0,
            "risk_level": "insufficient_data",
            "model_version": "rf-v1"
        }

    model = load_model()

    df = pd.DataFrame(downtime_logs)
    df['started_at'] = pd.to_datetime(df['started_at'], utc=True)
    df = df.sort_values('started_at')

    avg_duration = df['duration_minutes'].mean()
    max_duration = df['duration_minutes'].max()
    recent_3 = df.tail(3)['duration_minutes'].mean()

    now = pd.Timestamp.now(tz='UTC')

    days_since_last = (now - df['started_at'].iloc[-1]).days
    total_days = (df['started_at'].iloc[-1] - df['started_at'].iloc[0]).days
    frequency = len(df) / max(1, total_days) * 30

    features = pd.DataFrame([{
        'Air temperature [K]': 298 + (avg_duration / 60) * 5,
        'Process temperature [K]': 308 + (avg_duration / 60) * 8,
        'Rotational speed [rpm]': max(1000, 1500 - frequency * 10),
        'Torque [Nm]': 30 + (recent_3 / avg_duration) * 20 if avg_duration > 0 else 40,
        'Tool wear [min]': min(250, avg_duration * frequency)
    }])

    proba = model.predict_proba(features)[0][1]

    if proba > 0.75:
        risk = "critical"
    elif proba > 0.50:
        risk = "high"
    elif proba > 0.25:
        risk = "medium"
    else:
        risk = "low"

    avg_days_between = max(1, total_days / max(1, len(df) - 1))
    predicted_date = datetime.now(timezone.utc) + timedelta(days=avg_days_between * (1 - proba))

    return {
        "machine_id": machine_id,
        "predicted_failure_date": predicted_date.strftime("%Y-%m-%d"),
        "predicted_duration_minutes": round(float(recent_3), 1),
        "confidence_score": round(float(proba), 2),
        "risk_level": risk,
        "model_version": "rf-v1"
    }