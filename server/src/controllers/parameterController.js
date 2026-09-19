import mongoose from "mongoose";
import Parameter from "../models/Parameter.js";

const allowedCategories = [
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
];

const isValidCategory = (category) => {
  return allowedCategories.includes(category);
};

// Escape special regex characters
const escapeRegex = (value) => {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
};

// ---------------------------------------
// Validate Bank Operator Account Type
// ---------------------------------------

const validateBankOperatorParent = async (
  parentParameter
) => {
  if (!parentParameter) {
    return {
      valid: false,
      message:
        "Account Type is required for Bank Operator.",
    };
  }

  if (
    !mongoose.Types.ObjectId.isValid(
      parentParameter
    )
  ) {
    return {
      valid: false,
      message: "Invalid Account Type.",
    };
  }

  const accountType =
    await Parameter.findOne({
      _id: parentParameter,
      category: "account-type",
    });

  if (!accountType) {
    return {
      valid: false,
      message: "Account Type not found.",
    };
  }

  return {
    valid: true,
    accountType,
  };
};

// ---------------------------------------
// GET PARAMETERS BY CATEGORY
// ---------------------------------------

export const getParameters = async (
  req,
  res
) => {
  try {
    const { category } = req.params;
    const { active } = req.query;

    if (!isValidCategory(category)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid parameter category.",
      });
    }

    const filter = {
      category,
    };

    if (active === "true") {
      filter.isActive = true;
    }

    if (active === "false") {
      filter.isActive = false;
    }

    let query = Parameter.find(filter)
      .collation({
        locale: "en",
        strength: 2,
      })
      .sort({
        createdAt: 1,
      });

    // Bank Operators need their Account Type.
    if (category === "bank-operator") {
      query = query.populate(
        "parentParameter",
        "name category isActive"
      );
    }

    const parameters = await query;

    return res.status(200).json({
      success: true,
      parameters,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------------------------------------
// GET ONE PARAMETER
// ---------------------------------------

export const getParameterById = async (
  req,
  res
) => {
  try {
    const { category, id } =
      req.params;

    if (!isValidCategory(category)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid parameter category.",
      });
    }

    let query = Parameter.findOne({
      _id: id,
      category,
    });

    if (category === "bank-operator") {
      query = query.populate(
        "parentParameter",
        "name category isActive"
      );
    }

    const parameter = await query;

    if (!parameter) {
      return res.status(404).json({
        success: false,
        message: "Parameter not found.",
      });
    }

    return res.status(200).json({
      success: true,
      parameter,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------------------------------------
// CREATE PARAMETER
// ---------------------------------------

export const createParameter = async (
  req,
  res
) => {
  try {
    const { category } =
      req.params;

    const {
      name,
      isActive = true,
      parentParameter = null,
    } = req.body;

    if (!isValidCategory(category)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid parameter category.",
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Parameter name is required.",
      });
    }

    const normalizedName =
      name.trim();

    // -----------------------------------
    // Bank Operator requires Account Type
    // -----------------------------------

    let validatedParent = null;

    if (category === "bank-operator") {
      const validation =
        await validateBankOperatorParent(
          parentParameter
        );

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
        });
      }

      if (!validation.accountType.isActive) {
        return res.status(400).json({
          success: false,
          message:
            "The selected Account Type is inactive.",
        });
      }

      validatedParent =
        validation.accountType._id;
    }

    // -----------------------------------
    // Duplicate check
    // -----------------------------------

    const existingParameter =
      await Parameter.findOne({
        category,

        name: {
          $regex:
            `^${escapeRegex(
              normalizedName
            )}$`,

          $options: "i",
        },
      });

    if (existingParameter) {
      return res.status(400).json({
        success: false,
        message:
          "This parameter already exists.",
      });
    }

    // -----------------------------------
    // Create
    // -----------------------------------

    let parameter =
      await Parameter.create({
        category,

        name: normalizedName,

        isActive:
          typeof isActive === "boolean"
            ? isActive
            : true,

        parentParameter:
          category === "bank-operator"
            ? validatedParent
            : null,
      });

    // Return Account Type information
    // immediately for Bank Operator.
    if (category === "bank-operator") {
      parameter =
        await Parameter.findById(
          parameter._id
        ).populate(
          "parentParameter",
          "name category isActive"
        );
    }

    return res.status(201).json({
      success: true,
      message:
        "Parameter created successfully.",
      parameter,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "This parameter already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------------------------------------
// UPDATE PARAMETER
// ---------------------------------------

export const updateParameter = async (
  req,
  res
) => {
  try {
    const { category, id } =
      req.params;

    const {
      name,
      isActive,
      parentParameter,
    } = req.body;

    if (!isValidCategory(category)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid parameter category.",
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Parameter name is required.",
      });
    }

    const parameter =
      await Parameter.findOne({
        _id: id,
        category,
      });

    if (!parameter) {
      return res.status(404).json({
        success: false,
        message: "Parameter not found.",
      });
    }

    const normalizedName =
      name.trim();

    // -----------------------------------
    // Duplicate check
    // -----------------------------------

    const duplicate =
      await Parameter.findOne({
        category,

        _id: {
          $ne: id,
        },

        name: {
          $regex:
            `^${escapeRegex(
              normalizedName
            )}$`,

          $options: "i",
        },
      });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message:
          "Another parameter with this name already exists.",
      });
    }

    // -----------------------------------
    // Bank Operator Account Type
    // -----------------------------------

    if (category === "bank-operator") {
      const validation =
        await validateBankOperatorParent(
          parentParameter
        );

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
        });
      }

      parameter.parentParameter =
        validation.accountType._id;
    } else {
      parameter.parentParameter = null;
    }

    parameter.name =
      normalizedName;

    if (
      typeof isActive === "boolean"
    ) {
      parameter.isActive =
        isActive;
    }

    await parameter.save();

    let updatedParameter =
      parameter;

    if (category === "bank-operator") {
      updatedParameter =
        await Parameter.findById(
          parameter._id
        ).populate(
          "parentParameter",
          "name category isActive"
        );
    }

    return res.status(200).json({
      success: true,
      message:
        "Parameter updated successfully.",
      parameter:
        updatedParameter,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "This parameter already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------------------------------------
// DELETE PARAMETER
// ---------------------------------------

export const deleteParameter = async (
  req,
  res
) => {
  try {
    const { category, id } =
      req.params;

    if (!isValidCategory(category)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid parameter category.",
      });
    }

    const parameter =
      await Parameter.findOne({
        _id: id,
        category,
      });

    if (!parameter) {
      return res.status(404).json({
        success: false,
        message: "Parameter not found.",
      });
    }

    // -----------------------------------
    // Protect Account Types that are used
    // by Bank Operators
    // -----------------------------------

    if (category === "account-type") {
      const linkedBankOperator =
        await Parameter.findOne({
          category: "bank-operator",
          parentParameter: id,
        });

      if (linkedBankOperator) {
        return res.status(400).json({
          success: false,
          message:
            "This Account Type cannot be deleted because it is being used by one or more Bank Operators. Mark it inactive instead.",
        });
      }
    }

    await parameter.deleteOne();

    return res.status(200).json({
      success: true,
      message:
        "Parameter deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};