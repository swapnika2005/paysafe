# SafePay Deployment Guide

This document outlines the deployment architecture, CI/CD pipeline, and manual deployment instructions for the SafePay application on AWS EC2.

## 🏗️ Architecture Overview

SafePay is containerized using Docker and deployed on a single AWS EC2 `t2.micro` instance.

- **Frontend (React/Vite)**: Runs in an Nginx container.
- **Backend (Node.js/Express)**: Runs in a Node container, communicates with Neon Postgres.
- **ML API (Python/FastAPI)**: Runs in a Python container, handles fraud detection.
- **Reverse Proxy (Caddy)**: Handles all incoming HTTP/HTTPS traffic on ports 80/443, automatically provisions Let's Encrypt SSL certificates, and routes requests to the appropriate internal Docker containers.

### 🔗 Live URLs & Server Details
- **Frontend App**: [https://safepay.vynuro.tech](https://safepay.vynuro.tech)
- **Backend API Base**: [https://api.safepay.vynuro.tech](https://api.safepay.vynuro.tech)
- **Backend Health Check**: [https://api.safepay.vynuro.tech/api/v1/health](https://api.safepay.vynuro.tech/api/v1/health)

### 🖥️ AWS EC2 Information
- **Public IP Address**: `3.24.101.7`
- **Instance Type**: `t2.micro` (1GB RAM) with 2GB Swap Memory (configured to prevent OOM errors during build)
- **Operating System**: Ubuntu 26.04 LTS
- **SSH Username**: `ubuntu`
- **SSH Command**:
  ```bash
  ssh -i "SafePay-Server.pem" ubuntu@3.24.101.7
  ```
- **Project Location on Server**: `~/safepay`

---

## 🚀 CI/CD Pipeline (GitHub Actions)

The deployment is fully automated using GitHub Actions. Whenever code is pushed to the `main` branch, the `.github/workflows/aws-ec2-deploy.yml` workflow is triggered.

### What the pipeline does:
1. Connects to the AWS EC2 instance via SSH.
2. Clones or pulls the latest code from the `main` branch (using `git fetch` and `git reset --hard`).
3. Generates the necessary `.env` files for the Frontend, Backend, and ML-API dynamically by injecting your GitHub Secrets.
4. Stops existing containers and rebuilds the new ones using `docker compose up --build -d`.

### Required GitHub Secrets
To ensure the pipeline works, the following secrets must be set in your GitHub repository settings:

**AWS & SSH Secrets**
- `EC2_HOST`: The public IP of your EC2 instance (e.g., `3.24.101.7`).
- `EC2_USERNAME`: The SSH username (usually `ubuntu`).
- `EC2_SSH_KEY`: The raw contents of your `.pem` SSH key file.

**Backend Secrets**
- `DATABASE_URL`: Connection string for Neon Postgres (Pooler URL).
- `DIRECT_URL`: Connection string for Neon Postgres (Direct URL).
- `ACCESS_TOKEN_SECRET`: A secure random string for JWT access tokens.
- `REFRESH_TOKEN_SECRET`: A secure random string for JWT refresh tokens.
- `RESEND_API_KEY`: Your Resend email API key.
- `TWILIO_ACCOUNT_SID`: Your Twilio Account SID.
- `TWILIO_AUTH_TOKEN`: Your Twilio Auth Token.
- `FRONTEND_URL`: `https://safepay.vynuro.tech`

---

## 🛠️ Database & Prisma

Because this project uses the newer **Prisma 7**, database URLs are strictly configured inside `backend/prisma.config.ts`, not in `schema.prisma`. 

When the backend container starts, it automatically runs `npx prisma migrate deploy` via the `docker-entrypoint.sh` script to ensure your Neon database tables are always up-to-date.

---

## 🚑 Manual Deployment / Troubleshooting

If GitHub Actions fails or gets stuck because of local modifications on the server, you can deploy manually.

1. **SSH into your server:**
   ```bash
   ssh -i "SafePay-Server.pem" ubuntu@<your-ec2-ip>
   ```

2. **Navigate to the project directory:**
   ```bash
   cd safepay
   ```

3. **Force reset and pull the latest code:**
   ```bash
   git fetch --all
   git reset --hard origin/main
   git pull origin main
   ```
   *(Note: `git reset --hard` is crucial because if you manually modify files on the server, a standard `git pull` will be blocked).*

4. **Rebuild and restart the containers:**
   ```bash
   docker compose down
   docker compose up --build -d
   ```

### Useful Docker Commands (Run on Server)
- **Check running containers:** `docker ps`
- **View Backend logs:** `docker logs safepay-backend --tail 50`
- **View Caddy/SSL logs:** `docker logs safepay-caddy --tail 50`
- **Restart Backend:** `docker restart safepay-backend`
