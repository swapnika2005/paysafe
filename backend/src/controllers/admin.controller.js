import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/index.js";

const getAllUsers = AsyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, role, is_frozen } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    ...(role && { role }),
    ...(is_frozen !== undefined && { is_frozen: is_frozen === "true" }),
    ...(search && {
      OR: [
        { full_name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { pan: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: parseInt(limit),
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        pan: true,
        role: true,
        is_frozen: true,
        is_verified: true,
        created_at: true,
        last_login: true,
        wallet: {
          select: { balance: true, currency: true },
        },
        _count: {
          select: {
            sent: true,
            received: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
      "Users fetched.",
    ),
  );
});

const getUserDetail = AsyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      full_name: true,
      email: true,
      phone: true,
      pan: true,
      role: true,
      is_frozen: true,
      is_verified: true,
      avatar_url: true,
      created_at: true,
      last_login: true,
      wallet: {
        select: { balance: true, currency: true },
      },
      sent: {
        take: 5,
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          amount: true,
          status: true,
          created_at: true,
          receiver: { select: { full_name: true, phone: true } },
        },
      },
      _count: {
        select: {
          sent: true,
          received: true,
        },
      },
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found.", { code: "NOT_FOUND" });
  }

  return res.status(200).json(new ApiResponse(200, { user }, "User fetched."));
});

const freezeUser = AsyncHandler(async (req, res) => {
  const { reason } = req.body;
  const { id } = req.params;

  // Prevent freezing yourself
  if (id === req.user.id) {
    throw new ApiError(400, "You cannot freeze your own account.", {
      code: "SELF_ACTION",
    });
  }

  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new ApiError(404, "User not found.", { code: "NOT_FOUND" });
  }

  if (user.is_frozen) {
    throw new ApiError(400, "Account is already frozen.", {
      code: "ALREADY_FROZEN",
    });
  }

  // Freeze user + revoke all sessions atomically
  await prisma.$transaction([
    prisma.user.update({
      where: { id },
      data: { is_frozen: true },
    }),
    prisma.session.updateMany({
      where: { user_id: id, is_revoked: false },
      data: { is_revoked: true },
    }),
    prisma.notification.create({
      data: {
        user_id: id,
        title: "Account Suspended",
        message: reason
          ? `Your account has been suspended. Reason: ${reason}`
          : "Your account has been suspended. Contact support@paysafe.in",
        type: "FRAUD_ALERT",
      },
    }),
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, null, "Account frozen and all sessions revoked."),
    );
});

const unfreezeUser = AsyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new ApiError(404, "User not found.", { code: "NOT_FOUND" });
  }

  if (!user.is_frozen) {
    throw new ApiError(400, "Account is not frozen.", {
      code: "NOT_FROZEN",
    });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id },
      data: { is_frozen: false },
    }),
    prisma.notification.create({
      data: {
        user_id: id,
        title: "Account Restored ✅",
        message:
          "Your account has been restored. You can now send and receive money.",
        type: "SUCCESS",
      },
    }),
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Account unfrozen successfully."));
});

const getDashboardStats = AsyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    frozenUsers,
    totalTransactions,
    todayTransactions,
    blockedTransactions,
    approvedTransactions,
    pendingFraudReports,
    totalVolume,
    todayVolume,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { is_frozen: true } }),
    prisma.transaction.count(),
    prisma.transaction.count({ where: { created_at: { gte: today } } }),
    prisma.transaction.count({ where: { status: "BLOCKED" } }),
    prisma.transaction.count({ where: { status: "APPROVED" } }),
    prisma.fraudReport.count({ where: { review_status: "PENDING" } }),
    prisma.transaction.aggregate({
      where: { status: "APPROVED" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { status: "APPROVED", created_at: { gte: today } },
      _sum: { amount: true },
    }),
  ]);

  const fraudRate =
    totalTransactions > 0
      ? ((blockedTransactions / totalTransactions) * 100).toFixed(2)
      : "0.00";

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        users: {
          total: totalUsers,
          frozen: frozenUsers,
          active: totalUsers - frozenUsers,
        },
        transactions: {
          total: totalTransactions,
          today: todayTransactions,
          approved: approvedTransactions,
          blocked: blockedTransactions,
          fraud_rate: `${fraudRate}%`,
        },
        fraud: {
          pending_reviews: pendingFraudReports,
        },
        volume: {
          total_inr: totalVolume._sum.amount || 0,
          today_inr: todayVolume._sum.amount || 0,
        },
      },
      "Dashboard stats fetched.",
    ),
  );
});

export {
  getAllUsers,
  getUserDetail,
  freezeUser,
  unfreezeUser,
  getDashboardStats,
};
