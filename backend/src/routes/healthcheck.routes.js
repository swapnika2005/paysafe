import { Router } from "express";
import { prisma } from "../db/index.js";

const router = Router();

router.get("/", async (req, res) => {
  const start = Date.now();

  // Check DB connection
  let dbStatus = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    dbStatus = "error";
  }

  // Check ML service
  let mlStatus = "ok";
  try {
    const response = await fetch(
      `${process.env.ML_API_URL}/health`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!response.ok) mlStatus = "error";
  } catch {
    mlStatus = "unavailable";
  }

  const status =
    dbStatus === "ok" ? "healthy" : "degraded";

  return res.status(status === "healthy" ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    response_time: `${Date.now() - start}ms`,
    services: {
      database: dbStatus,
      ml_api:   mlStatus,
    },
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || "1.0.0",
  });
});

export default router;