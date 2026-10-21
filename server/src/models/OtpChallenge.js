import mongoose from "mongoose";

const otpChallengeSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true },
    codeHash: { type: String, required: true, select: false },
    attempts: { type: Number, required: true, default: 0 },
    expiresAt: { type: Date, required: true },
    consumed: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

otpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export default mongoose.model("OtpChallenge", otpChallengeSchema);
