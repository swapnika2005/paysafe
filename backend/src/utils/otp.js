import crypto from "crypto";
import bcrypt from "bcryptjs";

export const generateOtp = () => {
  // crypto.randomInt is cryptographically secure — never use Math.random for OTPs
  return crypto.randomInt(100000, 999999).toString();
};

export const hashOtp = async (code) => {
  return await bcrypt.hash(code, 10);
};

export const compareOtp = async (code, hash) => {
  return await bcrypt.compare(code, hash);
};