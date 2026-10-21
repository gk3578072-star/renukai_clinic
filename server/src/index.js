import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import MongoRateLimitStore from "./middleware/mongoRateLimitStore.js";
import User from "./models/User.js";
import OtpChallenge from "./models/OtpChallenge.js";
import RateLimitCounter from "./models/RateLimitCounter.js";
import { normalizePhone } from "./utils/phone.js";
import authRoutes from "./routes/auth.js";
import appointmentRoutes from "./routes/appointments.js";

function validateConfiguration() {
  if (!process.env.MONGODB_URI)
    throw new Error("Set MONGODB_URI before starting the API.");
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error(
      "Set JWT_SECRET to a random string at least 32 characters long.",
    );
  }

  const provider = process.env.OTP_PROVIDER;
  if (!["dev", "twilio"].includes(provider)) {
    throw new Error(
      "Set OTP_PROVIDER to 'dev' for local development or 'twilio' for SMS.",
    );
  }
  if (process.env.NODE_ENV === "production") {
    if (provider !== "twilio")
      throw new Error(
        "Production requires OTP_PROVIDER=twilio; development OTP is disabled.",
      );
    if (!process.env.CLIENT_ORIGIN)
      throw new Error("Set CLIENT_ORIGIN to the deployed frontend origin(s).");
  }
  const origins = process.env.CLIENT_ORIGIN
    ? process.env.CLIENT_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean)
    : ["http://localhost:5173"];
  if (!origins.length) throw new Error("Configure at least one CLIENT_ORIGIN.");
  for (const origin of origins) {
    let parsed;
    try {
      parsed = new URL(origin);
    } catch {
      throw new Error("CLIENT_ORIGIN must contain valid web origins.");
    }
    const normalizedOrigin = origin.endsWith("/") ? origin.slice(0, -1) : origin;
    if (
      !["http:", "https:"].includes(parsed.protocol) ||
      parsed.origin !== normalizedOrigin ||
      (process.env.NODE_ENV === "production" && parsed.protocol !== "https:")
    ) {
      throw new Error(
        "CLIENT_ORIGIN entries must be plain web origins (HTTPS in production).",
      );
    }
  }
  if (provider === "twilio") {
    const required = [
      "TWILIO_ACCOUNT_SID",
      "TWILIO_AUTH_TOKEN",
      "TWILIO_VERIFY_SERVICE_SID",
    ];
    const missing = required.filter((name) => !process.env[name]);
    if (missing.length)
      throw new Error(`Twilio Verify requires: ${missing.join(", ")}.`);
    if (!/^AC[a-f\d]{32}$/i.test(process.env.TWILIO_ACCOUNT_SID)) {
      throw new Error("TWILIO_ACCOUNT_SID must be a valid Twilio Account SID.");
    }
    if (!/^VA[a-f\d]{32}$/i.test(process.env.TWILIO_VERIFY_SERVICE_SID)) {
      throw new Error("TWILIO_VERIFY_SERVICE_SID must be a valid Verify Service SID.");
    }
    if (process.env.TWILIO_AUTH_TOKEN.length < 32) {
      throw new Error("TWILIO_AUTH_TOKEN must contain the full Twilio account auth token.");
    }
  }
  const adminPhones = (process.env.ADMIN_PHONES || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  for (const phone of adminPhones) {
    try {
      normalizePhone(phone);
    } catch {
      throw new Error("Every ADMIN_PHONES entry must be a valid E.164 number.");
    }
  }
  if (
    process.env.DEV_OTP_LOG === "true" &&
    (process.env.NODE_ENV !== "development" || provider !== "dev")
  ) {
    throw new Error(
      "DEV_OTP_LOG=true is allowed only with NODE_ENV=development and OTP_PROVIDER=dev.",
    );
  }
}

validateConfiguration();
const app = express();
app.disable("x-powered-by");
if (process.env.TRUST_PROXY) {
  const hops = Number(process.env.TRUST_PROXY);
  if (!Number.isSafeInteger(hops) || hops < 0) {
    throw new Error(
      "TRUST_PROXY must be a non-negative integer matching the trusted proxy hop count.",
    );
  }
  app.set("trust proxy", hops);
}
app.use(helmet());
const clientOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => new URL(value).origin)
  : ["http://localhost:5173"];
app.use(
  cors({
    origin: clientOrigins,
  }),
);
app.use(express.json({ limit: "20kb" }));
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 250,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests. Please try again later." },
    store: new MongoRateLimitStore(),
  }),
);
app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", service: "Renuka Dental Clinic API" }),
);
app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use((req, res) => res.status(404).json({ message: "Route not found." }));
app.use((err, _req, res, _next) => {
  console.error("Unhandled request error:", err?.name || "Error");
  res.status(500).json({ message: "Something went wrong." });
});
const port = process.env.PORT || 5000;
try {
  await mongoose.connect(process.env.MONGODB_URI);
  await Promise.all([
    User.init(),
    OtpChallenge.init(),
    RateLimitCounter.init(),
  ]);
  app.listen(port, () =>
    console.log(`Renuka Dental API running on http://localhost:${port}`),
  );
} catch (error) {
  console.error("MongoDB connection failed:", error?.name || "Error");
  process.exit(1);
}
