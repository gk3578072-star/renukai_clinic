# Renukai Dental Clinic

A MERN clinic website with service information, a clinic map, mobile OTP sign-in, patient appointment requests, and an administrator dashboard.

## Requirements

- Node.js 20 or newer
- MongoDB (local or a hosted deployment)
- Twilio Verify credentials only when using real SMS (`OTP_PROVIDER=twilio`)

## Install and run locally

1. If `server/.env` does not already exist, copy `server/.env.example` to `server/.env`. If it exists, keep it and update settings manually; do not overwrite existing credentials.
2. Set `MONGODB_URI` and a random `JWT_SECRET` of at least 32 characters.
3. Keep `NODE_ENV=development` and set `OTP_PROVIDER=dev`. `DEV_OTP_LOG=true` explicitly enables printing development codes to the server terminal; set it to `false` to suppress OTP output.
4. Install each package set from the repository root:

   ```sh
   npm install
   npm --prefix server install
   npm --prefix client install
   ```

5. Start MongoDB, then run:

   ```sh
   npm run dev
   ```

   The website is available at `http://localhost:5173` and the API at `http://localhost:5000`.

6. Enter a phone number in E.164 format (for example, `+919876543210`). With development OTP logging enabled, retrieve the six-digit code from the server terminal and submit it in the login page. Codes expire after five minutes, allow at most five attempts, and are consumed after successful verification.

The API response for `POST /api/auth/verify-otp` remains `{ token, user, message }`, compatible with the existing frontend authentication provider. Development OTPs are hashed in MongoDB and are never returned in API responses.

## OTP and SMS configuration

### Local development mode

Use `NODE_ENV=development`, `OTP_PROVIDER=dev`, and optionally `DEV_OTP_LOG=true`. Code logging is allowed only when all three settings explicitly indicate local development. Development OTP mode is rejected at startup in production.

### Twilio Verify mode

Set `OTP_PROVIDER=twilio` and configure these **server-only** variables:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_VERIFY_SERVICE_SID`

Create a Verify Service in the Twilio Console and use that service's SID. Twilio sends and verifies SMS codes; the API does not generate or locally validate codes in this mode. Test with Twilio's configured test credentials/numbers where available, or with a real Verify service and a consenting phone. Real SMS may incur charges. Delivery depends on the destination country's rules, supported regions, sender configuration, carrier filtering, and any required regulatory registration or recipient consent. Configure these in Twilio before launch. Provider details and credentials are never returned to clients.

For production set `NODE_ENV=production`, `OTP_PROVIDER=twilio`, and `CLIENT_ORIGIN` to one or more comma-separated HTTPS frontend origins. Startup fails if MongoDB, a sufficiently long JWT secret, a supported OTP provider, production CORS origins, or Twilio settings (when selected) are missing.

`CLIENT_ORIGIN` is server configuration. The frontend can use `VITE_API_URL` (for example, `https://api.example.com/api`) to point to a deployed API. Never place MongoDB, Twilio, or JWT secrets in `client/.env` or any `VITE_*` variable.

## Administrator setup

Set `ADMIN_PHONES` in `server/.env` to comma-separated, verified E.164 phone numbers. Example:

```env
ADMIN_PHONES=+919876543210,+14155550123
```

Only those phone numbers receive an administrator role after successful OTP verification. Administrative appointment APIs independently check both the account role and its currently configured phone number. Keep the allow-list out of frontend code. To provision the initial administrator, configure its phone number in `ADMIN_PHONES`, then complete OTP sign-in using that number. Removing a number from the allow-list immediately blocks its administrative API access.

## Storage and request limits

OTP challenges are stored in MongoDB with a five-minute TTL, hashed using an HMAC keyed by `JWT_SECRET`, and atomically attempt-counted/consumed. Shared rate-limit counters are also stored in MongoDB, so multiple API instances share IP and phone limits; expired counter documents are removed by MongoDB TTL indexes. No Redis service or additional paid service is required by this implementation. Ensure the MongoDB deployment permits TTL indexes and has sufficient availability.

OTP request limits include five requests per IP per 15 minutes and three per phone per hour. Verification is limited to 20 requests per IP and 10 per phone per 15 minutes, with a five-attempt maximum for each development challenge. The general API limit is 250 requests per IP per 15 minutes.

Do not set `TRUST_PROXY` unless the API is behind a known reverse proxy. When it is, set it to the exact trusted proxy hop count provided by the hosting platform (commonly `1` for a single proxy). Incorrect proxy trust can cause client IP spoofing or rate-limit all users under one address. Without it, Express uses the direct connection address and ignores forwarded IP headers.

## Validation

Run the server utility tests and frontend production build:

```sh
npm test
npm run build
```

Automated tests do not send SMS. Full endpoint tests require a running MongoDB instance; real SMS delivery requires a separately configured Twilio Verify service.

## Before production

Use HTTPS, a production MongoDB deployment with backups and TTL-index support, a strong random JWT secret, the correct frontend origin and proxy hop count, and a configured Twilio Verify service. Confirm local privacy, SMS consent, sender registration, clinic details, photos, and applicable legal requirements before deployment. The app does not store clinical records.
