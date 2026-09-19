import LeaveSchedule from "../models/LeaveSchedule.js";
import Parameter from "../models/Parameter.js";

// ---------------------------------------
// Validate leave allocations
// ---------------------------------------

const validateAllocations = async (allocations) => {
  if (!Array.isArray(allocations) || allocations.length === 0) {
    return {
      valid: false,
      message: "At least one leave allocation is required.",
    };
  }

  // Prevent same leave type appearing twice
  const leaveTypeIds = allocations.map((item) =>
    String(item.leaveType)
  );

  if (new Set(leaveTypeIds).size !== leaveTypeIds.length) {
    return {
      valid: false,
      message: "A Leave Type cannot be added more than once.",
    };
  }

  for (const allocation of allocations) {
    if (!allocation.leaveType) {
      return {
        valid: false,
        message: "Leave Type is required.",
      };
    }

    const days = Number(allocation.days);

    if (!Number.isFinite(days) || days < 0) {
      return {
        valid: false,
        message: "Leave days must be zero or greater.",
      };
    }

    const leaveType = await Parameter.findOne({
      _id: allocation.leaveType,
      category: "leave-type",
      isActive: true,
    });

    if (!leaveType) {
      return {
        valid: false,
        message:
          "One or more selected Leave Types are invalid or inactive.",
      };
    }
  }

  return {
    valid: true,
  };
};

// ---------------------------------------
// GET ALL LEAVE SCHEDULES
// ---------------------------------------

export const getLeaveSchedules = async (req, res) => {
  try {
    const { active } = req.query;

    const filter = {};

    if (active === "true") {
      filter.isActive = true;
    }

    if (active === "false") {
      filter.isActive = false;
    }

    const schedules = await LeaveSchedule.find(filter)
      .populate(
        "allocations.leaveType",
        "name category isActive"
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      schedules,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------------------------------------
// GET ONE LEAVE SCHEDULE
// ---------------------------------------

export const getLeaveScheduleById = async (req, res) => {
  try {
    const schedule = await LeaveSchedule.findById(
      req.params.id
    ).populate(
      "allocations.leaveType",
      "name category isActive"
    );

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Leave Schedule not found.",
      });
    }

    return res.status(200).json({
      success: true,
      schedule,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------------------------------------
// CREATE LEAVE SCHEDULE
// ---------------------------------------

export const createLeaveSchedule = async (req, res) => {
  try {
    const {
      name,
      description = "",
      allocations,
      isActive = true,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Leave Schedule name is required.",
      });
    }

    const validation = await validateAllocations(allocations);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const normalizedAllocations = allocations.map((item) => ({
      leaveType: item.leaveType,
      days: Number(item.days),
    }));

    let schedule = await LeaveSchedule.create({
      name: name.trim(),
      description: description.trim(),
      allocations: normalizedAllocations,
      isActive:
        typeof isActive === "boolean" ? isActive : true,
    });

    schedule = await LeaveSchedule.findById(
      schedule._id
    ).populate(
      "allocations.leaveType",
      "name category isActive"
    );

    return res.status(201).json({
      success: true,
      message: "Leave Schedule created successfully.",
      schedule,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "A Leave Schedule with this name already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------------------------------------
// UPDATE LEAVE SCHEDULE
// ---------------------------------------

export const updateLeaveSchedule = async (req, res) => {
  try {
    const {
      name,
      description = "",
      allocations,
      isActive,
    } = req.body;

    const schedule = await LeaveSchedule.findById(
      req.params.id
    );

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Leave Schedule not found.",
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Leave Schedule name is required.",
      });
    }

    const validation = await validateAllocations(allocations);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    schedule.name = name.trim();
    schedule.description = description.trim();

    schedule.allocations = allocations.map((item) => ({
      leaveType: item.leaveType,
      days: Number(item.days),
    }));

    if (typeof isActive === "boolean") {
      schedule.isActive = isActive;
    }

    await schedule.save();

    const updatedSchedule =
      await LeaveSchedule.findById(
        schedule._id
      ).populate(
        "allocations.leaveType",
        "name category isActive"
      );

    return res.status(200).json({
      success: true,
      message: "Leave Schedule updated successfully.",
      schedule: updatedSchedule,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "Another Leave Schedule with this name already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------------------------------------
// DELETE LEAVE SCHEDULE
// ---------------------------------------

export const deleteLeaveSchedule = async (req, res) => {
  try {
    const schedule = await LeaveSchedule.findById(
      req.params.id
    );

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Leave Schedule not found.",
      });
    }

    await schedule.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Leave Schedule deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};