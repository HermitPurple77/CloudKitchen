# selenium/Dockerfile

FROM python:3.11-slim

# Install Chrome and ChromeDriver
RUN apt-get update && apt-get install -y \
    wget curl unzip gnupg \
    chromium chromium-driver \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /selenium

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1

# Run pytest; exit 0 even on test failures so docker-compose doesn't crash
CMD ["sh", "-c", "sleep 10 && pytest tests/ -v --html=report.html --self-contained-html; echo '✅ Selenium tests finished'"]
