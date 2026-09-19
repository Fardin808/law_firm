"use client";

import { API_BASE_URL } from "@/lib/api";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";

import {
  Plus,
  Pencil,
  Trash2,
  Search,
  CalendarDays,
  CheckCircle2,
  Layers3,
  ChevronRight,
  AlertTriangle,
  X,
} from "lucide-react";

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

export default function LeaveSchedulePage() {
  const router = useRouter();

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [schedules, setSchedules] = useState<LeaveSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [deleteTarget, setDeleteTarget] =
    useState<LeaveSchedule | null>(null);

  const [deleting, setDeleting] = useState(false);

  const getToken = () =>
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  const handleUnauthorized = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    router.push("/login");
  };

  const fetchData = async () => {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [leaveTypeResponse, scheduleResponse] =
        await Promise.all([
          fetch(
            `${API_BASE_URL}/api/parameters/leave-type?active=true`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              cache: "no-store",
            }
          ),
          fetch(
            `${API_BASE_URL}/api/leave-schedules`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              cache: "no-store",
            }
          ),
        ]);

      if (
        leaveTypeResponse.status === 401 ||
        scheduleResponse.status === 401
      ) {
        handleUnauthorized();
        return;
      }

      const [leaveTypeData, scheduleData] =
        await Promise.all([
          leaveTypeResponse.json(),
          scheduleResponse.json(),
        ]);

      if (!leaveTypeResponse.ok) {
        throw new Error(
          leaveTypeData.message ||
            "Failed to load Leave Types."
        );
      }

      if (!scheduleResponse.ok) {
        throw new Error(
          scheduleData.message ||
            "Failed to load Leave Schedules."
        );
      }

      setLeaveTypes(leaveTypeData.parameters || []);
      setSchedules(scheduleData.schedules || []);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to load Leave Schedules.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getAllocationDays = (
    schedule: LeaveSchedule,
    leaveTypeId: string
  ) => {
    const allocation = schedule.allocations.find(
      (item) => item.leaveType?._id === leaveTypeId
    );

    return allocation?.days ?? 0;
  };

  // ==========================================
  // ALL SUMMARY VALUES COME FROM API DATA
  // ==========================================

  const totalPlans = schedules.length;

  const activePlans = schedules.filter(
    (schedule) => schedule.isActive
  ).length;

  const inactivePlans = schedules.filter(
    (schedule) => !schedule.isActive
  ).length;

  const totalAllocatedDays = schedules.reduce(
    (scheduleTotal, schedule) =>
      scheduleTotal +
      schedule.allocations.reduce(
        (allocationTotal, allocation) =>
          allocationTotal + Number(allocation.days || 0),
        0
      ),
    0
  );

  const filteredSchedules = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return schedules;

    return schedules.filter((schedule) => {
      return (
        schedule.name.toLowerCase().includes(query) ||
        (schedule.description || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [schedules, searchTerm]);

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
        `${API_BASE_URL}/api/leave-schedules/${deleteTarget._id}`,
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
          data.message ||
            "Failed to delete Leave Schedule."
        );
        return;
      }

      const deletedName = deleteTarget.name;

      setDeleteTarget(null);

      await fetchData();

      toast.success(
        `${deletedName} deleted successfully.`
      );
    } catch {
      toast.error("Unable to connect to the server.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="text-[#17324d]">
        {/* HEADER */}
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b1843d]">
              Leave Management
            </p>

            <h1 className="mt-1 font-serif text-[34px] font-semibold text-[#102a43]">
              Leave Schedule
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Configure leave plans and employee leave
              allocations.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Home</span>
            <ChevronRight size={13} />
            <span>Leave Plan</span>
            <ChevronRight size={13} />
            <span className="font-medium text-[#17324d]">
              Leave Schedule
            </span>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total Plans"
            value={totalPlans}
            icon={CalendarDays}
          />

          <SummaryCard
            label="Active Plans"
            value={activePlans}
            icon={CheckCircle2}
          />

          <SummaryCard
            label="Inactive Plans"
            value={inactivePlans}
            icon={Layers3}
          />

          <SummaryCard
            label="Total Allocated Days"
            value={totalAllocatedDays}
            icon={CalendarDays}
          />
        </div>

        {/* MAIN CARD */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-serif text-[20px] font-semibold text-[#17324d]">
                Leave Schedule List
              </h2>

              <p className="mt-0.5 text-xs text-slate-400">
                Manage available leave plans and allocations.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/leave-plan/leave-schedule/new"
                )
              }
              className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0b2945] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#071e34]"
            >
              <Plus
                size={17}
                className="text-[#d6ad66]"
              />
              New Leave Schedule
            </button>
          </div>

          {/* SEARCH */}
          <div className="border-b border-slate-100 px-6 py-5">
            <div className="relative max-w-[390px]">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
                placeholder="Search leave schedules..."
                className="h-11 w-full rounded-lg border border-slate-200 bg-[#fafbfc] pl-10 pr-4 text-sm outline-none transition focus:border-[#c6a364] focus:bg-white focus:ring-2 focus:ring-[#c6a364]/10"
              />
            </div>
          </div>

          {error && (
            <div className="mx-6 mt-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="p-6">
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h3 className="font-serif font-semibold text-[#17324d]">
                  Schedule Records
                </h3>

                {!loading && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-500">
                    {filteredSchedules.length} records
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-[#f8fafb]">
                      <TableHead>SL</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>

                      {/* DYNAMIC FROM BACKEND */}
                      {leaveTypes.map((leaveType) => (
                        <TableHead
                          key={leaveType._id}
                          center
                        >
                          {leaveType.name}
                        </TableHead>
                      ))}

                      <TableHead center>Status</TableHead>
                      <TableHead center>Action</TableHead>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={5 + leaveTypes.length}
                          className="py-16 text-center"
                        >
                          <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-[#b1843d]" />
                          <p className="mt-3 text-xs text-slate-400">
                            Loading leave schedules...
                          </p>
                        </td>
                      </tr>
                    ) : filteredSchedules.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5 + leaveTypes.length}
                          className="py-16 text-center"
                        >
                          <CalendarDays
                            size={32}
                            className="mx-auto text-slate-300"
                          />

                          <p className="mt-3 text-sm font-medium text-slate-600">
                            No leave schedules found
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredSchedules.map(
                        (schedule, index) => (
                          <tr
                            key={schedule._id}
                            className="transition hover:bg-[#fdfbf7]"
                          >
                            <td className="px-5 py-4 text-slate-500">
                              {String(index + 1).padStart(
                                2,
                                "0"
                              )}
                            </td>

                            <td className="px-5 py-4 font-medium text-[#17324d]">
                              {schedule.name}
                            </td>

                            <td className="max-w-[280px] px-5 py-4 text-slate-500">
                              {schedule.description || "—"}
                            </td>

                            {leaveTypes.map((leaveType) => (
                              <td
                                key={leaveType._id}
                                className="px-5 py-4 text-center font-medium text-slate-600"
                              >
                                {getAllocationDays(
                                  schedule,
                                  leaveType._id
                                )}
                              </td>
                            ))}

                            <td className="px-5 py-4 text-center">
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

                            <td className="px-5 py-4">
                              <div className="flex justify-center gap-2">
                                <button
                                  type="button"
                                  title="Edit"
                                  onClick={() =>
                                    router.push(
                                      `/leave-plan/leave-schedule/${schedule._id}/edit`
                                    )
                                  }
                                  className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                                >
                                  <Pencil size={15} />
                                </button>

                                <button
                                  type="button"
                                  title="Delete"
                                  onClick={() =>
                                    setDeleteTarget(schedule)
                                  }
                                  className="flex h-8 w-8 items-center justify-center rounded-md bg-red-50 text-red-500 transition hover:bg-red-100"
                                >
                                  <Trash2 size={15} />
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
          </div>
        </section>
      </div>

      {/* DELETE MODAL */}
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
                    Delete Leave Schedule
                  </h2>

                  <p className="text-xs text-slate-400">
                    This action requires confirmation.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  setDeleteTarget(null)
                }
                className="rounded-md p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={17} />
              </button>
            </div>

            <div className="px-6 py-6">
              <p className="text-sm leading-6 text-slate-600">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-[#17324d]">
                  &quot;{deleteTarget.name}&quot;
                </span>
                ?
              </p>

              <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600">
                This leave schedule will be permanently
                removed. This action cannot be undone.
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-[#fafbfc] px-6 py-4">
              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  setDeleteTarget(null)
                }
                className="h-10 rounded-lg border border-slate-200 bg-white px-5 text-sm text-slate-600"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="flex h-10 items-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                <Trash2 size={15} />

                {deleting
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

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
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 font-serif text-[28px] font-semibold text-[#17324d]">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#fbf3e5] text-[#b1843d]">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function TableHead({
  children,
  center = false,
}: {
  children: React.ReactNode;
  center?: boolean;
}) {
  return (
    <th
      className={`px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 ${
        center ? "text-center" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}
