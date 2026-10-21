import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^\+[1-9]\d{7,14}$/,
    },
    role: { type: String, enum: ["patient", "admin"], default: "patient" },
    name: { type: String, trim: true, maxlength: 100, default: "" },
  },
  { timestamps: true },
);
export default mongoose.model("User", userSchema);
