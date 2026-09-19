"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import AdminLayout from "@/components/layout/AdminLayout";

import {
  Plus,
  Pencil,
  Trash2,
  CalendarClock,
  ChevronRight,
  Clock3,
  AlertTriangle,
  X,
} from "lucide-react";

type AttendanceSchedule = {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  intervalStart: string;
  intervalEnd: string;
  isActive: boolean;
};

export default function AttendanceSchedulePage() {
  const router = useRouter();

  const [schedules, setSchedules] = useState<
    AttendanceSchedule[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Delete modal
  const [deleteTarget, setDeleteTarget] =
    useState<AttendanceSchedule | null>(null);

  const [deleting, setDeleting] = useState(false);

  // =====================================================
  // Token
  // =====================================================

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      sessionStorage.getItem("token")
    );
  };

  // =====================================================
  // Format Time
  // =====================================================

  const formatTime = (time: string) => {
    if (!time) return "—";

    const [hourString, minute] = time.split(":");

    let hour = Number(hourString);

    const period = hour >= 12 ? "PM" : "AM";

    hour = hour % 12 || 12;

    return `${hour}:${minute} ${period}`;
  };

  // =====================================================
  // Fetch Schedules
  // =====================================================

  const fetchSchedules = async () => {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/attendance-schedules",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");

        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load attendance schedules."
        );
      }

      setSchedules(data.schedules || []);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to load attendance schedules.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  // =====================================================
  // Open Delete Modal
  // =====================================================

  const handleDeleteClick = (
    schedule: AttendanceSchedule
  ) => {
    setDeleteTarget(schedule);
  };

  // =====================================================
  // Close Delete Modal
  // =====================================================

  const closeDeleteModal = () => {
    if (deleting) return;

    setDeleteTarget(null);
  };

  // =====================================================
  // Confirm Delete
  // =====================================================

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setDeleting(true);

      const response = await fetch(
        `http://localhost:5000/api/attendance-schedules/${deleteTarget._id}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");

        setDeleteTarget(null);

        router.push("/login");
        return;
      }

      if (!response.ok) {
        toast.error(
          data.message ||
            "Failed to delete attendance schedule."
        );

        return;
      }

      const deletedName = deleteTarget.name;

      setDeleteTarget(null);

      await fetchSchedules();

      toast.success(
        `${deletedName} deleted successfully.`
      );
    } catch {
      toast.error(
        "Unable to connect to the server."
      );
    } finally {
      setDeleting(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <AdminLayout>
      <div className="text-[#17324d]">
        {/* =============================================
            PAGE HEADER
        ============================================== */}

        <div className="mb-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b1843d]">
                Attendance Management
              </p>

              <h1 className="mt-1 font-serif text-[34px] font-semibold leading-tight text-[#102a43]">
                Attendance Schedule
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Configure office attendance hours,
                working periods and break intervals.
              </p>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Home</span>

              <ChevronRight size={13} />

              <span>Attendance Plan</span>

              <ChevronRight size={13} />

              <span className="font-medium text-[#17324d]">
                Schedule
              </span>
            </div>
          </div>
        </div>

        {/* =============================================
            MAIN CARD
        ============================================== */}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* CARD HEADER */}
          <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#fbf3e5] text-[#b1843d]">
                <CalendarClock
                  size={19}
                  strokeWidth={1.8}
                />
              </div>

              <div>
                <h2 className="font-serif text-[20px] font-semibold text-[#17324d]">
                  Attendance Schedule List
                </h2>

                <p className="mt-0.5 text-xs text-slate-400">
                  Manage working hours and attendance
                  schedules.
                </p>
              </div>
            </div>

            {/* NEW SCHEDULE */}
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/attendance-plan/schedule/new"
                )
              }
              className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#0b2945] px-5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#071e34] hover:shadow-md"
            >
              <Plus
                size={17}
                className="text-[#d6ad66]"
              />

              New Attendance Schedule
            </button>
          </div>

          {/* =============================================
              ERROR
          ============================================== */}

          {error && (
            <div className="mx-6 mt-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* =============================================
              TABLE
          ============================================== */}

          <div className="p-6">
            <div className="overflow-hidden rounded-lg border border-slate-200">
              {/* TABLE TOP BAR */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
                <div className="flex items-center gap-2">
                  <Clock3
                    size={16}
                    className="text-[#b1843d]"
                  />

                  <h3 className="font-serif text-[16px] font-semibold text-[#17324d]">
                    Schedule Records
                  </h3>
                </div>

                {!loading && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-500">
                    {schedules.length}{" "}
                    {schedules.length === 1
                      ? "schedule"
                      : "schedules"}
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-[#f8fafb]">
                      <th className="w-[75px] px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        SL
                      </th>

                      <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Name
                      </th>

                      <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Start Time
                      </th>

                      <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        End Time
                      </th>

                      <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Interval Start
                      </th>

                      <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Interval End
                      </th>

                      <th className="w-[130px] px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>

                      <th className="w-[130px] px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {/* LOADING */}
                    {loading ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-5 py-16 text-center"
                        >
                          <div className="flex flex-col items-center">
                            <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-[#b1843d]" />

                            <p className="mt-3 text-xs text-slate-400">
                              Loading attendance
                              schedules...
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : schedules.length === 0 ? (
                      /* EMPTY STATE */
                      <tr>
                        <td
                          colSpan={8}
                          className="px-5 py-16 text-center"
                        >
                          <CalendarClock
                            size={34}
                            strokeWidth={1.3}
                            className="mx-auto text-slate-300"
                          />

                          <p className="mt-3 text-sm font-medium text-slate-600">
                            No attendance schedules found
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Create an attendance schedule
                            to configure working hours.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      schedules.map(
                        (schedule, index) => (
                          <tr
                            key={schedule._id}
                            className="transition-colors duration-150 hover:bg-[#fdfbf7]"
                          >
                            {/* SL */}
                            <td className="px-5 py-4 text-slate-500">
                              {String(
                                index + 1
                              ).padStart(2, "0")}
                            </td>

                            {/* NAME */}
                            <td className="px-5 py-4">
                              <p className="font-medium text-[#17324d]">
                                {schedule.name}
                              </p>
                            </td>

                            {/* START TIME */}
                            <td className="px-5 py-4 text-slate-600">
                              {formatTime(
                                schedule.startTime
                              )}
                            </td>

                            {/* END TIME */}
                            <td className="px-5 py-4 text-slate-600">
                              {formatTime(
                                schedule.endTime
                              )}
                            </td>

                            {/* INTERVAL START */}
                            <td className="px-5 py-4 text-slate-600">
                              {formatTime(
                                schedule.intervalStart
                              )}
                            </td>

                            {/* INTERVAL END */}
                            <td className="px-5 py-4 text-slate-600">
                              {formatTime(
                                schedule.intervalEnd
                              )}
                            </td>

                            {/* STATUS */}
                            <td className="px-5 py-4">
                              {schedule.isActive ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-600">
                                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />

                                  Inactive
                                </span>
                              )}
                            </td>

                            {/* ACTION */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                {/* EDIT */}
                                <button
                                  type="button"
                                  title="Edit"
                                  aria-label={`Edit ${schedule.name}`}
                                  onClick={() =>
                                    router.push(
                                      `/attendance-plan/schedule/${schedule._id}/edit`
                                    )
                                  }
                                  className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600 transition hover:bg-blue-100 hover:text-blue-700"
                                >
                                  <Pencil
                                    size={15}
                                  />
                                </button>

                                {/* DELETE */}
                                <button
                                  type="button"
                                  title="Delete"
                                  aria-label={`Delete ${schedule.name}`}
                                  onClick={() =>
                                    handleDeleteClick(
                                      schedule
                                    )
                                  }
                                  className="flex h-8 w-8 items-center justify-center rounded-md bg-red-50 text-red-500 transition hover:bg-red-100 hover:text-red-600"
                                >
                                  <Trash2
                                    size={15}
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TABLE FOOTER */}
            {!loading && schedules.length > 0 && (
              <div className="mt-4 flex flex-col gap-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  Showing{" "}
                  <span className="font-medium text-slate-600">
                    1
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-slate-600">
                    {schedules.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-slate-600">
                    {schedules.length}
                  </span>{" "}
                  results
                </p>

                <p>Attendance Schedule</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* =============================================
          DELETE CONFIRMATION MODAL
      ============================================== */}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#071727]/50 px-4 backdrop-blur-[2px]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeDeleteModal();
            }
          }}
        >
          <div className="w-full max-w-[440px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
            {/* MODAL HEADER */}
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
                  <AlertTriangle size={20} />
                </div>

                <div>
                  <h2 className="font-serif text-[20px] font-semibold text-[#17324d]">
                    Delete Attendance Schedule
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-400">
                    This action requires confirmation.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                aria-label="Close confirmation"
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={17} />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="px-6 py-6">
              <p className="text-sm leading-6 text-slate-600">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-[#17324d]">
                  &quot;{deleteTarget.name}&quot;
                </span>
                ?
              </p>

              <div className="mt-4 rounded-lg border border-red-100 bg-red-50/70 px-4 py-3">
                <p className="text-xs leading-5 text-red-600">
                  This attendance schedule will be
                  permanently removed. This action
                  cannot be undone.
                </p>
              </div>
            </div>

            {/* MODAL ACTIONS */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-[#fafbfc] px-6 py-4">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="h-10 rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex h-10 items-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}