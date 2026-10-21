import mongoose from "mongoose";
const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    patientName: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true },
    service: {
      type: String,
      required: true,
      enum: [
        "General Check-up",
        "Teeth Cleaning",
        "Root Canal Treatment",
        "Dental Implants",
        "Braces & Aligners",
        "Cosmetic Dentistry",
        "Tooth Extraction",
        "Emergency Consultation",
      ],
    },
    date: { type: String, required: true },
    time: { type: String, required: true },
    message: { type: String, trim: true, maxlength: 500, default: "" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true },
);
appointmentSchema.index({ date: 1, time: 1, status: 1 });
export default mongoose.model("Appointment", appointmentSchema);
