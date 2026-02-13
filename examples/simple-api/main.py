from fastapi import FastAPI
from datetime import datetime
import platform

app = FastAPI(title="Example Microservice", version="1.0.0")


@app.get("/")
async def root():
    """Root endpoint - health check"""
    return {
        "service": "example-microservice",
        "status": "running",
        "message": "Hello from the Secure Microservice Deployer!",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/info")
async def info():
    """Returns service information"""
    return {
        "service": "example-microservice",
        "version": "1.0.0",
        "platform": platform.system(),
        "python_version": platform.python_version(),
        "hostname": platform.node(),
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}
