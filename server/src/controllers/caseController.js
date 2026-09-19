import mongoose from "mongoose";

import Case from "../models/Case.js";
import Appointment from "../models/Appointment.js";

// =====================================================
// Generate Case Code
// Example:
// CAS-0001
// CAS-0002
// =====================================================

const generateCaseCode = async () => {
  const lastCase = await Case.findOne()
    .sort({
      createdAt: -1,
    })
    .select("caseCode");

  if (!lastCase) {
    return "CAS-0001";
  }

  const lastNumber =
    Number(
      lastCase.caseCode.split("-")[1]
    ) || 0;

  const nextNumber =
    lastNumber + 1;

  return `CAS-${String(nextNumber).padStart(
    4,
    "0"
  )}`;
};

// =====================================================
// Populate Helper
// =====================================================

const getPopulatedCase = async (
  caseId
) => {
  return Case.findById(caseId).populate({
    path: "appointment",

    select:
      "appointmentCode title lawyer client date startTime endTime status",

    populate: [
      {
        path: "lawyer",
        select:
          "employeeCode name department designation",
      },

      {
        path: "client",
        select:
          "clientCode name phone email",
      },
    ],
  });
};

// =====================================================
// CREATE CASE
// POST /api/cases
// =====================================================

export const createCase = async (
  req,
  res
) => {
  try {
    const {
      appointment,
      title,
      description = "",
      totalCharge,
      isInactive = false,
    } = req.body;

    // Appointment required
    if (!appointment) {
      return res.status(400).json({
        success: false,
        message:
          "Appointment is required.",
      });
    }

    // Validate Appointment ID
    if (
      !mongoose.Types.ObjectId.isValid(
        appointment
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid Appointment.",
      });
    }

    // Check Appointment exists
    const existingAppointment =
      await Appointment.findById(
        appointment
      );

    if (!existingAppointment) {
      return res.status(404).json({
        success: false,
        message:
          "Appointment not found.",
      });
    }

    // Prevent duplicate Case for same Appointment
    const existingCase =
      await Case.findOne({
        appointment,
      });

    if (existingCase) {
      return res.status(400).json({
        success: false,
        message:
          "A Case already exists for this Appointment.",
      });
    }

    // Title
    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Case title is required.",
      });
    }

    // Charge
    const charge =
      Number(totalCharge);

    if (
      Number.isNaN(charge) ||
      charge < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Total Charge must be a valid positive amount.",
      });
    }

    // Generate Case Code
    const caseCode =
      await generateCaseCode();

    // New Case:
    // payment = 0
    // due = totalCharge
    const newCase =
      await Case.create({
        caseCode,

        appointment,

        title:
          title.trim(),

        description:
          description.trim(),

        totalCharge:
          charge,

        payment:
          0,

        due:
          charge,

        isInactive:
          Boolean(isInactive),
      });

    const populatedCase =
      await getPopulatedCase(
        newCase._id
      );

    return res.status(201).json({
      success: true,

      message:
        "Case created successfully.",

      case:
        populatedCase,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Failed to create Case.",
    });
  }
};

// =====================================================
// GET ALL CASES
// GET /api/cases
// =====================================================

export const getCases = async (
  req,
  res
) => {
  try {
    const {
      caseCode,
      appointment,
      status,
      limit = 10,
      page = 1,
    } = req.query;

    const filter = {};

    // Search Case Code
    if (caseCode) {
      filter.caseCode = {
        $regex:
          caseCode.trim(),

        $options:
          "i",
      };
    }

    // Appointment filter
    if (
      appointment &&
      mongoose.Types.ObjectId.isValid(
        appointment
      )
    ) {
      filter.appointment =
        appointment;
    }

    // Active / Inactive
    if (status === "active") {
      filter.isInactive =
        false;
    }

    if (status === "inactive") {
      filter.isInactive =
        true;
    }

    const pageNumber =
      Math.max(
        Number(page) || 1,
        1
      );

    const pageSize =
      Math.max(
        Number(limit) || 10,
        1
      );

    const cases =
      await Case.find(filter)
        .populate({
          path: "appointment",

          select:
            "appointmentCode title lawyer client date startTime endTime status",

          populate: [
            {
              path: "lawyer",
              select:
                "employeeCode name department designation",
            },

            {
              path: "client",
              select:
                "clientCode name phone email",
            },
          ],
        })
        .sort({
          createdAt: -1,
        })
        .skip(
          (pageNumber - 1) *
            pageSize
        )
        .limit(
          pageSize
        );

    const total =
      await Case.countDocuments(
        filter
      );

    return res.status(200).json({
      success: true,

      cases,

      pagination: {
        total,

        page:
          pageNumber,

        limit:
          pageSize,

        totalPages:
          Math.ceil(
            total /
              pageSize
          ),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Failed to load Cases.",
    });
  }
};

// =====================================================
// GET ONE CASE
// GET /api/cases/:id
// =====================================================

export const getCaseById = async (
  req,
  res
) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid Case ID.",
      });
    }

    const caseItem =
      await getPopulatedCase(
        req.params.id
      );

    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message:
          "Case not found.",
      });
    }

    return res.status(200).json({
      success: true,

      case:
        caseItem,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Failed to load Case.",
    });
  }
};

// =====================================================
// UPDATE CASE
// PUT /api/cases/:id
//
// Admin can manually update Payment here.
// Due is always calculated automatically:
//
// due = totalCharge - payment
// =====================================================

export const updateCase = async (
  req,
  res
) => {
  try {
    const {
      appointment,
      title,
      description = "",
      totalCharge,
      payment = 0,
      isInactive = false,
    } = req.body;

    // Find Case
    const caseItem =
      await Case.findById(
        req.params.id
      );

    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message:
          "Case not found.",
      });
    }

    // Appointment required
    if (!appointment) {
      return res.status(400).json({
        success: false,
        message:
          "Appointment is required.",
      });
    }

    // Validate Appointment ID
    if (
      !mongoose.Types.ObjectId.isValid(
        appointment
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid Appointment.",
      });
    }

    // Check Appointment exists
    const existingAppointment =
      await Appointment.findById(
        appointment
      );

    if (!existingAppointment) {
      return res.status(404).json({
        success: false,
        message:
          "Appointment not found.",
      });
    }

    // Prevent another Case using same Appointment
    const duplicateCase =
      await Case.findOne({
        appointment,

        _id: {
          $ne:
            caseItem._id,
        },
      });

    if (duplicateCase) {
      return res.status(400).json({
        success: false,

        message:
          "Another Case already uses this Appointment.",
      });
    }

    // Title
    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Case title is required.",
      });
    }

    // Total Charge validation
    const charge =
      Number(totalCharge);

    if (
      Number.isNaN(charge) ||
      charge < 0
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Total Charge must be a valid positive amount.",
      });
    }

    // Payment validation
    const paidAmount =
      Number(payment);

    if (
      Number.isNaN(paidAmount) ||
      paidAmount < 0
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Payment must be a valid positive amount.",
      });
    }

    // Prevent overpayment
    if (
      paidAmount >
      charge
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Payment cannot be greater than Total Charge.",
      });
    }

    // Calculate Due
    const calculatedDue =
      charge -
      paidAmount;

    // Update Case
    caseItem.appointment =
      appointment;

    caseItem.title =
      title.trim();

    caseItem.description =
      description.trim();

    caseItem.totalCharge =
      charge;

    caseItem.payment =
      paidAmount;

    caseItem.due =
      calculatedDue;

    caseItem.isInactive =
      Boolean(isInactive);

    await caseItem.save();

    const populatedCase =
      await getPopulatedCase(
        caseItem._id
      );

    return res.status(200).json({
      success: true,

      message:
        "Case updated successfully.",

      case:
        populatedCase,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Failed to update Case.",
    });
  }
};

// =====================================================
// DELETE CASE
// DELETE /api/cases/:id
// =====================================================

export const deleteCase = async (
  req,
  res
) => {
  try {
    const caseItem =
      await Case.findById(
        req.params.id
      );

    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message:
          "Case not found.",
      });
    }

    await caseItem.deleteOne();

    return res.status(200).json({
      success: true,

      message:
        "Case deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Failed to delete Case.",
    });
  }
};

// =====================================================
// AVAILABLE APPOINTMENTS FOR NEW CASE
//
// Returns only Appointments that don't already
// have a Case.
//
// GET /api/cases/available-appointments
// =====================================================

export const getAvailableAppointments =
  async (
    req,
    res
  ) => {
    try {
      const usedCases =
        await Case.find({})
          .select(
            "appointment"
          )
          .lean();

      const usedAppointmentIds =
        usedCases.map(
          (item) =>
            item.appointment
        );

      const appointments =
        await Appointment.find({
          _id: {
            $nin:
              usedAppointmentIds,
          },

          isInactive:
            false,
        })
          .populate(
            "lawyer",
            "employeeCode name designation"
          )
          .populate(
            "client",
            "clientCode name"
          )
          .sort({
            createdAt: -1,
          });

      return res.status(200).json({
        success: true,

        appointments,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Failed to load available Appointments.",
      });
    }
  };