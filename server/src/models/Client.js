import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    clientCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    name: {
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
      trim: true,
      lowercase: true,
      default: "",
    },

    isInactive: {
      type: Boolean,
      default: false,
    },

    // Client account will be connected later.
    // Until an account is created, this remains null.
    accountInfo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClientAccount",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Useful for searching clients
clientSchema.index({
  name: 1,
});

clientSchema.index({
  phone: 1,
});

const Client = mongoose.model(
  "Client",
  clientSchema
);

export default Client;