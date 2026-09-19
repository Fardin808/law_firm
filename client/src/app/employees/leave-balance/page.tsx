"use client";

import { API_BASE_URL } from "@/lib/api";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";

import {
  Users,
  FileText,
  BarChart3,
  ChevronRight,
  UserRound,
  CalendarDays,
  WalletCards,
  Layers3,
  CircleGauge,
  CheckCircle2,
} from "lucide-react";

// =====================================================
// TYPES
// =====================================================

type LeaveType = {
  _id: string;
  name: string;
};

type LeaveBalanceItem = {
  leaveType: LeaveType;
  allocated: number;
  used: number;
  remaining: number;
};

type EmployeeLeaveBalance = {
  _id: string;
  year: number;

  employee: {
    _id: string;
    employeeCode: string;
    name: string;
    department?: string;
    designation?: string;
  };

  leaveSchedule: {
    _id: string;
    name: string;
    description?: string;
  };

  balances: LeaveBalanceItem[];
};

type Employee = {
  _id: string;
  employeeCode: string;
  name: string;

  leaveSchedule?: {
    _id: string;
    name: string;
  } | null;
};

// =====================================================
// PAGE
// =====================================================

export default function LeaveBalancePage() {
  const router = useRouter();
  const pathname = usePathname();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  const [leaveBalance, setLeaveBalance] =
    useState<EmployeeLeaveBalance | null>(null);

  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const [error, setError] = useState("");

  // =====================================================
  // AUTH
  // =====================================================

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      sessionStorage.getItem("token")
    );
  };

  const handleUnauthorized = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");

    router.push("/login");
  };

  // =====================================================
  // LOAD EMPLOYEES
  // =====================================================

  useEffect(() => {
    const fetchEmployees = async () => {
      const token = getToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        setLoadingEmployees(true);
        setError("");

        const response = await fetch(
          "${API_BASE_URL}/api/employees?limit=100",
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

        const employeesWithLeaveSchedule = (
          data.employees || []
        ).filter(
          (employee: Employee) => employee.leaveSchedule
        );

        setEmployees(employeesWithLeaveSchedule);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load employees."
        );
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, [router]);

  // =====================================================
  // LOAD LEAVE BALANCE
  // =====================================================

  useEffect(() => {
    const fetchLeaveBalance = async () => {
      if (!selectedEmployeeId) {
        setLeaveBalance(null);
        return;
      }

      const token = getToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        setLoadingBalance(true);
        setError("");
        setLeaveBalance(null);

        const response = await fetch(
          `${API_BASE_URL}/api/leave-balances/employee/${selectedEmployeeId}`,
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
            data.message || "Failed to load Leave Balance."
          );
        }

        setLeaveBalance(data.leaveBalance);
      } catch (err) {
        setLeaveBalance(null);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load Leave Balance."
        );
      } finally {
        setLoadingBalance(false);
      }
    };

    fetchLeaveBalance();
  }, [selectedEmployeeId, router]);

  // =====================================================
  // DYNAMIC SUMMARY
  // =====================================================

  const summary = useMemo(() => {
    if (!leaveBalance) {
      return {
        leaveTypes: 0,
        allocated: 0,
        used: 0,
        remaining: 0,
      };
    }

    return leaveBalance.balances.reduce(
      (result, item) => {
        result.leaveTypes += 1;
        result.allocated += Number(item.allocated || 0);
        result.used += Number(item.used || 0);
        result.remaining += Number(item.remaining || 0);

        return result;
      },
      {
        leaveTypes: 0,
        allocated: 0,
        used: 0,
        remaining: 0,
      }
    );
  }, [leaveBalance]);

  // =====================================================
  // UI
  // =====================================================

  return (
    <AdminLayout>
      <div className="text-[#17324d]">

        {/* =================================================
            HEADER + EMPLOYEE MODULE SWITCHER
        ================================================= */}

        <div className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(260px,1fr)_minmax(500px,680px)_minmax(220px,1fr)] xl:items-center">

          {/* LEFT — PAGE INFO */}

          <div className="min-w-0">

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b1843d]">
              Employee Management
            </p>

            <h1 className="mt-1 font-serif text-[34px] font-semibold leading-tight tracking-[-0.02em] text-[#102a43]">
              Leave Details
            </h1>

            <p className="mt-1 max-w-[350px] text-sm leading-5 text-slate-500">
              View employee leave allocation, usage and remaining balance.
            </p>

          </div>

          {/* CENTER — EMPLOYEE MODULE SWITCHER */}

          <div className="w-full">

            <div className="grid w-full grid-cols-3 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">

              <EmployeeTab
                active={pathname.includes("employee-info")}
                icon={Users}
                label="Employee Info"
                onClick={() =>
                  router.push("/employees/employee-info")
                }
              />

              <EmployeeTab
                active={pathname.includes("leave-application")}
                icon={FileText}
                label="Leave Application"
                onClick={() =>
                  router.push("/employees/leave-application")
                }
              />

              <EmployeeTab
                active={pathname.includes("leave-balance")}
                icon={BarChart3}
                label="Leave Details"
                onClick={() =>
                  router.push("/employees/leave-balance")
                }
              />

            </div>

          </div>

          {/* RIGHT — BREADCRUMB */}

          <div className="flex items-center gap-2 text-xs text-slate-400 xl:justify-end">

            <span>
              Employees
            </span>

            <ChevronRight size={13} />

            <span className="font-medium text-[#17324d]">
              Leave Details
            </span>

          </div>

        </div>

        {/* =================================================
            EMPLOYEE SELECTOR
        ================================================= */}

        <section className="mb-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">

            <div className="flex shrink-0 items-center gap-3 lg:w-[250px]">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fbf3e5] text-[#b1843d]">
                <UserRound size={17} />
              </div>

              <div>

                <p className="text-xs font-semibold text-[#17324d]">
                  Select Employee
                </p>

                <p className="mt-0.5 text-[10px] text-slate-400">
                  Choose an employee to view balance.
                </p>

              </div>

            </div>

            <div className="min-w-0 flex-1">

              <select
                value={selectedEmployeeId}
                onChange={(e) =>
                  setSelectedEmployeeId(e.target.value)
                }
                disabled={loadingEmployees}
                className="h-10 w-full rounded-lg border border-slate-200 bg-[#fafbfc] px-3 text-sm text-[#17324d] outline-none transition focus:border-[#c6a364] focus:bg-white focus:ring-2 focus:ring-[#c6a364]/10 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">
                  {loadingEmployees
                    ? "Loading Employees..."
                    : "Select Employee"}
                </option>

                {employees.map((employee) => (
                  <option
                    key={employee._id}
                    value={employee._id}
                  >
                    {employee.employeeCode}
                    {" - "}
                    {employee.name}
                  </option>
                ))}
              </select>

            </div>

          </div>

        </section>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600">
            {error}
          </div>
        )}

        {/* =================================================
            NO EMPLOYEE SELECTED
        ================================================= */}

        {!selectedEmployeeId && (
          <section className="rounded-xl border border-slate-200 bg-white px-5 py-14 text-center shadow-sm">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fbf3e5] text-[#b1843d]">
              <WalletCards size={21} />
            </div>

            <h2 className="mt-3 font-serif text-lg font-semibold text-[#17324d]">
              Employee Leave Details
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Select an employee above to view their leave information.
            </p>

          </section>
        )}

        {/* =================================================
            LOADING BALANCE
        ================================================= */}

        {selectedEmployeeId && loadingBalance && (
          <section className="rounded-xl border border-slate-200 bg-white px-5 py-14 text-center shadow-sm">

            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-[#b1843d]" />

            <p className="mt-3 text-xs text-slate-400">
              Loading employee leave details...
            </p>

          </section>
        )}

        {/* =================================================
            LEAVE BALANCE
        ================================================= */}

        {selectedEmployeeId &&
          !loadingBalance &&
          leaveBalance && (
            <div className="space-y-4">

              {/* =========================================
                  EMPLOYEE PROFILE STRIP
              ========================================= */}

              <section className="overflow-hidden rounded-xl border border-[#d8c29c] bg-[#0b2945] shadow-sm">

                <div className="grid gap-px bg-white/10 sm:grid-cols-2 xl:grid-cols-4">

                  <ProfileInfo
                    label="Employee ID"
                    value={leaveBalance.employee.employeeCode}
                    icon={UserRound}
                  />

                  <ProfileInfo
                    label="Employee Name"
                    value={leaveBalance.employee.name}
                    icon={Users}
                  />

                  <ProfileInfo
                    label="Leave Schedule"
                    value={
                      leaveBalance.leaveSchedule?.name || "--"
                    }
                    icon={CalendarDays}
                  />

                  <ProfileInfo
                    label="Year"
                    value={String(leaveBalance.year)}
                    icon={CalendarDays}
                  />

                </div>

              </section>

              {/* =========================================
                  DYNAMIC SUMMARY
              ========================================= */}

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

                <SummaryCard
                  label="Leave Types"
                  value={summary.leaveTypes}
                  icon={Layers3}
                  variant="navy"
                />

                <SummaryCard
                  label="Total Allocated"
                  value={summary.allocated}
                  icon={CalendarDays}
                  variant="gold"
                />

                <SummaryCard
                  label="Total Used"
                  value={summary.used}
                  icon={CircleGauge}
                  variant="slate"
                />

                <SummaryCard
                  label="Total Remaining"
                  value={summary.remaining}
                  icon={CheckCircle2}
                  variant="green"
                />

              </div>

              {/* =========================================
                  BALANCE TABLE
              ========================================= */}

              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

                {/* TABLE HEADER */}

                <div className="flex flex-col justify-between gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">

                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fbf3e5] text-[#b1843d]">
                      <WalletCards size={17} />
                    </div>

                    <div>

                      <h2 className="font-serif text-lg font-semibold text-[#17324d]">
                        Leave Balance Details
                      </h2>

                      <p className="text-[10px] text-slate-400">
                        Allocation and usage by leave type.
                      </p>

                    </div>

                  </div>

                  <div className="rounded-full bg-[#edf3f8] px-3 py-1 text-[10px] font-semibold text-[#173f67]">
                    {leaveBalance.leaveSchedule?.name || "--"}
                  </div>

                </div>

                {/* TABLE CONTENT */}

                <div className="p-5">

                  {leaveBalance.balances.length === 0 ? (
                    <div className="py-10 text-center">

                      <WalletCards
                        size={22}
                        className="mx-auto text-slate-300"
                      />

                      <p className="mt-2 text-xs text-slate-400">
                        No leave balance entries found.
                      </p>

                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-slate-200">

                      <table className="w-full min-w-[760px] border-collapse">

                        <thead className="bg-[#f8fafb]">

                          <tr>

                            <TableHead>
                              SL
                            </TableHead>

                            <TableHead>
                              Leave Type
                            </TableHead>

                            <TableHead center>
                              Allocated
                            </TableHead>

                            <TableHead center>
                              Used
                            </TableHead>

                            <TableHead center>
                              Remaining
                            </TableHead>

                            <TableHead>
                              Usage
                            </TableHead>

                          </tr>

                        </thead>

                        <tbody>

                          {leaveBalance.balances.map(
                            (item, index) => {
                              const percentage =
                                getUsagePercentage(
                                  item.used,
                                  item.allocated
                                );

                              return (
                                <tr
                                  key={item.leaveType._id}
                                  className="border-b border-slate-100 transition last:border-b-0 hover:bg-[#fcfbf8]"
                                >

                                  {/* SL */}

                                  <TableCell>
                                    <span className="text-slate-400">
                                      {index + 1}
                                    </span>
                                  </TableCell>

                                  {/* LEAVE TYPE */}

                                  <TableCell>

                                    <div className="flex items-center gap-2.5">

                                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#fbf3e5] text-[#b1843d]">
                                        <CalendarDays size={13} />
                                      </div>

                                      <span className="font-semibold text-[#17324d]">
                                        {item.leaveType.name}
                                      </span>

                                    </div>

                                  </TableCell>

                                  {/* ALLOCATED */}

                                  <TableCell center>
                                    <NumberBadge>
                                      {item.allocated}
                                    </NumberBadge>
                                  </TableCell>

                                  {/* USED */}

                                  <TableCell center>
                                    <NumberBadge>
                                      {item.used}
                                    </NumberBadge>
                                  </TableCell>

                                  {/* REMAINING */}

                                  <TableCell center>

                                    <span
                                      className={`inline-flex min-w-9 justify-center rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                        item.remaining <= 0
                                          ? "bg-red-50 text-red-600"
                                          : "bg-emerald-50 text-emerald-700"
                                      }`}
                                    >
                                      {item.remaining}
                                    </span>

                                  </TableCell>

                                  {/* USAGE */}

                                  <TableCell>

                                    <div className="flex min-w-[150px] items-center gap-3">

                                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">

                                        <div
                                          className={`h-full rounded-full ${
                                            percentage >= 100
                                              ? "bg-red-400"
                                              : percentage >= 75
                                              ? "bg-amber-400"
                                              : "bg-[#b1843d]"
                                          }`}
                                          style={{
                                            width: `${percentage}%`,
                                          }}
                                        />

                                      </div>

                                      <span className="w-9 text-right text-[10px] font-semibold text-slate-500">
                                        {percentage}%
                                      </span>

                                    </div>

                                  </TableCell>

                                </tr>
                              );
                            }
                          )}

                        </tbody>

                      </table>

                    </div>
                  )}

                </div>

              </section>

            </div>
          )}

        {/* =================================================
            BALANCE NOT FOUND
        ================================================= */}

        {selectedEmployeeId &&
          !loadingBalance &&
          !leaveBalance &&
          !error && (
            <section className="rounded-xl border border-slate-200 bg-white px-5 py-14 text-center shadow-sm">

              <WalletCards
                size={23}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-sm font-semibold text-[#17324d]">
                No Leave Balance Found
              </p>

              <p className="mt-1 text-xs text-slate-400">
                No leave balance is available for the selected employee.
              </p>

            </section>
          )}

      </div>
    </AdminLayout>
  );
}

// =====================================================
// EMPLOYEE MODULE TAB
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
        <Icon
          size={16}
          strokeWidth={1.8}
        />
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
// PROFILE INFO
// =====================================================

function ProfileInfo({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex min-h-[72px] items-center gap-3 bg-[#0b2945] px-5 py-3">

      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#d6ad66]">
        <Icon size={15} />
      </div>

      <div className="min-w-0">

        <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-white/45">
          {label}
        </p>

        <p
          className="mt-1 truncate text-xs font-semibold text-white"
          title={value}
        >
          {value}
        </p>

      </div>

    </div>
  );
}

// =====================================================
// SUMMARY CARD
// =====================================================

function SummaryCard({
  label,
  value,
  icon: Icon,
  variant,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  variant: "navy" | "gold" | "slate" | "green";
}) {
  const styles = {
    navy: {
      card: "border-[#dce6ef] bg-[#f7fafc]",
      icon: "bg-[#eaf1f7] text-[#173f67]",
    },

    gold: {
      card: "border-[#eee1c9] bg-[#fdfaf4]",
      icon: "bg-[#fbf0dc] text-[#b1843d]",
    },

    slate: {
      card: "border-slate-200 bg-slate-50",
      icon: "bg-slate-200/60 text-slate-600",
    },

    green: {
      card: "border-emerald-100 bg-emerald-50/40",
      icon: "bg-emerald-100 text-emerald-600",
    },
  };

  const current = styles[variant];

  return (
    <div
      className={`flex h-[64px] items-center gap-3 rounded-xl border px-4 ${current.card}`}
    >

      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${current.icon}`}
      >
        <Icon size={15} />
      </div>

      <div>

        <p className="font-serif text-xl font-semibold leading-none text-[#17324d]">
          {value}
        </p>

        <p className="mt-1 text-[10px] font-medium text-slate-500">
          {label}
        </p>

      </div>

    </div>
  );
}

// =====================================================
// TABLE HEAD
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
      className={`border-b border-slate-200 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500 ${
        center ? "text-center" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

// =====================================================
// TABLE CELL
// =====================================================

function TableCell({
  children,
  center = false,
}: {
  children: React.ReactNode;
  center?: boolean;
}) {
  return (
    <td
      className={`px-4 py-3 text-xs text-slate-600 ${
        center ? "text-center" : ""
      }`}
    >
      {children}
    </td>
  );
}

// =====================================================
// NUMBER BADGE
// =====================================================

function NumberBadge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex min-w-9 justify-center rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-[#17324d]">
      {children}
    </span>
  );
}

// =====================================================
// USAGE PERCENTAGE
// =====================================================

function getUsagePercentage(
  used: number,
  allocated: number
) {
  if (!allocated || allocated <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round((used / allocated) * 100)
    )
  );
}
