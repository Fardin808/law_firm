import mongoose from "mongoose";

const leaveBalanceItemSchema = new mongoose.Schema(
  {
    leaveType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parameter",
      required: true,
    },

    allocated: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    used: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    remaining: {
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

const employeeLeaveBalanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    leaveSchedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveSchedule",
      required: true,
    },

    year: {
      type: Number,
      required: true,
    },

    balances: {
      type: [leaveBalanceItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// One balance record per employee per year
employeeLeaveBalanceSchema.index(
  {
    employee: 1,
    year: 1,
  },
  {
    unique: true,
  }
);

const EmployeeLeaveBalance = mongoose.model(
  "EmployeeLeaveBalance",
  employeeLeaveBalanceSchema
);

export default EmployeeLeaveBalance;