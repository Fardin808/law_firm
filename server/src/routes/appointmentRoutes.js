import express from "express";

import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  createReappointment,
} from "../controllers/appointmentController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Create appointment
router.post(
  "/",
  protect,
  createAppointment
);

// Get appointment list
router.get(
  "/",
  protect,
  getAppointments
);

// Reappointment
router.post(
  "/:id/reappointment",
  protect,
  createReappointment
);

// Get one appointment
router.get(
  "/:id",
  protect,
  getAppointmentById
);

// Update appointment
router.put(
  "/:id",
  protect,
  updateAppointment
);

// Delete appointment
router.delete(
  "/:id",
  protect,
  deleteAppointment
);

export default router;