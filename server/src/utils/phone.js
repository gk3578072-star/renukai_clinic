import { z } from "zod";

export const phoneSchema = z
  .string()
  .trim()
  .regex(
    /^\+[1-9]\d{7,14}$/,
    "Enter a valid phone number in international format, e.g. +919876543210.",
  );

export function normalizePhone(phone) {
  const parsed = phoneSchema.safeParse(phone);
  if (!parsed.success) throw new TypeError("Invalid E.164 phone number.");
  return parsed.data;
}
