import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    schedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendanceSchedule",
      required: true,
    },

    date: {
      type: String,
      required: true,
      trim: true,
    },

    day: {
      type: String,
      required: true,
      trim: true,
    },

    inTime: {
      type: String,
      default: "",
      trim: true,
    },

    outTime: {
      type: String,
      default: "",
      trim: true,
    },

    durationMinutes: {
      type: Number,
      default: 0,
    },

    lateMinutes: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Present", "Absent"],
      default: "Absent",
    },

    description: {
      type: String,
      default: "Working day",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// One attendance row per employee per date
attendanceSchema.index(
  {
    employee: 1,
    date: 1,
  },
  {
    unique: true,
  }
);

const Attendance = mongoose.model(
  "Attendance",
  attendanceSchema
);

export default Attendance;