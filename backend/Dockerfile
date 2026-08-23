FROM python:3.11-slim

WORKDIR /app


RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --index-url https://pypi.iranserver.com/repository/pypi/simple -r requirements.txt

COPY ./app ./app
COPY ./alembic.ini .
COPY ./migrations ./migrations

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
