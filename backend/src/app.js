import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRouter from "./routes/auth.routes.js";
import walletRouter from "./routes/wallet.routes.js";
import healthRouter from "./routes/healthcheck.routes.js";
import transactionRouter from "./routes/transactions.routes.js";
import notificationRouter from "./routes/notifications.routes.js";
import fraudRouter from "./routes/fraud.routes.js";
import adminRouter from "./routes/admin.routes.js";

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  }),
);

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(express.static("public"));
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many auth attempts. Try again later.",
    errors: [],
  },
});

const sendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many transfer attempts. Try again later.",
    errors: [],
  },
});

app.get("/", (req, res) => {
  res.send("Welcome to the Financial Management API");
});

app.use("/api/v1/health", healthRouter);
app.use("/api/v1/auth", authLimiter, authRouter);
app.use("/api/v1/wallet/send", sendLimiter);
app.use("/api/v1/wallet", walletRouter);
app.use("/api/v1/transactions", transactionRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/fraud", fraudRouter);
app.use("/api/v1/admin", adminRouter);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message: err.message || "Something went wrong",
    errors: err.errors || [],
  });
});

export { app };
