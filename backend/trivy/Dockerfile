FROM python:3.11-slim

WORKDIR /app

# Install Trivy (Modern Debian way, avoiding apt-key and lsb_release)
RUN apt-get update && apt-get install -y wget apt-transport-https gnupg \
    && mkdir -p /etc/apt/keyrings \
    && wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | gpg --dearmor -o /etc/apt/keyrings/trivy.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/trivy.gpg] https://aquasecurity.github.io/trivy-repo/deb generic main" | tee /etc/apt/sources.list.d/trivy.list \
    && apt-get update \
    && apt-get install -y trivy \
    && rm -rf /var/lib/apt/lists/*
RUN apt-get update && apt-get install -y docker.io && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY main.py .

# Expose port
EXPOSE 8003

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8003"]
