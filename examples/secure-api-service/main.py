from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel
import random

app = FastAPI(
    title="Secure Payment Gateway API",
    description="A secure, enterprise-grade payment processing microservice example.",
    version="2.5.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"  # Explicitly set for clarity
)

security = HTTPBasic()

class PaymentRequest(BaseModel):
    card_number: str
    amount: float
    currency: str = "USD"
    merchant_id: str

class PaymentResponse(BaseModel):
    transaction_id: str
    status: str
    message: str

@app.get("/")
def read_root():
    return {"status": "online", "service": "Secure Payment Gateway"}

@app.post("/process", response_model=PaymentResponse, status_code=201)
def process_payment(payment: PaymentRequest):
    """
    Process a new credit card transaction.
    
    - **card_number**: 16-digit card number (simulated validation)
    - **amount**: Transaction amount
    """
    if len(payment.card_number) != 16:
        raise HTTPException(status_code=400, detail="Invalid card number format")
    
    # Simulate processing
    return {
        "transaction_id": f"txn_{random.randint(10000, 99999)}",
        "status": "approved",
        "message": "Transaction processed successfully"
    }

@app.get("/balance")
def get_balance(credentials: HTTPBasicCredentials = Depends(security)):
    """
    Secure endpoint requiring Basic Auth.
    """
    if credentials.username != "admin" or credentials.password != "secret":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return {"balance": 1000000.00, "currency": "USD"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "2.5.0"}
