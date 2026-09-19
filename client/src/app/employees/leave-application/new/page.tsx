"use client";

import { API_BASE_URL } from "@/lib/api";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import AdminLayout from "@/components/layout/AdminLayout";

import {
  Save,
  ArrowLeft,
  ChevronRight,
  FilePlus2,
  UserRound,
  CalendarDays,
  ClipboardList,
  WalletCards,
  BriefcaseBusiness,
  CheckCircle2,
} from "lucide-react";

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

type LeaveBalance = {
  _id: string;
  year: number;

  employee: {
    _id: string;
    employeeCode: string;
    name: string;
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

export default function NewLeaveApplicationPage() {
  const router = useRouter();

  const [employees, setEmployees] =
    useState<Employee[]>([]);

  const [employeeId, setEmployeeId] =
    useState("");

  const [leaveTypeId, setLeaveTypeId] =
    useState("");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  const [reason, setReason] =
    useState("");

  const [requestSource, setRequestSource] =
    useState("Admin Entry");

  const [leaveBalance, setLeaveBalance] =
    useState<LeaveBalance | null>(null);

  const [loadingEmployees, setLoadingEmployees] =
    useState(true);

  const [loadingBalance, setLoadingBalance] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  // ==========================================
  // Auth
  // ==========================================

  const getToken = () =>
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  const handleUnauthorized = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");

    router.push("/login");
  };

  // ==========================================
  // Load Employees
  // ==========================================

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
          `${API_BASE_URL}/api/employees?limit=100`,
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
              "Failed to load employees."
          );
        }

        const employeesWithLeaveSchedule =
          (data.employees || []).filter(
            (employee: Employee) =>
              employee.leaveSchedule
          );

        setEmployees(
          employeesWithLeaveSchedule
        );
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to load employees.";

        setError(message);
        toast.error(message);
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, [router]);

  // ==========================================
  // Load Leave Balance
  // ==========================================

  useEffect(() => {
    const fetchLeaveBalance = async () => {
      if (!employeeId) {
        setLeaveBalance(null);
        setLeaveTypeId("");
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
        setLeaveTypeId("");

        const response = await fetch(
          `${API_BASE_URL}/api/leave-balances/employee/${employeeId}`,
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
              "Failed to load employee Leave Balance."
          );
        }

        setLeaveBalance(
          data.leaveBalance
        );
      } catch (err) {
        setLeaveBalance(null);

        const message =
          err instanceof Error
            ? err.message
            : "Unable to load Leave Balance.";

        setError(message);
        toast.error(message);
      } finally {
        setLoadingBalance(false);
      }
    };

    fetchLeaveBalance();
  }, [employeeId, router]);

  // ==========================================
  // Derived Data
  // ==========================================

  const selectedEmployee =
    employees.find(
      (employee) =>
        employee._id === employeeId
    );

  const selectedBalance =
    leaveBalance?.balances.find(
      (item) =>
        item.leaveType._id ===
        leaveTypeId
    );

  // ==========================================
  // Submit
  // ==========================================

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");

    if (!employeeId) {
      setError(
        "Please select an employee."
      );
      return;
    }

    if (!leaveTypeId) {
      setError(
        "Please select a Leave Type."
      );
      return;
    }

    if (!fromDate || !toDate) {
      setError(
        "From Date and To Date are required."
      );
      return;
    }

    if (!reason.trim()) {
      setError(
        "Reason is required."
      );
      return;
    }

    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_BASE_URL}/api/leave-applications`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            employeeId,
            leaveTypeId,
            fromDate,
            toDate,
            reason: reason.trim(),

            requestSource:
              requestSource.trim() ||
              "Admin Entry",
          }),
        }
      );

      const data =
        await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const message =
          data.message ||
          "Failed to create Leave Application.";

        setError(message);
        toast.error(message);
        return;
      }

      toast.success(
        "Leave application created successfully."
      );

      router.push(
        "/employees/leave-application"
      );
    } catch {
      const message =
        "Unable to connect to the server.";

      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="text-[#17324d]">

        {/* =====================================
            HEADER
        ===================================== */}

        <div className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-start">

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b1843d]">
              Employee Management
            </p>

            <h1 className="mt-0.5 font-serif text-[32px] font-semibold leading-tight text-[#102a43]">
              New Leave Application
            </h1>

            <p className="mt-1 text-xs text-slate-500">
              Create and submit a leave request for an employee.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">

            <span>Employees</span>

            <ChevronRight size={13} />

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/employees/leave-application"
                )
              }
              className="transition hover:text-[#b1843d]"
            >
              Leave Application
            </button>

            <ChevronRight size={13} />

            <span className="font-medium text-[#17324d]">
              New
            </span>

          </div>

        </div>

        {/* =====================================
            COMPACT TOP STRIP
        ===================================== */}

        <div className="mb-4 overflow-hidden rounded-xl border border-[#d9c59f] bg-gradient-to-r from-[#0b2945] to-[#173f67] shadow-sm">

          <div className="flex flex-col justify-between gap-3 px-5 py-3.5 sm:flex-row sm:items-center">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d6ad66]/50 bg-white/10 text-[#e6c98f]">
                <FilePlus2 size={17} />
              </div>

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#d6ad66]">
                  Leave Request
                </p>

                <h2 className="mt-0.5 font-serif text-lg font-semibold text-white">
                  Create Leave Application
                </h2>
              </div>

            </div>

            {selectedEmployee && (
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">

                <p className="text-[9px] uppercase tracking-wider text-white/50">
                  Selected Employee
                </p>

                <p className="mt-0.5 text-xs font-semibold text-white">
                  {selectedEmployee.employeeCode}
                  {" · "}
                  {selectedEmployee.name}
                </p>

              </div>
            )}

          </div>

        </div>

        {/* =====================================
            FORM CARD
        ===================================== */}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5">

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fbf3e5] text-[#b1843d]">
              <ClipboardList size={15} />
            </div>

            <div>
              <h2 className="font-serif text-lg font-semibold text-[#17324d]">
                Leave Application Information
              </h2>

              <p className="text-[11px] text-slate-400">
                Complete the employee, leave period and request details.
              </p>
            </div>

          </div>

          <form
            onSubmit={handleSubmit}
            className="p-5"
          >

            {/* =================================
                EMPLOYEE + LEAVE TYPE
            ================================= */}

            <FormSection
              icon={UserRound}
              title="Employee & Leave"
              description="Select the employee and applicable leave type."
            >

              <div className="grid grid-cols-1 gap-x-4 gap-y-3 lg:grid-cols-2">

                <Field label="Employee">

                  <select
                    value={employeeId}
                    onChange={(e) =>
                      setEmployeeId(
                        e.target.value
                      )
                    }
                    disabled={loadingEmployees}
                    className={inputClass}
                  >

                    <option value="">
                      {loadingEmployees
                        ? "Loading Employees..."
                        : "Select Employee"}
                    </option>

                    {employees.map(
                      (employee) => (
                        <option
                          key={employee._id}
                          value={employee._id}
                        >
                          {employee.employeeCode}
                          {" - "}
                          {employee.name}
                        </option>
                      )
                    )}

                  </select>

                </Field>

                <Field label="Leave Type">

                  <select
                    value={leaveTypeId}
                    onChange={(e) =>
                      setLeaveTypeId(
                        e.target.value
                      )
                    }
                    disabled={
                      !employeeId ||
                      loadingBalance ||
                      !leaveBalance
                    }
                    className={inputClass}
                  >

                    <option value="">
                      {loadingBalance
                        ? "Loading Leave Types..."
                        : !employeeId
                        ? "Select Employee First"
                        : "Select Leave Type"}
                    </option>

                    {leaveBalance?.balances.map(
                      (item) => (
                        <option
                          key={
                            item.leaveType._id
                          }
                          value={
                            item.leaveType._id
                          }
                        >
                          {item.leaveType.name}
                          {" — Remaining: "}
                          {item.remaining}
                        </option>
                      )
                    )}

                  </select>

                </Field>

              </div>

            </FormSection>

            {/* =================================
                LEAVE PERIOD
            ================================= */}

            <FormSection
              icon={CalendarDays}
              title="Leave Period"
              description="Set the requested leave dates and request source."
            >

              <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-3">

                <Field label="From Date">

                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => {
                      const value =
                        e.target.value;

                      setFromDate(value);

                      if (
                        toDate &&
                        value > toDate
                      ) {
                        setToDate("");
                      }
                    }}
                    className={inputClass}
                  />

                </Field>

                <Field label="To Date">

                  <input
                    type="date"
                    value={toDate}
                    min={
                      fromDate ||
                      undefined
                    }
                    onChange={(e) =>
                      setToDate(
                        e.target.value
                      )
                    }
                    className={inputClass}
                  />

                </Field>

                <Field
                  label="Request Source"
                  required={false}
                >

                  <select
                    value={requestSource}
                    onChange={(e) =>
                      setRequestSource(
                        e.target.value
                      )
                    }
                    className={inputClass}
                  >
                    <option value="Admin Entry">
                      Admin Entry
                    </option>

                    <option value="Email">
                      Email
                    </option>

                    <option value="Phone">
                      Phone
                    </option>

                    <option value="Paper Form">
                      Paper Form
                    </option>

                    <option value="WhatsApp">
                      WhatsApp
                    </option>
                  </select>

                </Field>

              </div>

            </FormSection>

            {/* =================================
                BALANCE
            ================================= */}

            <FormSection
              icon={WalletCards}
              title="Available Leave Balance"
              description="Current balance for the selected leave type."
            >

              {loadingBalance ? (

                <div className="flex h-[64px] items-center justify-center rounded-lg border border-slate-200 bg-[#fafbfc]">

                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#b1843d]" />

                  <span className="ml-2 text-xs text-slate-400">
                    Loading balance...
                  </span>

                </div>

              ) : selectedBalance ? (

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                  <BalanceCard
                    label="Allocated"
                    value={
                      selectedBalance.allocated
                    }
                  />

                  <BalanceCard
                    label="Used"
                    value={
                      selectedBalance.used
                    }
                  />

                  <BalanceCard
                    label="Remaining"
                    value={
                      selectedBalance.remaining
                    }
                    highlight
                  />

                </div>

              ) : (

                <div className="flex h-[58px] items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-[#fafbfc] px-4">

                  <WalletCards
                    size={17}
                    className="text-slate-300"
                  />

                  <p className="text-xs text-slate-400">
                    Select an employee and leave type to view the available balance.
                  </p>

                </div>

              )}

            </FormSection>

            {/* =================================
                REASON
            ================================= */}

            <FormSection
              icon={BriefcaseBusiness}
              title="Request Details"
              description="Provide the reason for this leave request."
              last
            >

              <Field label="Reason">

                <textarea
                  value={reason}
                  onChange={(e) =>
                    setReason(
                      e.target.value
                    )
                  }
                  rows={3}
                  placeholder="Enter reason for leave..."
                  className="w-full resize-none rounded-md border border-slate-200 bg-[#fafbfc] px-3 py-2.5 text-xs text-[#17324d] outline-none transition placeholder:text-slate-400 focus:border-[#c6a364] focus:bg-white focus:ring-2 focus:ring-[#c6a364]/10"
                />

              </Field>

            </FormSection>

            {/* =================================
                ERROR
            ================================= */}

            {error && (
              <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
                {error}
              </div>
            )}

            {/* =================================
                ACTIONS
            ================================= */}

            <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/employees/leave-application"
                  )
                }
                className="flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <ArrowLeft size={14} />
                Back
              </button>

              <button
                type="submit"
                disabled={
                  saving ||
                  loadingEmployees ||
                  loadingBalance
                }
                className="flex h-9 items-center justify-center gap-2 rounded-lg bg-[#0b2945] px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#071f34] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <Save
                    size={14}
                    className="text-[#d6ad66]"
                  />
                )}

                {saving
                  ? "Submitting..."
                  : "Submit Application"}
              </button>

            </div>

          </form>

        </section>

      </div>
    </AdminLayout>
  );
}

// ==========================================
// Shared input style
// ==========================================

const inputClass =
  "h-9 w-full rounded-md border border-slate-200 bg-[#fafbfc] px-3 text-xs text-[#17324d] outline-none transition focus:border-[#c6a364] focus:bg-white focus:ring-2 focus:ring-[#c6a364]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

// ==========================================
// Form Section
// ==========================================

function FormSection({
  icon: Icon,
  title,
  description,
  children,
  last = false,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <section
      className={
        last
          ? "pt-4"
          : "border-b border-slate-100 py-4 first:pt-0"
      }
    >

      <div className="mb-3 flex items-center gap-2.5">

        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#fbf3e5] text-[#b1843d]">
          <Icon size={14} />
        </div>

        <div>
          <h3 className="text-xs font-semibold text-[#17324d]">
            {title}
          </h3>

          <p className="text-[10px] text-slate-400">
            {description}
          </p>
        </div>

      </div>

      {children}

    </section>
  );
}

// ==========================================
// Field
// ==========================================

function Field({
  label,
  children,
  required = true,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>

      <label className="mb-1.5 block text-[11px] font-semibold text-slate-600">

        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}

      </label>

      {children}

    </div>
  );
}

// ==========================================
// Balance Card
// ==========================================

function BalanceCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex h-[58px] items-center justify-between rounded-lg border px-4 ${
        highlight
          ? "border-emerald-100 bg-emerald-50/50"
          : "border-slate-200 bg-[#fafbfc]"
      }`}
    >

      <div>
        <p className="text-[10px] font-medium text-slate-400">
          {label}
        </p>

        <p
          className={`mt-0.5 font-serif text-xl font-semibold leading-none ${
            highlight
              ? "text-emerald-700"
              : "text-[#17324d]"
          }`}
        >
          {value}
        </p>
      </div>

      {highlight && (
        <CheckCircle2
          size={17}
          className="text-emerald-500"
        />
      )}

    </div>
  );
}
