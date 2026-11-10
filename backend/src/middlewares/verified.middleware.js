import { ApiError } from "../utils/ApiError.js";

export const requireVerified = (req, res, next) => {
  if (!req.user.is_verified) {
    throw new ApiError(403, "Please verify your phone number to access this feature.", {
      code: "PHONE_NOT_VERIFIED",
    });
  }
  next();
};