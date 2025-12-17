FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    # Prisma needs DATABASE_URL at generate-time even if it doesn't connect.
    DATABASE_URL="sqlserver://localhost:1433;database=stylino_db;user=stylino;password=stylino;encrypt=true;trustServerCertificate=true"

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN prisma generate --schema prisma/schema.prisma

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

