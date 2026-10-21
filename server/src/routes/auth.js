import { Router } from "express";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import twilio from "twilio";
import User from "../models/User.js";
import OtpChallenge from "../models/OtpChallenge.js";
import MongoRateLimitStore from "../middleware/mongoRateLimitStore.js";
import { protect } from "../middleware/auth.js";
import {
  generateOtp,
  hashOtp,
  OTP_MAX_ATTEMPTS,
  OTP_TTL_MS,
  otpHashesMatch,
} from "../utils/otp.js";
import { normalizePhone } from "../utils/phone.js";
import {
  profileSchema,
  sendOtpSchema,
  verifyOtpSchema,
} from "../utils/authValidation.js";

const router = Router();
const otpMessage = {
  message: "Too many attempts. Please wait before trying again.",
};
const rateLimitOptions = (namespace, windowMs, limit, keyGenerator) => ({
  windowMs,
  limit,
  standardHeaders: true,
  legacyHeaders: false,
  message: otpMessage,
  store: new MongoRateLimitStore(namespace),
  ...(keyGenerator ? { keyGenerator } : {}),
});

const sendIpLimiter = rateLimit(
  rateLimitOptions("otp-send-ip", 15 * 60 * 1000, 5),
);
const verifyIpLimiter = rateLimit(
  rateLimitOptions("otp-verify-ip", 15 * 60 * 1000, 20),
);
const phoneKey = (req) => {
  try {
    return `phone:${normalizePhone(req.body?.phone)}`;
  } catch {
    return `invalid:${req.ip}`;
  }
};
const sendPhoneLimiter = rateLimit(
  rateLimitOptions("otp-send-phone", 60 * 60 * 1000, 3, phoneKey),
);
const verifyPhoneLimiter = rateLimit(
  rateLimitOptions("otp-verify-phone", 15 * 60 * 1000, 10, phoneKey),
);

function twilioClient() {
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

function temporaryProviderFailure(error) {
  return (
    error?.status === 429 ||
    error?.status >= 500 ||
    !Number.isInteger(error?.status)
  );
}

async function getOrCreateUser(phone) {
  const adminPhones = new Set(
    (process.env.ADMIN_PHONES || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
  const role = adminPhones.has(phone) ? "admin" : "patient";
  try {
    return await User.findOneAndUpdate(
      { phone },
      { $set: { role }, $setOnInsert: { phone } },
      { upsert: true, new: true, runValidators: true },
    );
  } catch (error) {
    if (error?.code !== 11000) throw error;
    return User.findOneAndUpdate(
      { phone },
      { $set: { role } },
      { new: true, runValidators: true },
    );
  }
}

async function storeDevChallenge(phone, code) {
  const update = {
    $set: {
      codeHash: hashOtp(phone, code, process.env.JWT_SECRET),
      attempts: 0,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
      consumed: false,
    },
  };
  try {
    await OtpChallenge.findOneAndUpdate({ phone }, update, {
      upsert: true,
      new: true,
      runValidators: true,
    });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    await OtpChallenge.findOneAndUpdate({ phone }, update, {
      new: true,
      runValidators: true,
    });
  }
  if (
    process.env.NODE_ENV === "development" &&
    process.env.DEV_OTP_LOG === "true"
  ) {
    console.info(
      `[DEV OTP] Code generated for ${phone}; it expires in five minutes.`,
    );
    console.info(`[DEV OTP CODE] ${code}`);
  }
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    phone: user.phone,
    role: user.role,
    name: user.name,
  };
}

router.post(
  "/send-otp",
  sendIpLimiter,
  sendPhoneLimiter,
  async (req, res, next) => {
    const parsed = sendOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0].message });
    }
    const phone = normalizePhone(parsed.data.phone);

    try {
      if (process.env.OTP_PROVIDER === "twilio") {
        await twilioClient()
          .verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
          .verifications.create({ to: phone, channel: "sms" });
        return res.json({
          message:
            "If the number can receive SMS, a verification code has been sent.",
        });
      }

      const code = generateOtp();
      await storeDevChallenge(phone, code);
      return res.json({
        message:
          "If the number can receive SMS, a verification code has been sent.",
      });
    } catch (error) {
      if (process.env.OTP_PROVIDER === "twilio") {
        return res.status(temporaryProviderFailure(error) ? 503 : 400).json({
          message: temporaryProviderFailure(error)
            ? "SMS verification is temporarily unavailable. Please try again later."
            : "We could not send a code to that number. Check the number and try again.",
        });
      }
      return next(error);
    }
  },
);

router.post(
  "/verify-otp",
  verifyIpLimiter,
  verifyPhoneLimiter,
  async (req, res, next) => {
    const parsed = verifyOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0].message });
    }
    const { code } = parsed.data;
    const phone = normalizePhone(parsed.data.phone);
    let approved = false;

    if (process.env.OTP_PROVIDER === "twilio") {
      try {
        const result = await twilioClient()
          .verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
          .verificationChecks.create({ to: phone, code });
        approved = result.status === "approved";
        if (!approved)
          return res
            .status(400)
            .json({ message: "The code is incorrect or has expired." });
      } catch (error) {
        return res.status(temporaryProviderFailure(error) ? 503 : 400).json({
          message: temporaryProviderFailure(error)
            ? "SMS verification is temporarily unavailable. Please try again later."
            : "The code is incorrect or has expired.",
        });
      }
    } else {
      try {
        const challenge = await OtpChallenge.findOne({
          phone,
          consumed: false,
          expiresAt: { $gt: new Date() },
          attempts: { $lt: OTP_MAX_ATTEMPTS },
        }).select("+codeHash");
        if (!challenge)
          return res
            .status(400)
            .json({ message: "The code is incorrect or has expired." });

        const suppliedHash = hashOtp(phone, code, process.env.JWT_SECRET);
        const isCorrect = otpHashesMatch(challenge.codeHash, suppliedHash);
        const update = isCorrect
          ? { $set: { consumed: true }, $inc: { attempts: 1 } }
          : { $inc: { attempts: 1 } };
        const consumed = await OtpChallenge.findOneAndUpdate(
          {
            _id: challenge._id,
            consumed: false,
            expiresAt: { $gt: new Date() },
            attempts: { $lt: OTP_MAX_ATTEMPTS },
          },
          update,
          { new: true },
        );
        approved = Boolean(isCorrect && consumed?.consumed);
        if (!approved)
          return res
            .status(400)
            .json({ message: "The code is incorrect or has expired." });
      } catch (error) {
        return next(error);
      }
    }

    try {
      const user = await getOrCreateUser(phone);
      if (!user)
        return res
          .status(500)
          .json({ message: "Unable to sign in right now. Please try again." });
      const token = jwt.sign(
        { sub: user._id.toString(), role: user.role },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d",
          algorithm: "HS256",
          issuer: "renukai-dental-api",
          audience: "renukai-dental-client",
        },
      );
      return res.json({
        token,
        user: publicUser(user),
        message: "Signed in successfully.",
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.get("/me", protect, (req, res) =>
  res.json({ user: publicUser(req.user) }),
);

router.patch("/profile", protect, async (req, res, next) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({
        message: "Only a name between 2 and 100 characters can be updated.",
      });
  }
  try {
    req.user.name = parsed.data.name;
    await req.user.save();
    return res.json({ user: publicUser(req.user) });
  } catch (error) {
    return next(error);
  }
});

export default router;
