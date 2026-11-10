import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/index.js";


const getTransaction = AsyncHandler(async (req, res) => {
  const { id } = req.params;

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      sender: {
        select: { id: true, full_name: true, phone: true }
      },
      receiver: {
        select: { id: true, full_name: true, phone: true }
      },
      fraud_report: {
        select: {
          risk_score: true,
          fraud_signals: true,
          review_status: true,
          ml_model_version: true,
        }
      },
    },
  });

  if (!transaction) {
    throw new ApiError(404, "Transaction not found.", { code: "NOT_FOUND" });
  }

  
  const isInvolved =
    transaction.sender_id === req.user.id ||
    transaction.receiver_id === req.user.id;

  if (!isInvolved && req.user.role !== "admin") {
    throw new ApiError(403, "You are not authorized to view this transaction.", {
      code: "FORBIDDEN",
    });
  }

  
  const direction =
    transaction.sender_id === req.user.id ? "SENT" : "RECEIVED";

  return res.status(200).json(
    new ApiResponse(200, {
      transaction: { ...transaction, direction }
    }, "Transaction fetched successfully.")
  );
});


const getReceipt = AsyncHandler(async (req, res) => {
  const { id } = req.params;

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      sender: {
        select: { full_name: true, phone: true }
      },
      receiver: {
        select: { full_name: true, phone: true }
      },
    },
  });

  if (!transaction) {
    throw new ApiError(404, "Transaction not found.", { code: "NOT_FOUND" });
  }

 
  const isInvolved =
    transaction.sender_id === req.user.id ||
    transaction.receiver_id === req.user.id;

  if (!isInvolved) {
    throw new ApiError(403, "Forbidden.", { code: "FORBIDDEN" });
  }

  
  if (transaction.status !== "APPROVED") {
    throw new ApiError(400, "Receipt only available for approved transactions.", {
      code: "RECEIPT_UNAVAILABLE",
    });
  }

  const receipt = {
    receipt_id: `TXN-${transaction.id.slice(0, 8).toUpperCase()}`,
    transaction_id: transaction.id,
    status: transaction.status,
    amount: transaction.amount,
    currency: "INR",
    note: transaction.note || null,
    sender: {
      name: transaction.sender.full_name,
      phone: transaction.sender.phone,
    },
    receiver: {
      name: transaction.receiver.full_name,
      phone: transaction.receiver.phone,
    },
    timestamp: transaction.created_at,
    processed_at: transaction.updated_at,
  };

  return res.status(200).json(
    new ApiResponse(200, { receipt }, "Receipt fetched successfully.")
  );
});

export { getTransaction, getReceipt };