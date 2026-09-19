import mongoose from "mongoose";

const caseSchema = new mongoose.Schema(
  {
    caseCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    totalCharge: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    payment: {
      type: Number,
      min: 0,
      default: 0,
    },

    due: {
      type: Number,
      min: 0,
      default: 0,
    },

    isInactive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// One appointment should create only one case
caseSchema.index(
  {
    appointment: 1,
  },
  {
    unique: true,
  }
);


const Case = mongoose.model(
  "Case",
  caseSchema
);

export default Case;