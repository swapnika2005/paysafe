import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/index.js";


const getNotifications = AsyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unread_only } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    user_id: req.user.id,
    ...(unread_only === "true" && { is_read: false }),
  };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: parseInt(limit),
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        is_read: true,
        created_at: true,
        transaction_id: true,
      },
    }),
    prisma.notification.count({ where }),
    // Always return unread count regardless of filter
    prisma.notification.count({
      where: { user_id: req.user.id, is_read: false },
    }),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      notifications,
      unread_count: unreadCount,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    }, "Notifications fetched successfully.")
  );
});


const markOneRead = AsyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await prisma.notification.findUnique({
    where: { id },
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found.", { code: "NOT_FOUND" });
  }

  // Only owner can mark their notification
  if (notification.user_id !== req.user.id) {
    throw new ApiError(403, "Forbidden.", { code: "FORBIDDEN" });
  }

  // Already read — no need to update
  if (notification.is_read) {
    return res.status(200).json(
      new ApiResponse(200, { is_read: true }, "Already marked as read.")
    );
  }

  await prisma.notification.update({
    where: { id },
    data: { is_read: true },
  });

  return res.status(200).json(
    new ApiResponse(200, { is_read: true }, "Notification marked as read.")
  );
});


const markAllRead = AsyncHandler(async (req, res) => {
  const { count } = await prisma.notification.updateMany({
    where: {
      user_id: req.user.id,
      is_read: false,
    },
    data: { is_read: true },
  });

  return res.status(200).json(
    new ApiResponse(200, {
      updated: count,
    }, `${count} notification${count === 1 ? "" : "s"} marked as read.`)
  );
});


const deleteOne = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const notif = await prisma.notification.findUnique({ where: { id } });
  if (!notif) {
    throw new ApiError(404, "Notification not found.", { code: "NOT_FOUND" });
  }
  if (notif.user_id !== req.user.id) {
    throw new ApiError(403, "Forbidden.", { code: "FORBIDDEN" });
  }
  await prisma.notification.delete({ where: { id } });
  return res.status(200).json(
    new ApiResponse(200, null, "Notification deleted successfully.")
  );
}); 

export { getNotifications, markOneRead, markAllRead, deleteOne };