import Employee from "../models/Employee.js";
import AttendanceSchedule from "../models/AttendanceSchedule.js";
import LeaveSchedule from "../models/LeaveSchedule.js";
import EmployeeLeaveBalance from "../models/EmployeeLeaveBalance.js";
import { generateEmployeeCode } from "../utils/generateEmployeeCode.js";

export const createEmployee = async (req, res) => {
  try {
    const {
      enrollId,
      name,
      fatherName,
      motherName,
      phone,
      email,
      department,
      designation,
      gender,
      maritalStatus,
      nationality,
      religion,
      isInactive,
    } = req.body;

    if (
      !enrollId ||
      !name ||
      !fatherName ||
      !motherName ||
      !phone ||
      !email ||
      !department ||
      !designation ||
      !gender ||
      !maritalStatus ||
      !nationality ||
      !religion
    ) {
      return res.status(400).json({
        success: false,
        message: "All employee fields are required.",
      });
    }

    const existingEmail = await Employee.findOne({ email });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "An employee with this email already exists.",
      });
    }

    const existingEnrollId = await Employee.findOne({ enrollId });

    if (existingEnrollId) {
      return res.status(400).json({
        success: false,
        message: "This Enroll ID is already in use.",
      });
    }

    const employeeCode = await generateEmployeeCode();

    const employee = await Employee.create({
      employeeCode,
      enrollId,
      name,
      fatherName,
      motherName,
      phone,
      email,
      department,
      designation,
      gender,
      maritalStatus,
      nationality,
      religion,
      isInactive: isInactive || false,
    });

    res.status(201).json({
      success: true,
      message: "Employee created successfully.",
      employee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getEmployees = async (req, res) => {
  try {
    const {
      employeeCode,
      department,
      designation,
      limit = 10,
      page = 1,
    } = req.query;

    const filter = {};

    if (employeeCode) {
      filter.employeeCode = {
        $regex: employeeCode,
        $options: "i",
      };
    }

    if (department) {
      filter.department = department;
    }

    if (designation) {
      filter.designation = designation;
    }

    const pageNumber = Math.max(Number(page) || 1, 1);
    const pageSize = Math.max(Number(limit) || 10, 1);

    const employees = await Employee.find(filter)
    .populate(
        "attendanceSchedule",
        "name startTime endTime intervalStart intervalEnd isActive"
    )


    .populate({
        path: "leaveSchedule",
        populate: {
          path: "allocations.leaveType",
          select: "name category isActive",
        },
      })



    .sort({ createdAt: -1 })
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize);

    const total = await Employee.countDocuments(filter);

    res.status(200).json({
      success: true,
      employees,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const getNextEmployeeCode = async (req, res) => {
  try {
    const employeeCode = await generateEmployeeCode();

    res.status(200).json({
      success: true,
      employeeCode,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate employee code.",
    });
  }
};

// Get one employee
export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(
      req.params.id
    )
      .populate(
        "attendanceSchedule",
        "name startTime endTime intervalStart intervalEnd isActive"
      )
      .populate({
        path: "leaveSchedule",
        populate: {
          path: "allocations.leaveType",
          select: "name category isActive",
        },
      });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    res.status(200).json({
      success: true,
      employee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load employee.",
    });
  }
};


// Update employee
export const updateEmployee = async (req, res) => {
  try {
    const {
      enrollId,
      name,
      fatherName,
      motherName,
      phone,
      email,
      department,
      designation,
      gender,
      maritalStatus,
      nationality,
      religion,
      isInactive,
    } = req.body;

    // All employee information is required
    if (
      !enrollId ||
      !name ||
      !fatherName ||
      !motherName ||
      !phone ||
      !email ||
      !department ||
      !designation ||
      !gender ||
      !maritalStatus ||
      !nationality ||
      !religion
    ) {
      return res.status(400).json({
        success: false,
        message: "All employee fields are required.",
      });
    }

    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    // Check duplicate email belonging to another employee
    const existingEmail = await Employee.findOne({
      email: email.toLowerCase(),
      _id: { $ne: req.params.id },
    });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Another employee already uses this email.",
      });
    }

    // Check duplicate enroll ID
    const existingEnrollId = await Employee.findOne({
      enrollId,
      _id: { $ne: req.params.id },
    });

    if (existingEnrollId) {
      return res.status(400).json({
        success: false,
        message: "Another employee already uses this Enroll ID.",
      });
    }

    employee.enrollId = enrollId;
    employee.name = name;
    employee.fatherName = fatherName;
    employee.motherName = motherName;
    employee.phone = phone;
    employee.email = email;
    employee.department = department;
    employee.designation = designation;
    employee.gender = gender;
    employee.maritalStatus = maritalStatus;
    employee.nationality = nationality;
    employee.religion = religion;
    employee.isInactive = Boolean(isInactive);

    await employee.save();

    res.status(200).json({
      success: true,
      message: "Employee updated successfully.",
      employee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    await Employee.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Employee deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ---------------------------------------
// Assign Attendance Schedule to Employee
// ---------------------------------------

export const assignAttendanceSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.body;

    if (!scheduleId) {
      return res.status(400).json({
        success: false,
        message: "Attendance schedule is required.",
      });
    }

    const employee = await Employee.findById(
      req.params.id
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    const schedule =
      await AttendanceSchedule.findById(
        scheduleId
      );

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message:
          "Attendance schedule not found.",
      });
    }

    if (!schedule.isActive) {
      return res.status(400).json({
        success: false,
        message:
          "Inactive attendance schedules cannot be assigned.",
      });
    }

    employee.attendanceSchedule =
      schedule._id;

    await employee.save();

    const updatedEmployee =
      await Employee.findById(
        employee._id
      ).populate(
        "attendanceSchedule",
        "name startTime endTime intervalStart intervalEnd isActive"
      );

    return res.status(200).json({
      success: true,
      message:
        "Attendance schedule assigned successfully.",
      employee: updatedEmployee,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------------------------------------
// Assign Leave Schedule to Employee
// and initialize yearly leave balance
// ---------------------------------------

export const assignLeaveSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.body;

    if (!scheduleId) {
      return res.status(400).json({
        success: false,
        message: "Leave schedule is required.",
      });
    }

    const employee = await Employee.findById(
      req.params.id
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    const schedule = await LeaveSchedule.findById(
      scheduleId
    );

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Leave schedule not found.",
      });
    }

    if (!schedule.isActive) {
      return res.status(400).json({
        success: false,
        message:
          "Inactive Leave Schedules cannot be assigned.",
      });
    }

    // Save relationship on employee
    employee.leaveSchedule = schedule._id;

    await employee.save();

    // Current calendar year
    const currentYear =
      new Date().getFullYear();

    // Check whether this employee already has
    // a leave balance for this year
    let leaveBalance =
      await EmployeeLeaveBalance.findOne({
        employee: employee._id,
        year: currentYear,
      });

    // Convert schedule allocations into
    // employee-specific balances
    const newBalances =
      schedule.allocations.map(
        (allocation) => ({
          leaveType:
            allocation.leaveType,

          allocated:
            allocation.days,

          used: 0,

          remaining:
            allocation.days,
        })
      );

    if (!leaveBalance) {
      // First time assigning a Leave Schedule
      // for this employee/year
      leaveBalance =
        await EmployeeLeaveBalance.create({
          employee:
            employee._id,

          leaveSchedule:
            schedule._id,

          year:
            currentYear,

          balances:
            newBalances,
        });
    } else {
      // Existing balance record:
      // update the Leave Schedule reference.
      //
      // For now we reset the balance because
      // we have not started leave applications yet.
      leaveBalance.leaveSchedule =
        schedule._id;

      leaveBalance.balances =
        newBalances;

      await leaveBalance.save();
    }

    const updatedEmployee =
      await Employee.findById(
        employee._id
      )
        .populate(
          "attendanceSchedule",
          "name startTime endTime intervalStart intervalEnd isActive"
        )
        .populate({
          path: "leaveSchedule",
          populate: {
            path:
              "allocations.leaveType",
            select:
              "name category isActive",
          },
        });

    const populatedLeaveBalance =
      await EmployeeLeaveBalance.findById(
        leaveBalance._id
      )
        .populate(
          "employee",
          "employeeCode name"
        )
        .populate(
          "leaveSchedule",
          "name description"
        )
        .populate(
          "balances.leaveType",
          "name category isActive"
        );

    return res.status(200).json({
      success: true,

      message:
        "Leave Schedule assigned and Leave Balance initialized successfully.",

      employee:
        updatedEmployee,

      leaveBalance:
        populatedLeaveBalance,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};