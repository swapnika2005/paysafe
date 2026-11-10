import { Router } from "express";
import {
  getAllUsers, getUserDetail,
  freezeUser, unfreezeUser,
  getDashboardStats,
} from "../controllers/admin.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/admin.middleware.js";

const router = Router();
router.use(authenticate, requireAdmin);

router.get("/stats",               getDashboardStats);
router.get("/users",               getAllUsers);
router.get("/users/:id",           getUserDetail);
router.post("/users/:id/freeze",   freezeUser);
router.post("/users/:id/unfreeze", unfreezeUser);

export default router;