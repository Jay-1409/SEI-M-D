FROM python:3.11-slim

WORKDIR /app

# Install Nikto and dependencies for vulnerability scanning
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

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
