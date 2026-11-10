import jwt from "jsonwebtoken";
import crypto from "crypto";

export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m" }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" }
  );
};

export const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,       // JS cannot read it — XSS protection
  secure: process.env.NODE_ENV === "production", // HTTPS only in prod
  sameSite: "strict",   // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};