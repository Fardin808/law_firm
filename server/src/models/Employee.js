import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    employeeCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    enrollId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    fatherName: {
      type: String,
      required: true,
      trim: true,
    },

    motherName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    designation: {
      type: String,
      required: true,
      trim: true,
    },

    gender: {
      type: String,
      required: true,
      trim: true,
    },

    maritalStatus: {
      type: String,
      required: true,
      trim: true,
    },

    nationality: {
      type: String,
      required: true,
      trim: true,
    },

    religion: {
      type: String,
      required: true,
      trim: true,
    },

    isInactive: {
      type: Boolean,
      default: false,
    },

    // ---------------------------------------
    // Assigned Attendance Schedule
    // ---------------------------------------
    attendanceSchedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendanceSchedule",
      default: null,
    },

  // ---------------------------------------
  // Assigned Leave Schedule
  // ---------------------------------------
  leaveSchedule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LeaveSchedule",
    default: null,
  },
  },
  {
    timestamps: true,
  }
);

const Employee = mongoose.model(
  "Employee",
  employeeSchema
);

export default Employee;