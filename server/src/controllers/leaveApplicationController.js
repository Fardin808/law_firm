import LeaveApplication from "../models/LeaveApplication.js";
import Employee from "../models/Employee.js";
import Parameter from "../models/Parameter.js";
import EmployeeLeaveBalance from "../models/EmployeeLeaveBalance.js";

// --------------------------------------------------
// Calculate leave days
// For now: every calendar day is counted.
// Example: Sep 10 - Sep 11 = 2 days
// --------------------------------------------------

const calculateLeaveDays = (fromDate, toDate) => {
  const start = new Date(fromDate);
  const end = new Date(toDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const difference =
    end.getTime() - start.getTime();

  return (
    Math.floor(
      difference / (1000 * 60 * 60 * 24)
    ) + 1
  );
};

// --------------------------------------------------
// CREATE LEAVE APPLICATION
// --------------------------------------------------

export const createLeaveApplication = async (
  req,
  res
) => {
  try {
    const {
      employeeId,
      leaveTypeId,
      fromDate,
      toDate,
      reason,
      requestSource = "Admin Entry",
    } = req.body;

    if (
      !employeeId ||
      !leaveTypeId ||
      !fromDate ||
      !toDate ||
      !reason?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Employee, Leave Type, From Date, To Date and Reason are required.",
      });
    }

    // Check dates

    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave date.",
      });
    }

    if (end < start) {
      return res.status(400).json({
        success: false,
        message:
          "To Date cannot be before From Date.",
      });
    }

    // Check employee

    const employee = await Employee.findById(
      employeeId
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    if (!employee.leaveSchedule) {
      return res.status(400).json({
        success: false,
        message:
          "This employee does not have a Leave Schedule assigned.",
      });
    }

    // Check Leave Type

    const leaveType = await Parameter.findOne({
      _id: leaveTypeId,
      category: "leave-type",
      isActive: true,
    });

    if (!leaveType) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or inactive Leave Type.",
      });
    }

    const numberOfDays =
      calculateLeaveDays(
        fromDate,
        toDate
      );

    // Determine which yearly balance this request uses.
    //
    // For the first version, leave must stay inside
    // the same calendar year.

    const startYear =
      start.getFullYear();

    const endYear =
      end.getFullYear();

    if (startYear !== endYear) {
      return res.status(400).json({
        success: false,
        message:
          "A Leave Application cannot span multiple years.",
      });
    }

    // Make sure employee actually has this Leave Type
    // in their yearly balance.

    const leaveBalance =
      await EmployeeLeaveBalance.findOne({
        employee: employeeId,
        year: startYear,
      });

    if (!leaveBalance) {
      return res.status(400).json({
        success: false,
        message:
          `No Leave Balance exists for this employee for ${startYear}.`,
      });
    }

    const balanceItem =
      leaveBalance.balances.find(
        (item) =>
          item.leaveType.toString() ===
          leaveTypeId.toString()
      );

    if (!balanceItem) {
      return res.status(400).json({
        success: false,
        message:
          "This Leave Type is not available in the employee's Leave Schedule.",
      });
    }

    // We don't deduct here.
    // But we can prevent obviously impossible requests.

    if (
      numberOfDays >
      balanceItem.remaining
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Insufficient leave balance. Remaining: ${balanceItem.remaining} day(s).`,
      });
    }

    const application =
      await LeaveApplication.create({
        employee:
          employeeId,

        leaveType:
          leaveTypeId,

        fromDate:
          start,

        toDate:
          end,

        numberOfDays,

        reason:
          reason.trim(),

        requestSource:
          requestSource?.trim() ||
          "Admin Entry",

        status:
          "pending",
      });

    const populatedApplication =
      await LeaveApplication.findById(
        application._id
      )
        .populate(
          "employee",
          "employeeCode name department designation"
        )
        .populate(
          "leaveType",
          "name"
        );

    return res.status(201).json({
      success: true,
      message:
        "Leave Application created successfully.",
      application:
        populatedApplication,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// --------------------------------------------------
// GET ALL LEAVE APPLICATIONS
// --------------------------------------------------

export const getLeaveApplications = async (
  req,
  res
) => {
  try {
    const {
      status,
      employeeId,
      year,
    } = req.query;

    const filter = {};

    if (
      status &&
      ["pending", "approved", "rejected"].includes(
        status
      )
    ) {
      filter.status = status;
    }

    if (employeeId) {
      filter.employee =
        employeeId;
    }

    if (year) {
      const numericYear =
        Number(year);

      if (
        !Number.isInteger(numericYear)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid year.",
        });
      }

      filter.fromDate = {
        $gte: new Date(
          numericYear,
          0,
          1
        ),

        $lt: new Date(
          numericYear + 1,
          0,
          1
        ),
      };
    }

    const applications =
      await LeaveApplication.find(
        filter
      )
        .populate(
          "employee",
          "employeeCode name department designation"
        )
        .populate(
          "leaveType",
          "name"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      applications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// --------------------------------------------------
// GET ONE LEAVE APPLICATION
// --------------------------------------------------

export const getLeaveApplicationById = async (
  req,
  res
) => {
  try {
    const application =
      await LeaveApplication.findById(
        req.params.id
      )
        .populate(
          "employee",
          "employeeCode name department designation"
        )
        .populate(
          "leaveType",
          "name"
        );

    if (!application) {
      return res.status(404).json({
        success: false,
        message:
          "Leave Application not found.",
      });
    }

    return res.status(200).json({
      success: true,
      application,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// --------------------------------------------------
// APPROVE LEAVE APPLICATION
// --------------------------------------------------

export const approveLeaveApplication = async (
  req,
  res
) => {
  try {
    const { decisionNote = "" } =
      req.body;

    const application =
      await LeaveApplication.findById(
        req.params.id
      );

    if (!application) {
      return res.status(404).json({
        success: false,
        message:
          "Leave Application not found.",
      });
    }

    if (
      application.status !==
      "pending"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only pending Leave Applications can be approved.",
      });
    }

    const year =
      application.fromDate.getFullYear();

    const leaveBalance =
      await EmployeeLeaveBalance.findOne({
        employee:
          application.employee,

        year,
      });

    if (!leaveBalance) {
      return res.status(404).json({
        success: false,
        message:
          "Employee Leave Balance not found.",
      });
    }

    const balanceItem =
      leaveBalance.balances.find(
        (item) =>
          item.leaveType.toString() ===
          application.leaveType.toString()
      );

    if (!balanceItem) {
      return res.status(400).json({
        success: false,
        message:
          "Leave Type does not exist in the employee's Leave Balance.",
      });
    }

    // Check again at approval time.
    // Balance may have changed after application creation.

    if (
      balanceItem.remaining <
      application.numberOfDays
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Insufficient leave balance. Remaining: ${balanceItem.remaining} day(s).`,
      });
    }

    // Deduct balance

    balanceItem.used +=
      application.numberOfDays;

    balanceItem.remaining -=
      application.numberOfDays;

    await leaveBalance.save();

    // Update application

    application.status =
      "approved";

    application.decisionNote =
      decisionNote.trim();

    application.decidedAt =
      new Date();

    await application.save();

    const populatedApplication =
      await LeaveApplication.findById(
        application._id
      )
        .populate(
          "employee",
          "employeeCode name department designation"
        )
        .populate(
          "leaveType",
          "name"
        );

    const populatedBalance =
      await EmployeeLeaveBalance.findById(
        leaveBalance._id
      ).populate(
        "balances.leaveType",
        "name"
      );

    return res.status(200).json({
      success: true,

      message:
        "Leave Application approved successfully.",

      application:
        populatedApplication,

      leaveBalance:
        populatedBalance,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// --------------------------------------------------
// REJECT LEAVE APPLICATION
// --------------------------------------------------

export const rejectLeaveApplication = async (
  req,
  res
) => {
  try {
    const { decisionNote = "" } =
      req.body;

    const application =
      await LeaveApplication.findById(
        req.params.id
      );

    if (!application) {
      return res.status(404).json({
        success: false,
        message:
          "Leave Application not found.",
      });
    }

    if (
      application.status !==
      "pending"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only pending Leave Applications can be rejected.",
      });
    }

    application.status =
      "rejected";

    application.decisionNote =
      decisionNote.trim();

    application.decidedAt =
      new Date();

    await application.save();

    const populatedApplication =
      await LeaveApplication.findById(
        application._id
      )
        .populate(
          "employee",
          "employeeCode name department designation"
        )
        .populate(
          "leaveType",
          "name"
        );

    return res.status(200).json({
      success: true,

      message:
        "Leave Application rejected successfully.",

      application:
        populatedApplication,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};