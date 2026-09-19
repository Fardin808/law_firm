import express from "express";

import {
  getEmployeeLeaveBalance,
} from "../controllers/leaveBalanceController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/employee/:employeeId",
  protect,
  getEmployeeLeaveBalance
);

export default router;