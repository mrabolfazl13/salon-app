# Multi-stage build for optimized production image
FROM python:3.11-slim-bookworm AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Production stage - smaller image
FROM python:3.11-slim-bookworm

WORKDIR /app

# Add labels for better maintainability
LABEL maintainer="Futsal Booking Team"
LABEL description="Futsal Booking System API"
LABEL version="2.0.0"

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY ./app ./app
COPY ./alembic.ini .
COPY ./migrations ./migrations

# Create non-root user for security
RUN adduser --disabled-password --no-create-home appuser && \
    chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Use gunicorn with uvicorn workers for production
CMD ["gunicorn", "app.main:app", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000", "--access-logfile", "-", "--error-logfile", "-"]