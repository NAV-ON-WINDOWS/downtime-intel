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
    if not os.path.exists("model.pkl"):
        print("Training model on startup...")
        train_model()

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