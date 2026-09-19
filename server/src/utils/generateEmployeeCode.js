import Employee from "../models/Employee.js";

export const generateEmployeeCode = async () => {
  const now = new Date();

  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear()).slice(-2);

  const prefix = `EMP-${month}${year}-`;

  const lastEmployee = await Employee.findOne({
    employeeCode: { $regex: `^${prefix}` },
  })
    .sort({ employeeCode: -1 })
    .select("employeeCode");

  let nextNumber = 1;

  if (lastEmployee) {
    const parts = lastEmployee.employeeCode.split("-");
    const lastNumber = Number(parts[2]);

    nextNumber = lastNumber + 1;
  }

  const serial = String(nextNumber).padStart(3, "0");

  return `${prefix}${serial}`;
};