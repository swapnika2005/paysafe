import { Router } from "express";
import {
  getTransaction,
  getReceipt,
} from "../controllers/transactions.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/:id",         getTransaction);
router.get("/:id/receipt", getReceipt);

export default router;