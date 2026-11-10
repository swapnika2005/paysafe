import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  REFRESH_COOKIE_OPTIONS,
} from "../utils/tokens.js";

import { sendSms } from "../services/sms.service.js";
import { sendEmail } from "../services/email.service.js";
import { generateOtp, hashOtp, compareOtp } from "../utils/otp.js";

const register = AsyncHandler(async (req, res) => {
  const { full_name, email, phone, pan, password, pin } = req.body;
  

  const requiredFields = { full_name, email, phone, pan, password, pin };
  const missingFields = Object.entries(requiredFields)
    .filter(([_, v]) => !v || String(v).trim() === "")
    .map(([k]) => k);

  if (missingFields.length) {
    throw new ApiError(422, "Request validation failed.", {
      code: "VALIDATION_ERROR",
      fields: Object.fromEntries(
        missingFields.map((f) => [f, `${f} is required.`]),
      ),
    });
  }

  
  const validationErrors = {};

  if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(pan))
    validationErrors.pan = "Enter a valid PAN in the format ABCDE1234F.";

  if (!/^[6-9]\d{9}$/.test(phone))
    validationErrors.phone = "Enter a valid 10-digit Indian mobile number.";

  if (!/^(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(password))
    validationErrors.password =
      "Password must be at least 8 characters and contain at least one special character.";

  if (!/^\d{4,6}$/.test(pin))
    validationErrors.pin = "PIN must be 4 to 6 digits.";

  if (Object.keys(validationErrors).length) {
    throw new ApiError(422, "Request validation failed.", {
      code: "VALIDATION_ERROR",
      fields: validationErrors,
    });
  }

  
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { phone }, { pan }],
    },
  });

  if (existingUser) {
    const duplicateField =
      existingUser.email === email
        ? "email"
        : existingUser.phone === phone
          ? "phone"
          : "pan";

    throw new ApiError(
      409,
      `An account with this ${duplicateField} already exists.`,
      {
        code: "DUPLICATE_ENTRY",
        field: duplicateField,
      },
    );
  }

  
  const hashedPassword = await bcrypt.hash(password, 10);
  const hashedPin = await bcrypt.hash(pin, 10);

 
  const { user, wallet } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        full_name,
        email,
        phone,
        pan,
        password_hash: hashedPassword, 
        pin_hash: hashedPin, 
        role: "user",
        is_verified: false,
      },
    });

    const wallet = await tx.wallet.create({
      data: {
        user_id: user.id,
        balance: "0.00",
        currency: "INR",
      },
    });

    return { user, wallet };
  });

 
  const accessToken = generateAccessToken(user);

  
  return res.status(201).json(
    new ApiResponse(
      201,
      {
        access_token: accessToken,
        expires_in: 900,
        token_type: "Bearer",
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          pan: user.pan,
          role: user.role,
          is_verified: user.is_verified,
          two_factor_enabled: user.two_factor_enabled,
          created_at: user.created_at,
        },
        wallet: {
          id: wallet.id,
          balance: wallet.balance,
          currency: wallet.currency,
        },
      },
      "Account created. Please verify your phone.",
    ),
  );
});

const LOGIN_OTP_EXPIRY_MINUTES = 5;
const LOGIN_OTP_RATE_LIMIT = 3;
const LOGIN_OTP_RATE_WINDOW_MINUTES = 10;

const startLoginChallenge = async (user) => {
  if (!user.phone) {
    throw new ApiError(400, "Add and verify a mobile number before signing in.", {
      code: "PHONE_NOT_VERIFIED",
    });
  }

  const windowStart = new Date(
    Date.now() - LOGIN_OTP_RATE_WINDOW_MINUTES * 60 * 1000,
  );
  const recentCount = await prisma.otp.count({
    where: {
      user_id: user.id,
      purpose: "LOGIN",
      created_at: { gte: windowStart },
    },
  });

  if (recentCount >= LOGIN_OTP_RATE_LIMIT) {
    throw new ApiError(
      429,
      "Too many verification code requests. Please try again later.",
      { code: "RATE_LIMIT_EXCEEDED" },
    );
  }

  await prisma.otp.updateMany({
    where: { user_id: user.id, purpose: "LOGIN", is_used: false },
    data: { is_used: true },
  });

  const code = generateOtp();
  const otp = await prisma.otp.create({
    data: {
      user_id: user.id,
      code_hash: await hashOtp(code),
      purpose: "LOGIN",
      expires_at: new Date(Date.now() + LOGIN_OTP_EXPIRY_MINUTES * 60 * 1000),
    },
  });

  const smsResult = await sendSms(
    user.phone,
    `Your PaySafe sign-in code is: ${code}. Valid for ${LOGIN_OTP_EXPIRY_MINUTES} minutes. Never share it.`,
  );

  if (!smsResult?.success) {
    await prisma.otp.update({
      where: { id: otp.id },
      data: { is_used: true },
    });
    throw new ApiError(503, "Unable to send a verification code. Please try again.", {
      code: "OTP_DELIVERY_FAILED",
    });
  }

  const challengeToken = jwt.sign(
    { id: user.id, purpose: "LOGIN_OTP" },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "5m" },
  );

  return {
    challenge_token: challengeToken,
    phone_hint: `+91 ${user.phone.replace(/(\d{2})\d{4}(\d{4})/, "$1****$2")}`,
  };
};

const verifyLoginChallenge = (challengeToken) => {
  if (!challengeToken || typeof challengeToken !== "string") {
    throw new ApiError(422, "A login challenge is required.", {
      code: "VALIDATION_ERROR",
    });
  }

  try {
    const challenge = jwt.verify(
      challengeToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
    if (challenge.purpose !== "LOGIN_OTP" || !challenge.id) {
      throw new Error("Invalid login challenge.");
    }
    return challenge;
  } catch {
    throw new ApiError(401, "Login challenge expired. Please sign in again.", {
      code: "LOGIN_CHALLENGE_INVALID",
    });
  }
};


const login = AsyncHandler(async (req, res) => {
  const { email, password } = req.body;

 

  
  if (!email || !password) {
    throw new ApiError(422, "Email and password are required.", {
      code: "VALIDATION_ERROR",
      fields: {
        ...(!email && { email: "Email is required." }),
        ...(!password && { password: "Password is required." }),
      },
    });
  }

  
  const user = await prisma.user.findUnique({ where: { email } });

  
  if (!user) {
    throw new ApiError(401, "Invalid email or password.", {
      code: "INVALID_CREDENTIALS",
    });
  }


  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password.", {
      code: "INVALID_CREDENTIALS",
    });
  }

  


  if (user.is_frozen) {
    throw new ApiError(403, "Your account has been frozen. Contact support.", {
      code: "ACCOUNT_FROZEN",
    });
  }

  if (user.is_verified && user.two_factor_enabled) {
    const challenge = await startLoginChallenge(user);
    return res.status(200).json(
      new ApiResponse(
        200,
        { requires_2fa: true, ...challenge },
        "A sign-in verification code has been sent to your phone.",
      ),
    );
  }

  
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  const tokenHash = hashToken(refreshToken);

  
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.session.create({
    data: {
      user_id: user.id,
      token_hash: tokenHash,
      device_info: req.headers["user-agent"] || null,
      ip_address: req.ip || null,
      expires_at: expiresAt,
    },
  });

  
  await prisma.user.update({
    where: { id: user.id },
    data: { last_login: new Date() },
  });

  
  res.cookie("refresh_token", refreshToken, REFRESH_COOKIE_OPTIONS);

  
  const isVerified = user.is_verified;

return res.status(200).json(
  new ApiResponse(
    200,
    {
      access_token: accessToken,
      expires_in: 900,
      token_type: "Bearer",
      requires_verification: !isVerified,   // ← frontend checks this
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        is_verified: user.is_verified,
        is_email_verified: user.is_email_verified,
        two_factor_enabled: user.two_factor_enabled,
        two_factor_enabled: user.two_factor_enabled,
        last_login: user.last_login,
      },
    },
    isVerified ? "Logged in successfully." : "Please verify your phone to continue."
  )
);
});

const verifyLoginOtp = AsyncHandler(async (req, res) => {
  const { challenge_token: challengeToken, code } = req.body;
  if (!code || !/^\d{6}$/.test(code)) {
    throw new ApiError(422, "Enter the 6-digit verification code.", {
      code: "VALIDATION_ERROR",
    });
  }

  const challenge = verifyLoginChallenge(challengeToken);
  const user = await prisma.user.findUnique({ where: { id: challenge.id } });
  if (!user || !user.is_verified || user.is_frozen) {
    throw new ApiError(401, "Unable to complete sign-in. Please sign in again.", {
      code: "LOGIN_CHALLENGE_INVALID",
    });
  }

  const otp = await prisma.otp.findFirst({
    where: {
      user_id: user.id,
      purpose: "LOGIN",
      is_used: false,
      expires_at: { gt: new Date() },
    },
    orderBy: { created_at: "desc" },
  });

  if (!otp) {
    throw new ApiError(400, "Code expired or not found. Request a new code.", {
      code: "OTP_INVALID",
    });
  }

  if (otp.attempts >= 5) {
    await prisma.otp.update({
      where: { id: otp.id },
      data: { is_used: true },
    });
    throw new ApiError(400, "Too many incorrect attempts. Request a new code.", {
      code: "OTP_MAX_ATTEMPTS",
    });
  }

  if (!(await compareOtp(code, otp.code_hash))) {
    await prisma.otp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    throw new ApiError(400, "Incorrect verification code.", {
      code: "OTP_INCORRECT",
    });
  }

  const refreshToken = generateRefreshToken(user);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.$transaction(async (tx) => {
    const consumed = await tx.otp.updateMany({
      where: { id: otp.id, is_used: false, attempts: { lt: 5 } },
      data: { is_used: true },
    });
    if (consumed.count !== 1) {
      throw new ApiError(400, "This verification code has already been used.", {
        code: "OTP_INVALID",
      });
    }
    await tx.session.create({
      data: {
        user_id: user.id,
        token_hash: hashToken(refreshToken),
        device_info: req.headers["user-agent"] || null,
        ip_address: req.ip || null,
        expires_at: expiresAt,
      },
    });
    await tx.user.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    });
  });

  res.cookie("refresh_token", refreshToken, REFRESH_COOKIE_OPTIONS);
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        access_token: generateAccessToken(user),
        expires_in: 900,
        token_type: "Bearer",
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          is_verified: user.is_verified,
          is_email_verified: user.is_email_verified,
          two_factor_enabled: user.two_factor_enabled,
          last_login: new Date(),
        },
      },
      "Sign-in verified successfully.",
    ),
  );
});

const resendLoginOtp = AsyncHandler(async (req, res) => {
  const challenge = verifyLoginChallenge(req.body.challenge_token);
  const user = await prisma.user.findUnique({ where: { id: challenge.id } });
  if (!user || !user.is_verified || user.is_frozen || !user.two_factor_enabled) {
    throw new ApiError(401, "Unable to resend the code. Please sign in again.", {
      code: "LOGIN_CHALLENGE_INVALID",
    });
  }

  const nextChallenge = await startLoginChallenge(user);
  return res.status(200).json(
    new ApiResponse(200, nextChallenge, "A new sign-in code has been sent."),
  );
});

const updateTwoFactor = AsyncHandler(async (req, res) => {
  const { enabled } = req.body;
  if (typeof enabled !== "boolean") {
    throw new ApiError(422, "enabled must be true or false.", {
      code: "VALIDATION_ERROR",
    });
  }
  if (enabled && !req.user.is_verified) {
    throw new ApiError(400, "Verify your phone before enabling sign-in codes.", {
      code: "PHONE_NOT_VERIFIED",
    });
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { two_factor_enabled: enabled },
    select: { two_factor_enabled: true },
  });
  return res.status(200).json(
    new ApiResponse(200, user, "Two-factor authentication setting updated."),
  );
});


const refresh = AsyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.refresh_token;

  if (!incomingToken) {
    throw new ApiError(401, "Refresh token missing.", { code: "UNAUTHORIZED" });
  }

 
  let decoded;
  try {
    decoded = jwt.verify(incomingToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    throw new ApiError(401, "Refresh token invalid or expired.", {
      code: "UNAUTHORIZED",
    });
  }

  
  const tokenHash = hashToken(incomingToken);
  const session = await prisma.session.findFirst({
    where: {
      token_hash: tokenHash,
      is_revoked: false,
      expires_at: { gt: new Date() },
    },
  });

  if (!session) {
    throw new ApiError(401, "Session expired or revoked. Please login again.", {
      code: "SESSION_INVALID",
    });
  }


  const user = await prisma.user.findUnique({ where: { id: decoded.id } });

  if (!user) {
    throw new ApiError(401, "User not found.", { code: "UNAUTHORIZED" });
  }

  if (user.is_frozen) {
    throw new ApiError(403, "Your account has been frozen. Contact support.", {
      code: "ACCOUNT_FROZEN",
    });
  }

  
  const newRefreshToken = generateRefreshToken(user);
  const newTokenHash = hashToken(newRefreshToken);
  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    // Revoke old session
    prisma.session.update({
      where: { id: session.id },
      data: { is_revoked: true },
    }),
    // Create new session
    prisma.session.create({
      data: {
        user_id: user.id,
        token_hash: newTokenHash,
        device_info: session.device_info,
        ip_address: req.ip || null,
        expires_at: newExpiresAt,
      },
    }),
  ]);


  const accessToken = generateAccessToken(user);
  res.cookie("refresh_token", newRefreshToken, REFRESH_COOKIE_OPTIONS);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        access_token: accessToken,
        expires_in: 900,
        token_type: "Bearer",
      },
      "Token refreshed successfully.",
    ),
  );
});


const logout = AsyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.refresh_token;

  if (incomingToken) {
    const tokenHash = hashToken(incomingToken);

    // Revoke session in DB
    await prisma.session.updateMany({
      where: { token_hash: tokenHash },
      data: { is_revoked: true },
    });
  }


  res.clearCookie("refresh_token", REFRESH_COOKIE_OPTIONS);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Logged out successfully."));
});



const me = AsyncHandler(async (req, res) => {
  // req.user is set by authenticate middleware
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      full_name: true,
      email: true,
      phone: true,
      pan: true,
      is_email_verified: true,
      role: true,
      is_verified: true,
      is_frozen: true,
      two_factor_enabled: true,
      avatar_url: true,
      created_at: true,
      last_login: true,
      // NEVER select password_hash or pin_hash
      wallet: {
        select: {
          id: true,
          balance: true,
          currency: true,
        },
      },
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found.", { code: "NOT_FOUND" });
  }

  return res.status(200).json(
    new ApiResponse(200, { user }, "Profile fetched successfully.")
  );
});




const forgotPassword = AsyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    throw new ApiError(422, "Phone number is required.", {
      code: "VALIDATION_ERROR",
      fields: { phone: "Phone is required." }
    });
  }

  const user = await prisma.user.findUnique({ where: { phone } });

  // Always same response — prevent phone enumeration
  if (!user) {
    return res.status(200).json(
      new ApiResponse(200, null,
        "If this phone exists, an OTP has been sent."
      )
    );
  }

  if (user.is_frozen) {
    throw new ApiError(403, "Account suspended. Contact support.", {
      code: "ACCOUNT_FROZEN"
    });
  }

  // Expire existing RESET_PASSWORD OTPs
  await prisma.otp.updateMany({
    where: {
      user_id: user.id,
      purpose: "RESET_PASSWORD",
      is_used: false
    },
    data: { is_used: true }
  });

  // Generate OTP
  const otpCode = generateOtp();              // ← your existing util
  const hashedOtp = await hashOtp(otpCode);   // ← your existing util
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.otp.create({
    data: {
      user_id: user.id,
      code_hash: hashedOtp,
      purpose: "RESET_PASSWORD",
      expires_at: expiresAt
    }
  });

  // ✅ Uses your actual SMS service (dev logs, prod sends)
  await sendSms(
    user.phone,
    `Your PaySafe password reset code is: ${otpCode}. Valid for 5 minutes. Never share it.`
  );

  return res.status(200).json(
    new ApiResponse(200, {
      expires_in: 300,
      phone_masked: user.phone.replace(/(\d{4})\d{4}(\d{3})/, "$1****$2")
    },
    "If this phone exists, an OTP has been sent."
    )
  );
});



const resetPassword = AsyncHandler(async (req, res) => {
  const { phone, otp_code, new_password, confirm_password } = req.body;


  // Validate all fields present
  if (!phone || !otp_code || !new_password || !confirm_password) {
    throw new ApiError(422, "All fields are required.", {
      code: "VALIDATION_ERROR",
      fields: {
        ...(!phone && { phone: "Phone is required." }),
        ...(!otp_code && { otp_code: "OTP code is required." }),
        ...(!new_password && { new_password: "New password is required." }),
        ...(!confirm_password && { confirm_password: "Confirm password is required." })
      }
    });
  }

  // Passwords match
  if (new_password !== confirm_password) {
    throw new ApiError(422, "Passwords do not match.", {
      code: "VALIDATION_ERROR",
      fields: { confirm_password: "Does not match new_password." }
    });
  }

  // Password strength
  if (!/^(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(new_password)) {
    throw new ApiError(422, "Password too weak.", {
      code: "VALIDATION_ERROR",
      fields: {
        new_password: "Min 8 chars with at least one special character."
      }
    });
  }

  // Find user
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    throw new ApiError(404, "User not found.", { code: "NOT_FOUND" });
  }

  // Find latest valid OTP
  const otpRecord = await prisma.otp.findFirst({
    where: {
      user_id: user.id,
      purpose: "RESET_PASSWORD",
      is_used: false,
      expires_at: { gt: new Date() }
    },
    orderBy: { created_at: "desc" }
  });

  if (!otpRecord) {
    throw new ApiError(410, "OTP expired or not found. Request a new one.", {
      code: "OTP_EXPIRED"
    });
  }

  // Check attempt limit
  if (otpRecord.attempts >= 3) {
    await prisma.otp.update({
      where: { id: otpRecord.id },
      data: { is_used: true }
    });
    throw new ApiError(429, "Too many wrong attempts. Request a new OTP.", {
      code: "OTP_LOCKED"
    });
  }

  // Verify OTP code
  const isOtpValid = await bcrypt.compare(otp_code, otpRecord.code_hash);

  if (!isOtpValid) {
    // Increment attempts
    await prisma.otp.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } }
    });

    const remaining = 2 - otpRecord.attempts;
    throw new ApiError(400, `Incorrect OTP. ${remaining} attempts remaining.`, {
      code: "INVALID_OTP"
    });
  }

  // OTP valid → hash new password + update + mark OTP used
  const hashedPassword = await bcrypt.hash(new_password, 10);

  await prisma.$transaction([
    // Update password
    prisma.user.update({
      where: { id: user.id },
      data: { password_hash: hashedPassword }
    }),
    // Mark OTP as used
    prisma.otp.update({
      where: { id: otpRecord.id },
      data: { is_used: true }
    }),
    // Revoke ALL sessions → force re-login everywhere
    prisma.session.updateMany({
      where: { user_id: user.id },
      data: { is_revoked: true }
    })
  ]);

  return res.status(200).json(
    new ApiResponse(200, null,
      "Password reset successfully. Please login with your new password."
    )
  );
});

const changePassword = AsyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    throw new ApiError(422, "All fields are required.", {
      code: "VALIDATION_ERROR",
    });
  }

  if (!/^(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(new_password)) {
    throw new ApiError(422, "Password too weak.", { code: "VALIDATION_ERROR" });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const isValid = await bcrypt.compare(current_password, user.password_hash);

  if (!isValid) {
    throw new ApiError(401, "Current password is incorrect.", {
      code: "INVALID_CREDENTIALS",
    });
  }

  const hashed = await bcrypt.hash(new_password, 10);
  await prisma.user.update({
    where: { id: req.user.id },
    data: { password_hash: hashed },
  });

  // Revoke all sessions so other devices are logged out
  await prisma.session.updateMany({
    where: { user_id: req.user.id },
    data: { is_revoked: true },
  });

  return res.status(200).json(
    new ApiResponse(200, null, "Password changed successfully.")
  );
});


const getSessions = AsyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.refresh_token;
  const currentHash   = incomingToken ? hashToken(incomingToken) : null;

  const sessions = await prisma.session.findMany({
    where: {
      user_id:    req.user.id,
      is_revoked: false,
      expires_at: { gt: new Date() },
    },
    select: {
      id:          true,
      device_info: true,
      ip_address:  true,
      created_at:  true,
      expires_at:  true,
      token_hash:  true,   // used server-side only to flag current
    },
    orderBy: { created_at: "desc" },
  });

  const result = sessions.map((s) => ({
    id:          s.id,
    device_info: s.device_info ?? "Unknown device",
    ip_address:  s.ip_address  ?? "—",
    created_at:  s.created_at,
    expires_at:  s.expires_at,
    is_current:  s.token_hash === currentHash,   // never expose token_hash to client
  }));

  return res.status(200).json(
    new ApiResponse(200, { sessions: result }, "Sessions fetched.")
  );
});


const revokeSession = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const incomingToken = req.cookies?.refresh_token;
  const currentHash   = incomingToken ? hashToken(incomingToken) : null;

  const session = await prisma.session.findFirst({
    where: { id, user_id: req.user.id, is_revoked: false },
  });

  if (!session) {
    throw new ApiError(404, "Session not found.", { code: "NOT_FOUND" });
  }

  if (session.token_hash === currentHash) {
    throw new ApiError(400, "Cannot revoke your current session. Use logout instead.", {
      code: "CANNOT_REVOKE_CURRENT",
    });
  }

  await prisma.session.update({
    where: { id },
    data:  { is_revoked: true },
  });

  return res.status(200).json(
    new ApiResponse(200, null, "Session revoked.")
  );
});


const revokeAllOtherSessions = AsyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.refresh_token;
  const currentHash   = incomingToken ? hashToken(incomingToken) : null;

  await prisma.session.updateMany({
    where: {
      user_id:    req.user.id,
      is_revoked: false,
      NOT: { token_hash: currentHash ?? "" },
    },
    data: { is_revoked: true },
  });

  return res.status(200).json(
    new ApiResponse(200, null, "All other sessions revoked.")
  );
});


export { register, login, verifyLoginOtp, resendLoginOtp, updateTwoFactor, refresh, logout, me, forgotPassword, resetPassword, changePassword  , getSessions, revokeSession, revokeAllOtherSessions};
