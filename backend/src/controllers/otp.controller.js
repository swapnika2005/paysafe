import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/index.js";
import { generateOtp, hashOtp, compareOtp } from "../utils/otp.js";
import { sendSms } from "../services/sms.service.js";
import { sendEmail } from "../services/email.service.js";

const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RATE_LIMIT = 3; 
const OTP_RATE_WINDOW_MINUTES = 10;


const sendOtp = AsyncHandler(async (req, res) => {
  const { type } = req.body;
  const userId = req.user.id;

  
  const allowedTypes = ["PHONE_VERIFY", "EMAIL_VERIFY"];
  if (!type || !allowedTypes.includes(type)) {
    throw new ApiError(422, "Invalid OTP type.", {
      code: "VALIDATION_ERROR",
      fields: { type: "Must be PHONE_VERIFY or EMAIL_VERIFY" },
    });
  }

 
  if (type === "PHONE_VERIFY" && req.user.is_verified) {
    throw new ApiError(400, "Phone is already verified.", {
      code: "ALREADY_VERIFIED",
    });
  }
  if (type === "EMAIL_VERIFY" && req.user.is_email_verified) {
    throw new ApiError(400, "Email is already verified.", {
      code: "ALREADY_VERIFIED",
    });
  }

  
  const windowStart = new Date(
    Date.now() - OTP_RATE_WINDOW_MINUTES * 60 * 1000
  );
  const recentCount = await prisma.otp.count({
    where: {
      user_id: userId,
      purpose: type,
      created_at: { gte: windowStart },
    },
  });

  if (recentCount >= OTP_RATE_LIMIT) {
    throw new ApiError(
      429,
      `Too many OTP requests. Please wait ${OTP_RATE_WINDOW_MINUTES} minutes.`,
      { code: "RATE_LIMIT_EXCEEDED" }
    );
  }

  
  await prisma.otp.updateMany({
    where: { user_id: userId, purpose: type, is_used: false },
    data: { is_used: true },
  });

  
  const code = generateOtp();
  const code_hash = await hashOtp(code);
  const expires_at = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otp.create({
    data: { user_id: userId, code_hash, purpose: type, expires_at },
  });

  
  if (type === "PHONE_VERIFY") {
    await sendSms(
      req.user.phone,
      `Your PaySafe verification code is: ${code}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Never share it.`
    );
  } else {
    await sendEmail(req.user.email, "EMAIL_VERIFY", code);
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      `OTP sent to your ${type === "PHONE_VERIFY" ? "phone" : "email"}.`
    )
  );
});


const verifyOtpHandler = AsyncHandler(async (req, res) => {
  const { code, type } = req.body;
  const userId = req.user.id;

  
  if (!code || !type) {
    throw new ApiError(422, "code and type are required.", {
      code: "VALIDATION_ERROR",
    });
  }

  if (!/^\d{6}$/.test(code)) {
    throw new ApiError(422, "OTP must be a 6-digit number.", {
      code: "VALIDATION_ERROR",
    });
  }

  if (!["PHONE_VERIFY", "EMAIL_VERIFY"].includes(type)) {
    throw new ApiError(422, "Invalid OTP type.", {
      code: "VALIDATION_ERROR",
      fields: { type: "Must be PHONE_VERIFY or EMAIL_VERIFY" },
    });
  }

 
  const otpRecord = await prisma.otp.findFirst({
    where: {
      user_id: userId,
      purpose: type,
      is_used: false,
      expires_at: { gt: new Date() },
    },
    orderBy: { created_at: "desc" },
  });

  if (!otpRecord) {
    throw new ApiError(
      400,
      "OTP expired or not found. Please request a new one.",
      { code: "OTP_INVALID" }
    );
  }

  
  if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
    await prisma.otp.update({
      where: { id: otpRecord.id },
      data: { is_used: true },
    });
    throw new ApiError(
      400,
      "Too many failed attempts. Please request a new OTP.",
      { code: "OTP_MAX_ATTEMPTS" }
    );
  }

  
  const isValid = await compareOtp(code, otpRecord.code_hash);

  if (!isValid) {
    await prisma.otp.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } },
    });

    const remaining = OTP_MAX_ATTEMPTS - (otpRecord.attempts + 1);
    throw new ApiError(400, `Incorrect OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`, {
      code: "OTP_INCORRECT",
      remaining_attempts: remaining,
    });
  }

  
  await prisma.$transaction([
    prisma.otp.update({
      where: { id: otpRecord.id },
      data: { is_used: true },
    }),
    prisma.user.update({
      where: { id: userId },
      data:
        type === "PHONE_VERIFY"
          ? { is_verified: true }
          : { is_email_verified: true },
    }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      { verified: true },
      `${type === "PHONE_VERIFY" ? "Phone" : "Email"} verified successfully.`
    )
  );
});

export { sendOtp, verifyOtpHandler };