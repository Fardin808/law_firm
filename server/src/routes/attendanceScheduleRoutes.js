import express from "express";

import {
  getAttendanceSchedules,
  getAttendanceScheduleById,
  createAttendanceSchedule,
  updateAttendanceSchedule,
  deleteAttendanceSchedule,
} from "../controllers/attendanceScheduleController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getAttendanceSchedules);
router.post("/", protect, createAttendanceSchedule);

router.get("/:id", protect, getAttendanceScheduleById);
router.put("/:id", protect, updateAttendanceSchedule);
router.delete("/:id", protect, deleteAttendanceSchedule);

export default router;