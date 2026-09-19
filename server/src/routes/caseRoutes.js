import express from "express";

import {
  createCase,
  getCases,
  getCaseById,
  updateCase,
  deleteCase,
  getAvailableAppointments,
} from "../controllers/caseController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

const router =
  express.Router();

// =====================================================
// Case List / Create
// =====================================================

router.post(
  "/",
  protect,
  createCase
);

router.get(
  "/",
  protect,
  getCases
);

// =====================================================
// Appointment options for New Case
//
// IMPORTANT:
// Keep this before /:id
// =====================================================

router.get(
  "/available-appointments",
  protect,
  getAvailableAppointments
);

// =====================================================
// Individual Case
// =====================================================

router.get(
  "/:id",
  protect,
  getCaseById
);

router.put(
  "/:id",
  protect,
  updateCase
);

router.delete(
  "/:id",
  protect,
  deleteCase
);

export default router;