import { Router } from "express";
import { z } from "zod";
import Appointment from "../models/Appointment.js";
import { protect, adminOnly } from "../middleware/auth.js";
const router = Router();
const services = [
  "General Check-up",
  "Teeth Cleaning",
  "Root Canal Treatment",
  "Dental Implants",
  "Braces & Aligners",
  "Cosmetic Dentistry",
  "Tooth Extraction",
  "Emergency Consultation",
];
const schema = z.object({
  patientName: z.string().trim().min(2).max(100),
  service: z.enum(services),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  message: z.string().max(500).optional().default(""),
});
router.post("/", protect, async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ message: parsed.error.issues[0].message });
  if (parsed.data.date < new Date().toLocaleDateString("en-CA"))
    return res.status(400).json({ message: "Please choose a future date." });
  const existing = await Appointment.findOne({
    date: parsed.data.date,
    time: parsed.data.time,
    status: { $in: ["pending", "confirmed"] },
  });
  if (existing)
    return res
      .status(409)
      .json({
        message: "That slot is already requested. Please choose another time.",
      });
  const appointment = await Appointment.create({
    ...parsed.data,
    patient: req.user._id,
    phone: req.user.phone,
  });
  res
    .status(201)
    .json({
      appointment,
      message:
        "Appointment request submitted. The clinic will confirm it shortly.",
    });
});
router.get("/mine", protect, async (req, res) => {
  const appointments = await Appointment.find({ patient: req.user._id }).sort({
    date: -1,
    time: -1,
  });
  res.json({ appointments });
});
router.patch("/:id/cancel", protect, async (req, res) => {
  const appointment = await Appointment.findOne({
    _id: req.params.id,
    patient: req.user._id,
  });
  if (!appointment)
    return res.status(404).json({ message: "Appointment not found." });
  if (["completed", "cancelled"].includes(appointment.status))
    return res
      .status(400)
      .json({ message: "This appointment cannot be cancelled." });
  appointment.status = "cancelled";
  await appointment.save();
  res.json({ appointment, message: "Appointment cancelled." });
});
router.get("/admin/all", protect, adminOnly, async (req, res) => {
  const { status, search, date } = req.query;
  const filter = {};
  if (
    status &&
    ["pending", "confirmed", "completed", "cancelled"].includes(status)
  )
    filter.status = status;
  if (date) filter.date = date;
  if (search)
    filter.$or = [
      { patientName: { $regex: String(search).slice(0, 80), $options: "i" } },
      { phone: { $regex: String(search).slice(0, 30), $options: "i" } },
    ];
  const appointments = await Appointment.find(filter)
    .populate("patient", "name phone")
    .sort({ date: 1, time: 1 })
    .limit(500);
  res.json({ appointments, total: await Appointment.countDocuments(filter) });
});
router.patch("/admin/:id/status", protect, adminOnly, async (req, res) => {
  const parsed = z
    .object({
      status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
    })
    .safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ message: "Invalid appointment status." });
  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    { status: parsed.data.status },
    { new: true, runValidators: true },
  );
  if (!appointment)
    return res.status(404).json({ message: "Appointment not found." });
  res.json({ appointment, message: "Appointment updated." });
});
router.get("/admin/stats", protect, adminOnly, async (_req, res) => {
  const [total, pending, confirmed, patients] = await Promise.all([
    Appointment.countDocuments(),
    Appointment.countDocuments({ status: "pending" }),
    Appointment.countDocuments({ status: "confirmed" }),
    (await import("../models/User.js")).default.countDocuments({
      role: "patient",
    }),
  ]);
  res.json({ total, pending, confirmed, patients });
});
export default router;
