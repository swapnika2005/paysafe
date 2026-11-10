import { describe, expect, it } from "vitest";
import { requireVerified } from "../middlewares/verified.middleware.js";

describe("requireVerified", () => {
  it("blocks unverified users", () => {
    const req = { user: { is_verified: false } };
    const next = () => {
      throw new Error("next should not be called");
    };
    expect(() => requireVerified(req, {}, next)).toThrow(
      /verify your phone/i,
    );
  });

  it("allows verified users", () => {
    const req = { user: { is_verified: true } };
    let called = false;
    requireVerified(req, {}, () => {
      called = true;
    });
    expect(called).toBe(true);
  });
});
