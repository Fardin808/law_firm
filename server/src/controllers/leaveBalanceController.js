import EmployeeLeaveBalance from "../models/EmployeeLeaveBalance.js";

export const getEmployeeLeaveBalance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const year =
      Number(req.query.year) ||
      new Date().getFullYear();

    const leaveBalance =
      await EmployeeLeaveBalance.findOne({
        employee: employeeId,
        year,
      })
        .populate(
          "employee",
          "employeeCode name department designation"
        )
        .populate(
          "leaveSchedule",
          "name description"
        )
        .populate(
          "balances.leaveType",
          "name category isActive"
        );

    if (!leaveBalance) {
      return res.status(404).json({
        success: false,
        message:
          "Leave Balance not found for this employee and year.",
      });
    }

    return res.status(200).json({
      success: true,
      leaveBalance,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};