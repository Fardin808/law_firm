"use client";

import { API_BASE_URL } from "@/lib/api";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";

import {
  Plus,
  Pencil,
  Trash2,
  WalletCards,
  UserRoundCheck,
  X,
  Check,
  Search,
  Users,
  Building2,
  CalendarDays,
  FileText,
  BarChart3,
  ChevronRight,
  Mail,
  Phone,
  AlertTriangle,
} from "lucide-react";

// =====================================================
// Types
// =====================================================

type AttendanceSchedule = {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  intervalStart: string;
  intervalEnd: string;
  isActive: boolean;
};

type LeaveType = {
  _id: string;
  name: string;
  category: string;
  isActive: boolean;
};

type LeaveAllocation = {
  leaveType: LeaveType;
  days: number;
};

type LeaveSchedule = {
  _id: string;
  name: string;
  description: string;
  allocations: LeaveAllocation[];
  isActive: boolean;
};

type Employee = {
  _id: string;
  employeeCode: string;
  enrollId: string;
  name: string;
  department: string;
  designation: string;
  email: string;
  phone: string;
  attendanceSchedule?: AttendanceSchedule | null;
  leaveSchedule?: LeaveSchedule | null;
};

type Parameter = {
  _id: string;
  category: string;
  name: string;
  isActive: boolean;
};

// =====================================================
// Page
// =====================================================

export default function EmployeeInfoPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [employees, setEmployees] = useState<Employee[]>([]);

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [limit, setLimit] = useState("10");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [departments, setDepartments] = useState<Parameter[]>([]);
  const [designations, setDesignations] = useState<Parameter[]>([]);
  const [parametersLoading, setParametersLoading] = useState(true);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Attendance schedule modal
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  const [selectedEmployee, setSelectedEmployee] =
    useState<Employee | null>(null);

  const [schedules, setSchedules] = useState<AttendanceSchedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);

  const [assigningScheduleId, setAssigningScheduleId] =
    useState<string | null>(null);

  const [scheduleError, setScheduleError] = useState("");

  // Leave schedule modal
  const [leaveScheduleModalOpen, setLeaveScheduleModalOpen] =
    useState(false);

  const [selectedLeaveEmployee, setSelectedLeaveEmployee] =
    useState<Employee | null>(null);

  const [leaveSchedules, setLeaveSchedules] = useState<LeaveSchedule[]>([]);
  const [leaveSchedulesLoading, setLeaveSchedulesLoading] = useState(false);

  const [assigningLeaveScheduleId, setAssigningLeaveScheduleId] =
    useState<string | null>(null);

  const [leaveScheduleError, setLeaveScheduleError] = useState("");

  // =====================================================
  // Helpers
  // =====================================================

  const getToken = () =>
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  const handleUnauthorized = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    router.push("/login");
  };

  const formatTime = (time: string) => {
    if (!time) return "";

    const [hourString, minute] = time.split(":");

    let hour = Number(hourString);
    const period = hour >= 12 ? "PM" : "AM";

    hour = hour % 12 || 12;

    return `${hour}:${minute} ${period}`;
  };

  const getInitials = (name: string) => {
    return name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  };

  // =====================================================
  // Dynamic values
  // =====================================================

  const totalEmployees = employees.length;

  const assignedAttendance = employees.filter((employee) =>
    Boolean(employee.attendanceSchedule)
  ).length;

  const assignedLeave = employees.filter((employee) =>
    Boolean(employee.leaveSchedule)
  ).length;

  const visibleDepartmentCount = useMemo(
    () =>
      new Set(
        employees
          .map((employee) => employee.department)
          .filter(Boolean)
      ).size,
    [employees]
  );

  // =====================================================
  // Load Department / Designation
  // =====================================================

  useEffect(() => {
    const fetchFilterParameters = async () => {
      const token = getToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        setParametersLoading(true);

        const [departmentResponse, designationResponse] =
          await Promise.all([
            fetch(
              "${API_BASE_URL}/api/parameters/department?active=true",
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                cache: "no-store",
              }
            ),

            fetch(
              "${API_BASE_URL}/api/parameters/designation?active=true",
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                cache: "no-store",
              }
            ),
          ]);

        if (
          departmentResponse.status === 401 ||
          designationResponse.status === 401
        ) {
          handleUnauthorized();
          return;
        }

        const [departmentData, designationData] = await Promise.all([
          departmentResponse.json(),
          designationResponse.json(),
        ]);

        if (!departmentResponse.ok) {
          throw new Error(
            departmentData.message || "Failed to load departments."
          );
        }

        if (!designationResponse.ok) {
          throw new Error(
            designationData.message || "Failed to load designations."
          );
        }

        setDepartments(departmentData.parameters || []);
        setDesignations(designationData.parameters || []);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load filter parameters.";

        setError(message);
        toast.error(message);
      } finally {
        setParametersLoading(false);
      }
    };

    fetchFilterParameters();
  }, [router]);

  // =====================================================
  // Employees
  // =====================================================

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        router.push("/login");
        return;
      }

      const params = new URLSearchParams();

      if (search.trim()) {
        params.append("employeeCode", search.trim());
      }

      if (department) {
        params.append("department", department);
      }

      if (designation) {
        params.append("designation", designation);
      }

      params.append("limit", limit);

      const response = await fetch(
        `${API_BASE_URL}/api/employees?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load employees."
        );
      }

      setEmployees(data.employees || []);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load employees.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [department, designation, limit]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEmployees();
  };

  // =====================================================
  // Delete
  // =====================================================

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setDeleting(true);

      const response = await fetch(
        `${API_BASE_URL}/api/employees/${deleteTarget._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        toast.error(
          data.message || "Failed to delete employee."
        );
        return;
      }

      const deletedName = deleteTarget.name;

      setDeleteTarget(null);

      await fetchEmployees();

      toast.success(
        `${deletedName} deleted successfully.`
      );
    } catch {
      toast.error("Unable to connect to the server.");
    } finally {
      setDeleting(false);
    }
  };

  // =====================================================
  // Attendance Schedule
  // =====================================================

  const openScheduleModal = async (employee: Employee) => {
    setSelectedEmployee(employee);
    setScheduleModalOpen(true);
    setScheduleError("");

    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setSchedulesLoading(true);

      const response = await fetch(
        "${API_BASE_URL}/api/attendance-schedules",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load attendance schedules."
        );
      }

      const activeSchedules = (data.schedules || []).filter(
        (schedule: AttendanceSchedule) => schedule.isActive
      );

      setSchedules(activeSchedules);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to load attendance schedules.";

      setScheduleError(message);
      toast.error(message);
    } finally {
      setSchedulesLoading(false);
    }
  };

  const closeScheduleModal = () => {
    if (assigningScheduleId) return;

    setScheduleModalOpen(false);
    setSelectedEmployee(null);
    setSchedules([]);
    setScheduleError("");
  };

  const assignSchedule = async (
    schedule: AttendanceSchedule
  ) => {
    if (!selectedEmployee) return;

    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setAssigningScheduleId(schedule._id);
      setScheduleError("");

      const response = await fetch(
        `${API_BASE_URL}/api/employees/${selectedEmployee._id}/attendance-schedule`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            scheduleId: schedule._id,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const message =
          data.message ||
          "Failed to assign attendance schedule.";

        setScheduleError(message);
        toast.error(message);
        return;
      }

      setEmployees((previous) =>
        previous.map((employee) =>
          employee._id === selectedEmployee._id
            ? {
                ...employee,
                attendanceSchedule:
                  data.employee.attendanceSchedule,
              }
            : employee
        )
      );

      setScheduleModalOpen(false);
      setSelectedEmployee(null);
      setSchedules([]);

      toast.success(
        "Attendance schedule assigned successfully."
      );
    } catch {
      const message = "Unable to connect to the server.";

      setScheduleError(message);
      toast.error(message);
    } finally {
      setAssigningScheduleId(null);
    }
  };

  // =====================================================
  // Leave Schedule
  // =====================================================

  const openLeaveScheduleModal = async (
    employee: Employee
  ) => {
    setSelectedLeaveEmployee(employee);
    setLeaveScheduleModalOpen(true);
    setLeaveScheduleError("");

    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLeaveSchedulesLoading(true);

      const response = await fetch(
        "${API_BASE_URL}/api/leave-schedules?active=true",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load Leave Schedules."
        );
      }

      setLeaveSchedules(data.schedules || []);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to load Leave Schedules.";

      setLeaveScheduleError(message);
      toast.error(message);
    } finally {
      setLeaveSchedulesLoading(false);
    }
  };

  const closeLeaveScheduleModal = () => {
    if (assigningLeaveScheduleId) return;

    setLeaveScheduleModalOpen(false);
    setSelectedLeaveEmployee(null);
    setLeaveSchedules([]);
    setLeaveScheduleError("");
  };

  const assignLeaveSchedule = async (
    schedule: LeaveSchedule
  ) => {
    if (!selectedLeaveEmployee) return;

    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setAssigningLeaveScheduleId(schedule._id);
      setLeaveScheduleError("");

      const response = await fetch(
        `${API_BASE_URL}/api/employees/${selectedLeaveEmployee._id}/leave-schedule`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            scheduleId: schedule._id,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const message =
          data.message ||
          "Failed to assign Leave Schedule.";

        setLeaveScheduleError(message);
        toast.error(message);
        return;
      }

      setEmployees((previous) =>
        previous.map((employee) =>
          employee._id === selectedLeaveEmployee._id
            ? {
                ...employee,
                leaveSchedule:
                  data.employee.leaveSchedule,
              }
            : employee
        )
      );

      setLeaveScheduleModalOpen(false);
      setSelectedLeaveEmployee(null);
      setLeaveSchedules([]);

      toast.success(
        "Leave Schedule assigned successfully."
      );
    } catch {
      const message = "Unable to connect to the server.";

      setLeaveScheduleError(message);
      toast.error(message);
    } finally {
      setAssigningLeaveScheduleId(null);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <AdminLayout>
      <div className="text-[#17324d]">

        {/* =================================================
            HEADER + MODULE SWITCHER
        ================================================= */}

        <div className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(260px,1fr)_minmax(500px,680px)_minmax(220px,1fr)] xl:items-center">

          {/* LEFT */}

          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b1843d]">
              Employee Management
            </p>

            <h1 className="mt-1 font-serif text-[34px] font-semibold leading-tight tracking-[-0.02em] text-[#102a43]">
              Employees
            </h1>

            <p className="mt-1 max-w-[330px] text-sm leading-5 text-slate-500">
              Manage employee records, attendance and leave
              information.
            </p>
          </div>

          {/* CENTER SWITCHER */}

          <div className="w-full">
            <div className="grid w-full grid-cols-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] sm:grid-cols-3">

              <EmployeeTab
                active={
                  pathname === "/employees/employee-info"
                }
                icon={Users}
                label="Employee Info"
                onClick={() =>
                  router.push("/employees/employee-info")
                }
              />

              <EmployeeTab
                active={
                  pathname ===
                  "/employees/leave-application"
                }
                icon={FileText}
                label="Leave Application"
                onClick={() =>
                  router.push(
                    "/employees/leave-application"
                  )
                }
              />

              <EmployeeTab
                active={
                  pathname === "/employees/leave-balance"
                }
                icon={BarChart3}
                label="Leave Details"
                onClick={() =>
                  router.push("/employees/leave-balance")
                }
              />

            </div>
          </div>

          {/* RIGHT */}

          <div className="flex items-center gap-2 text-xs text-slate-400 xl:justify-end">
            <span>Employees</span>

            <ChevronRight size={13} />

            <span className="font-medium text-[#17324d]">
              Employee Info
            </span>
          </div>

        </div>

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={Users}
            title="Loaded Employees"
            value={totalEmployees}
          />

          <SummaryCard
            icon={Building2}
            title="Departments in Results"
            value={visibleDepartmentCount}
          />

          <SummaryCard
            icon={UserRoundCheck}
            title="Attendance Assigned"
            value={assignedAttendance}
          />

          <SummaryCard
            icon={CalendarDays}
            title="Leave Assigned"
            value={assignedLeave}
          />
        </div>

        {/* =================================================
            DIRECTORY
        ================================================= */}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          {/* DIRECTORY HEADER */}

          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fbf3e5] text-[#b1843d]">
                <Users size={17} />
              </div>

              <div>
                <h2 className="font-serif text-lg font-semibold text-[#17324d]">
                  Employee Directory
                </h2>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  View, search and manage employee records.
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={() => router.push("/employees/new")}
              className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0b2945] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#071e34]"
            >
              <Plus size={15} className="text-[#d6ad66]" />

              New Employee
            </button>
          </div>

          {/* =================================================
              FILTER BAR
          ================================================= */}

          <div className="border-b border-slate-100 bg-[#fcfcfd] px-5 py-4">
            <form
              onSubmit={handleSearch}
              className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(260px,1.5fr)_1fr_1fr_120px]"
            >

              {/* SEARCH */}

              <div className="flex gap-2">

                <div className="relative min-w-0 flex-1">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Search by Employee ID..."
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-[#17324d] outline-none transition placeholder:text-slate-400 focus:border-[#c6a364] focus:ring-2 focus:ring-[#c6a364]/10"
                  />
                </div>

                <button
                  type="submit"
                  className="h-10 rounded-lg bg-[#17324d] px-4 text-xs font-semibold text-white transition hover:bg-[#0b2945]"
                >
                  Search
                </button>

              </div>

              {/* DEPARTMENT */}

              <select
                value={department}
                onChange={(e) =>
                  setDepartment(e.target.value)
                }
                disabled={parametersLoading}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs text-[#17324d] outline-none focus:border-[#c6a364] disabled:bg-slate-50"
              >
                <option value="">
                  {parametersLoading
                    ? "Loading Departments..."
                    : "All Departments"}
                </option>

                {departments.map((item) => (
                  <option key={item._id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>

              {/* DESIGNATION */}

              <select
                value={designation}
                onChange={(e) =>
                  setDesignation(e.target.value)
                }
                disabled={parametersLoading}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs text-[#17324d] outline-none focus:border-[#c6a364] disabled:bg-slate-50"
              >
                <option value="">
                  {parametersLoading
                    ? "Loading Designations..."
                    : "All Designations"}
                </option>

                {designations.map((item) => (
                  <option key={item._id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>

              {/* LIMIT */}

              <select
                value={limit}
                onChange={(e) =>
                  setLimit(e.target.value)
                }
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs text-[#17324d] outline-none focus:border-[#c6a364]"
              >
                {[10, 20, 30, 40, 50].map((value) => (
                  <option key={value} value={value}>
                    {value} rows
                  </option>
                ))}
              </select>

            </form>
          </div>

          {/* ERROR */}

          {error && (
            <div className="mx-5 mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-2.5 text-xs text-red-600">
              {error}
            </div>
          )}

          {/* =================================================
              TABLE
          ================================================= */}

          <div className="p-4">

            <div className="w-full overflow-hidden rounded-lg border border-slate-200">

              <table className="w-full table-fixed border-collapse">

                <colgroup>
                  <col className="w-[4%]" />
                  <col className="w-[17%]" />
                  <col className="w-[11%]" />
                  <col className="w-[12%]" />
                  <col className="w-[22%]" />
                  <col className="w-[8%]" />
                  <col className="w-[9%]" />
                  <col className="w-[9%]" />
                  <col className="w-[8%]" />
                </colgroup>

                <thead className="bg-[#f8fafb]">
                  <tr>
                    <TableHead>SL</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead center>Account</TableHead>
                    <TableHead center>Attendance</TableHead>
                    <TableHead center>Leave</TableHead>
                    <TableHead center>Action</TableHead>
                  </tr>
                </thead>

                <tbody>

                  {loading ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="py-14 text-center"
                      >
                        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-[#b1843d]" />

                        <p className="mt-2 text-[10px] text-slate-400">
                          Loading employees...
                        </p>
                      </td>
                    </tr>
                  ) : employees.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="py-14 text-center"
                      >
                        <Users
                          size={28}
                          className="mx-auto text-slate-300"
                        />

                        <p className="mt-3 text-xs font-semibold text-[#17324d]">
                          No employees found
                        </p>

                        <p className="mt-1 text-[10px] text-slate-400">
                          Try changing the current filters.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    employees.map((employee, index) => (
                      <tr
                        key={employee._id}
                        className="border-b border-slate-100 transition last:border-b-0 hover:bg-[#fdfbf7]"
                      >

                        {/* SL */}

                        <TableCell>
                          <span className="text-slate-400">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                        </TableCell>

                        {/* EMPLOYEE */}

                        <TableCell>
                          <div className="flex min-w-0 items-center gap-2">

                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#edf3f8] text-[9px] font-bold text-[#17324d]">
                              {getInitials(employee.name)}
                            </div>

                            <div className="min-w-0">
                              <p
                                className="truncate text-[11px] font-semibold text-[#17324d]"
                                title={employee.name}
                              >
                                {employee.name}
                              </p>

                              <p
                                className="mt-0.5 truncate text-[9px] text-slate-400"
                                title={employee.employeeCode}
                              >
                                {employee.employeeCode}
                              </p>
                            </div>

                          </div>
                        </TableCell>

                        {/* DEPARTMENT */}

                        <TableCell>
                          <span
                            className="block truncate"
                            title={employee.department || "—"}
                          >
                            {employee.department || "—"}
                          </span>
                        </TableCell>

                        {/* DESIGNATION */}

                        <TableCell>
                          <span
                            className="block truncate"
                            title={employee.designation || "—"}
                          >
                            {employee.designation || "—"}
                          </span>
                        </TableCell>

                        {/* CONTACT */}

                        <TableCell>
                          <div className="space-y-1 text-[10px] text-slate-500">

                            <div className="flex min-w-0 items-center gap-1.5">
                              <Mail
                                size={11}
                                className="shrink-0 text-slate-400"
                              />

                              <span
                                className="truncate"
                                title={employee.email || "—"}
                              >
                                {employee.email || "—"}
                              </span>
                            </div>

                            <div className="flex min-w-0 items-center gap-1.5">
                              <Phone
                                size={11}
                                className="shrink-0 text-slate-400"
                              />

                              <span
                                className="truncate"
                                title={employee.phone || "—"}
                              >
                                {employee.phone || "—"}
                              </span>
                            </div>

                          </div>
                        </TableCell>

                        {/* ACCOUNT */}

                        <TableCell center>
                          <button
                            type="button"
                            title="Employee account"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#eef8f3] text-emerald-600 transition hover:bg-emerald-100"
                          >
                            <WalletCards size={13} />
                          </button>
                        </TableCell>

                        {/* ATTENDANCE */}

                        <TableCell center>
                          <button
                            type="button"
                            title={
                              employee.attendanceSchedule
                                ? `Assigned: ${employee.attendanceSchedule.name}`
                                : "No attendance schedule assigned"
                            }
                            onClick={() =>
                              openScheduleModal(employee)
                            }
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition ${
                              employee.attendanceSchedule
                                ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                : "bg-red-50 text-red-500 hover:bg-red-100"
                            }`}
                          >
                            <UserRoundCheck size={13} />
                          </button>
                        </TableCell>

                        {/* LEAVE */}

                        <TableCell center>
                          <button
                            type="button"
                            title={
                              employee.leaveSchedule
                                ? `Assigned: ${employee.leaveSchedule.name}`
                                : "No Leave Schedule assigned"
                            }
                            onClick={() =>
                              openLeaveScheduleModal(employee)
                            }
                            className={`inline-flex h-7 items-center justify-center gap-1 rounded-md px-2 text-[9px] font-semibold transition ${
                              employee.leaveSchedule
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "bg-red-50 text-red-600 hover:bg-red-100"
                            }`}
                          >
                            <CalendarDays size={11} />
                            Leave
                          </button>
                        </TableCell>

                        {/* ACTION */}

                        <TableCell center>
                          <div className="flex items-center justify-center gap-1">

                            <button
                              type="button"
                              title="Edit employee"
                              onClick={() =>
                                router.push(
                                  `/employees/${employee._id}/edit`
                                )
                              }
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                            >
                              <Pencil size={12} />
                            </button>

                            <button
                              type="button"
                              title="Delete employee"
                              onClick={() =>
                                setDeleteTarget(employee)
                              }
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-red-50 text-red-500 transition hover:bg-red-100"
                            >
                              <Trash2 size={12} />
                            </button>

                          </div>
                        </TableCell>

                      </tr>
                    ))
                  )}

                </tbody>

              </table>

              {!loading && employees.length > 0 && (
                <div className="border-t border-slate-100 px-4 py-2.5 text-[10px] text-slate-400">
                  Showing {employees.length} employee record
                  {employees.length === 1 ? "" : "s"}
                </div>
              )}

            </div>

          </div>

        </section>

      </div>

      {/* ==================================================
          DELETE MODAL
      ================================================== */}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#071727]/50 px-4 backdrop-blur-[2px]"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget &&
              !deleting
            ) {
              setDeleteTarget(null);
            }
          }}
        >
          <div className="w-full max-w-[440px] overflow-hidden rounded-xl bg-white shadow-2xl">

            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-red-500">
                  <AlertTriangle size={20} />
                </div>

                <div>
                  <h2 className="font-serif text-xl font-semibold text-[#17324d]">
                    Delete Employee
                  </h2>

                  <p className="text-xs text-slate-400">
                    This action requires confirmation.
                  </p>
                </div>

              </div>

              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="rounded-md p-2 text-slate-400 transition hover:bg-slate-100"
              >
                <X size={17} />
              </button>

            </div>

            <div className="px-6 py-6">

              <p className="text-sm leading-6 text-slate-600">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-[#17324d]">
                  {deleteTarget.name}
                </span>
                ?
              </p>

              <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600">
                The employee record will be permanently removed.
              </div>

            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-[#fafbfc] px-6 py-4">

              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="h-10 rounded-lg border border-slate-200 bg-white px-5 text-sm text-slate-600"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="flex h-10 items-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 size={15} />

                {deleting ? "Deleting..." : "Delete"}
              </button>

            </div>

          </div>
        </div>
      )}

      {/* ==================================================
          ATTENDANCE MODAL
      ================================================== */}

      {scheduleModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#071727]/50 px-4 backdrop-blur-[2px]">

          <div className="max-h-[85vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white shadow-2xl">

            <ModalHeader
              title="Attendance Schedule"
              subtitle="Select an attendance schedule for"
              employee={selectedEmployee}
              onClose={closeScheduleModal}
            />

            {selectedEmployee.attendanceSchedule && (
              <CurrentScheduleBanner
                label="Current Schedule"
                value={selectedEmployee.attendanceSchedule.name}
              />
            )}

            <div className="p-6">

              {scheduleError && (
                <ErrorMessage message={scheduleError} />
              )}

              <div className="overflow-hidden rounded-lg border border-slate-200">

                <div className="overflow-x-auto">

                  <table className="w-full min-w-[850px] text-sm">

                    <thead>
                      <tr className="bg-[#f8fafb]">
                        <TableHead>SL</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Start Time</TableHead>
                        <TableHead>End Time</TableHead>
                        <TableHead>Interval Start</TableHead>
                        <TableHead>Interval End</TableHead>
                        <TableHead center>Action</TableHead>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">

                      {schedulesLoading ? (
                        <LoadingRow
                          colSpan={7}
                          text="Loading attendance schedules..."
                        />
                      ) : schedules.length === 0 ? (
                        <LoadingRow
                          colSpan={7}
                          text="No active attendance schedules found."
                        />
                      ) : (
                        schedules.map((schedule, index) => {
                          const isCurrent =
                            selectedEmployee.attendanceSchedule
                              ?._id === schedule._id;

                          return (
                            <tr
                              key={schedule._id}
                              className="hover:bg-[#fdfbf7]"
                            >
                              <ModalCell>
                                {index + 1}
                              </ModalCell>

                              <ModalCell>
                                <span className="font-medium text-[#17324d]">
                                  {schedule.name}
                                </span>

                                {isCurrent && (
                                  <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                                    Current
                                  </span>
                                )}
                              </ModalCell>

                              <ModalCell>
                                {formatTime(schedule.startTime)}
                              </ModalCell>

                              <ModalCell>
                                {formatTime(schedule.endTime)}
                              </ModalCell>

                              <ModalCell>
                                {formatTime(schedule.intervalStart)}
                              </ModalCell>

                              <ModalCell>
                                {formatTime(schedule.intervalEnd)}
                              </ModalCell>

                              <ModalCell center>
                                {isCurrent ? (
                                  <CurrentButton />
                                ) : (
                                  <ApplyButton
                                    loading={
                                      assigningScheduleId ===
                                      schedule._id
                                    }
                                    disabled={
                                      assigningScheduleId !== null
                                    }
                                    onClick={() =>
                                      assignSchedule(schedule)
                                    }
                                  />
                                )}
                              </ModalCell>

                            </tr>
                          );
                        })
                      )}

                    </tbody>

                  </table>

                </div>

              </div>

            </div>

            <ModalFooter
              onClose={closeScheduleModal}
              disabled={assigningScheduleId !== null}
            />

          </div>

        </div>
      )}

      {/* ==================================================
          LEAVE MODAL
      ================================================== */}

      {leaveScheduleModalOpen && selectedLeaveEmployee && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#071727]/50 px-4 backdrop-blur-[2px]">

          <div className="max-h-[85vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white shadow-2xl">

            <ModalHeader
              title="Leave Schedule"
              subtitle="Select a leave schedule for"
              employee={selectedLeaveEmployee}
              onClose={closeLeaveScheduleModal}
            />

            {selectedLeaveEmployee.leaveSchedule && (
              <CurrentScheduleBanner
                label="Current Leave Schedule"
                value={selectedLeaveEmployee.leaveSchedule.name}
              />
            )}

            <div className="p-6">

              {leaveScheduleError && (
                <ErrorMessage message={leaveScheduleError} />
              )}

              <div className="overflow-hidden rounded-lg border border-slate-200">

                <div className="overflow-x-auto">

                  <table className="w-full min-w-[750px] text-sm">

                    <thead>
                      <tr className="bg-[#f8fafb]">
                        <TableHead>SL</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Leave Allocation</TableHead>
                        <TableHead center>Action</TableHead>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">

                      {leaveSchedulesLoading ? (
                        <LoadingRow
                          colSpan={5}
                          text="Loading Leave Schedules..."
                        />
                      ) : leaveSchedules.length === 0 ? (
                        <LoadingRow
                          colSpan={5}
                          text="No active Leave Schedules found."
                        />
                      ) : (
                        leaveSchedules.map((schedule, index) => {
                          const isCurrent =
                            selectedLeaveEmployee.leaveSchedule
                              ?._id === schedule._id;

                          return (
                            <tr
                              key={schedule._id}
                              className="hover:bg-[#fdfbf7]"
                            >

                              <ModalCell>
                                {index + 1}
                              </ModalCell>

                              <ModalCell>
                                <span className="font-medium text-[#17324d]">
                                  {schedule.name}
                                </span>

                                {isCurrent && (
                                  <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                                    Current
                                  </span>
                                )}
                              </ModalCell>

                              <ModalCell>
                                {schedule.description || "—"}
                              </ModalCell>

                              <ModalCell>
                                <div className="flex flex-wrap gap-1.5">

                                  {schedule.allocations.map(
                                    (allocation) => (
                                      <span
                                        key={
                                          allocation.leaveType._id
                                        }
                                        className="rounded-md bg-[#f5f7f9] px-2 py-1 text-[11px] text-slate-600"
                                      >
                                        {allocation.leaveType.name}:{" "}
                                        <strong>
                                          {allocation.days}
                                        </strong>
                                      </span>
                                    )
                                  )}

                                </div>
                              </ModalCell>

                              <ModalCell center>
                                {isCurrent ? (
                                  <CurrentButton />
                                ) : (
                                  <ApplyButton
                                    loading={
                                      assigningLeaveScheduleId ===
                                      schedule._id
                                    }
                                    disabled={
                                      assigningLeaveScheduleId !==
                                      null
                                    }
                                    onClick={() =>
                                      assignLeaveSchedule(schedule)
                                    }
                                  />
                                )}
                              </ModalCell>

                            </tr>
                          );
                        })
                      )}

                    </tbody>

                  </table>

                </div>

              </div>

            </div>

            <ModalFooter
              onClose={closeLeaveScheduleModal}
              disabled={assigningLeaveScheduleId !== null}
            />

          </div>

        </div>
      )}

    </AdminLayout>
  );
}

// =====================================================
// Employee Module Tab
// =====================================================

function EmployeeTab({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex h-[56px] items-center justify-center gap-2.5 rounded-xl px-3 text-[12px] font-semibold transition-all duration-200 ${
        active
          ? "bg-[#0b2945] text-white shadow-[0_6px_16px_rgba(11,41,69,0.18)]"
          : "text-[#52667a] hover:bg-[#faf8f3] hover:text-[#17324d]"
      }`}
    >

      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
          active
            ? "bg-white/10 text-[#d6ad66]"
            : "bg-[#f8fafb] text-slate-400"
        }`}
      >
        <Icon size={16} strokeWidth={1.8} />
      </span>

      <span className="whitespace-nowrap">
        {label}
      </span>

      {active && (
        <span className="absolute bottom-0 left-[20%] right-[20%] h-[2px] rounded-t-full bg-[#d6ad66]" />
      )}

    </button>
  );
}

// =====================================================
// Summary Card
// =====================================================

function SummaryCard({
  icon: Icon,
  title,
  value,
}: {
  icon: React.ElementType;
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#d8c29c] hover:shadow-md">

      <div className="flex items-center gap-3">

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#fbf3e5] text-[#b1843d]">
          <Icon size={18} />
        </div>

        <div>
          <p className="text-[11px] font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-1 font-serif text-[25px] font-semibold leading-none text-[#17324d]">
            {value}
          </p>
        </div>

      </div>

    </div>
  );
}

// =====================================================
// Table
// =====================================================

function TableHead({
  children,
  center = false,
}: {
  children: React.ReactNode;
  center?: boolean;
}) {
  return (
    <th
      className={`border-b border-slate-200 px-2 py-2.5 text-[9px] font-semibold uppercase tracking-[0.03em] text-slate-500 ${
        center ? "text-center" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function TableCell({
  children,
  center = false,
}: {
  children: React.ReactNode;
  center?: boolean;
}) {
  return (
    <td
      className={`overflow-hidden px-2 py-2.5 text-[10px] text-slate-600 ${
        center ? "text-center" : "text-left"
      }`}
    >
      {children}
    </td>
  );
}

// =====================================================
// Modal Components
// =====================================================

function ModalHeader({
  title,
  subtitle,
  employee,
  onClose,
}: {
  title: string;
  subtitle: string;
  employee: Employee;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b1843d]">
          Employee Management
        </p>

        <h2 className="mt-1 font-serif text-2xl font-semibold text-[#17324d]">
          {title}
        </h2>

        <p className="mt-1 text-xs text-slate-400">
          {subtitle}{" "}
          <span className="font-semibold text-[#17324d]">
            {employee.name}
          </span>{" "}
          ({employee.employeeCode})
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-[#17324d]"
      >
        <X size={18} />
      </button>

    </div>
  );
}

function CurrentScheduleBanner({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="mx-6 mt-5 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
      {label}: <strong>{value}</strong>
    </div>
  );
}

function ErrorMessage({
  message,
}: {
  message: string;
}) {
  return (
    <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
      {message}
    </div>
  );
}

function LoadingRow({
  colSpan,
  text,
}: {
  colSpan: number;
  text: string;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="p-10 text-center text-sm text-slate-400"
      >
        {text}
      </td>
    </tr>
  );
}

function ModalCell({
  children,
  center = false,
}: {
  children: React.ReactNode;
  center?: boolean;
}) {
  return (
    <td
      className={`px-4 py-4 text-sm text-slate-600 ${
        center ? "text-center" : ""
      }`}
    >
      {children}
    </td>
  );
}

function CurrentButton() {
  return (
    <button
      type="button"
      disabled
      title="Currently assigned"
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"
    >
      <Check size={16} />
    </button>
  );
}

function ApplyButton({
  disabled,
  loading,
  onClick,
}: {
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title="Apply Schedule"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#fbf3e5] px-3 text-xs font-semibold text-[#9a6b20] transition hover:bg-[#f4e4c8] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <UserRoundCheck size={15} />

      {loading ? "Applying..." : "Apply"}
    </button>
  );
}

function ModalFooter({
  onClose,
  disabled,
}: {
  onClose: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex justify-end border-t border-slate-100 bg-[#fafbfc] px-6 py-4">
      <button
        type="button"
        onClick={onClose}
        disabled={disabled}
        className="h-10 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
      >
        Close
      </button>
    </div>
  );
}
