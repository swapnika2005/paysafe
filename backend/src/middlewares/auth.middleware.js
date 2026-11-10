import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { prisma } from "../db/index.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";

export const authenticate = AsyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new ApiError(401, "Access token required.", { code: "UNAUTHORIZED" });
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    const message =
      err.name === "TokenExpiredError"
        ? "Access token expired."
        : "Invalid access token.";
    throw new ApiError(401, message, { code: "UNAUTHORIZED" });
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });

  if (!user) {
    throw new ApiError(401, "User no longer exists.", { code: "UNAUTHORIZED" });
  }

  if (user.is_frozen) {
    throw new ApiError(403, "Your account has been frozen. Contact support.", {
      code: "ACCOUNT_FROZEN",
    });
  }

  req.user = user;
  next();
});