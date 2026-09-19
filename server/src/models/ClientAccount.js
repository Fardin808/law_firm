import mongoose from "mongoose";

const clientAccountSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      unique: true,
    },

    accountHead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parameter",
      required: true,
    },

    accountType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parameter",
      required: true,
    },

    bankOperator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parameter",
      default: null,
    },

    accountCode: {
      type: String,
      trim: true,
      default: "",
    },

    accountNo: {
      type: String,
      trim: true,
      default: "",
    },

    accountName: {
      type: String,
      trim: true,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      default: "",
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

const ClientAccount = mongoose.model(
  "ClientAccount",
  clientAccountSchema
);

export default ClientAccount;