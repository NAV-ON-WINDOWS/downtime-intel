import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.utils import resample
import joblib
import os
from datetime import datetime, timedelta, timezone

MODEL_PATH = "model_azure.pkl"
TRAINING_DATA = "PdM_telemetry.csv"
FAILURES_DATA = "PdM_failures.csv"
ERRORS_DATA = "PdM_errors.csv"

def build_rolling_features(telemetry):
    telemetry = telemetry.sort_values(['machineID', 'datetime'])
    for col in ['volt', 'rotate', 'pressure', 'vibration']:
        telemetry[f'{col}_roll3_mean'] = telemetry.groupby('machineID')[col].transform(
            lambda x: x.rolling(3, min_periods=1).mean()
        )
        telemetry[f'{col}_roll3_std'] = telemetry.groupby('machineID')[col].transform(
            lambda x: x.rolling(3, min_periods=1).std().fillna(0)
        )
        telemetry[f'{col}_roll24_mean'] = telemetry.groupby('machineID')[col].transform(
            lambda x: x.rolling(24, min_periods=1).mean()
        )
        telemetry[f'{col}_roll24_std'] = telemetry.groupby('machineID')[col].transform(
            lambda x: x.rolling(24, min_periods=1).std().fillna(0)
        )
    return telemetry

def get_feature_cols():
    cols = []
    for col in ['volt', 'rotate', 'pressure', 'vibration']:
        cols += [f'{col}_roll3_mean', f'{col}_roll3_std',
                 f'{col}_roll24_mean', f'{col}_roll24_std']
    cols += ['error_count']
    return cols

def train_model():
    print("Training model on Microsoft Azure industrial data...")

    telemetry = pd.read_csv(TRAINING_DATA)
    failures = pd.read_csv(FAILURES_DATA)
    errors = pd.read_csv(ERRORS_DATA)

    telemetry['datetime'] = pd.to_datetime(telemetry['datetime'])
    failures['datetime'] = pd.to_datetime(failures['datetime'])
    errors['datetime'] = pd.to_datetime(errors['datetime'])

    telemetry = build_rolling_features(telemetry)

    errors['date'] = errors['datetime'].dt.date
    error_counts = errors.groupby(['machineID', 'date']).size().reset_index(name='error_count')
    error_counts['date'] = pd.to_datetime(error_counts['date'])

    telemetry['date'] = telemetry['datetime'].dt.date
    feature_cols = [c for c in get_feature_cols() if c != 'error_count']
    daily = telemetry.groupby(['machineID', 'date'])[feature_cols].mean().reset_index()
    daily['date'] = pd.to_datetime(daily['date'])
    daily = daily.merge(error_counts, on=['machineID', 'date'], how='left')
    daily['error_count'] = daily['error_count'].fillna(0)

    failures['date'] = pd.to_datetime(failures['datetime']).dt.normalize()
    failure_set = set(zip(failures['machineID'], failures['date']))
    daily['failed'] = daily.apply(
        lambda r: 1 if (r['machineID'], r['date']) in failure_set else 0, axis=1
    )

    all_feature_cols = get_feature_cols()
    majority = daily[daily['failed'] == 0]
    minority = daily[daily['failed'] == 1]
    minority_up = resample(minority, replace=True, n_samples=len(majority), random_state=42)
    balanced = pd.concat([majority, minority_up])

    X = balanced[all_feature_cols].fillna(0)
    y = balanced['failed']

    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=20,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X, y)
    joblib.dump(model, MODEL_PATH)
    print("Model trained and saved.")
    return model

def load_model():
    if os.path.exists(MODEL_PATH):
        print("Loading existing model...")
        return joblib.load(MODEL_PATH)
    if os.path.exists(TRAINING_DATA):
        return train_model()
    # Fallback to AI4I model if Azure data not available
    if os.path.exists("ai4i2020.csv"):
        print("Azure data not found, falling back to AI4I training...")
        return train_model_ai4i()
    raise Exception("No training data found")

def predict_next_failure(machine_id: str, downtime_logs: list):
    if len(downtime_logs) < 3:
        return {
            "machine_id": machine_id,
            "predicted_failure_date": None,
            "predicted_duration_minutes": 0,
            "confidence_score": 0.0,
            "risk_level": "insufficient_data",
            "model_version": "azure-rf-v2"
        }

    model = load_model()

    df = pd.DataFrame(downtime_logs)
    df['started_at'] = pd.to_datetime(df['started_at'], utc=True)
    df = df.sort_values('started_at')

    avg_duration = df['duration_minutes'].mean()
    recent_3 = df.tail(3)['duration_minutes'].mean()
    total_days = max(1, (df['started_at'].iloc[-1] - df['started_at'].iloc[0]).days)
    frequency = len(df) / total_days * 30

    # Map downtime patterns to Azure-style sensor features
    # Higher frequency/duration = worse sensor readings
    severity = min(1.0, (avg_duration / 120) * (frequency / 10))

    features = pd.DataFrame([{
        'volt_roll3_mean': 170 - severity * 10,
        'volt_roll3_std': 2 + severity * 5,
        'volt_roll24_mean': 170 - severity * 8,
        'volt_roll24_std': 2 + severity * 4,
        'rotate_roll3_mean': 1500 - severity * 100,
        'rotate_roll3_std': 50 + severity * 80,
        'rotate_roll24_mean': 1500 - severity * 80,
        'rotate_roll24_std': 50 + severity * 60,
        'pressure_roll3_mean': 100 + severity * 10,
        'pressure_roll3_std': 5 + severity * 8,
        'pressure_roll24_mean': 100 + severity * 8,
        'pressure_roll24_std': 5 + severity * 6,
        'vibration_roll3_mean': 40 + severity * 20,
        'vibration_roll3_std': 5 + severity * 10,
        'vibration_roll24_mean': 40 + severity * 15,
        'vibration_roll24_std': 5 + severity * 8,
        'error_count': min(10, frequency * severity)
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
        "model_version": "azure-rf-v2"
    }