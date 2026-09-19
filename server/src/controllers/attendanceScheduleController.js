import AttendanceSchedule from "../models/AttendanceSchedule.js";

// ---------------------------------------
// Helper: validate HH:mm time
// ---------------------------------------

const isValidTime = (value) => {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
};

// ---------------------------------------
// GET ALL ATTENDANCE SCHEDULES
// ---------------------------------------

export const getAttendanceSchedules = async (req, res) => {
  try {
    const schedules = await AttendanceSchedule.find().sort({
      createdAt: 1,
    });

    res.status(200).json({
      success: true,
      schedules,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------------------------------------
// GET ONE ATTENDANCE SCHEDULE
// ---------------------------------------

export const getAttendanceScheduleById = async (req, res) => {
  try {
    const schedule = await AttendanceSchedule.findById(
      req.params.id
    );

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Attendance schedule not found.",
      });
    }

    res.status(200).json({
      success: true,
      schedule,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------------------------------------
// CREATE ATTENDANCE SCHEDULE
// ---------------------------------------

export const createAttendanceSchedule = async (req, res) => {
  try {
    const {
      name,
      startTime,
      endTime,
      intervalStart,
      intervalEnd,
      isActive = true,
    } = req.body;

    if (
      !name ||
      !startTime ||
      !endTime ||
      !intervalStart ||
      !intervalEnd
    ) {
      return res.status(400).json({
        success: false,
        message: "All attendance schedule fields are required.",
      });
    }

    if (
      !isValidTime(startTime) ||
      !isValidTime(endTime) ||
      !isValidTime(intervalStart) ||
      !isValidTime(intervalEnd)
    ) {
      return res.status(400).json({
        success: false,
        message: "Time must be in HH:mm format.",
      });
    }

    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time.",
      });
    }

    if (intervalStart >= intervalEnd) {
      return res.status(400).json({
        success: false,
        message: "Interval end must be after interval start.",
      });
    }

    if (
      intervalStart < startTime ||
      intervalEnd > endTime
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Interval time must be within the schedule start and end time.",
      });
    }

    const schedule = await AttendanceSchedule.create({
      name: name.trim(),
      startTime,
      endTime,
      intervalStart,
      intervalEnd,
      isActive:
        typeof isActive === "boolean"
          ? isActive
          : true,
    });

    res.status(201).json({
      success: true,
      message: "Attendance schedule created successfully.",
      schedule,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------------------------------------
// UPDATE ATTENDANCE SCHEDULE
// ---------------------------------------

export const updateAttendanceSchedule = async (req, res) => {
  try {
    const {
      name,
      startTime,
      endTime,
      intervalStart,
      intervalEnd,
      isActive,
    } = req.body;

    if (
      !name ||
      !startTime ||
      !endTime ||
      !intervalStart ||
      !intervalEnd
    ) {
      return res.status(400).json({
        success: false,
        message: "All attendance schedule fields are required.",
      });
    }

    if (
      !isValidTime(startTime) ||
      !isValidTime(endTime) ||
      !isValidTime(intervalStart) ||
      !isValidTime(intervalEnd)
    ) {
      return res.status(400).json({
        success: false,
        message: "Time must be in HH:mm format.",
      });
    }

    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time.",
      });
    }

    if (intervalStart >= intervalEnd) {
      return res.status(400).json({
        success: false,
        message: "Interval end must be after interval start.",
      });
    }

    if (
      intervalStart < startTime ||
      intervalEnd > endTime
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Interval time must be within the schedule start and end time.",
      });
    }

    const schedule = await AttendanceSchedule.findById(
      req.params.id
    );

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Attendance schedule not found.",
      });
    }

    schedule.name = name.trim();
    schedule.startTime = startTime;
    schedule.endTime = endTime;
    schedule.intervalStart = intervalStart;
    schedule.intervalEnd = intervalEnd;

    if (typeof isActive === "boolean") {
      schedule.isActive = isActive;
    }

    await schedule.save();

    res.status(200).json({
      success: true,
      message: "Attendance schedule updated successfully.",
      schedule,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------------------------------------
// DELETE ATTENDANCE SCHEDULE
// ---------------------------------------

export const deleteAttendanceSchedule = async (req, res) => {
  try {
    const schedule = await AttendanceSchedule.findById(
      req.params.id
    );

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Attendance schedule not found.",
      });
    }

    await schedule.deleteOne();

    res.status(200).json({
      success: true,
      message: "Attendance schedule deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};