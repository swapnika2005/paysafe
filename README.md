# PaySafe

PaySafe is an educational digital-wallet application that demonstrates peer-to-peer transfers, wallet activity, and machine-learning-assisted fraud review. It is built as a web client, an Express API, a PostgreSQL database, and a separate FastAPI model service.

> **Important:** PaySafe is a demo project, not a bank or payment processor. Top-ups are simulated. Do not use real financial or identity data.

## Features

- Account registration, login, one-time-password verification, password recovery, and configurable two-factor authentication.
- INR wallet balances, simulated top-ups, and transfers to other registered users.
- PIN-protected transfers with transaction history, receipts, wallet audit logs, and notifications.
- Fraud scoring through a scikit-learn model service. A transaction classified as suspicious is recorded as blocked and creates a fraud report; admins can review reports and manage user accounts.
- Profile and security settings, including password/PIN changes and session revocation.
- Responsive React interface and a Docker Compose deployment stack with Caddy as a reverse proxy.

## Architecture

```text
Browser (React + Vite)
        │ /api/v1
        ▼
Express API ─────── PostgreSQL (Prisma)
        │
        └────────── FastAPI fraud model (scikit-learn)
```

The API authenticates and validates wallet operations, requests a fraud prediction for transfers, and stores the result and corresponding wallet activity. In production, the backend fails closed if the fraud service is unavailable. A demo fallback can be enabled explicitly for local or demo use.

## Tech stack

- **Frontend:** React, TypeScript, Vite, TanStack Router, Tailwind CSS
- **Backend:** Node.js, Express, Prisma
- **Database:** PostgreSQL
- **Fraud model API:** Python, FastAPI, scikit-learn
- **Deployment:** Docker Compose, Caddy; a Render Blueprint is also provided

## Run locally

### Prerequisites

- Node.js 22 and pnpm 11
- Python 3.12 and pip
- PostgreSQL

Create a PostgreSQL database, then configure the backend environment. From the repository root:

```sh
cd backend
cp .env.example .env
```

Set `DATABASE_URL` and `DIRECT_URL` to your PostgreSQL connection strings, provide distinct values for `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET`, and keep `CORS_ORIGIN=http://localhost:5173`. The example config connects the backend to the fraud API at `http://localhost:5000`. Keep secrets out of source control.

Start each service in a separate terminal from the repository root.

### Backend

```sh
cd backend
pnpm install
pnpm exec prisma migrate dev
pnpm run dev
```

The API listens on `http://localhost:8000`.

### Frontend

```sh
cd frontend
pnpm install
pnpm run dev
```

The frontend uses `http://localhost:8000/api/v1` as its default API URL. Open the URL Vite prints, usually `http://localhost:5173`.

### ML API

```sh
cd ml-api
python -m venv .venv
# Activate the virtual environment, then:
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 5000
```

The model files under `ml-api/model/` are required. In development, verification codes for email/SMS are logged by the backend; configure Resend and Twilio credentials if you want to test delivery.

## Docker deployment

The root `docker-compose.yml` runs the frontend, backend, fraud API, and Caddy reverse proxy. Before starting it:

1. Configure `backend/.env.production` with the values from `backend/.env.example`, including PostgreSQL connection strings, strong token secrets, and the correct frontend `CORS_ORIGIN`.
2. Create `ml-api/.env` (it is loaded by Compose and can be empty if no ML environment variables are needed).
3. Configure the hostnames in `Caddyfile` and point their DNS records at the deployment host.
4. Start the stack:

```sh
docker compose up --build -d
```

Caddy serves the frontend and proxies the API using the hostnames configured in `Caddyfile`. The backend container applies Prisma migrations during startup. Review the example environment files and deployment configuration before exposing the app publicly.

## API overview

The backend API is rooted at `/api/v1`:

| Route group | Purpose |
| --- | --- |
| `/health` | API, database, and fraud-service health |
| `/auth` | Registration, login, OTP, password/PIN, and session management |
| `/wallet` | Balance, top-up, transfers, transaction history, and wallet logs |
| `/transactions` | Transaction details and receipts |
| `/notifications` | Wallet notifications |
| `/fraud` | Admin fraud-report review |
| `/admin` | Admin dashboard and user management |

Most wallet and transaction routes require authentication. Transfers and top-ups also require phone verification; admin routes require an admin account.

The fraud API exposes `GET /health` and `POST /predict`. Predictions use the amount, hour of day, and sender/receiver transaction counts. See [`backend/openapi.yaml`](backend/openapi.yaml) for the backend API specification.

## Configuration

Important backend variables (see [`backend/.env.example`](backend/.env.example)):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL`, `DIRECT_URL` | PostgreSQL pooled and direct connection strings |
| `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET` | JWT signing secrets |
| `CORS_ORIGIN` | Allowed frontend origin |
| `ML_API_URL` | Base URL of the fraud API (the backend appends `/predict` and `/health`) |
| `ML_MODEL_VERSION` | Model version recorded with fraud reports |
| `RESEND_API_KEY`, `EMAIL_FROM` | Optional email delivery configuration |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | Optional SMS delivery configuration |
| `DEMO_ALLOW_ML_FALLBACK` | Allows transfers to continue with a zero-risk fallback if the ML service is unavailable; keep disabled in production |
| `ALLOW_MOCK_TOPUP` | Enables simulated wallet top-ups; do not treat these as real payments |

For frontend builds, `VITE_API_URL` sets the API base URL. Compose builds the frontend with `/api/v1` and routes requests through Caddy.

## Tests and checks

```sh
cd backend
pnpm test
```

```sh
cd frontend
pnpm run lint
pnpm run build
```

The backend integration test is opt-in and requires a configured database:

```sh
cd backend
pnpm run test:integration
```

## Repository layout

```text
backend/    Express API, Prisma schema/migrations, and tests
frontend/   React + TypeScript web application
ml-api/     FastAPI fraud prediction service and model artifacts
```
