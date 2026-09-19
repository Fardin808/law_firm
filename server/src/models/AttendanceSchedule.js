import mongoose from "mongoose";

const attendanceScheduleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Store time in 24-hour HH:mm format
    // Example: "09:00", "17:30"
    startTime: {
      type: String,
      required: true,
      trim: true,
    },

    endTime: {
      type: String,
      required: true,
      trim: true,
    },

    intervalStart: {
      type: String,
      required: true,
      trim: true,
    },

    intervalEnd: {
      type: String,
      required: true,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const AttendanceSchedule = mongoose.model(
  "AttendanceSchedule",
  attendanceScheduleSchema
);

export default AttendanceSchedule;