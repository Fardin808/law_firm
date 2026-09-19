"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AdminLayout from "@/components/layout/AdminLayout";

import {
  Users,
  UserCheck,
  UserX,
  Clock,
  CalendarDays,
  ClipboardList,
  CircleCheck,
  CircleX,
  ArrowRight,
  Calendar,
} from "lucide-react";

// =====================================================
// Types
// =====================================================

type DashboardOverview = {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;

  pendingLeave: number;
  approvedLeave: number;
  rejectedLeave: number;
  onLeaveToday: number;
};

type PendingLeave = {
  _id: string;

  employee?: {
    _id: string;
    employeeCode: string;
    name: string;
  };

  leaveType?: {
    _id: string;
    name: string;
  };

  fromDate: string;
  toDate: string;
  numberOfDays?: number;
  status: string;
};

type DashboardResponse = {
  success: boolean;
  overview: DashboardOverview;
  recentPendingLeave: PendingLeave[];
};

// =====================================================
// Page
// =====================================================

export default function DashboardPage() {
  const router = useRouter();

  const [overview, setOverview] = useState<DashboardOverview>({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,

    pendingLeave: 0,
    approvedLeave: 0,
    rejectedLeave: 0,
    onLeaveToday: 0,
  });

  const [recentPendingLeave, setRecentPendingLeave] = useState<
    PendingLeave[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // Helpers
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

  const formatDate = (date: string) => {
    if (!date) return "--";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =====================================================
  // Load Dashboard
  // =====================================================

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = getToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "http://localhost:5000/api/dashboard/overview",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        const data: DashboardResponse = await response.json();

        if (response.status === 401) {
          handleUnauthorized();
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to load dashboard.");
        }

        setOverview(data.overview);

        setRecentPendingLeave(
          data.recentPendingLeave || []
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [router]);

  const leaveTotal =
    overview.approvedLeave +
    overview.pendingLeave +
    overview.rejectedLeave;

  // =====================================================
  // UI
  // =====================================================

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#f6f7f9]">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b1843d]">
              Law Firm Administration
            </p>

            <h1 className="mt-1 font-serif text-[30px] font-semibold text-[#102a43]">
              Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Welcome back, Admin. Here&apos;s what&apos;s happening
              across your firm today.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-500 shadow-sm">
            Administration Dashboard
          </div>

        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* =================================================
            PRIMARY CARDS
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <DashboardStat
            title="Total Employees"
            value={
              loading
                ? "..."
                : overview.totalEmployees
            }
            subtitle="Active employees"
            icon={Users}
            tone="navy"
          />

          <DashboardStat
            title="Present Today"
            value={
              loading
                ? "..."
                : overview.presentToday
            }
            subtitle="Employees present"
            icon={UserCheck}
            tone="green"
          />

          <DashboardStat
            title="Absent Today"
            value={
              loading
                ? "..."
                : overview.absentToday
            }
            subtitle="Employees absent"
            icon={UserX}
            tone="red"
          />

          <DashboardStat
            title="Late Today"
            value={
              loading
                ? "..."
                : overview.lateToday
            }
            subtitle="Late arrivals"
            icon={Clock}
            tone="gold"
          />

        </div>

        {/* =================================================
            SECONDARY CARDS
        ================================================= */}

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <DashboardStat
            title="Pending Leave"
            value={
              loading
                ? "..."
                : overview.pendingLeave
            }
            subtitle="Awaiting review"
            icon={ClipboardList}
            tone="gold"
          />

          <DashboardStat
            title="Approved Leave"
            value={
              loading
                ? "..."
                : overview.approvedLeave
            }
            subtitle="Approved applications"
            icon={CircleCheck}
            tone="green"
          />

          <DashboardStat
            title="Rejected Leave"
            value={
              loading
                ? "..."
                : overview.rejectedLeave
            }
            subtitle="Rejected applications"
            icon={CircleX}
            tone="red"
          />

          <DashboardStat
            title="On Leave Today"
            value={
              loading
                ? "..."
                : overview.onLeaveToday
            }
            subtitle="Currently on leave"
            icon={CalendarDays}
            tone="navy"
          />

        </div>

        {/* =================================================
            MAIN SECTION
        ================================================= */}

        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">

          {/* ===============================================
              ATTENDANCE
          ================================================ */}

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-2">

            <SectionHeader
              title="Today's Attendance"
              subtitle="Employee attendance overview"
              button="View Attendance"
              onClick={() =>
                router.push(
                  "/attendance/attendance-info"
                )
              }
            />

            <div className="p-6">

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                <AttendanceCard
                  label="Present"
                  value={
                    loading
                      ? "..."
                      : overview.presentToday
                  }
                  icon={UserCheck}
                  tone="green"
                />

                <AttendanceCard
                  label="Absent"
                  value={
                    loading
                      ? "..."
                      : overview.absentToday
                  }
                  icon={UserX}
                  tone="red"
                />

                <AttendanceCard
                  label="Late"
                  value={
                    loading
                      ? "..."
                      : overview.lateToday
                  }
                  icon={Clock}
                  tone="gold"
                />

              </div>

              {/* Attendance visual */}

              <div className="mt-6 rounded-xl border border-slate-100 bg-[#f9fafb] p-5">

                <div className="mb-4 flex items-center justify-between">

                  <div>
                    <p className="text-sm font-semibold text-[#17324d]">
                      Workforce Status
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Today&apos;s attendance distribution
                    </p>
                  </div>

                  <span className="font-serif text-2xl font-semibold text-[#17324d]">
                    {loading
                      ? "..."
                      : overview.totalEmployees}
                  </span>

                </div>

                <AttendanceProgress
                  present={overview.presentToday}
                  absent={overview.absentToday}
                  late={overview.lateToday}
                  total={overview.totalEmployees}
                />

                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">

                  <Legend
                    color="bg-emerald-500"
                    label="Present"
                    value={overview.presentToday}
                  />

                  <Legend
                    color="bg-red-400"
                    label="Absent"
                    value={overview.absentToday}
                  />

                  <Legend
                    color="bg-[#c99a49]"
                    label="Late"
                    value={overview.lateToday}
                  />

                </div>

              </div>

            </div>

          </section>

          {/* ===============================================
              PENDING LEAVE
          ================================================ */}

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

            <SectionHeader
              title="Pending Leave Requests"
              subtitle="Applications awaiting review"
              button="View All"
              onClick={() =>
                router.push(
                  "/employees/leave-application"
                )
              }
            />

            <div className="p-5">

              {loading ? (
                <div className="flex min-h-[280px] items-center justify-center text-sm text-slate-400">
                  Loading requests...
                </div>
              ) : recentPendingLeave.length === 0 ? (
                <div className="flex min-h-[280px] items-center justify-center rounded-xl bg-slate-50 text-center">

                  <div>
                    <ClipboardList
                      size={32}
                      strokeWidth={1.5}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 text-sm font-semibold text-slate-600">
                      No pending requests
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      New applications will appear here.
                    </p>
                  </div>

                </div>
              ) : (
                <div className="space-y-3">

                  {recentPendingLeave.map(
                    (leave) => (
                      <div
                        key={leave._id}
                        className="rounded-xl border border-slate-100 p-4 transition hover:border-[#d7c19b] hover:bg-[#fdfbf7]"
                      >

                        <div className="flex items-start justify-between gap-3">

                          <div className="min-w-0">

                            <p className="truncate text-sm font-semibold text-[#17324d]">
                              {leave.employee?.name ||
                                "Employee"}
                            </p>

                            <p className="mt-1 text-[11px] text-slate-400">
                              {leave.employee
                                ?.employeeCode || "--"}
                            </p>

                          </div>

                          <span className="rounded-full bg-[#fbf3e5] px-2.5 py-1 text-[10px] font-semibold text-[#a57327]">
                            Pending
                          </span>

                        </div>

                        <div className="mt-3 flex items-end justify-between gap-3">

                          <div>

                            <p className="text-xs font-medium text-slate-600">
                              {leave.leaveType?.name ||
                                "Leave"}
                            </p>

                            <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                              <Calendar size={11} />

                              {formatDate(
                                leave.fromDate
                              )}

                              <span>-</span>

                              {formatDate(
                                leave.toDate
                              )}
                            </div>

                          </div>

                        </div>

                      </div>
                    )
                  )}

                </div>
              )}

            </div>

          </section>

        </div>

        {/* =================================================
            BOTTOM
        ================================================= */}

        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">

          {/* LEAVE OVERVIEW */}

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

            <SectionHeader
              title="Leave Overview"
              subtitle="Current leave application status"
            />

            <div className="space-y-6 p-6">

              <LeaveProgress
                label="Approved"
                value={overview.approvedLeave}
                total={leaveTotal}
                tone="green"
              />

              <LeaveProgress
                label="Pending"
                value={overview.pendingLeave}
                total={leaveTotal}
                tone="gold"
              />

              <LeaveProgress
                label="Rejected"
                value={overview.rejectedLeave}
                total={leaveTotal}
                tone="red"
              />

            </div>

          </section>

          {/* TODAY SUMMARY */}

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

            <SectionHeader
              title="Today's Summary"
              subtitle="Quick workforce overview"
            />

            <div className="grid grid-cols-2 gap-4 p-6">

              <SummaryCard
                label="Employees"
                value={overview.totalEmployees}
                icon={Users}
              />

              <SummaryCard
                label="Present"
                value={overview.presentToday}
                icon={UserCheck}
              />

              <SummaryCard
                label="Late"
                value={overview.lateToday}
                icon={Clock}
              />

              <SummaryCard
                label="On Leave"
                value={overview.onLeaveToday}
                icon={CalendarDays}
              />

            </div>

          </section>

        </div>

      </div>
    </AdminLayout>
  );
}

// =====================================================
// Dashboard Stat
// =====================================================

function DashboardStat({
  title,
  value,
  subtitle,
  icon: Icon,
  tone,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ElementType;
  tone: "navy" | "green" | "red" | "gold";
}) {
  const styles = {
    navy: "bg-[#edf3f8] text-[#173f67]",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-500",
    gold: "bg-[#fbf3e5] text-[#b1843d]",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-xs font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 font-serif text-[30px] font-semibold leading-none text-[#17324d]">
            {value}
          </p>

          <p className="mt-3 text-[11px] text-slate-400">
            {subtitle}
          </p>

        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-lg ${styles[tone]}`}
        >
          <Icon size={20} strokeWidth={1.8} />
        </div>

      </div>

    </div>
  );
}

// =====================================================
// Section Header
// =====================================================

function SectionHeader({
  title,
  subtitle,
  button,
  onClick,
}: {
  title: string;
  subtitle: string;
  button?: string;
  onClick?: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">

      <div>

        <h2 className="font-serif text-[17px] font-semibold text-[#17324d]">
          {title}
        </h2>

        <p className="mt-0.5 text-[11px] text-slate-400">
          {subtitle}
        </p>

      </div>

      {button && (
        <button
          type="button"
          onClick={onClick}
          className="flex items-center gap-1 text-xs font-semibold text-[#a97828] transition hover:text-[#79531c]"
        >
          {button}
          <ArrowRight size={12} />
        </button>
      )}

    </div>
  );
}

// =====================================================
// Attendance Card
// =====================================================

function AttendanceCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  tone: "green" | "red" | "gold";
}) {
  const styles = {
    green:
      "bg-emerald-50 text-emerald-600",
    red:
      "bg-red-50 text-red-500",
    gold:
      "bg-[#fbf3e5] text-[#b1843d]",
  };

  return (
    <div className="rounded-xl border border-slate-100 p-4">

      <div className="flex items-center justify-between">

        <p className="text-xs font-medium text-slate-500">
          {label}
        </p>

        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${styles[tone]}`}
        >
          <Icon size={16} />
        </div>

      </div>

      <p className="mt-3 font-serif text-2xl font-semibold text-[#17324d]">
        {value}
      </p>

    </div>
  );
}

// =====================================================
// Attendance Progress
// =====================================================

function AttendanceProgress({
  present,
  absent,
  late,
  total,
}: {
  present: number;
  absent: number;
  late: number;
  total: number;
}) {
  if (total <= 0) {
    return (
      <div className="h-2.5 rounded-full bg-slate-200" />
    );
  }

  const presentWidth =
    (present / total) * 100;

  const absentWidth =
    (absent / total) * 100;

  const lateWidth =
    (late / total) * 100;

  return (
    <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-200">

      <div
        className="bg-emerald-500"
        style={{
          width: `${presentWidth}%`,
        }}
      />

      <div
        className="bg-red-400"
        style={{
          width: `${absentWidth}%`,
        }}
      />

      <div
        className="bg-[#c99a49]"
        style={{
          width: `${lateWidth}%`,
        }}
      />

    </div>
  );
}

// =====================================================
// Legend
// =====================================================

function Legend({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2">

      <span
        className={`h-2.5 w-2.5 rounded-full ${color}`}
      />

      <span className="text-xs text-slate-500">
        {label}
      </span>

      <span className="text-xs font-semibold text-[#17324d]">
        {value}
      </span>

    </div>
  );
}

// =====================================================
// Leave Progress
// =====================================================

function LeaveProgress({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: "green" | "gold" | "red";
}) {
  const percentage =
    total > 0
      ? Math.min((value / total) * 100, 100)
      : 0;

  const styles = {
    green: "bg-emerald-500",
    gold: "bg-[#c99a49]",
    red: "bg-red-400",
  };

  return (
    <div>

      <div className="mb-2 flex items-center justify-between">

        <p className="text-sm font-medium text-slate-600">
          {label}
        </p>

        <div className="flex items-center gap-3">

          <span className="text-xs text-slate-400">
            {Math.round(percentage)}%
          </span>

          <span className="text-sm font-semibold text-[#17324d]">
            {value}
          </span>

        </div>

      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">

        <div
          className={`h-full rounded-full ${styles[tone]}`}
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

    </div>
  );
}

// =====================================================
// Summary
// =====================================================

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-[#fafbfc] p-5">

      <div className="flex items-center justify-between">

        <p className="text-xs font-medium text-slate-500">
          {label}
        </p>

        <Icon
          size={17}
          strokeWidth={1.7}
          className="text-[#b1843d]"
        />

      </div>

      <p className="mt-3 font-serif text-[26px] font-semibold text-[#17324d]">
        {value}
      </p>

    </div>
  );
}