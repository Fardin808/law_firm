import mongoose from "mongoose";

const leaveAllocationSchema = new mongoose.Schema(
  {
    leaveType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parameter",
      required: true,
    },

    days: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  {
    _id: false,
  }
);

const leaveScheduleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    allocations: {
      type: [leaveAllocationSchema],
      default: [],
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

// Avoid duplicate schedule names
leaveScheduleSchema.index(
  {
    name: 1,
  },
  {
    unique: true,
    collation: {
      locale: "en",
      strength: 2,
    },
  }
);

const LeaveSchedule = mongoose.model(
  "LeaveSchedule",
  leaveScheduleSchema
);

export default LeaveSchedule;