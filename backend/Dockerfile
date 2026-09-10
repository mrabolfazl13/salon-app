FROM python:3.11-bookworm

WORKDIR /app

RUN echo "deb http://mirror.shatel.ir/debian bookworm main contrib non-free non-free-firmware" > /etc/apt/sources.list && \
    echo "deb http://mirror.shatel.ir/debian bookworm-updates main contrib non-free non-free-firmware" >> /etc/apt/sources.list && \
    echo "deb http://mirror.shatel.ir/debian bookworm-backports main contrib non-free non-free-firmware" >> /etc/apt/sources.list && \
    echo "deb http://mirror.shatel.ir/debian-security bookworm-security main contrib non-free non-free-firmware" >> /etc/apt/sources.list

# نصب پکیج‌ها
RUN apt update && \
    apt install -y \
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