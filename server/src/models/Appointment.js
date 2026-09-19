import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    appointmentCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
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

    appointmentType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parameter",
      required: true,
    },

    lawyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    date: {
      type: String,
      required: true,
      trim: true,
    },

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

    appointmentDetails: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "Applied",
        "Confirmed",
        "Completed",
        "Cancelled",
      ],
      default: "Applied",
    },

    reappointmentOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
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

// Helpful indexes
appointmentSchema.index({
  date: 1,
});

appointmentSchema.index({
  lawyer: 1,
  date: 1,
});

appointmentSchema.index({
  client: 1,
  date: 1,
});

const Appointment = mongoose.model(
  "Appointment",
  appointmentSchema
);

export default Appointment;