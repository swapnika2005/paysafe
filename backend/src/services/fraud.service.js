import axios from "axios";
import { ApiError } from "../utils/ApiError.js";

/**
 * Fraud scoring against ML API.
 * Prod default: fail-closed (503) when ML is down.
 * Demo only: set DEMO_ALLOW_ML_FALLBACK=true to fail-open.
 */
export const checkFraud = async (features) => {
  try {
    const response = await axios.post(
      `${process.env.ML_API_URL}/predict`,
      { features },
      { timeout: 5000 },
    );
    return response.data;
  } catch (error) {
    console.error("ML service unavailable:", error.message);

    const allowFallback =
      process.env.DEMO_ALLOW_ML_FALLBACK === "true" ||
      process.env.NODE_ENV !== "production";

    if (allowFallback) {
      return {
        risk_score: 0,
        is_fraud: false,
        reasons: ["ml_unavailable_fallback"],
        fallback: true,
      };
    }

    throw new ApiError(
      503,
      "Fraud detection service is temporarily unavailable. Please try again shortly.",
      { code: "ML_UNAVAILABLE" },
    );
  }
};