import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePhone, phoneSchema } from '../src/utils/phone.js';
import { generateOtp, hashOtp, otpHashesMatch, OTP_MAX_ATTEMPTS, OTP_TTL_MS } from '../src/utils/otp.js';
import User from '../src/models/User.js';
import { adminOnly } from '../src/middleware/auth.js';
import { profileSchema, sendOtpSchema, verifyOtpSchema } from '../src/utils/authValidation.js';
import jwt from 'jsonwebtoken';

test('accepts E.164 numbers and normalizes surrounding whitespace', () => {
  assert.equal(normalizePhone(' +919876543210 '), '+919876543210');
  assert.equal(phoneSchema.safeParse('+12025550123').success, true);
  assert.equal(phoneSchema.safeParse('+1234567').success, false);
  assert.equal(phoneSchema.safeParse('919876543210').success, false);
  assert.equal(phoneSchema.safeParse('+019876543210').success, false);
  assert.equal(phoneSchema.safeParse('+919876543210x').success, false);
  assert.equal(phoneSchema.safeParse('+1234567890123456').success, false);
});

test('generates six-digit OTP strings and binds their hashes to phone and secret', () => {
  assert.equal(OTP_TTL_MS, 5 * 60 * 1000);
  assert.equal(OTP_MAX_ATTEMPTS, 5);
  for (let index = 0; index < 50; index += 1) {
    assert.match(generateOtp(), /^\d{6}$/);
  }
  const hash = hashOtp('+919876543210', '123456', 'test-secret');
  assert.equal(otpHashesMatch(hash, hashOtp('+919876543210', '123456', 'test-secret')), true);
  assert.equal(otpHashesMatch(hash, hashOtp('+919876543211', '123456', 'test-secret')), false);
  assert.equal(otpHashesMatch(hash, hashOtp('+919876543210', '123457', 'test-secret')), false);
});

test('restricts user roles to patient and admin', () => {
  const patient = new User({ phone: '+919876543210', role: 'patient' });
  const admin = new User({ phone: '+919876543211', role: 'admin' });
  const invalid = new User({ phone: '+919876543212', role: 'owner' });
  assert.equal(patient.validateSync(), undefined);
  assert.equal(admin.validateSync(), undefined);
  assert.equal(invalid.validateSync().errors.role.kind, 'enum');
  const malformedPhone = new User({ phone: '919876543210', role: 'patient' });
  assert.equal(malformedPhone.validateSync().errors.phone.kind, 'regexp');
});

test('validation schemas reject malformed auth input and privileged profile fields', () => {
  assert.equal(sendOtpSchema.safeParse({ phone: '+919876543210' }).success, true);
  assert.equal(sendOtpSchema.safeParse({ phone: '919876543210' }).success, false);
  assert.equal(verifyOtpSchema.safeParse({ phone: '+919876543210', code: '12345' }).success, false);
  assert.equal(profileSchema.safeParse({ name: 'Patient' }).success, true);
  assert.equal(profileSchema.safeParse({ name: 'Patient', role: 'admin' }).success, false);
  assert.equal(profileSchema.safeParse({ name: 'Patient', phone: '+919876543211' }).success, false);
});

test('JWT validation rejects expired and tampered tokens', () => {
  const secret = 'test-secret-that-is-long-enough-for-signing';
  const claims = {
    issuer: 'renukai-dental-api',
    audience: 'renukai-dental-client',
  };
  const expired = jwt.sign({ sub: 'user-id' }, secret, { ...claims, expiresIn: -1 });
  assert.throws(() => jwt.verify(expired, secret, { ...claims, algorithms: ['HS256'] }), { name: 'TokenExpiredError' });
  const valid = jwt.sign({ sub: 'user-id' }, secret, { ...claims, expiresIn: '7d' });
  const [header, payload, signature] = valid.split('.');
  const tamperedPayload = Buffer.from(JSON.stringify({ sub: 'attacker' })).toString('base64url');
  assert.throws(() => jwt.verify(`${header}.${tamperedPayload}.${signature}`, secret, { ...claims, algorithms: ['HS256'] }));
});

test('admin middleware requires both an admin role and configured phone number', () => {
  const previous = process.env.ADMIN_PHONES;
  process.env.ADMIN_PHONES = '+919876543210';
  const response = {
    statusCode: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  let continued = false;
  adminOnly({ user: { role: 'admin', phone: '+919876543210' } }, response, () => { continued = true; });
  assert.equal(continued, true);
  continued = false;
  adminOnly({ user: { role: 'admin', phone: '+919876543211' } }, response, () => { continued = true; });
  assert.equal(continued, false);
  assert.equal(response.statusCode, 403);
  if (previous === undefined) delete process.env.ADMIN_PHONES;
  else process.env.ADMIN_PHONES = previous;
});
