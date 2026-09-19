import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import dashboardRoutes from "./src/routes/dashboardRoutes.js";
import employeeRoutes from "./src/routes/employeeRoutes.js";
import parameterRoutes from "./src/routes/parameterRoutes.js";
import attendanceScheduleRoutes from "./src/routes/attendanceScheduleRoutes.js";
import attendanceRoutes from "./src/routes/attendanceRoutes.js";
import leaveScheduleRoutes from "./src/routes/leaveScheduleRoutes.js";
import leaveBalanceRoutes from "./src/routes/leaveBalanceRoutes.js";
import leaveApplicationRoutes from "./src/routes/leaveApplicationRoutes.js";
import clientRoutes from "./src/routes/clientRoutes.js";
import appointmentRoutes from "./src/routes/appointmentRoutes.js";
import caseRoutes from "./src/routes/caseRoutes.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/parameters", parameterRoutes);
app.use("/api/attendance-schedules",attendanceScheduleRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leave-schedules", leaveScheduleRoutes);
app.use(
  "/api/appointments",
  appointmentRoutes
);
app.use(
  "/api/leave-balances",
  leaveBalanceRoutes
);
app.use(
  "/api/leave-applications",
  leaveApplicationRoutes
);
app.use(
  "/api/clients",
  clientRoutes
);
app.use(
  "/api/cases",
  caseRoutes
);
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Law Firm API is running",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});