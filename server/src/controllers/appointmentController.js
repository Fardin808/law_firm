import mongoose from "mongoose";

import Appointment from "../models/Appointment.js";
import Client from "../models/Client.js";
import Employee from "../models/Employee.js";
import Parameter from "../models/Parameter.js";

// =====================================================
// Generate Appointment Code
// Example: APP-0001
// =====================================================

const generateAppointmentCode = async () => {
  const lastAppointment =
    await Appointment.findOne()
      .sort({ createdAt: -1 })
      .select("appointmentCode");

  if (!lastAppointment) {
    return "APP-0001";
  }

  const lastNumber =
    Number(
      lastAppointment.appointmentCode.split("-")[1]
    ) || 0;

  const nextNumber =
    lastNumber + 1;

  return `APP-${String(nextNumber).padStart(
    4,
    "0"
  )}`;
};

// =====================================================
// Validate Appointment Type
// =====================================================

const validateAppointmentType = async (
  appointmentTypeId
) => {
  if (
    !mongoose.Types.ObjectId.isValid(
      appointmentTypeId
    )
  ) {
    return {
      valid: false,
      message:
        "Invalid Appointment Type.",
    };
  }

  const appointmentType =
    await Parameter.findOne({
      _id: appointmentTypeId,
      category: "appointment-type",
      isActive: true,
    });

  if (!appointmentType) {
    return {
      valid: false,
      message:
        "Appointment Type not found or inactive.",
    };
  }

  return {
    valid: true,
    appointmentType,
  };
};

// =====================================================
// Validate Client
// =====================================================

const validateClient = async (
  clientId
) => {
  if (
    !mongoose.Types.ObjectId.isValid(
      clientId
    )
  ) {
    return {
      valid: false,
      message: "Invalid client ID.",
    };
  }

  const client =
    await Client.findById(clientId);

  if (!client) {
    return {
      valid: false,
      message: "Client not found.",
    };
  }

  if (client.isInactive) {
    return {
      valid: false,
      message:
        "Inactive clients cannot be assigned to an appointment.",
    };
  }

  return {
    valid: true,
    client,
  };
};

// =====================================================
// Validate Lawyer
// =====================================================

const validateLawyer = async (
  lawyerId
) => {
  if (
    !mongoose.Types.ObjectId.isValid(
      lawyerId
    )
  ) {
    return {
      valid: false,
      message: "Invalid lawyer ID.",
    };
  }

  const lawyer =
    await Employee.findById(lawyerId);

  if (!lawyer) {
    return {
      valid: false,
      message: "Lawyer not found.",
    };
  }

  if (lawyer.isInactive) {
    return {
      valid: false,
      message:
        "Inactive employees cannot be assigned as lawyers.",
    };
  }

  return {
    valid: true,
    lawyer,
  };
};

// =====================================================
// Validate Date / Time
// =====================================================

const validateDateAndTime = (
  date,
  startTime,
  endTime
) => {
  if (!date) {
    return {
      valid: false,
      message:
        "Appointment date is required.",
    };
  }

  if (!startTime || !endTime) {
    return {
      valid: false,
      message:
        "Start Time and End Time are required.",
    };
  }

  if (endTime <= startTime) {
    return {
      valid: false,
      message:
        "End Time must be after Start Time.",
    };
  }

  return {
    valid: true,
  };
};

// =====================================================
// CREATE APPOINTMENT
// =====================================================

export const createAppointment = async (
  req,
  res
) => {
  try {
    const {
      title,
      description = "",
      appointmentType,
      lawyer,
      client,
      date,
      startTime,
      endTime,
      appointmentDetails = "",
      status = "Applied",
      isInactive = false,
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Appointment title is required.",
      });
    }

    if (!appointmentType) {
      return res.status(400).json({
        success: false,
        message:
          "Appointment Type is required.",
      });
    }

    if (!lawyer) {
      return res.status(400).json({
        success: false,
        message: "Lawyer is required.",
      });
    }

    if (!client) {
      return res.status(400).json({
        success: false,
        message: "Client is required.",
      });
    }

    const typeValidation =
      await validateAppointmentType(
        appointmentType
      );

    if (!typeValidation.valid) {
      return res.status(400).json({
        success: false,
        message:
          typeValidation.message,
      });
    }

    const clientValidation =
      await validateClient(client);

    if (!clientValidation.valid) {
      return res.status(400).json({
        success: false,
        message:
          clientValidation.message,
      });
    }

    const lawyerValidation =
      await validateLawyer(lawyer);

    if (!lawyerValidation.valid) {
      return res.status(400).json({
        success: false,
        message:
          lawyerValidation.message,
      });
    }

    const dateValidation =
      validateDateAndTime(
        date,
        startTime,
        endTime
      );

    if (!dateValidation.valid) {
      return res.status(400).json({
        success: false,
        message:
          dateValidation.message,
      });
    }

    const allowedStatuses = [
      "Applied",
      "Confirmed",
      "Completed",
      "Cancelled",
    ];

    if (
      !allowedStatuses.includes(
        status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid appointment status.",
      });
    }

    const appointmentCode =
      await generateAppointmentCode();

    const appointment =
      await Appointment.create({
        appointmentCode,

        title:
          title.trim(),

        description:
          description.trim(),

        appointmentType,

        lawyer,

        client,

        date,

        startTime,

        endTime,

        appointmentDetails:
          appointmentDetails.trim(),

        status,

        isInactive:
          Boolean(isInactive),
      });

    const populatedAppointment =
      await Appointment.findById(
        appointment._id
      )
        .populate(
          "appointmentType",
          "name category isActive"
        )
        .populate(
          "lawyer",
          "employeeCode name department designation"
        )
        .populate(
          "client",
          "clientCode name phone email"
        );

    return res.status(201).json({
      success: true,
      message:
        "Appointment created successfully.",
      appointment:
        populatedAppointment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to create appointment.",
    });
  }
};

// =====================================================
// GET ALL APPOINTMENTS
// =====================================================

export const getAppointments = async (
  req,
  res
) => {
  try {
    const {
      appointmentCode,
      status,
      lawyer,
      client,
      date,
      limit = 10,
      page = 1,
    } = req.query;

    const filter = {};

    if (appointmentCode) {
      filter.appointmentCode = {
        $regex:
          appointmentCode,
        $options: "i",
      };
    }

    if (status) {
      filter.status =
        status;
    }

    if (lawyer) {
      filter.lawyer =
        lawyer;
    }

    if (client) {
      filter.client =
        client;
    }

    if (date) {
      filter.date =
        date;
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

    const appointments =
      await Appointment.find(filter)
        .populate(
          "appointmentType",
          "name category isActive"
        )
        .populate(
          "lawyer",
          "employeeCode name department designation"
        )
        .populate(
          "client",
          "clientCode name phone email"
        )
        .populate(
          "reappointmentOf",
          "appointmentCode title date startTime endTime"
        )
        .sort({
          createdAt: -1,
        })
        .skip(
          (pageNumber - 1) *
            pageSize
        )
        .limit(pageSize);

    const total =
      await Appointment.countDocuments(
        filter
      );

    return res.status(200).json({
      success: true,
      appointments,
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
        "Failed to load appointments.",
    });
  }
};

// =====================================================
// GET ONE APPOINTMENT
// =====================================================

export const getAppointmentById =
  async (
    req,
    res
  ) => {
    try {
      const appointment =
        await Appointment.findById(
          req.params.id
        )
          .populate(
            "appointmentType",
            "name category isActive"
          )
          .populate(
            "lawyer",
            "employeeCode name department designation"
          )
          .populate(
            "client",
            "clientCode name phone email"
          )
          .populate(
            "reappointmentOf",
            "appointmentCode title date startTime endTime"
          );

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message:
            "Appointment not found.",
        });
      }

      return res.status(200).json({
        success: true,
        appointment,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to load appointment.",
      });
    }
  };

// =====================================================
// UPDATE APPOINTMENT
// =====================================================

export const updateAppointment = async (
  req,
  res
) => {
  try {
    const {
      title,
      description = "",
      appointmentType,
      lawyer,
      client,
      date,
      startTime,
      endTime,
      appointmentDetails = "",
      status,
      isInactive = false,
    } = req.body;

    const appointment =
      await Appointment.findById(
        req.params.id
      );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message:
          "Appointment not found.",
      });
    }

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Appointment title is required.",
      });
    }

    const typeValidation =
      await validateAppointmentType(
        appointmentType
      );

    if (!typeValidation.valid) {
      return res.status(400).json({
        success: false,
        message:
          typeValidation.message,
      });
    }

    const clientValidation =
      await validateClient(client);

    if (!clientValidation.valid) {
      return res.status(400).json({
        success: false,
        message:
          clientValidation.message,
      });
    }

    const lawyerValidation =
      await validateLawyer(lawyer);

    if (!lawyerValidation.valid) {
      return res.status(400).json({
        success: false,
        message:
          lawyerValidation.message,
      });
    }

    const dateValidation =
      validateDateAndTime(
        date,
        startTime,
        endTime
      );

    if (!dateValidation.valid) {
      return res.status(400).json({
        success: false,
        message:
          dateValidation.message,
      });
    }

    const allowedStatuses = [
      "Applied",
      "Confirmed",
      "Completed",
      "Cancelled",
    ];

    if (
      status &&
      !allowedStatuses.includes(
        status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid appointment status.",
      });
    }

    appointment.title =
      title.trim();

    appointment.description =
      description.trim();

    appointment.appointmentType =
      appointmentType;

    appointment.lawyer =
      lawyer;

    appointment.client =
      client;

    appointment.date =
      date;

    appointment.startTime =
      startTime;

    appointment.endTime =
      endTime;

    appointment.appointmentDetails =
      appointmentDetails.trim();

    if (status) {
      appointment.status =
        status;
    }

    appointment.isInactive =
      Boolean(isInactive);

    await appointment.save();

    const updatedAppointment =
      await Appointment.findById(
        appointment._id
      )
        .populate(
          "appointmentType",
          "name category isActive"
        )
        .populate(
          "lawyer",
          "employeeCode name department designation"
        )
        .populate(
          "client",
          "clientCode name phone email"
        )
        .populate(
          "reappointmentOf",
          "appointmentCode title date startTime endTime"
        );

    return res.status(200).json({
      success: true,
      message:
        "Appointment updated successfully.",
      appointment:
        updatedAppointment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to update appointment.",
    });
  }
};

// =====================================================
// DELETE APPOINTMENT
// =====================================================

export const deleteAppointment = async (
  req,
  res
) => {
  try {
    const appointment =
      await Appointment.findById(
        req.params.id
      );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message:
          "Appointment not found.",
      });
    }

    await appointment.deleteOne();

    return res.status(200).json({
      success: true,
      message:
        "Appointment deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to delete appointment.",
    });
  }
};

// =====================================================
// REAPPOINTMENT
// =====================================================

export const createReappointment = async (
  req,
  res
) => {
  try {
    const originalAppointment =
      await Appointment.findById(
        req.params.id
      );

    if (!originalAppointment) {
      return res.status(404).json({
        success: false,
        message:
          "Original appointment not found.",
      });
    }

    const {
      date,
      startTime,
      endTime,
      appointmentDetails = "",
      status = "Applied",
    } = req.body;

    const dateValidation =
      validateDateAndTime(
        date,
        startTime,
        endTime
      );

    if (!dateValidation.valid) {
      return res.status(400).json({
        success: false,
        message:
          dateValidation.message,
      });
    }

    const appointmentCode =
      await generateAppointmentCode();

    const reappointment =
      await Appointment.create({
        appointmentCode,

        title:
          originalAppointment.title,

        description:
          originalAppointment.description,

        appointmentType:
          originalAppointment.appointmentType,

        lawyer:
          originalAppointment.lawyer,

        client:
          originalAppointment.client,

        date,

        startTime,

        endTime,

        appointmentDetails:
          appointmentDetails.trim(),

        status,

        reappointmentOf:
          originalAppointment._id,

        isInactive:
          false,
      });

    const populatedReappointment =
      await Appointment.findById(
        reappointment._id
      )
        .populate(
          "appointmentType",
          "name"
        )
        .populate(
          "lawyer",
          "employeeCode name designation"
        )
        .populate(
          "client",
          "clientCode name"
        )
        .populate(
          "reappointmentOf",
          "appointmentCode title date startTime endTime"
        );

    return res.status(201).json({
      success: true,
      message:
        "Reappointment created successfully.",
      appointment:
        populatedReappointment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to create reappointment.",
    });
  }
};