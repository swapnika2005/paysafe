import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/index.js";
import bcrypt from "bcryptjs";
import { checkFraud } from "../services/fraud.service.js";

const getBalance = AsyncHandler(async (req, res) => {
  const wallet = await prisma.wallet.findUnique({
    where: { user_id: req.user.id },
    select: {
      id: true,
      balance: true,
      currency: true,
      updated_at: true,
    },
  });

  if (!wallet) {
    throw new ApiError(404, "Wallet not found.", { code: "NOT_FOUND" });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { wallet }, "Wallet fetched successfully."));
});

const topUp = AsyncHandler(async (req, res) => {
  // Mock top-up is demo-only. Off by default in production.
  const allowMockTopup =
    process.env.ALLOW_MOCK_TOPUP === "true" ||
    process.env.NODE_ENV !== "production";

  if (!allowMockTopup) {
    throw new ApiError(403, "Mock top-up is disabled in production.", {
      code: "TOPUP_DISABLED",
    });
  }

  const { amount } = req.body;

  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    throw new ApiError(422, "Invalid amount.", {
      code: "VALIDATION_ERROR",
      fields: { amount: "Must be a positive number." },
    });
  }

  if (Number(amount) > 296000) {
    throw new ApiError(422, "Max top-up is ₹296,000 at a time.", {
      code: "VALIDATION_ERROR",
      fields: { amount: "Exceeds maximum top-up limit." },
    });
  }

  const topupAmount = parseFloat(amount);

  const wallet = await prisma.$transaction(async (tx) => {
    const current = await tx.wallet.findUnique({
      where: { user_id: req.user.id },
    });

    if (!current) {
      throw new ApiError(404, "Wallet not found.");
    }

    const transaction = await tx.transaction.create({
      data: {
        sender: {
          connect: { id: req.user.id },
        },
        receiver: {
          connect: { id: req.user.id },
        },
        amount: topupAmount,
        status: "APPROVED",
        is_fraud: false,
        fraud_reasons: [],
      },
    });

    const updated = await tx.wallet.update({
      where: { user_id: req.user.id },
      data: { balance: { increment: topupAmount } },
    });

    await tx.walletLog.create({
      data: {
        user: { connect: { id: req.user.id } },
        transaction: { connect: { id: transaction.id } },
        type: "TOPUP",
        amount: topupAmount,
        balance_before: current.balance,
        balance_after: updated.balance,
      },
    });

    return updated;
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        balance: wallet.balance,
        currency: wallet.currency,
        topped_up: topupAmount,
      },
      `₹${topupAmount} added to your wallet.`,
    ),
  );
});

const sendMoney = AsyncHandler(async (req, res) => {
  const { receiver_phone, amount, note, pin } = req.body;
  const idempotencyKey =
    req.headers["idempotency-key"] || req.body.idempotency_key || null;

  // ── 1. Validate input ──
  if (!receiver_phone || !amount || !pin) {
    throw new ApiError(422, "receiver_phone, amount and pin are required.", {
      code: "VALIDATION_ERROR",
      fields: {
        ...(!receiver_phone && { receiver_phone: "Required." }),
        ...(!amount && { amount: "Required." }),
        ...(!pin && { pin: "Required." }),
      },
    });
  }

  if (isNaN(amount) || Number(amount) <= 0) {
    throw new ApiError(422, "Invalid amount.", {
      code: "VALIDATION_ERROR",
      fields: { amount: "Must be a positive number." },
    });
  }

  if (Number(amount) > 1480000) {
    throw new ApiError(422, "Exceeds transaction limit of ₹1,480,000.", {
      code: "VALIDATION_ERROR",
      fields: { amount: "Max single transaction is ₹1,480,000." },
    });
  }

  const sendAmount = parseFloat(amount);

  // ── Idempotent replay ──
  if (idempotencyKey) {
    const existing = await prisma.transaction.findUnique({
      where: {
        sender_id_idempotency_key: {
          sender_id: req.user.id,
          idempotency_key: String(idempotencyKey),
        },
      },
      include: {
        receiver: { select: { full_name: true, phone: true } },
      },
    });

    if (existing) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            status: existing.status,
            risk_score: existing.risk_score,
            reasons: existing.fraud_reasons,
            transaction_id: existing.id,
            amount: existing.amount,
            idempotent_replay: true,
            receiver: existing.receiver
              ? {
                  name: existing.receiver.full_name,
                  phone: existing.receiver.phone,
                }
              : undefined,
          },
          "Idempotent replay of existing transfer.",
        ),
      );
    }
  }

  // ── 2. Find receiver ──
  const receiver = await prisma.user.findUnique({
    where: { phone: receiver_phone },
    include: { wallet: true },
  });

  if (!receiver) {
    throw new ApiError(404, "No account found with this phone number.", {
      code: "USER_NOT_FOUND",
    });
  }

  // ── 3. No self-transfer ──
  if (receiver.id === req.user.id) {
    throw new ApiError(400, "You cannot send money to yourself.", {
      code: "SELF_TRANSFER",
    });
  }

  // ── 4. Receiver not frozen ──
  if (receiver.is_frozen) {
    throw new ApiError(400, "Receiver account is unavailable.", {
      code: "RECEIVER_FROZEN",
    });
  }

  // ── 5. Get sender ──
  const sender = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { wallet: true },
  });

  if (!sender?.wallet) {
    throw new ApiError(404, "Wallet not found.", { code: "NOT_FOUND" });
  }

  if (!sender.pin_hash) {
    throw new ApiError(400, "Transaction PIN is not set.", {
      code: "PIN_NOT_SET",
    });
  }

  // Early balance hint (authoritative check happens inside the transfer txn)
  if (parseFloat(sender.wallet.balance) < sendAmount) {
    throw new ApiError(400, "Insufficient balance.", {
      code: "INSUFFICIENT_BALANCE",
      data: {
        available: sender.wallet.balance,
        required: sendAmount,
      },
    });
  }

  // ── 6. Verify PIN ──
  const isPinValid = await bcrypt.compare(pin, sender.pin_hash);
  if (!isPinValid) {
    throw new ApiError(401, "Incorrect PIN.", { code: "INVALID_PIN" });
  }

  // ── 7. ML Fraud Check ──
  const [senderTxnCount, receiverTxnCount] = await Promise.all([
    prisma.transaction.count({ where: { sender_id: req.user.id } }),
    prisma.transaction.count({ where: { receiver_id: receiver.id } }),
  ]);

  const fraudResult = await checkFraud({
    amount: sendAmount,
    hour_of_day: new Date().getHours(),
    sender_txn_count: senderTxnCount,
    receiver_txn_count: receiverTxnCount,
    device_ip: req.ip,
  });

  const { risk_score, is_fraud, reasons, fallback } = fraudResult;

  // ── 8. BLOCKED ──
  if (is_fraud) {
    const blockedTxn = await prisma.$transaction(async (tx) => {
      const txn = await tx.transaction.create({
        data: {
          sender_id: req.user.id,
          receiver_id: receiver.id,
          amount: sendAmount,
          note,
          status: "BLOCKED",
          risk_score,
          is_fraud: true,
          fraud_reasons: reasons,
          device_ip: req.ip,
          hour_of_day: new Date().getHours(),
          device_type: req.headers["user-agent"]?.includes("Mobile")
            ? "mobile"
            : "web",
          idempotency_key: idempotencyKey ? String(idempotencyKey) : null,
        },
      });

      await tx.fraudReport.create({
        data: {
          transaction_id: txn.id,
          risk_score,
          fraud_signals: reasons,
          ml_model_version: process.env.ML_MODEL_VERSION || "v1.0.0",
        },
      });

      await tx.notification.create({
        data: {
          user_id: req.user.id,
          transaction_id: txn.id,
          title: "Transaction Blocked 🚨",
          message: `Your transfer of ₹${sendAmount} to ${receiver.full_name} was blocked due to suspicious activity.`,
          type: "FRAUD_ALERT",
        },
      });

      return txn;
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          status: "BLOCKED",
          risk_score,
          reasons,
          transaction_id: blockedTxn.id,
        },
        "Transaction blocked due to suspicious activity.",
      ),
    );
  }

  // ── 9. APPROVED — atomic debit with conditional balance lock ──
  const txn = await prisma.$transaction(async (tx) => {
    // Conditional decrement: only succeeds if balance >= amount (prevents overdraft races)
    const debit = await tx.wallet.updateMany({
      where: {
        user_id: req.user.id,
        balance: { gte: sendAmount },
      },
      data: { balance: { decrement: sendAmount } },
    });

    if (debit.count === 0) {
      throw new ApiError(400, "Insufficient balance.", {
        code: "INSUFFICIENT_BALANCE",
      });
    }

    const updatedSender = await tx.wallet.findUnique({
      where: { user_id: req.user.id },
    });

    const receiverBefore = await tx.wallet.findUnique({
      where: { user_id: receiver.id },
    });

    const updatedReceiver = await tx.wallet.update({
      where: { user_id: receiver.id },
      data: { balance: { increment: sendAmount } },
    });

    const created = await tx.transaction.create({
      data: {
        sender_id: req.user.id,
        receiver_id: receiver.id,
        amount: sendAmount,
        note,
        status: "APPROVED",
        risk_score,
        is_fraud: false,
        fraud_reasons: reasons,
        device_ip: req.ip,
        hour_of_day: new Date().getHours(),
        device_type: req.headers["user-agent"]?.includes("Mobile")
          ? "mobile"
          : "web",
        idempotency_key: idempotencyKey ? String(idempotencyKey) : null,
      },
    });

    const senderBalanceBefore =
      parseFloat(updatedSender.balance) + sendAmount;

    await tx.walletLog.create({
      data: {
        user_id: req.user.id,
        transaction_id: created.id,
        type: "DEBIT",
        amount: sendAmount,
        balance_before: senderBalanceBefore,
        balance_after: updatedSender.balance,
      },
    });

    await tx.walletLog.create({
      data: {
        user_id: receiver.id,
        transaction_id: created.id,
        type: "CREDIT",
        amount: sendAmount,
        balance_before: receiverBefore.balance,
        balance_after: updatedReceiver.balance,
      },
    });

    await tx.notification.create({
      data: {
        user_id: req.user.id,
        transaction_id: created.id,
        title: "Money Sent ✅",
        message: `₹${sendAmount} sent to ${receiver.full_name} successfully.`,
        type: "SUCCESS",
      },
    });

    await tx.notification.create({
      data: {
        user_id: receiver.id,
        transaction_id: created.id,
        title: "Money Received 💰",
        message: `₹${sendAmount} received from ${sender.full_name}.`,
        type: "SUCCESS",
      },
    });

    return created;
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        status: "APPROVED",
        risk_score,
        fallback: fallback || false,
        transaction_id: txn.id,
        amount: sendAmount,
        receiver: {
          name: receiver.full_name,
          phone: receiver_phone,
        },
      },
      `₹${sendAmount} sent to ${receiver.full_name} successfully.`,
    ),
  );
});

const getHistory = AsyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, type } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  let where = {
    OR: [{ sender_id: req.user.id }, { receiver_id: req.user.id }],
  };

  if (status) where.status = status;
  if (type === "SENT")
    where = { sender_id: req.user.id, ...(status && { status }) };
  if (type === "RECEIVED")
    where = { receiver_id: req.user.id, ...(status && { status }) };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: parseInt(limit),
      select: {
        id: true,
        amount: true,
        note: true,
        status: true,
        risk_score: true,
        is_fraud: true,
        hour_of_day: true,
        created_at: true,
        sender: {
          select: { id: true, full_name: true, phone: true },
        },
        receiver: {
          select: { id: true, full_name: true, phone: true },
        },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        transactions,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
      "Transaction history fetched.",
    ),
  );
});

const getWalletLogs = AsyncHandler(async (req, res) => {
  const { page = 1, limit = 20, export: exportCsv, type, search } = req.query;
  const isExport = exportCsv === "true";
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // build where clause
  const where = {
    user_id: req.user.id,
    ...(type && type !== "ALL" ? { type } : {}),
    ...(search
      ? {
          transaction_id: { contains: search, mode: "insensitive" },
        }
      : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.walletLog.findMany({
      where,
      orderBy: { created_at: "desc" },
      ...(isExport ? {} : { skip, take: parseInt(limit) }),
      select: {
        id: true,
        type: true,
        amount: true,
        balance_before: true,
        balance_after: true,
        created_at: true,
        transaction_id: true,
      },
    }),
    prisma.walletLog.count({ where }),
  ]);

  if (isExport) {
    const csv = [
      "Date,Type,Amount,Balance Before,Balance After,Txn ID",
      ...logs.map((l) =>
        [
          new Date(l.created_at).toLocaleString(),
          l.type,
          l.amount,
          l.balance_before,
          l.balance_after,
          l.transaction_id ?? "",
        ].join(","),
      ),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=wallet-logs.csv",
    );
    return res.send(csv);
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        logs,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
      "Wallet logs fetched.",
    ),
  );
});

const getStats = AsyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [sent, received, blocked, total_transactions] = await Promise.all([
    prisma.transaction.aggregate({
      where: { sender_id: userId, status: "APPROVED" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { receiver_id: userId, status: "APPROVED" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { sender_id: userId, status: "BLOCKED" },
      _sum: { amount: true },
    }),
    prisma.transaction.count({
      where: {
        OR: [{ sender_id: userId }, { receiver_id: userId }],
      },
    }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        total_sent: sent._sum.amount || 0,
        total_received: received._sum.amount || 0,
        total_blocked: blocked._sum.amount || 0,
        total_transactions,
      },
      "Wallet stats fetched.",
    ),
  );
});

const lookupUser = AsyncHandler(async (req, res) => {
  const { phone } = req.query;
  

  if (!phone) {
    throw new ApiError(422, "Phone number is required.", {
      code: "VALIDATION_ERROR",
    });
  }

  const user = await prisma.user.findUnique({
    where: { phone },
    select: { id: true, full_name: true, phone: true, is_frozen: true },
  });

  if (!user) {
    throw new ApiError(404, "No PaySafe account found on this number.", {
      code: "USER_NOT_FOUND",
    });
  }


  if (user.id === req.user.id) {
    throw new ApiError(400, "You cannot send money to yourself.", {
      code: "SELF_TRANSFER",
    });
  }

  if (user.is_frozen) {
    throw new ApiError(400, "This account is unavailable.", {
      code: "ACCOUNT_FROZEN",
    });
  }

  return res.status(200).json(
    new ApiResponse(200, { full_name: user.full_name, phone: user.phone }, "User found.")
  );
});

const getRecentContacts = AsyncHandler(async (req, res) => {
  const recentTxns = await prisma.transaction.findMany({
    where: {
      sender_id: req.user.id,
      status: "APPROVED",
      receiver_id: { not: req.user.id },
    },
    orderBy: { created_at: "desc" },
    take: 50,
    select: {
      receiver: {
        select: { full_name: true, phone: true },
      },
    },
  });

  
  const seen = new Set();
  const contacts = [];
  for (const txn of recentTxns) {
    const phone = txn.receiver.phone;
    if (phone === req.user.phone) continue;
    if (!seen.has(phone)) {
      seen.add(phone);
      contacts.push({ full_name: txn.receiver.full_name, phone });
    }
    if (contacts.length === 5) break;
  }

  return res.status(200).json(
    new ApiResponse(200, contacts, "Recent contacts fetched.")
  );
});
export { getBalance, topUp, sendMoney, getHistory, getWalletLogs, getStats , getRecentContacts, lookupUser};
