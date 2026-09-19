import express from "express";

import {
  getParameters,
  getParameterById,
  createParameter,
  updateParameter,
  deleteParameter,
} from "../controllers/parameterController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all parameters from a category
router.get("/:category", protect, getParameters);

// Create parameter
router.post("/:category", protect, createParameter);

// Get one parameter
router.get("/:category/:id", protect, getParameterById);

// Update parameter
router.put("/:category/:id", protect, updateParameter);

// Delete parameter
router.delete("/:category/:id", protect, deleteParameter);

export default router;