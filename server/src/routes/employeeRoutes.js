import express from "express";


import {
  createEmployee,
  getEmployees,
  getNextEmployeeCode,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  assignAttendanceSchedule,
  assignLeaveSchedule,
} from "../controllers/employeeController.js";


import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/next-code", protect, getNextEmployeeCode);

router.get("/", protect, getEmployees);
router.post("/", protect, createEmployee);

router.put(
  "/:id/attendance-schedule",
  protect,
  assignAttendanceSchedule
);
router.put(
  "/:id/leave-schedule",
  protect,
  assignLeaveSchedule
);

router.get("/:id", protect, getEmployeeById);
router.put("/:id", protect, updateEmployee);
router.delete("/:id", protect, deleteEmployee);


export default router;