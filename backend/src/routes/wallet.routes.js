import { Router } from "express";
import {
  getBalance,
  topUp,
  sendMoney,
  getHistory,
  getWalletLogs,
  getStats,
  getRecentContacts,
  lookupUser,
} from "../controllers/wallet.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requireVerified } from "../middlewares/verified.middleware.js";

const router = Router();

router.use(authenticate);
router.get("/balance", getBalance);
router.get("/history", getHistory);
router.get("/logs", getWalletLogs);
router.get("/stats", getStats);
router.get("/recent-contacts", getRecentContacts);
router.get("/lookup", lookupUser);

// Money-moving actions require a verified phone
router.post("/topup", requireVerified, topUp);
router.post("/send", requireVerified, sendMoney);

export default router;