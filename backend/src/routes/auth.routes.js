import { Router } from "express";
import {
  register, login, verifyLoginOtp, resendLoginOtp, updateTwoFactor, refresh, logout, me , forgotPassword, resetPassword, changePassword,
  getSessions, revokeSession, revokeAllOtherSessions,
} from "../controllers/auth.controller.js";
import { sendOtp, verifyOtpHandler } from "../controllers/otp.controller.js";
import { changePin, verifyPin } from "../controllers/pin.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// ── Public ──────────────────────────────
router.post("/register", register);
router.post("/login", login);
router.post("/login/verify-otp", verifyLoginOtp);
router.post("/login/resend-otp", resendLoginOtp);
router.post("/refresh", refresh);
router.post("/forgot-password",  forgotPassword);   
router.post("/reset-password",   resetPassword);    

// ── Protected ───────────────────────────
router.get("/me", authenticate, me);
router.patch("/two-factor", authenticate, updateTwoFactor);
router.post("/logout", authenticate, logout);
router.post("/send-otp", authenticate, sendOtp);
router.post("/verify-otp", authenticate, verifyOtpHandler);
router.post("/change-password", authenticate, changePassword);

// ── PIN ─────────────────────────────────
router.post("/pin/change", authenticate, changePin);
router.post("/pin/verify", authenticate, verifyPin);

// ── Sessions ───────────────────────────
router.get("/sessions",        authenticate, getSessions);
router.delete("/sessions/:id", authenticate, revokeSession);
router.delete("/sessions",     authenticate, revokeAllOtherSessions);


export default router;