import express from "express";

import {
  getLeaveSchedules,
  getLeaveScheduleById,
  createLeaveSchedule,
  updateLeaveSchedule,
  deleteLeaveSchedule,
} from "../controllers/leaveScheduleController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all Leave Schedules
router.get("/", protect, getLeaveSchedules);

// Get one Leave Schedule
router.get("/:id", protect, getLeaveScheduleById);

// Create Leave Schedule
router.post("/", protect, createLeaveSchedule);

// Update Leave Schedule
router.put("/:id", protect, updateLeaveSchedule);

// Delete Leave Schedule
router.delete("/:id", protect, deleteLeaveSchedule);

export default router;