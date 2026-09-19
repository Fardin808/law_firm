"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import { toast } from "sonner";

import AdminLayout from "@/components/layout/AdminLayout";

import {
  Plus,
  Check,
  X,
  Users,
  FileText,
  BarChart3,
  Search,
  ChevronRight,
  Clock3,
  CircleCheck,
  CircleX,
  ClipboardList,
  Filter,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

// =====================================================
// Types
// =====================================================

type Employee = {
  _id: string;
  employeeCode: string;
  name: string;
};

type LeaveType = {
  _id: string;
  name: string;
};

type LeaveApplication = {
  _id: string;
  employee: Employee;
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  numberOfDays: number;
  reason: string;
  requestSource: string;
  status: "pending" | "approved" | "rejected";
  decisionNote: string;
};

type DecisionAction =
  | "approve"
  | "reject";

type DecisionTarget = {
  action: DecisionAction;
  application: LeaveApplication;
};

// =====================================================
// Page
// =====================================================

export default function LeaveApplicationPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [applications, setApplications] =
    useState<LeaveApplication[]>([]);

  const [statusFilter, setStatusFilter] =
    useState("");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  const [decisionTarget, setDecisionTarget] =
    useState<DecisionTarget | null>(null);

  const [decisionNote, setDecisionNote] =
    useState("");

  // =====================================================
  // Auth
  // =====================================================

  const getToken = () =>
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  const handleUnauthorized = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");

    router.push("/login");
  };

  // =====================================================
  // Fetch Applications
  // =====================================================

  const fetchApplications = async () => {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const params =
        new URLSearchParams();

      if (statusFilter) {
        params.append(
          "status",
          statusFilter
        );
      }

      const response = await fetch(
        `http://localhost:5000/api/leave-applications?${params.toString()}`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load Leave Applications."
        );
      }

      setApplications(
        data.applications || []
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to load Leave Applications.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  // =====================================================
  // Dynamic Statistics
  // =====================================================

  const statistics = useMemo(() => {
    return applications.reduce(
      (result, application) => {
        result.total += 1;

        if (
          application.status ===
          "pending"
        ) {
          result.pending += 1;
        }

        if (
          application.status ===
          "approved"
        ) {
          result.approved += 1;
        }

        if (
          application.status ===
          "rejected"
        ) {
          result.rejected += 1;
        }

        return result;
      },
      {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
      }
    );
  }, [applications]);

  // =====================================================
  // Search
  // =====================================================

  const filteredApplications =
    useMemo(() => {
      const query =
        searchTerm
          .trim()
          .toLowerCase();

      if (!query) {
        return applications;
      }

      return applications.filter(
        (application) => {
          const searchableValues = [
            application.employee
              ?.employeeCode,
            application.employee
              ?.name,
            application.leaveType
              ?.name,
            application.reason,
            application.status,
          ];

          return searchableValues.some(
            (value) =>
              String(value || "")
                .toLowerCase()
                .includes(query)
          );
        }
      );
    }, [applications, searchTerm]);

  // =====================================================
  // Decision Modal
  // =====================================================

  const openApproveModal = (
    application: LeaveApplication
  ) => {
    setDecisionNote(
      "Approved by admin"
    );

    setDecisionTarget({
      action: "approve",
      application,
    });
  };

  const openRejectModal = (
    application: LeaveApplication
  ) => {
    setDecisionNote("");

    setDecisionTarget({
      action: "reject",
      application,
    });
  };

  const closeDecisionModal = () => {
    if (processingId) {
      return;
    }

    setDecisionTarget(null);
    setDecisionNote("");
  };

  // =====================================================
  // Submit Decision
  // =====================================================

  const handleDecision = async () => {
    if (!decisionTarget) {
      return;
    }

    const {
      application,
      action,
    } = decisionTarget;

    if (
      action === "reject" &&
      !decisionNote.trim()
    ) {
      toast.error(
        "Please enter a reason for rejection."
      );

      return;
    }

    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setProcessingId(
        application._id
      );

      const response = await fetch(
        `http://localhost:5000/api/leave-applications/${application._id}/${action}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            decisionNote:
              decisionNote.trim(),
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
          `Failed to ${action} Leave Application.`;

        toast.error(message);
        return;
      }

      toast.success(
        action === "approve"
          ? "Leave application approved successfully."
          : "Leave application rejected successfully."
      );

      setDecisionTarget(null);
      setDecisionNote("");

      await fetchApplications();
    } catch {
      toast.error(
        "Unable to connect to the server."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // =====================================================
  // Helpers
  // =====================================================

  const formatDate = (
    value: string
  ) => {
    if (!value) {
      return "--";
    }

    return new Date(
      value
    ).toLocaleDateString();
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
  };

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
              Leave Application
            </h1>

            <p className="mt-1 text-sm leading-5 text-slate-500">
              Review and manage employee leave requests.
            </p>

          </div>

          {/* CENTER — MODULE SWITCHER */}

          <div className="w-full">

            <div className="grid w-full grid-cols-3 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">

              <EmployeeTab
                active={pathname.includes(
                  "employee-info"
                )}
                icon={Users}
                label="Employee Info"
                onClick={() =>
                  router.push(
                    "/employees/employee-info"
                  )
                }
              />

              <EmployeeTab
                active={pathname.includes(
                  "leave-application"
                )}
                icon={FileText}
                label="Leave Application"
                onClick={() =>
                  router.push(
                    "/employees/leave-application"
                  )
                }
              />

              <EmployeeTab
                active={pathname.includes(
                  "leave-balance"
                )}
                icon={BarChart3}
                label="Leave Details"
                onClick={() =>
                  router.push(
                    "/employees/leave-balance"
                  )
                }
              />

            </div>

          </div>

          {/* RIGHT — BREADCRUMB */}

          <div className="flex items-center gap-2 text-xs text-slate-400 xl:justify-end">

            <span>
              Employees
            </span>

            <ChevronRight
              size={13}
            />

            <span className="font-medium text-[#17324d]">
              Leave Application
            </span>

          </div>

        </div>

        {/* =================================================
            TOP ACTION + DYNAMIC STATS
        ================================================= */}

        <div className="mb-4 grid gap-3 xl:grid-cols-[190px_1fr]">

          {/* NEW APPLICATION */}

          <button
            type="button"
            onClick={() =>
              router.push(
                "/employees/leave-application/new"
              )
            }
            className="flex h-[64px] items-center justify-center gap-2 rounded-xl bg-[#0b2945] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#071f34]"
          >
            <Plus
              size={15}
              className="text-[#d6ad66]"
            />

            New Leave Application
          </button>

          {/* SUMMARY */}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

            <SummaryCard
              title="Applications"
              value={statistics.total}
              icon={ClipboardList}
              variant="navy"
            />

            <SummaryCard
              title="Pending"
              value={statistics.pending}
              icon={Clock3}
              variant="gold"
            />

            <SummaryCard
              title="Approved"
              value={statistics.approved}
              icon={CircleCheck}
              variant="green"
            />

            <SummaryCard
              title="Rejected"
              value={statistics.rejected}
              icon={CircleX}
              variant="red"
            />

          </div>

        </div>

        {/* =================================================
            FILTER BAR
        ================================================= */}

        <section className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

            {/* SEARCH */}

            <div className="relative min-w-0 flex-1">

              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(
                    e.target.value
                  )
                }
                placeholder="Search by ID, employee, leave type or reason..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-[#fafbfc] pl-10 pr-4 text-sm text-[#17324d] outline-none transition placeholder:text-slate-400 focus:border-[#c6a364] focus:bg-white focus:ring-2 focus:ring-[#c6a364]/10"
              />

            </div>

            {/* STATUS FILTER */}

            <div className="relative">

              <Filter
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#b1843d]"
              />

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value
                  )
                }
                className="h-10 min-w-[170px] appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-sm font-medium text-[#17324d] outline-none transition focus:border-[#c6a364]"
              >
                <option value="">
                  All Status
                </option>

                <option value="pending">
                  Pending
                </option>

                <option value="approved">
                  Approved
                </option>

                <option value="rejected">
                  Rejected
                </option>
              </select>

            </div>

            {/* RESET */}

            {(searchTerm ||
              statusFilter) && (
              <button
                type="button"
                onClick={resetFilters}
                className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-[#17324d]"
              >
                <RotateCcw
                  size={14}
                />

                Reset
              </button>
            )}

          </div>

        </section>

        {/* =================================================
            APPLICATION TABLE
        ================================================= */}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          {/* CARD HEADER */}

          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fbf3e5] text-[#b1843d]">
                <FileText
                  size={17}
                />
              </div>

              <div>

                <h2 className="font-serif text-lg font-semibold text-[#17324d]">
                  Leave Application List
                </h2>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  Review application details and manage decisions.
                </p>

              </div>

            </div>

            {!loading && (
              <p className="text-xs text-slate-400">
                Showing{" "}
                <span className="font-semibold text-[#17324d]">
                  {
                    filteredApplications.length
                  }
                </span>{" "}
                {filteredApplications.length ===
                1
                  ? "application"
                  : "applications"}
              </p>
            )}

          </div>

          <div className="p-5">

            {/* ERROR */}

            {error && (
              <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* TABLE */}

            <div className="overflow-x-auto rounded-lg border border-slate-200">

              <table className="w-full min-w-[1100px] border-collapse text-left">

                <thead className="bg-[#f8fafb]">

                  <tr>

                    {[
                      "SL",
                      "ID",
                      "Employee",
                      "Leave Type",
                      "From",
                      "To",
                      "Days",
                      "Reason",
                      "Status",
                      "Action",
                    ].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="border-b border-slate-200 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500"
                        >
                          {heading}
                        </th>
                      )
                    )}

                  </tr>

                </thead>

                <tbody>

                  {loading ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-4 py-14 text-center"
                      >
                        <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-[#b1843d]" />

                        <p className="mt-3 text-xs text-slate-400">
                          Loading leave applications...
                        </p>
                      </td>
                    </tr>
                  ) : filteredApplications.length ===
                    0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-4 py-14 text-center"
                      >
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#fbf3e5] text-[#b1843d]">
                          <FileText
                            size={20}
                          />
                        </div>

                        <p className="mt-3 text-sm font-semibold text-[#17324d]">
                          No leave applications found
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Try changing your search or status filter.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredApplications.map(
                      (
                        application,
                        index
                      ) => (
                        <tr
                          key={
                            application._id
                          }
                          className="border-b border-slate-100 transition last:border-b-0 hover:bg-[#fcfbf8]"
                        >

                          {/* SL */}

                          <TableCell>
                            <span className="text-slate-400">
                              {index + 1}
                            </span>
                          </TableCell>

                          {/* ID */}

                          <TableCell>
                            <span className="font-medium text-[#17324d]">
                              {application
                                .employee
                                ?.employeeCode ||
                                "--"}
                            </span>
                          </TableCell>

                          {/* EMPLOYEE */}

                          <TableCell>
                            <div className="flex items-center gap-2.5">

                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#edf3f8] text-[10px] font-bold uppercase text-[#173f67]">
                                {getInitials(
                                  application
                                    .employee
                                    ?.name
                                )}
                              </div>

                              <span className="font-semibold text-[#17324d]">
                                {application
                                  .employee
                                  ?.name ||
                                  "--"}
                              </span>

                            </div>
                          </TableCell>

                          {/* LEAVE TYPE */}

                          <TableCell>
                            {application
                              .leaveType
                              ?.name ||
                              "--"}
                          </TableCell>

                          {/* FROM */}

                          <TableCell>
                            {formatDate(
                              application.fromDate
                            )}
                          </TableCell>

                          {/* TO */}

                          <TableCell>
                            {formatDate(
                              application.toDate
                            )}
                          </TableCell>

                          {/* DAYS */}

                          <TableCell>
                            <span className="inline-flex min-w-8 justify-center rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-[#17324d]">
                              {
                                application.numberOfDays
                              }
                            </span>
                          </TableCell>

                          {/* REASON */}

                          <TableCell>
                            <p
                              className="max-w-[180px] truncate"
                              title={
                                application.reason
                              }
                            >
                              {application.reason ||
                                "--"}
                            </p>
                          </TableCell>

                          {/* STATUS */}

                          <TableCell>
                            <StatusBadge
                              status={
                                application.status
                              }
                            />
                          </TableCell>

                          {/* ACTION */}

                          <TableCell>
                            {application.status ===
                            "pending" ? (
                              <div className="flex items-center gap-2">

                                <button
                                  type="button"
                                  disabled={
                                    processingId !==
                                    null
                                  }
                                  title="Approve"
                                  onClick={() =>
                                    openApproveModal(
                                      application
                                    )
                                  }
                                  className="flex h-8 w-8 items-center justify-center rounded-md border border-emerald-100 bg-emerald-50 text-emerald-600 transition hover:bg-emerald-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Check
                                    size={15}
                                  />
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    processingId !==
                                    null
                                  }
                                  title="Reject"
                                  onClick={() =>
                                    openRejectModal(
                                      application
                                    )
                                  }
                                  className="flex h-8 w-8 items-center justify-center rounded-md border border-red-100 bg-red-50 text-red-500 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <X
                                    size={15}
                                  />
                                </button>

                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">
                                Completed
                              </span>
                            )}
                          </TableCell>

                        </tr>
                      )
                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>

        </section>

        {/* =================================================
            DECISION MODAL
        ================================================= */}

        {decisionTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#071727]/55 px-4 backdrop-blur-[2px]">

            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

              {/* MODAL HEADER */}

              <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">

                <div className="flex gap-3">

                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      decisionTarget.action ===
                      "approve"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-red-50 text-red-500"
                    }`}
                  >
                    {decisionTarget.action ===
                    "approve" ? (
                      <Check size={18} />
                    ) : (
                      <AlertTriangle
                        size={18}
                      />
                    )}
                  </div>

                  <div>

                    <h3 className="font-serif text-lg font-semibold text-[#17324d]">
                      {decisionTarget.action ===
                      "approve"
                        ? "Approve Leave Application"
                        : "Reject Leave Application"}
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      {
                        decisionTarget
                          .application
                          .employee?.name
                      }{" "}
                      ·{" "}
                      {
                        decisionTarget
                          .application
                          .leaveType?.name
                      }
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={
                    closeDecisionModal
                  }
                  disabled={
                    processingId !== null
                  }
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                >
                  <X size={17} />
                </button>

              </div>

              {/* MODAL BODY */}

              <div className="px-5 py-5">

                <div className="mb-4 grid grid-cols-3 gap-2 rounded-lg bg-[#f8fafb] p-3">

                  <DecisionInfo
                    label="From"
                    value={formatDate(
                      decisionTarget
                        .application
                        .fromDate
                    )}
                  />

                  <DecisionInfo
                    label="To"
                    value={formatDate(
                      decisionTarget
                        .application
                        .toDate
                    )}
                  />

                  <DecisionInfo
                    label="Days"
                    value={String(
                      decisionTarget
                        .application
                        .numberOfDays
                    )}
                  />

                </div>

                <label className="mb-1.5 block text-xs font-semibold text-slate-600">

                  {decisionTarget.action ===
                  "reject"
                    ? "Reason for Rejection"
                    : "Decision Note"}

                  {decisionTarget.action ===
                    "reject" && (
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  )}

                </label>

                <textarea
                  rows={3}
                  value={decisionNote}
                  onChange={(e) =>
                    setDecisionNote(
                      e.target.value
                    )
                  }
                  placeholder={
                    decisionTarget.action ===
                    "reject"
                      ? "Enter the reason for rejection..."
                      : "Enter an optional decision note..."
                  }
                  className="w-full resize-none rounded-lg border border-slate-200 bg-[#fafbfc] px-3 py-2.5 text-sm text-[#17324d] outline-none transition placeholder:text-slate-400 focus:border-[#c6a364] focus:bg-white focus:ring-2 focus:ring-[#c6a364]/10"
                />

              </div>

              {/* MODAL FOOTER */}

              <div className="flex justify-end gap-2 border-t border-slate-100 bg-[#fafbfc] px-5 py-4">

                <button
                  type="button"
                  onClick={
                    closeDecisionModal
                  }
                  disabled={
                    processingId !== null
                  }
                  className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    handleDecision
                  }
                  disabled={
                    processingId !== null
                  }
                  className={`flex h-9 items-center gap-2 rounded-lg px-4 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    decisionTarget.action ===
                    "approve"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                >

                  {decisionTarget.action ===
                  "approve" ? (
                    <Check size={14} />
                  ) : (
                    <X size={14} />
                  )}

                  {processingId
                    ? "Processing..."
                    : decisionTarget.action ===
                      "approve"
                    ? "Approve Application"
                    : "Reject Application"}

                </button>

              </div>

            </div>

          </div>
        )}

      </div>
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
// Summary Card
// =====================================================

function SummaryCard({
  title,
  value,
  icon: Icon,
  variant,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  variant:
    | "navy"
    | "gold"
    | "green"
    | "red";
}) {
  const styles = {
    navy: {
      container:
        "border-[#dce6ef] bg-[#f7fafc]",
      icon:
        "bg-[#eaf1f7] text-[#173f67]",
    },

    gold: {
      container:
        "border-[#eee1c9] bg-[#fdfaf4]",
      icon:
        "bg-[#fbf0dc] text-[#b1843d]",
    },

    green: {
      container:
        "border-emerald-100 bg-emerald-50/40",
      icon:
        "bg-emerald-100 text-emerald-600",
    },

    red: {
      container:
        "border-red-100 bg-red-50/40",
      icon:
        "bg-red-100 text-red-500",
    },
  };

  const current =
    styles[variant];

  return (
    <div
      className={`flex h-[64px] items-center gap-3 rounded-xl border px-3.5 ${current.container}`}
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
          {title}
        </p>

      </div>

    </div>
  );
}

// =====================================================
// Table Cell
// =====================================================

function TableCell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
      {children}
    </td>
  );
}

// =====================================================
// Status Badge
// =====================================================

function StatusBadge({
  status,
}: {
  status:
    | "pending"
    | "approved"
    | "rejected";
}) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">

        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

        Approved

      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-semibold text-red-600">

        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />

        Rejected

      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">

      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

      Pending

    </span>
  );
}

// =====================================================
// Decision Modal Info
// =====================================================

function DecisionInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>

      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xs font-semibold text-[#17324d]">
        {value}
      </p>

    </div>
  );
}

// =====================================================
// Initials
// =====================================================

function getInitials(
  name?: string
) {
  if (!name) {
    return "--";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0)
    )
    .join("");
}