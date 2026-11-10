import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
  },
}));

import axios from "axios";
import { checkFraud } from "../services/fraud.service.js";

describe("checkFraud", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ML_API_URL = "http://ml-test:5000";
    delete process.env.DEMO_ALLOW_ML_FALLBACK;
    process.env.NODE_ENV = "test";
  });

  it("returns ML prediction on success", async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        risk_score: 0.91,
        is_fraud: true,
        reasons: ["high_amount"],
      },
    });

    const result = await checkFraud({ amount: 250000, hour_of_day: 2 });

    expect(axios.post).toHaveBeenCalledWith(
      "http://ml-test:5000/predict",
      { features: { amount: 250000, hour_of_day: 2 } },
      { timeout: 5000 },
    );
    expect(result.is_fraud).toBe(true);
    expect(result.risk_score).toBe(0.91);
  });

  it("fail-opens in non-production when ML is down", async () => {
    process.env.NODE_ENV = "development";
    axios.post.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    const result = await checkFraud({ amount: 100 });

    expect(result.fallback).toBe(true);
    expect(result.is_fraud).toBe(false);
  });

  it("fail-closes in production when ML is down", async () => {
    process.env.NODE_ENV = "production";
    process.env.DEMO_ALLOW_ML_FALLBACK = "false";
    axios.post.mockRejectedValueOnce(new Error("timeout"));

    await expect(checkFraud({ amount: 100 })).rejects.toMatchObject({
      statusCode: 503,
      message: expect.stringContaining("unavailable"),
    });
  });

  it("allows explicit demo fallback in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.DEMO_ALLOW_ML_FALLBACK = "true";
    axios.post.mockRejectedValueOnce(new Error("down"));

    const result = await checkFraud({ amount: 100 });
    expect(result.fallback).toBe(true);
  });
});
