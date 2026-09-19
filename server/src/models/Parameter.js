import mongoose from "mongoose";

const parameterSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      enum: [
        "account-head",
        "account-type",
        "bank-operator",
        "leave-type",
        "department",
        "designation",
        "appointment-type",
        "religion",
        "gender",
        "marital-status",
        "nationality",
      ],
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Used only for dependent parameters.
    //
    // Example:
    // Bank Operator "bKash"
    // parentParameter -> Account Type "Mobile Bank"
    //
    // Other parameter categories will simply keep this null.
    parentParameter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parameter",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate parameter names
// inside the same category.
//
// Example:
// Department "IT" cannot be added twice.
//
// Bank Operator names are also kept unique
// inside bank-operator for now.
parameterSchema.index(
  {
    category: 1,
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

const Parameter = mongoose.model(
  "Parameter",
  parameterSchema
);

export default Parameter;