# SafePay — AI-Powered Digital Wallet

> A full-stack P2P digital wallet inspired by EasyPaisa/JazzCash, built with React, Node.js, Express, PostgreSQL, Prisma, FastAPI, and a custom Random Forest fraud detection model.

SafePay allows users to send and receive money securely while every transaction is analyzed by an ML fraud detection service before it is processed. If the fraud probability is **70% or higher**, the transaction is blocked before any database write occurs.

> **Disclaimer:** SafePay is an educational/portfolio project and is not a real banking or financial service. Do not use real financial data.

---

## Table of Contents

- [SafePay — AI-Powered Digital Wallet](#safepay--ai-powered-digital-wallet)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Live Demo](#live-demo)
    - [Demo Credentials](#demo-credentials)
  - [Preview](#preview)
  - [Architecture Diagram](#architecture-diagram)
  - [How the Fraud Detection Flow Works](#how-the-fraud-detection-flow-works)
    - [Transfer Decision Logic](#transfer-decision-logic)
  - [Tech Stack](#tech-stack)
  - [Key Technical Decisions](#key-technical-decisions)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Local Setup Without Docker](#local-setup-without-docker)
      - [Backend](#backend)
      - [Frontend](#frontend)
      - [ML API](#ml-api)
    - [Local Setup With Docker](#local-setup-with-docker)
  - [Environment Variables](#environment-variables)
  - [API Reference](#api-reference)
    - [Auth Routes](#auth-routes)
    - [Wallet Routes](#wallet-routes)
    - [Example — Send Money](#example--send-money)
  - [ML Fraud Detection Service](#ml-fraud-detection-service)
    - [Model Details](#model-details)
    - [Prediction Request](#prediction-request)
    - [Prediction Response](#prediction-response)
  - [Deployment](#deployment)
    - [Option 1: Dockerized Cloud Deployment](#option-1-dockerized-cloud-deployment)
    - [Option 2: Separate Free-Tier Deployment](#option-2-separate-free-tier-deployment)
    - [Deployment Note](#deployment-note)
  - [Project Structure](#project-structure)
  - [Future Improvements](#future-improvements)
  - [Author](#author)
  - [License](#license)

---

## Features

- **User Authentication** — secure signup/login flow with JWT authentication.
- **Wallet Dashboard** — shows balance, sent amount, received amount, blocked transactions, and account status.
- **Send Money Flow** — 3-step transfer flow: recipient, amount, confirmation PIN.
- **AI Fraud Detection** — every transfer is scored by a Random Forest model before processing.
- **Fraud Blocking** — transactions with fraud probability `>= 70%` are blocked before database write.
- **Transaction History** — searchable transaction history with sent, received, and blocked status.
- **Wallet Audit Log** — debit/credit wallet activity with balance tracking.
- **Notifications** — success, alert, and information notifications for wallet activity.
- **Profile & Security** — profile details, wallet balance, password update, PIN update, and active sessions.
- **Session Management** — users can revoke individual sessions or revoke all other sessions.
- **CSV Export** — export transaction data for review.
- **Dockerized Setup** — frontend, backend, PostgreSQL, and ML API can run using Docker Compose.

---

## Live Demo

http://16.170.146.30/

### Demo Credentials

```txt
Email: mw5667155@gmail.com
Password: password123@@
Transaction PIN: 8877
```

---

## Preview

| Login                                       | Wallet Dashboard                                    |
| ------------------------------------------- | --------------------------------------------------- |
| ![Login Screen](docs/screenshots/login.png) | ![Wallet Dashboard](docs/screenshots/dashboard.png) |

| Send Money - Recipient                                       | Send Money - Amount                                    |
| ------------------------------------------------------------ | ------------------------------------------------------ |
| ![Send Money Recipient](docs/screenshots/send-recipient.png) | ![Send Money Amount](docs/screenshots/send-amount.png) |

| Send Money - Confirm                                     | Transaction Receipt                                              |
| -------------------------------------------------------- | ---------------------------------------------------------------- |
| ![Send Money Confirm](docs/screenshots/send-confirm.png) | ![Transaction Receipt](docs/screenshots/transaction-receipt.png) |

| Transaction History                                              | Wallet Audit Log                                           |
| ---------------------------------------------------------------- | ---------------------------------------------------------- |
| ![Transaction History](docs/screenshots/transaction-history.png) | ![Wallet Audit Log](docs/screenshots/wallet-audit-log.png) |

| Fraud Blocked Result                                               | Active Sessions / Settings                                          |
| ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| ![Fraud Blocked Result](docs/screenshots/fraud-blocked-result.png) | ![Settings Active Sessions](docs/screenshots/settings-sessions.png) |

---

## Architecture Diagram

```mermaid
flowchart LR
    U[User / Browser] --> FE[React Frontend]

    FE -->|Login / Wallet / Transfer Requests| API[Node.js + Express API]
    API --> AUTH[JWT Auth Middleware]
    AUTH --> WALLET[Wallet & Transaction Service]

    WALLET -->|Build transaction features| ML[FastAPI ML Service]
    ML --> RF[Random Forest Model]
    RF -->|fraud_score + is_fraud| ML
    ML -->|Prediction Result| WALLET

    WALLET --> DECISION{Fraud score >= 70%?}

    DECISION -->|Yes| BLOCK[Block Transaction]
    BLOCK --> NODB[No DB Write]
    BLOCK --> NOTIFY1[Create Fraud Alert / Notify User]

    DECISION -->|No| PRISMA[Prisma ORM]
    PRISMA --> DB[(PostgreSQL Database)]
    DB --> HISTORY[Transaction History]
    DB --> BALANCE[Wallet Balance Update]
    WALLET --> NOTIFY2[Success Notification]

    HISTORY --> API
    BALANCE --> API
    NOTIFY1 --> API
    NOTIFY2 --> API
    API --> FE

    subgraph Dockerized Local Setup
        FE
        API
        ML
        DB
    end
```

---

## How the Fraud Detection Flow Works

```txt
User initiates transfer
        │
        ▼
React frontend sends request to Express API
        │
        ▼
Express API validates JWT, recipient, amount, and PIN
        │
        ▼
Backend sends transaction features to FastAPI ML service
        │
        ▼
Random Forest model returns fraud_score between 0 and 1
        │
   ┌────┴────────────┐
   │                 │
score >= 0.70    score < 0.70
   │                 │
BLOCKED          PROCESSED
No DB write      Prisma transaction updates balances
User notified    Transaction saved in PostgreSQL
```

### Transfer Decision Logic

1. User enters recipient phone number and note.
2. User enters amount and confirms transfer with transaction PIN.
3. Backend validates authentication, balance, recipient, and PIN.
4. Backend sends transaction features to the FastAPI ML service.
5. ML service returns `fraud_score` and `is_fraud`.
6. If `fraud_score >= 0.70`, the transaction is blocked before database write.
7. If `fraud_score < 0.70`, the transaction is processed and stored using Prisma.
8. User receives success or fraud-blocked notification.

---

## Tech Stack

| Layer           | Technology                           |
| --------------- | ------------------------------------ |
| Frontend        | React.js, Tailwind CSS               |
| Backend         | Node.js, Express.js                  |
| Database        | PostgreSQL                           |
| ORM             | Prisma ORM                           |
| Authentication  | JWT Authentication                   |
| Fraud Detection | FastAPI, scikit-learn, Random Forest |
| DevOps          | Docker, Docker Compose               |
| Cloud           | AWS / Cloud VM                       |
| Version Control | Git, GitHub                          |

---

## Key Technical Decisions

- **PostgreSQL + Prisma** were used because wallet transactions need relational consistency and safe balance updates.
- **Fraud detection runs before database write** so risky transactions are blocked before they affect wallet balances.
- **FastAPI** was used for the ML service because Python has strong support for scikit-learn and model serving.
- **Docker Compose** was used to run frontend, backend, database, and ML service in a consistent local environment.
- **JWT authentication** was used to protect wallet routes and keep user sessions secure.
- **Separate ML service architecture** keeps fraud detection independent from the main Express backend.

---

## Getting Started

### Prerequisites

- Node.js v18+
- Python 3.9+
- PostgreSQL
- Docker and Docker Compose
- Git

---

### Local Setup Without Docker

```bash
# 1. Clone the repository
git clone https://github.com/Wcoder547/safepay.git
cd safepay
```

#### Backend

```bash
cd backend
pnpm install
cp .env.example .env
npx prisma migrate dev
pnpm run dev
```

#### Frontend

```bash
cd frontend
pnpm install
pnpm run dev
```

#### ML API

```bash
cd ml-api
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

### Local Setup With Docker

```bash
git clone https://github.com/Wcoder547/safepay.git
cd safepay
cp backend/.env.example backend/.env
docker compose up --build
```

Default local URLs:

```txt
Frontend: http://localhost:3000
Backend API: http://localhost:5000
ML API: http://localhost:8000
```

---

## Environment Variables

Create `backend/.env`:

```env
PORT=5000
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/safepay
JWT_SECRET=your_jwt_secret_key
ML_API_URL=http://localhost:8000/predict
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

Create `frontend/.env` if your frontend uses Vite:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## API Reference

### Auth Routes

| Method | Endpoint             | Description           |
| ------ | -------------------- | --------------------- |
| POST   | `/api/auth/register` | Register a new user   |
| POST   | `/api/auth/login`    | Login and receive JWT |

### Wallet Routes

| Method | Endpoint                   | Description                |
| ------ | -------------------------- | -------------------------- |
| GET    | `/api/wallet/balance`      | Get current user balance   |
| POST   | `/api/wallet/send`         | Send money to another user |
| GET    | `/api/wallet/transactions` | Get transaction history    |

### Example — Send Money

**Request**

```http
POST /api/wallet/send
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "recipientPhone": "03001217136",
  "amount": 2000,
  "pin": "1234",
  "note": "Rent payment"
}
```

**Success Response**

```json
{
  "status": "success",
  "message": "Transaction completed successfully",
  "transactionId": "txn_abc123",
  "amount": 2000,
  "fraudScore": 0.0
}
```

**Fraud Blocked Response**

```json
{
  "status": "blocked",
  "message": "Transaction flagged as fraudulent and has been blocked",
  "fraudScore": 0.87
}
```

---

## ML Fraud Detection Service

The ML service is located inside `ml-api/` and exposes a prediction endpoint using FastAPI.

### Model Details

| Item                | Detail                            |
| ------------------- | --------------------------------- |
| Algorithm           | Random Forest Classifier          |
| Library             | scikit-learn                      |
| Serving Framework   | FastAPI                           |
| Threshold           | `fraud_score >= 0.70`             |
| Action on High Risk | Block transaction before DB write |

### Prediction Request

```http
POST http://localhost:8000/predict
Content-Type: application/json
```

```json
{
  "amount": 50000,
  "sender_account_age_days": 12,
  "recipient_account_age_days": 3,
  "transactions_last_24h": 8
}
```

### Prediction Response

```json
{
  "fraud_score": 0.87,
  "is_fraud": true
}
```

---

## Deployment

SafePay can be deployed in two ways:

### Option 1: Dockerized Cloud Deployment

All services can run on a cloud VM using Docker Compose.

```bash
docker compose up --build -d
```

### Option 2: Separate Free-Tier Deployment

For portfolio/demo deployment, services can also be deployed separately:

```txt
Frontend: Vercel / Netlify   (see frontend/vercel.json)
Backend:  Render Blueprint   (see render.yaml)
ML API:   Render             (included in render.yaml)
Database: Neon PostgreSQL / Supabase
Env map:  deploy.env.example
```

**Quick path**

1. Create a Neon DB and copy `DATABASE_URL` + `DIRECT_URL`.
2. In Render: New → Blueprint → select this repo (`render.yaml`).
3. Set `CORS_ORIGIN` to your Vercel URL and Twilio/Resend keys.
4. Deploy frontend on Vercel with `VITE_API_URL=https://<backend>.onrender.com/api/v1`.
5. Run migrations once: `cd backend && pnpm migrate:deploy`.
6. For free-tier ML cold starts keep `DEMO_ALLOW_ML_FALLBACK=true` and `ALLOW_MOCK_TOPUP=true`.

### Deployment Note

This project includes Docker/Docker Compose for a production-like local setup. If deployed on free-tier services, the backend or ML API may sleep and take a few seconds to wake up on the first request.

---

## Project Structure

```txt
safepay/
├── backend/                  # Node.js + Express API
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   └── index.js
│   ├── .env.example
│   └── package.json
│
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── App.jsx
│   └── package.json
│
├── ml-api/                   # FastAPI + Random Forest model
│   ├── model/
│   │   └── fraud_model.pkl
│   ├── main.py
│   └── requirements.txt
│
├── docs/
│   └── screenshots/
│       ├── login.png
│       ├── dashboard.png
│       ├── send-recipient.png
│       ├── send-amount.png
│       ├── send-confirm.png
│       ├── transaction-receipt.png
│       ├── transaction-history.png
│       ├── wallet-audit-log.png
│       ├── fraud-blocked-result.png
│       └── settings-sessions.png
│
├── docker-compose.yml
└── README.md
```

---

## Future Improvements

- Add role-based admin dashboard for monitoring suspicious transactions.
- Add two-factor authentication for sensitive wallet actions.
- Add fraud analytics charts for transaction risk patterns.
- Add automated backend tests for wallet and fraud-blocking logic.
- Add Swagger/OpenAPI documentation for backend APIs.
- Add CI/CD pipeline for Docker image build and deployment.
- Add production monitoring and error logging.

---

## Author

**Waseem Akram**  
Full-Stack Developer  
Portfolio: https://www.waseemmalikdev.eu.cc/  
GitHub: https://github.com/Wcoder547  
LinkedIn: https://www.linkedin.com/in/wasim-akram-dev/

---

## License

MIT © [Waseem Akram](https://www.linkedin.com/in/wasim-akram-dev/)
