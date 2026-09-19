import express from "express";

import {
  getAttendanceList,
  generateAttendanceRow,
  generateAttendanceForDate,
  updateAttendance,
} from "../controllers/attendanceController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all attendance records
router.get(
  "/",
  protect,
  getAttendanceList
);

router.post(
  "/generate-date",
  protect,
  generateAttendanceForDate
);

// Generate attendance row
router.post(
  "/",
  protect,
  generateAttendanceRow
);


// Admin enters/updates In Time and Out Time
router.put(
  "/:id",
  protect,
  updateAttendance
);

export default router;