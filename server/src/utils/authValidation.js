import { z } from 'zod';
import { phoneSchema } from './phone.js';

export const sendOtpSchema = z.object({ phone: phoneSchema }).strict();
export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: z.string().regex(/^\d{6}$/, 'Enter the six-digit code.'),
}).strict();
export const profileSchema = z.object({
  name: z.string().trim().min(2).max(100),
}).strict();
