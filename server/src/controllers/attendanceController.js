import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";

// ---------------------------------------
// Helpers
// ---------------------------------------

const timeToMinutes = (time) => {
  if (!time) return null;

  const [hours, minutes] = time
    .split(":")
    .map(Number);

  return hours * 60 + minutes;
};

const minutesToDuration = (minutes) => {
  if (!minutes || minutes <= 0) {
    return "00:00";
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(
    mins
  ).padStart(2, "0")}`;
};

// ---------------------------------------
// GET ATTENDANCE LIST
// ---------------------------------------

export const getAttendanceList = async (
  req,
  res
) => {
  try {
    const attendance =
      await Attendance.find()
        .populate(
          "employee",
          "employeeCode name attendanceSchedule"
        )
        .populate(
          "schedule",
          "name startTime endTime intervalStart intervalEnd"
        )
        .sort({
          date: -1,
          createdAt: 1,
        });

    return res.status(200).json({
      success: true,
      attendance,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------------------------------------
// GENERATE ATTENDANCE ROW
// ---------------------------------------
// Creates one row for one employee/date.
// Only employees with an assigned schedule
// are allowed.
// ---------------------------------------

export const generateAttendanceRow = async (
  req,
  res
) => {
  try {
    const {
      employeeId,
      date,
      day,
    } = req.body;

    if (!employeeId || !date || !day) {
      return res.status(400).json({
        success: false,
        message:
          "Employee, date and day are required.",
      });
    }

    if (day === "Friday") {
      return res.status(400).json({
        success: false,
        message:
          "Friday is not a working day.",
      });
    }

    const employee =
      await Employee.findById(
        employeeId
      ).populate(
        "attendanceSchedule"
      );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    if (!employee.attendanceSchedule) {
      return res.status(400).json({
        success: false,
        message:
          "Employee does not have an attendance schedule assigned.",
      });
    }

    const existing =
      await Attendance.findOne({
        employee: employee._id,
        date,
      });

    if (existing) {
      return res.status(400).json({
        success: false,
        message:
          "Attendance already exists for this employee on this date.",
      });
    }

    const attendance =
      await Attendance.create({
        employee: employee._id,
        schedule:
          employee.attendanceSchedule._id,
        date,
        day,
        inTime: "",
        outTime: "",
        durationMinutes: 0,
        lateMinutes: 0,
        status: "Absent",
        description: "Working day",
      });

    return res.status(201).json({
      success: true,
      message:
        "Attendance row generated successfully.",
      attendance,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------------------------------------
// UPDATE IN TIME / OUT TIME
// ---------------------------------------

export const updateAttendance = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const {
      inTime = "",
      outTime = "",
    } = req.body;

    const attendance =
      await Attendance.findById(
        id
      ).populate(
        "schedule"
      );

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message:
          "Attendance record not found.",
      });
    }

    attendance.inTime = inTime;
    attendance.outTime = outTime;

    // ------------------------------
    // No times
    // ------------------------------

    if (!inTime && !outTime) {
      attendance.status = "Absent";
      attendance.durationMinutes = 0;
      attendance.lateMinutes = 0;
    }

    // ------------------------------
    // Both times present
    // ------------------------------

    if (inTime && outTime) {
      const actualIn =
        timeToMinutes(inTime);

      const actualOut =
        timeToMinutes(outTime);

      const scheduledStart =
        timeToMinutes(
          attendance.schedule.startTime
        );

      if (
        actualIn === null ||
        actualOut === null ||
        scheduledStart === null
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid attendance time.",
        });
      }

      if (actualOut < actualIn) {
        return res.status(400).json({
          success: false,
          message:
            "Out Time cannot be earlier than In Time.",
        });
      }

      attendance.status = "Present";

      attendance.durationMinutes =
        actualOut - actualIn;

      attendance.lateMinutes =
        Math.max(
          actualIn -
            scheduledStart,
          0
        );
    }

    // ------------------------------
    // Only one time entered
    // ------------------------------
    // Keep status Absent until both
    // values are provided.
    // ------------------------------

    if (
      (inTime && !outTime) ||
      (!inTime && outTime)
    ) {
      attendance.status = "Absent";
      attendance.durationMinutes = 0;

      if (inTime) {
        const actualIn =
          timeToMinutes(inTime);

        const scheduledStart =
          timeToMinutes(
            attendance.schedule.startTime
          );

        attendance.lateMinutes =
          Math.max(
            actualIn -
              scheduledStart,
            0
          );
      } else {
        attendance.lateMinutes = 0;
      }
    }

    await attendance.save();

    const updatedAttendance =
      await Attendance.findById(
        attendance._id
      )
        .populate(
          "employee",
          "employeeCode name"
        )
        .populate(
          "schedule",
          "name startTime endTime intervalStart intervalEnd"
        );

    return res.status(200).json({
      success: true,
      message:
        "Attendance updated successfully.",
      attendance:
        updatedAttendance,

      duration:
        minutesToDuration(
          attendance.durationMinutes
        ),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------------------------------------
// GENERATE ATTENDANCE FOR A DATE
// ---------------------------------------

export const generateAttendanceForDate = async (req, res) => {
  try {
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required.",
      });
    }

    // Prevent timezone problems by treating
    // the supplied YYYY-MM-DD as a local calendar date.
    const dateParts = date.split("-").map(Number);

    if (
      dateParts.length !== 3 ||
      dateParts.some((part) => Number.isNaN(part))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD.",
      });
    }

    const [year, month, dayOfMonth] = dateParts;

    const selectedDate = new Date(
      year,
      month - 1,
      dayOfMonth
    );

    // Check that the date is actually valid
    if (
      selectedDate.getFullYear() !== year ||
      selectedDate.getMonth() !== month - 1 ||
      selectedDate.getDate() !== dayOfMonth
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid date.",
      });
    }

    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    const day = dayNames[selectedDate.getDay()];

    // Friday is excluded
    if (day === "Friday") {
      return res.status(200).json({
        success: true,
        message: "Friday is not a working day.",
        date,
        day,
        attendance: [],
      });
    }

    // Only active employees who have a schedule
    const employees = await Employee.find({
      attendanceSchedule: {
        $ne: null,
      },
      isInactive: false,
    }).populate("attendanceSchedule");

    let createdCount = 0;

    // Create a row for each scheduled employee
    // only when one does not already exist.
    for (const employee of employees) {
      if (!employee.attendanceSchedule) {
        continue;
      }

      const existingAttendance =
        await Attendance.findOne({
          employee: employee._id,
          date,
        });

      if (!existingAttendance) {
        await Attendance.create({
          employee: employee._id,

          schedule:
            employee.attendanceSchedule._id,

          date,
          day,

          inTime: "",
          outTime: "",

          durationMinutes: 0,
          lateMinutes: 0,

          status: "Absent",

          description: "Working day",
        });

        createdCount++;
      }
    }

    // Return all attendance rows for this date
    const attendance =
      await Attendance.find({
        date,
      })
        .populate(
          "employee",
          "employeeCode name department designation"
        )
        .populate(
          "schedule",
          "name startTime endTime intervalStart intervalEnd"
        )
        .sort({
          createdAt: 1,
        });

    return res.status(200).json({
      success: true,

      message:
        createdCount > 0
          ? `${createdCount} attendance row(s) generated successfully.`
          : "Attendance rows already exist for this date.",

      date,
      day,
      createdCount,
      attendance,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};