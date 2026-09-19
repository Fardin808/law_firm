import express from "express";

import {
  createLeaveApplication,
  getLeaveApplications,
  getLeaveApplicationById,
  approveLeaveApplication,
  rejectLeaveApplication,
} from "../controllers/leaveApplicationController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create application
router.post(
  "/",
  protect,
  createLeaveApplication
);

// Get all applications
router.get(
  "/",
  protect,
  getLeaveApplications
);

// Get one application
router.get(
  "/:id",
  protect,
  getLeaveApplicationById
);

// Approve
router.patch(
  "/:id/approve",
  protect,
  approveLeaveApplication
);

// Reject
router.patch(
  "/:id/reject",
  protect,
  rejectLeaveApplication
);

export default router;