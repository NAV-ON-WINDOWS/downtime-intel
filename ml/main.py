from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from model import predict_next_failure, train_model
import os
import traceback

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictRequest(BaseModel):
    machine_id: str
    downtime_logs: list

@app.on_event("startup")
def startup():
    import requests, joblib, pandas as pd
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if url and key:
        print("Fetching logs from Supabase...")
        resp = requests.get(
            f"{url}/rest/v1/downtime_logs?select=*&limit=1000",
            headers={"apikey": key, "Authorization": f"Bearer {key}"}
        )
        if resp.status_code == 200 and resp.json():
            print(f"Fetched {len(resp.json())} logs — training model...")
            train_model()
            print("Model trained and ready.")
        else:
            print(f"Supabase fetch failed: {resp.status_code}")
    elif os.path.exists("ai4i2020.csv"):
        print("Training model from local CSV...")
        train_model()
    else:
        print("No model or training data found")

@app.get("/")
def root():
    return {"status": "Downtime Intel ML service running"}

@app.post("/predict")
def predict(req: PredictRequest):
    try:
        result = predict_next_failure(req.machine_id, req.downtime_logs)
        return result
    except Exception as e:
        print("PREDICTION ERROR:", str(e))
        print(traceback.format_exc())
        return {
            "machine_id": req.machine_id,
            "predicted_failure_date": None,
            "predicted_duration_minutes": 0,
            "confidence_score": 0.0,
            "risk_level": "insufficient_data",
            "model_version": "rf-v1"
        }