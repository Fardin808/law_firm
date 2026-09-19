import mongoose from "mongoose";

import Client from "../models/Client.js";
import ClientAccount from "../models/ClientAccount.js";
import Parameter from "../models/Parameter.js";

// =====================================================
// Helper: Validate Parameter
// =====================================================

const validateParameter = async (
  parameterId,
  expectedCategory,
  fieldName,
  required = true
) => {
  // Optional field
  if (!parameterId) {
    if (required) {
      return {
        valid: false,
        message: `${fieldName} is required.`,
      };
    }

    return {
      valid: true,
      parameter: null,
    };
  }

  // Invalid MongoDB ID
  if (
    !mongoose.Types.ObjectId.isValid(
      parameterId
    )
  ) {
    return {
      valid: false,
      message: `Invalid ${fieldName}.`,
    };
  }

  const parameter =
    await Parameter.findById(parameterId);

  if (!parameter) {
    return {
      valid: false,
      message: `${fieldName} not found.`,
    };
  }

  if (
    parameter.category !==
    expectedCategory
  ) {
    return {
      valid: false,
      message:
        `Selected ${fieldName} does not belong to ${expectedCategory}.`,
    };
  }

  if (!parameter.isActive) {
    return {
      valid: false,
      message:
        `Selected ${fieldName} is inactive.`,
    };
  }

  return {
    valid: true,
    parameter,
  };
};

// =====================================================
// GET CLIENT ACCOUNT
// GET /api/clients/:clientId/account
// =====================================================

export const getClientAccount = async (
  req,
  res
) => {
  try {
    const { clientId } =
      req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        clientId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid client ID.",
      });
    }

    const client =
      await Client.findById(clientId);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found.",
      });
    }

    const account =
      await ClientAccount.findOne({
        client: clientId,
      })
        .populate(
          "accountHead",
          "name category isActive"
        )
        .populate(
          "accountType",
          "name category isActive"
        )
        .populate(
          "bankOperator",
          "name category isActive parentParameter"
        );

    if (!account) {
      return res.status(200).json({
        success: true,
        hasAccount: false,
        account: null,
      });
    }

    return res.status(200).json({
      success: true,
      hasAccount: true,
      account,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to load client account.",
    });
  }
};

// =====================================================
// CREATE OR UPDATE CLIENT ACCOUNT
// PUT /api/clients/:clientId/account
// =====================================================

export const saveClientAccount = async (
  req,
  res
) => {
  try {
    const { clientId } =
      req.params;

    const {
      accountHead,
      accountType,
      bankOperator = null,
      accountCode = "",
      accountNo = "",
      accountName = "",
      description = "",
      isInactive = false,
    } = req.body;

    // -------------------------------------------------
    // Validate client ID
    // -------------------------------------------------

    if (
      !mongoose.Types.ObjectId.isValid(
        clientId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid client ID.",
      });
    }

    const client =
      await Client.findById(clientId);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found.",
      });
    }

    // -------------------------------------------------
    // Validate Account Head
    // -------------------------------------------------

    const accountHeadResult =
      await validateParameter(
        accountHead,
        "account-head",
        "Account Head"
      );

    if (!accountHeadResult.valid) {
      return res.status(400).json({
        success: false,
        message:
          accountHeadResult.message,
      });
    }

    // -------------------------------------------------
    // Validate Account Type
    // -------------------------------------------------

    const accountTypeResult =
      await validateParameter(
        accountType,
        "account-type",
        "Account Type"
      );

    if (!accountTypeResult.valid) {
      return res.status(400).json({
        success: false,
        message:
          accountTypeResult.message,
      });
    }

    // -------------------------------------------------
    // Validate Bank Operator
    // Optional
    // -------------------------------------------------

    const bankOperatorResult =
      await validateParameter(
        bankOperator,
        "bank-operator",
        "Bank Operator",
        false
      );

    if (!bankOperatorResult.valid) {
      return res.status(400).json({
        success: false,
        message:
          bankOperatorResult.message,
      });
    }

    // -------------------------------------------------
    // Validate dependent Bank Operator
    //
    // Your Parameter model already supports:
    //
    // Bank Operator "bKash"
    //      ↓ parentParameter
    // Account Type "Mobile Bank"
    //
    // Therefore, if the selected operator has a parent,
    // it must belong to the selected Account Type.
    // -------------------------------------------------

    if (
      bankOperatorResult.parameter
        ?.parentParameter
    ) {
      const operatorParent =
        bankOperatorResult.parameter
          .parentParameter.toString();

      if (
        operatorParent !==
        accountType.toString()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "The selected Bank Operator does not belong to the selected Account Type.",
        });
      }
    }

    // -------------------------------------------------
    // Find existing account
    // -------------------------------------------------

    let account =
      await ClientAccount.findOne({
        client: clientId,
      });

    let created = false;

    // -------------------------------------------------
    // CREATE
    // -------------------------------------------------

    if (!account) {
      account =
        await ClientAccount.create({
          client: clientId,

          accountHead,
          accountType,

          bankOperator:
            bankOperator || null,

          accountCode:
            accountCode.trim(),

          accountNo:
            accountNo.trim(),

          accountName:
            accountName.trim(),

          description:
            description.trim(),

          isInactive:
            Boolean(isInactive),
        });

      created = true;
    }

    // -------------------------------------------------
    // UPDATE
    // -------------------------------------------------

    else {
      account.accountHead =
        accountHead;

      account.accountType =
        accountType;

      account.bankOperator =
        bankOperator || null;

      account.accountCode =
        accountCode.trim();

      account.accountNo =
        accountNo.trim();

      account.accountName =
        accountName.trim();

      account.description =
        description.trim();

      account.isInactive =
        Boolean(isInactive);

      await account.save();
    }

    // -------------------------------------------------
    // Link account to client
    // -------------------------------------------------

    if (
      !client.accountInfo ||
      client.accountInfo.toString() !==
        account._id.toString()
    ) {
      client.accountInfo =
        account._id;

      await client.save();
    }

    // -------------------------------------------------
    // Populate response
    // -------------------------------------------------

    const populatedAccount =
      await ClientAccount.findById(
        account._id
      )
        .populate(
          "accountHead",
          "name category isActive"
        )
        .populate(
          "accountType",
          "name category isActive"
        )
        .populate(
          "bankOperator",
          "name category isActive parentParameter"
        );

    return res
      .status(created ? 201 : 200)
      .json({
        success: true,

        message: created
          ? "Client account created successfully."
          : "Client account updated successfully.",

        hasAccount: true,

        account:
          populatedAccount,
      });
  } catch (error) {
    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Failed to save client account.",
    });
  }
};