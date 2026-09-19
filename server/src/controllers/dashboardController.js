import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import LeaveApplication from "../models/LeaveApplication.js";

// ---------------------------------------
// Dashboard Overview
// ---------------------------------------

export const getDashboardOverview = async (req, res) => {
  try {
    // Current date in YYYY-MM-DD
    const now = new Date();

    const year = now.getFullYear();
    const month = String(
      now.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      now.getDate()
    ).padStart(2, "0");

    const todayString =
      `${year}-${month}-${day}`;

    // Start/end of today for Date-based leave fields
    const startOfToday =
      new Date(
        year,
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0
      );

    const endOfToday =
      new Date(
        year,
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999
      );

    // ---------------------------------------
    // Employee totals
    // ---------------------------------------

    const totalEmployees =
      await Employee.countDocuments({
        isInactive: false,
      });

    // ---------------------------------------
    // Attendance totals for today
    // ---------------------------------------

    const presentToday =
      await Attendance.countDocuments({
        date: todayString,
        status: "Present",
      });

    const absentToday =
      await Attendance.countDocuments({
        date: todayString,
        status: "Absent",
      });

    const lateToday =
      await Attendance.countDocuments({
        date: todayString,
        status: "Present",
        lateMinutes: {
          $gt: 0,
        },
      });

    // ---------------------------------------
    // Leave application totals
    // ---------------------------------------

    const pendingLeave =
      await LeaveApplication.countDocuments({
        status: "pending",
      });

    const approvedLeave =
      await LeaveApplication.countDocuments({
        status: "approved",
      });

    const rejectedLeave =
      await LeaveApplication.countDocuments({
        status: "rejected",
      });

    // ---------------------------------------
    // Employees on leave today
    // ---------------------------------------

    const onLeaveToday =
      await LeaveApplication.countDocuments({
        status: "approved",

        fromDate: {
          $lte: endOfToday,
        },

        toDate: {
          $gte: startOfToday,
        },
      });

    // ---------------------------------------
    // Recent pending leave requests
    // ---------------------------------------

    const recentPendingLeave =
      await LeaveApplication.find({
        status: "pending",
      })
        .populate(
          "employee",
          "employeeCode name"
        )
        .populate(
          "leaveType",
          "name"
        )
        .sort({
          createdAt: -1,
        })
        .limit(5);

    // ---------------------------------------
    // Response
    // ---------------------------------------

    return res.status(200).json({
      success: true,

      overview: {
        totalEmployees,
        presentToday,
        absentToday,
        lateToday,

        pendingLeave,
        approvedLeave,
        rejectedLeave,
        onLeaveToday,
      },

      recentPendingLeave,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to load dashboard overview.",
    });
  }
};