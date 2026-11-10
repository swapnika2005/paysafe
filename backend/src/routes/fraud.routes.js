import { Router } from "express";
import {
  getFraudReports, getFraudReport,
  overrideFraud, confirmFraud,
} from "../controllers/fraud.controller.js";
import { authenticate }  from "../middlewares/auth.middleware.js";
import { requireAdmin }  from "../middlewares/admin.middleware.js";

const router = Router();
router.use(authenticate, requireAdmin);

router.get("/",              getFraudReports);
router.get("/:id",           getFraudReport);
router.post("/:id/override", overrideFraud);
router.post("/:id/confirm",  confirmFraud);

export default router;