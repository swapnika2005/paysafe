import { beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const runIntegration = process.env.RUN_INTEGRATION === "true";

describe.skipIf(!runIntegration)("wallet/auth integration", () => {
  let app;
  let prisma;
  const suffix = Date.now();
  const senderEmail = `sender_${suffix}@test.safepay.local`;
  const receiverEmail = `receiver_${suffix}@test.safepay.local`;
  const senderPhone = `0399${String(suffix).slice(-7)}`;
  const receiverPhone = `0388${String(suffix).slice(-7)}`;
  const password = "TestPass123@@";
  const pin = "1234";
  let accessToken = "";
  let senderId = "";
  let receiverId = "";

  beforeAll(async () => {
    process.env.DEMO_ALLOW_ML_FALLBACK = "true";
    process.env.ALLOW_MOCK_TOPUP = "true";
    process.env.NODE_ENV = "development";
    // Fail ML fast so tests don't wait on the 5s axios timeout
    process.env.ML_API_URL = "http://127.0.0.1:9";

    const db = await import("../db/index.js");
    prisma = db.prisma;
    await prisma.$connect();

    const password_hash = await bcrypt.hash(password, 10);
    const pin_hash = await bcrypt.hash(pin, 10);

    const sender = await prisma.user.create({
      data: {
        full_name: "Integration Sender",
        email: senderEmail,
        phone: senderPhone,
        password_hash,
        pin_hash,
        is_verified: true,
        is_email_verified: true,
        two_factor_enabled: false,
        wallet: { create: { balance: 5000 } },
      },
    });
    senderId = sender.id;

    const receiver = await prisma.user.create({
      data: {
        full_name: "Integration Receiver",
        email: receiverEmail,
        phone: receiverPhone,
        password_hash,
        pin_hash,
        is_verified: true,
        wallet: { create: { balance: 0 } },
      },
    });
    receiverId = receiver.id;

    const mod = await import("../app.js");
    app = mod.app;
  }, 60000);

  it("logs in and returns access token", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: senderEmail, password });

    expect(res.status).toBe(200);
    expect(res.body?.data?.access_token).toBeTruthy();
    accessToken = res.body.data.access_token;
  });

  it("requires the SMS code before completing a two-factor login", async () => {
    await prisma.user.update({
      where: { id: senderId },
      data: { two_factor_enabled: true },
    });
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    try {
      const challenge = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: senderEmail, password });

      expect(challenge.status).toBe(200);
      expect(challenge.body?.data?.requires_2fa).toBe(true);
      expect(challenge.body?.data?.access_token).toBeUndefined();
      expect(challenge.body?.data?.challenge_token).toBeTruthy();

      const output = logSpy.mock.calls.flat().join(" ");
      const code = output.match(/sign-in code is: (\d{6})/)?.[1];
      expect(code).toBeTruthy();

      const verified = await request(app)
        .post("/api/v1/auth/login/verify-otp")
        .send({
          challenge_token: challenge.body.data.challenge_token,
          code,
        });

      expect(verified.status).toBe(200);
      expect(verified.body?.data?.access_token).toBeTruthy();
      expect(verified.headers["set-cookie"]).toBeTruthy();
      accessToken = verified.body.data.access_token;
    } finally {
      logSpy.mockRestore();
      await prisma.user.update({
        where: { id: senderId },
        data: { two_factor_enabled: false },
      });
    }
  });

  it("rejects send for unverified user", async () => {
    const unverifiedEmail = `unverified_${suffix}@test.safepay.local`;
    const password_hash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        full_name: "Unverified User",
        email: unverifiedEmail,
        phone: `0377${String(suffix).slice(-7)}`,
        password_hash,
        is_verified: false,
        wallet: { create: { balance: 1000 } },
      },
    });

    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: unverifiedEmail, password });

    // login may succeed but wallet send must be blocked
    if (login.status === 200 && login.body?.data?.access_token) {
      const send = await request(app)
        .post("/api/v1/wallet/send")
        .set("Authorization", `Bearer ${login.body.data.access_token}`)
        .send({
          receiver_phone: receiverPhone,
          amount: 10,
          pin,
        });
      expect(send.status).toBe(403);
      expect(send.body?.message || "").toMatch(/verify/i);
    }
  });

  it(
    "tops up then sends money idempotently",
    async () => {
      expect(accessToken).toBeTruthy();

      const topup = await request(app)
        .post("/api/v1/wallet/topup")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ amount: 100 });
      expect([200, 403]).toContain(topup.status);

      const key = `idem_${suffix}`;
      const payload = {
        receiver_phone: receiverPhone,
        amount: 50,
        note: "integration test",
        pin,
      };

      const first = await request(app)
        .post("/api/v1/wallet/send")
        .set("Authorization", `Bearer ${accessToken}`)
        .set("Idempotency-Key", key)
        .send(payload);

      expect(first.status).toBe(200);
      expect(["APPROVED", "BLOCKED"]).toContain(first.body?.data?.status);

      const second = await request(app)
        .post("/api/v1/wallet/send")
        .set("Authorization", `Bearer ${accessToken}`)
        .set("Idempotency-Key", key)
        .send(payload);

      expect(second.status).toBe(200);
      expect(second.body?.data?.transaction_id).toBe(
        first.body?.data?.transaction_id,
      );
      expect(second.body?.data?.idempotent_replay).toBe(true);
    },
    20000,
  );

  it("does not overdraft on concurrent sends", async () => {
    // Reset sender balance to a known small amount
    await prisma.wallet.update({
      where: { user_id: senderId },
      data: { balance: 100 },
    });

    const attempts = await Promise.all(
      [1, 2, 3].map((i) =>
        request(app)
          .post("/api/v1/wallet/send")
          .set("Authorization", `Bearer ${accessToken}`)
          .set("Idempotency-Key", `race_${suffix}_${i}`)
          .send({
            receiver_phone: receiverPhone,
            amount: 80,
            pin,
            note: `race-${i}`,
          }),
      ),
    );

    const approved = attempts.filter(
      (r) => r.status === 200 && r.body?.data?.status === "APPROVED",
    );
    const failed = attempts.filter(
      (r) => r.status === 400 || r.body?.data?.status === "BLOCKED",
    );

    expect(approved.length).toBeLessThanOrEqual(1);
    expect(approved.length + failed.length).toBe(3);

    const wallet = await prisma.wallet.findUnique({
      where: { user_id: senderId },
    });
    expect(parseFloat(wallet.balance)).toBeGreaterThanOrEqual(0);
    expect(parseFloat(wallet.balance)).toBeLessThanOrEqual(100);
  });
});
