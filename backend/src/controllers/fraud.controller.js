import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/index.js";


const getFraudReports = AsyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    ...(status && { review_status: status }),
  };

  const [reports, total] = await Promise.all([
    prisma.fraudReport.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: parseInt(limit),
      include: {
        transaction: {
          include: {
            sender:   { select: { id: true, full_name: true, phone: true } },
            receiver: { select: { id: true, full_name: true, phone: true } },
          },
        },
        reviewer: {
          select: { id: true, full_name: true },
        },
      },
    }),
    prisma.fraudReport.count({ where }),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      reports,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    }, "Fraud reports fetched.")
  );
});


const getFraudReport = AsyncHandler(async (req, res) => {
  const report = await prisma.fraudReport.findUnique({
    where: { id: req.params.id },
    include: {
      transaction: {
        include: {
          sender:   { select: { id: true, full_name: true, phone: true } },
          receiver: { select: { id: true, full_name: true, phone: true } },
        },
      },
      reviewer: {
        select: { id: true, full_name: true },
      },
    },
  });

  if (!report) {
    throw new ApiError(404, "Fraud report not found.", { code: "NOT_FOUND" });
  }

  return res.status(200).json(
    new ApiResponse(200, { report }, "Fraud report fetched.")
  );
});


const overrideFraud = AsyncHandler(async (req, res) => {
  const { admin_note } = req.body;
  const { id } = req.params;

  const report = await prisma.fraudReport.findUnique({
    where: { id },
    include: { transaction: true },
  });

  if (!report) {
    throw new ApiError(404, "Fraud report not found.", { code: "NOT_FOUND" });
  }

  if (report.review_status !== "PENDING") {
    throw new ApiError(400, "Report already reviewed.", {
      code: "ALREADY_REVIEWED",
    });
  }

  if (report.transaction.status !== "BLOCKED") {
    throw new ApiError(400, "Only blocked transactions can be overridden.", {
      code: "INVALID_STATUS",
    });
  }

  const amount = parseFloat(report.transaction.amount);
  const senderId = report.transaction.sender_id;
  const receiverId = report.transaction.receiver_id;

  await prisma.$transaction(async (tx) => {
    const debit = await tx.wallet.updateMany({
      where: {
        user_id: senderId,
        balance: { gte: amount },
      },
      data: { balance: { decrement: amount } },
    });

    if (debit.count === 0) {
      throw new ApiError(
        400,
        "Cannot approve: sender has insufficient balance to settle this transfer.",
        { code: "INSUFFICIENT_BALANCE" },
      );
    }

    const updatedSender = await tx.wallet.findUnique({
      where: { user_id: senderId },
    });
    const receiverBefore = await tx.wallet.findUnique({
      where: { user_id: receiverId },
    });
    const updatedReceiver = await tx.wallet.update({
      where: { user_id: receiverId },
      data: { balance: { increment: amount } },
    });

    await tx.fraudReport.update({
      where: { id },
      data: {
        review_status: "FALSE_ALARM",
        admin_note: admin_note || null,
        reviewed_by: req.user.id,
        reviewed_at: new Date(),
      },
    });

    await tx.transaction.update({
      where: { id: report.transaction_id },
      data: { status: "APPROVED", is_fraud: false },
    });

    await tx.walletLog.create({
      data: {
        user_id: senderId,
        transaction_id: report.transaction_id,
        type: "DEBIT",
        amount,
        balance_before: parseFloat(updatedSender.balance) + amount,
        balance_after: updatedSender.balance,
      },
    });

    await tx.walletLog.create({
      data: {
        user_id: receiverId,
        transaction_id: report.transaction_id,
        type: "CREDIT",
        amount,
        balance_before: receiverBefore.balance,
        balance_after: updatedReceiver.balance,
      },
    });

    await tx.notification.create({
      data: {
        user_id: senderId,
        transaction_id: report.transaction_id,
        title: "Transaction Approved ✅",
        message: `Your blocked transaction of ₹${amount} has been reviewed and approved.`,
        type: "SUCCESS",
      },
    });

    await tx.notification.create({
      data: {
        user_id: receiverId,
        transaction_id: report.transaction_id,
        title: "Money Received 💰",
        message: `₹${amount} received after admin review of a blocked transfer.`,
        type: "SUCCESS",
      },
    });
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      "Transaction settled and approved. Fraud report marked as false alarm.",
    ),
  );
});


const confirmFraud = AsyncHandler(async (req, res) => {
  const { admin_note } = req.body;
  const { id } = req.params;

  const report = await prisma.fraudReport.findUnique({
    where: { id },
    include: { transaction: true },
  });

  if (!report) {
    throw new ApiError(404, "Fraud report not found.", { code: "NOT_FOUND" });
  }

  if (report.review_status !== "PENDING") {
    throw new ApiError(400, "Report already reviewed.", {
      code: "ALREADY_REVIEWED",
    });
  }

  await prisma.fraudReport.update({
    where: { id },
    data: {
      review_status: "CONFIRMED_FRAUD",
      admin_note:    admin_note || null,
      reviewed_by:   req.user.id,
      reviewed_at:   new Date(),
    },
  });

  return res.status(200).json(
    new ApiResponse(200, null, "Fraud confirmed and logged.")
  );
});

export { getFraudReports, getFraudReport, overrideFraud, confirmFraud };