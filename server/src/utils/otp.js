import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

export function generateOtp() {
  return String(randomInt(100000, 1000000));
}

export function hashOtp(phone, code, secret) {
  return createHmac("sha256", secret).update(`${phone}:${code}`).digest("hex");
}

export function otpHashesMatch(expected, actual) {
  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(actual, "hex");
  return (
    expectedBuffer.length === actualBuffer.length &&
    timingSafeEqual(expectedBuffer, actualBuffer)
  );
}
