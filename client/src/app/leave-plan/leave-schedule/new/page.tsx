"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";

import {
  Save,
  ArrowLeft,
  CalendarPlus,
  ChevronRight,
  CalendarDays,
  FileText,
} from "lucide-react";

type LeaveType = {
  _id: string;
  name: string;
  category: string;
  isActive: boolean;
};

type AllocationForm = {
  leaveType: string;
  days: string;
};

export default function NewLeaveSchedulePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isInactive, setIsInactive] = useState(false);

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [allocations, setAllocations] = useState<AllocationForm[]>([]);

  const [loadingTypes, setLoadingTypes] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const getToken = () =>
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  const handleUnauthorized = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    router.push("/login");
  };

  useEffect(() => {
    const fetchLeaveTypes = async () => {
      const token = getToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        setLoadingTypes(true);
        setError("");

        const response = await fetch(
          "http://localhost:5000/api/parameters/leave-type?active=true",
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
            data.message || "Failed to load Leave Types."
          );
        }

        const types: LeaveType[] = data.parameters || [];

        setLeaveTypes(types);

        // Generated completely from API leave types
        setAllocations(
          types.map((item) => ({
            leaveType: item._id,
            days: "0",
          }))
        );
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to load Leave Types.";

        setError(message);
        toast.error(message);
      } finally {
        setLoadingTypes(false);
      }
    };

    fetchLeaveTypes();
  }, [router]);

  const updateDays = (
    leaveTypeId: string,
    value: string
  ) => {
    setAllocations((previous) =>
      previous.map((item) =>
        item.leaveType === leaveTypeId
          ? {
              ...item,
              days: value,
            }
          : item
      )
    );
  };

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");

    if (!name.trim()) {
      setError("Leave Schedule name is required.");
      return;
    }

    if (leaveTypes.length === 0) {
      setError(
        "No active Leave Types are available. Create Leave Types first."
      );
      return;
    }

    const invalidAllocation = allocations.some((item) => {
      const days = Number(item.days);

      return (
        item.days === "" ||
        Number.isNaN(days) ||
        days < 0
      );
    });

    if (invalidAllocation) {
      setError(
        "All leave allocations must be valid numbers of zero or greater."
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
        "http://localhost:5000/api/leave-schedules",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),

            allocations: allocations.map((item) => ({
              leaveType: item.leaveType,
              days: Number(item.days),
            })),

            isActive: !isInactive,
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
          "Failed to create Leave Schedule.";

        setError(message);
        toast.error(message);
        return;
      }

      toast.success(
        "Leave Schedule created successfully."
      );

      router.push("/leave-plan/leave-schedule");
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
        {/* PAGE HEADER */}
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b1843d]">
              Leave Management
            </p>

            <h1 className="mt-1 font-serif text-[34px] font-semibold text-[#102a43]">
              New Leave Schedule
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Create a new leave plan and configure its
              available allocations.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Leave Plan</span>

            <ChevronRight size={13} />

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/leave-plan/leave-schedule"
                )
              }
              className="transition hover:text-[#b1843d]"
            >
              Leave Schedule
            </button>

            <ChevronRight size={13} />

            <span className="font-medium text-[#17324d]">
              New
            </span>
          </div>
        </div>

        {/* FORM CARD */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#fbf3e5] text-[#b1843d]">
              <CalendarPlus size={19} />
            </div>

            <div>
              <h2 className="font-serif text-xl font-semibold text-[#17324d]">
                Leave Schedule Information
              </h2>

              <p className="mt-0.5 text-xs text-slate-400">
                Enter the schedule details and leave
                allocations below.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-6 md:p-7"
          >
            {/* GENERAL INFORMATION */}
            <div>
              <div className="mb-5 flex items-center gap-2">
                <FileText
                  size={16}
                  className="text-[#b1843d]"
                />

                <h3 className="text-sm font-semibold text-[#17324d]">
                  General Information
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    Schedule Name
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    placeholder="Enter schedule name"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-[#fafbfc] px-4 text-sm text-[#17324d] outline-none transition placeholder:text-slate-400 focus:border-[#c6a364] focus:bg-white focus:ring-2 focus:ring-[#c6a364]/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    Description
                  </label>

                  <input
                    type="text"
                    value={description}
                    onChange={(e) =>
                      setDescription(e.target.value)
                    }
                    placeholder="Enter description"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-[#fafbfc] px-4 text-sm text-[#17324d] outline-none transition placeholder:text-slate-400 focus:border-[#c6a364] focus:bg-white focus:ring-2 focus:ring-[#c6a364]/10"
                  />
                </div>
              </div>

              {/* STATUS */}
              <div className="mt-5 rounded-lg border border-slate-200 bg-[#fafbfc] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#17324d]">
                      Schedule Status
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Set whether this leave schedule is
                      available for use.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setIsInactive(
                        (previous) => !previous
                      )
                    }
                    className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                      !isInactive
                        ? "bg-[#0b2945]"
                        : "bg-slate-300"
                    }`}
                    aria-label="Toggle schedule status"
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
                        !isInactive
                          ? "left-6"
                          : "left-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="mt-3">
                  {!isInactive ? (
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
                </div>
              </div>
            </div>

            {/* ALLOCATIONS */}
            <div className="mt-8 border-t border-slate-100 pt-7">
              <div className="mb-5 flex items-center gap-2">
                <CalendarDays
                  size={16}
                  className="text-[#b1843d]"
                />

                <div>
                  <h3 className="text-sm font-semibold text-[#17324d]">
                    Leave Allocation
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-400">
                    Configure the number of days for each
                    available leave type.
                  </p>
                </div>
              </div>

              {loadingTypes ? (
                <div className="rounded-lg border border-slate-200 bg-[#fafbfc] py-10 text-center">
                  <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-[#b1843d]" />

                  <p className="mt-3 text-xs text-slate-400">
                    Loading leave types...
                  </p>
                </div>
              ) : leaveTypes.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700">
                  No active Leave Types are currently
                  available.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {leaveTypes.map((leaveType) => {
                    const allocation =
                      allocations.find(
                        (item) =>
                          item.leaveType ===
                          leaveType._id
                      );

                    return (
                      <div
                        key={leaveType._id}
                        className="rounded-lg border border-slate-200 bg-[#fafbfc] p-4"
                      >
                        <label className="mb-2 block text-xs font-semibold text-slate-600">
                          {leaveType.name}
                          <span className="ml-1 text-red-500">
                            *
                          </span>
                        </label>

                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            value={
                              allocation?.days ?? "0"
                            }
                            onChange={(e) =>
                              updateDays(
                                leaveType._id,
                                e.target.value
                              )
                            }
                            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 pr-14 text-sm font-medium text-[#17324d] outline-none transition focus:border-[#c6a364] focus:ring-2 focus:ring-[#c6a364]/10"
                          />

                          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
                            Days
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ERROR */}
            {error && (
              <div className="mt-6 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* ACTIONS */}
            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/leave-plan/leave-schedule"
                  )
                }
                className="flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <button
                type="submit"
                disabled={
                  saving ||
                  loadingTypes ||
                  leaveTypes.length === 0
                }
                className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0b2945] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#071e34] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save
                  size={16}
                  className="text-[#d6ad66]"
                />

                {saving
                  ? "Saving..."
                  : "Save Schedule"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </AdminLayout>
  );
}