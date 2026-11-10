FROM python:3.12-slim AS builder

WORKDIR /app


RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .


RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


FROM python:3.12-slim AS runner

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1


RUN addgroup --system safepay && adduser --system --ingroup safepay safepay

WORKDIR /app


COPY --from=builder /install /usr/local


COPY --chown=safepay:safepay . .

USER safepay

EXPOSE 5000


CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000", "--workers", "2"]