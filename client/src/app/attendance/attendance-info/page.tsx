"use client";

import { API_BASE_URL } from "@/lib/api";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";

import {
  Save,
  CalendarDays,
  Users,
  UserCheck,
  UserX,
  Clock3,
  ChevronRight,
  ClipboardCheck,
  Check,
} from "lucide-react";

type Employee = {
  _id: string;
  employeeCode: string;
  name: string;
  department?: string;
  designation?: string;
};

type Schedule = {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  intervalStart: string;
  intervalEnd: string;
};

type Attendance = {
  _id: string;
  employee: Employee;
  schedule: Schedule;
  date: string;
  day: string;
  inTime: string;
  outTime: string;
  durationMinutes: number;
  lateMinutes: number;
  status: "Present" | "Absent";
  description: string;
};

export default function AttendanceInfoPage() {
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );

  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");

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
  // Load Attendance
  // ==========================================

  const loadAttendance = async (date: string) => {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "${API_BASE_URL}/api/attendance/generate-date",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            date,
          }),

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
          data.message || "Failed to load attendance."
        );
      }

      setAttendance(data.attendance || []);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load attendance.";

      setError(message);
      setAttendance([]);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance(selectedDate);
  }, [selectedDate]);

  // ==========================================
  // Local Time Change
  // ==========================================

  const changeTime = (
    attendanceId: string,
    field: "inTime" | "outTime",
    value: string
  ) => {
    setAttendance((previous) =>
      previous.map((item) =>
        item._id === attendanceId
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  // ==========================================
  // Save Attendance
  // ==========================================

  const saveAttendance = async (record: Attendance) => {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setSavingId(record._id);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/attendance/${record._id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            inTime: record.inTime,
            outTime: record.outTime,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update attendance."
        );
      }

      setAttendance((previous) =>
        previous.map((item) =>
          item._id === record._id
            ? data.attendance
            : item
        )
      );

      toast.success("Attendance updated successfully.");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to update attendance.";

      setError(message);
      toast.error(message);
    } finally {
      setSavingId(null);
    }
  };

  // ==========================================
  // Dynamic Summary
  // ==========================================

  const summary = useMemo(() => {
    return attendance.reduce(
      (result, record) => {
        result.total += 1;

        if (record.status === "Present") {
          result.present += 1;
        }

        if (record.status === "Absent") {
          result.absent += 1;
        }

        if (record.lateMinutes > 0) {
          result.late += 1;
        }

        return result;
      },
      {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
      }
    );
  }, [attendance]);

  // ==========================================
  // Helpers
  // ==========================================

  const formatDuration = (minutes: number) => {
    if (!minutes || minutes <= 0) {
      return "--";
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) {
      return `${remainingMinutes}m`;
    }

    return `${hours}h ${remainingMinutes}m`;
  };

  const formatLate = (minutes: number) => {
    if (!minutes || minutes <= 0) {
      return "0m";
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) {
      return `${remainingMinutes}m`;
    }

    return `${hours}h ${remainingMinutes}m`;
  };

  const formatDisplayDate = (date: string) => {
    if (!date) {
      return "--";
    }

    const [year, month, day] = date.split("-");

    return `${day}/${month}/${year.slice(-2)}`;
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
              Attendance Management
            </p>

            <h1 className="mt-1 font-serif text-[34px] font-semibold leading-tight text-[#102a43]">
              Attendance
            </h1>

            <p className="mt-1 text-xs text-slate-500">
              Review and update daily employee attendance.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>Attendance</span>

            <ChevronRight size={12} />

            <span className="font-medium text-[#17324d]">
              Attendance Info
            </span>
          </div>

        </div>

        {/* =====================================
            DATE + SUMMARY
        ===================================== */}

        <div className="mb-4 grid gap-3 xl:grid-cols-[230px_1fr]">

          {/* Date */}

          <div className="flex h-[62px] items-center gap-3 rounded-xl border border-[#e5d5b7] bg-[#fdfaf4] px-4">

            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fbf0dc] text-[#b1843d]">
              <CalendarDays size={15} />
            </div>

            <div className="min-w-0 flex-1">

              <label className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                Attendance Date
              </label>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) =>
                  setSelectedDate(e.target.value)
                }
                className="w-full bg-transparent text-[11px] font-semibold text-[#17324d] outline-none"
              />

            </div>

          </div>

          {/* Dynamic summary */}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

            <SummaryCard
              label="Employees"
              value={summary.total}
              icon={Users}
              variant="navy"
            />

            <SummaryCard
              label="Present"
              value={summary.present}
              icon={UserCheck}
              variant="green"
            />

            <SummaryCard
              label="Absent"
              value={summary.absent}
              icon={UserX}
              variant="red"
            />

            <SummaryCard
              label="Late"
              value={summary.late}
              icon={Clock3}
              variant="gold"
            />

          </div>

        </div>

        {/* =====================================
            ERROR
        ===================================== */}

        {error && (
          <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[11px] text-red-600">
            {error}
          </div>
        )}

        {/* =====================================
            FRIDAY
        ===================================== */}

        {!loading &&
          attendance.length === 0 &&
          getDayName(selectedDate) === "Friday" && (
            <div className="mb-4 rounded-lg border border-amber-100 bg-[#fdf9f1] px-3 py-2 text-[11px] text-amber-700">
              Friday is not a regular working day.
            </div>
          )}

        {/* =====================================
            ATTENDANCE CARD
        ===================================== */}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          {/* Card Header */}

          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center">

            <div className="flex items-center gap-2.5">

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fbf3e5] text-[#b1843d]">
                <ClipboardCheck size={15} />
              </div>

              <div>
                <h2 className="font-serif text-[17px] font-semibold leading-tight text-[#17324d]">
                  Daily Attendance
                </h2>

                <p className="mt-0.5 text-[9px] text-slate-400">
                  Enter check-in and check-out time, then save the record.
                </p>
              </div>

            </div>

            {!loading && (
              <div className="rounded-full bg-[#edf3f8] px-3 py-1 text-[9px] font-semibold text-[#173f67]">
                {getDayName(selectedDate)}
                {" · "}
                {formatDisplayDate(selectedDate)}
              </div>
            )}

          </div>

          {/* =====================================
              TABLE
          ===================================== */}

          <div className="p-3">

            <div className="overflow-x-auto rounded-lg border border-slate-200">

              <table className="w-full table-fixed border-collapse">

                <colgroup>
                  <col className="w-[3%]" />
                  <col className="w-[9%]" />
                  <col className="w-[11%]" />
                  <col className="w-[7%]" />
                  <col className="w-[8%]" />
                  <col className="w-[9%]" />
                  <col className="w-[9%]" />
                  <col className="w-[7%]" />
                  <col className="w-[5%]" />
                  <col className="w-[7%]" />
                  <col className="w-[18%]" />
                  <col className="w-[7%]" />
                </colgroup>

                <thead className="bg-[#f8fafb]">

                  <tr>
                    <TableHead center>SL</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>In Time</TableHead>
                    <TableHead>Out Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Late</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead center>Action</TableHead>
                  </tr>

                </thead>

                <tbody>

                  {loading ? (
                    <tr>
                      <td
                        colSpan={12}
                        className="py-12 text-center"
                      >
                        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-[#b1843d]" />

                        <p className="mt-2 text-[10px] text-slate-400">
                          Loading attendance...
                        </p>
                      </td>
                    </tr>
                  ) : attendance.length === 0 ? (
                    <tr>
                      <td
                        colSpan={12}
                        className="py-12 text-center"
                      >
                        <ClipboardCheck
                          size={21}
                          className="mx-auto text-slate-300"
                        />

                        <p className="mt-2 text-[11px] font-semibold text-[#17324d]">
                          No attendance records
                        </p>

                        <p className="mt-1 text-[9px] text-slate-400">
                          No records were found for the selected date.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    attendance.map((record, index) => (
                      <tr
                        key={record._id}
                        className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-[#fdfcf9]"
                      >

                        {/* SL */}

                        <TableCell center>
                          <span className="text-slate-400">
                            {index + 1}
                          </span>
                        </TableCell>

                        {/* ID */}

                        <TableCell>
                          <span
                            className="block truncate font-medium text-[#102a43]"
                            title={
                              record.employee?.employeeCode
                            }
                          >
                            {record.employee?.employeeCode || "--"}
                          </span>
                        </TableCell>

                        {/* NAME */}

                        <TableCell>
                          <span
                            className="block truncate font-semibold text-[#102a43]"
                            title={record.employee?.name}
                          >
                            {record.employee?.name || "--"}
                          </span>
                        </TableCell>

                        {/* DAY */}

                        <TableCell>
                          <span className="block truncate">
                            {record.day || "--"}
                          </span>
                        </TableCell>

                        {/* DATE */}

                        <TableCell>
                          {formatDisplayDate(record.date)}
                        </TableCell>

                        {/* IN TIME */}

                        <TableCell>
                          <input
                            type="time"
                            value={record.inTime || ""}
                            onChange={(e) =>
                              changeTime(
                                record._id,
                                "inTime",
                                e.target.value
                              )
                            }
                            className="h-8 w-full min-w-0 rounded-md border border-slate-200 bg-[#fafbfc] px-1.5 text-[11px] text-[#17324d] outline-none transition focus:border-[#c6a364] focus:bg-white focus:ring-1 focus:ring-[#c6a364]/20"
                          />
                        </TableCell>

                        {/* OUT TIME */}

                        <TableCell>
                          <input
                            type="time"
                            value={record.outTime || ""}
                            onChange={(e) =>
                              changeTime(
                                record._id,
                                "outTime",
                                e.target.value
                              )
                            }
                            className="h-8 w-full min-w-0 rounded-md border border-slate-200 bg-[#fafbfc] px-1.5 text-[11px] text-[#17324d] outline-none transition focus:border-[#c6a364] focus:bg-white focus:ring-1 focus:ring-[#c6a364]/20"
                          />
                        </TableCell>

                        {/* DURATION */}

                        <TableCell>
                          <span className="font-medium text-slate-600">
                            {formatDuration(
                              record.durationMinutes
                            )}
                          </span>
                        </TableCell>

                        {/* LATE */}

                        <TableCell>
                          <span
                            className={
                              record.lateMinutes > 0
                                ? "font-semibold text-amber-600"
                                : "text-slate-400"
                            }
                          >
                            {formatLate(
                              record.lateMinutes
                            )}
                          </span>
                        </TableCell>

                        {/* STATUS */}

                        <TableCell>
                          <StatusBadge
                            status={record.status}
                          />
                        </TableCell>

                        {/* DESCRIPTION */}

                        <TableCell>
                          <span
                            className="block truncate text-slate-500"
                            title={
                              record.description ||
                              "Working day"
                            }
                          >
                            {record.description ||
                              "Working day"}
                          </span>
                        </TableCell>

                        {/* ACTION */}

                        <TableCell center>
                          <button
                            type="button"
                            onClick={() =>
                              saveAttendance(record)
                            }
                            disabled={
                              savingId === record._id
                            }
                            title="Save attendance"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#0b2945] text-white shadow-sm transition hover:bg-[#173f67] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {savingId === record._id ? (
                              <div className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" />
                            ) : (
                              <Save
                                size={12}
                                className="text-[#e0bd79]"
                              />
                            )}
                          </button>
                        </TableCell>

                      </tr>
                    ))
                  )}

                </tbody>

              </table>

            </div>

          </div>

        </section>

      </div>
    </AdminLayout>
  );
}

// ==========================================
// Summary Card
// ==========================================

function SummaryCard({
  label,
  value,
  icon: Icon,
  variant,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  variant: "navy" | "green" | "red" | "gold";
}) {
  const styles = {
    navy: {
      card: "border-[#dce6ef] bg-[#f7fafc]",
      icon: "bg-[#eaf1f7] text-[#173f67]",
    },

    green: {
      card: "border-emerald-100 bg-emerald-50/40",
      icon: "bg-emerald-100 text-emerald-600",
    },

    red: {
      card: "border-red-100 bg-red-50/40",
      icon: "bg-red-100 text-red-500",
    },

    gold: {
      card: "border-[#eee1c9] bg-[#fdfaf4]",
      icon: "bg-[#fbf0dc] text-[#b1843d]",
    },
  };

  const current = styles[variant];

  return (
    <div
      className={`flex h-[62px] items-center gap-3 rounded-xl border px-3 ${current.card}`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${current.icon}`}
      >
        <Icon size={14} />
      </div>

      <div>
        <p className="font-serif text-lg font-semibold leading-none text-[#17324d]">
          {value}
        </p>

        <p className="mt-1 text-[9px] font-medium text-slate-500">
          {label}
        </p>
      </div>
    </div>
  );
}

// ==========================================
// Table Head
// ==========================================

function TableHead({
  children,
  center = false,
}: {
  children: React.ReactNode;
  center?: boolean;
}) {
  return (
    <th
      className={`border-b border-slate-200 px-1.5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.02em] text-slate-500 ${
        center ? "text-center" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

// ==========================================
// Table Cell
// ==========================================

function TableCell({
  children,
  center = false,
}: {
  children: React.ReactNode;
  center?: boolean;
}) {
  return (
    <td
      className={`overflow-hidden px-1.5 py-2.5 text-[11px] text-slate-600 ${
        center ? "text-center" : "text-left"
      }`}
    >
      {children}
    </td>
  );
}

// ==========================================
// Status Badge
// ==========================================

function StatusBadge({
  status,
}: {
  status: "Present" | "Absent";
}) {
  const present = status === "Present";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${
        present
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-600"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
          present ? "bg-emerald-500" : "bg-red-400"
        }`}
      />

      {status}
    </span>
  );
}

// ==========================================
// Get Day Name
// ==========================================

function getDayName(date: string) {
  if (!date) {
    return "";
  }

  const [year, month, day] = date
    .split("-")
    .map(Number);

  const selectedDate = new Date(
    year,
    month - 1,
    day
  );

  return [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ][selectedDate.getDay()];
}
