FROM python:3.11-slim

WORKDIR /app

# Install Nikto and dependencies
RUN apt-get update && apt-get install -y \
    git \
    perl \
    libnet-ssleay-perl \
    openssl \
    libwhisker2-perl \
    libjson-perl \
    libxml-writer-perl \
    && git clone https://github.com/sullo/nikto /opt/nikto \
    && ln -s /opt/nikto/program/nikto.pl /usr/local/bin/nikto \
    && chmod +x /opt/nikto/program/nikto.pl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY main.py .

# Expose port
EXPOSE 8002

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
