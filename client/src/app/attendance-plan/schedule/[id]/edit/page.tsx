"use client";

import { API_BASE_URL } from "@/lib/api";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import { toast } from "sonner";

import AdminLayout from "@/components/layout/AdminLayout";

import {
  Save,
  ArrowLeft,
  Pencil,
  Clock3,
} from "lucide-react";

const initialForm = {
  name: "",
  startTime: "",
  endTime: "",
  intervalStart: "",
  intervalEnd: "",
};

export default function EditAttendanceSchedulePage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id as string;

  const [form, setForm] =
    useState(initialForm);

  const [isInactive, setIsInactive] =
    useState(false);

  const [pageLoading, setPageLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      sessionStorage.getItem("token")
    );
  };

  const updateField = (
    field: keyof typeof initialForm,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (error) {
      setError("");
    }
  };

  // ============================================
  // LOAD EXISTING SCHEDULE
  // ============================================

  useEffect(() => {
    const fetchSchedule = async () => {
      const token = getToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        setPageLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/api/attendance-schedules/${id}`,
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
              "Failed to load attendance schedule."
          );
        }

        const schedule = data.schedule;

        setForm({
          name: schedule.name || "",
          startTime: schedule.startTime || "",
          endTime: schedule.endTime || "",
          intervalStart:
            schedule.intervalStart || "",
          intervalEnd:
            schedule.intervalEnd || "",
        });

        setIsInactive(
          schedule.isActive === false
        );
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to load attendance schedule.";

        setError(message);
        toast.error(message);
      } finally {
        setPageLoading(false);
      }
    };

    if (id) {
      fetchSchedule();
    }
  }, [id, router]);

  // ============================================
  // UPDATE
  // ============================================

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");

    const hasEmptyField =
      Object.values(form).some(
        (value) => !value.trim()
      );

    if (hasEmptyField) {
      setError(
        "Please fill in all attendance schedule fields."
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
        `${API_BASE_URL}/api/attendance-schedules/${id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            ...form,
            isActive: !isInactive,
          }),
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
        const message =
          data.message ||
          "Failed to update attendance schedule.";

        setError(message);
        toast.error(message);

        return;
      }

      toast.success(
        "Attendance schedule updated successfully."
      );

      router.push("/attendance-plan/schedule");
    } catch {
      const message =
        "Unable to connect to the server.";

      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // LOADING
  // ============================================

  if (pageLoading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#b1843d]" />

            <p className="mt-3 text-sm text-slate-400">
              Loading attendance schedule...
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="text-[#17324d]">
        {/* PAGE HEADER */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/attendance-plan/schedule"
              )
            }
            className="mb-4 flex items-center gap-2 text-xs font-medium text-slate-400 transition hover:text-[#a97828]"
          >
            <ArrowLeft size={14} />
            Back to Attendance Schedule
          </button>

          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b1843d]">
            Attendance Management
          </p>

          <h1 className="mt-1 font-serif text-[32px] font-semibold text-[#102a43]">
            Edit Attendance Schedule
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Update working hours, break intervals and
            schedule availability.
          </p>
        </div>

        {/* FORM CARD */}
        <section className="max-w-[1000px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* CARD HEADER */}
          <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#fbf3e5] text-[#b1843d]">
              <Pencil size={18} />
            </div>

            <div>
              <h2 className="font-serif text-[19px] font-semibold text-[#17324d]">
                Schedule Information
              </h2>

              <p className="mt-0.5 text-xs text-slate-400">
                Modify the schedule details below and
                save your changes.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-7 p-6 md:p-7">
              {/* STATUS */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#17324d]">
                  Status
                </label>

                <button
                  type="button"
                  onClick={() =>
                    setIsInactive(
                      (current) => !current
                    )
                  }
                  className="flex items-center gap-3"
                >
                  <div
                    className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
                      !isInactive
                        ? "bg-[#0b2945]"
                        : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200 ${
                        !isInactive
                          ? "left-6"
                          : "left-1"
                      }`}
                    />
                  </div>

                  <div className="text-left">
                    <p
                      className={`text-sm font-medium ${
                        !isInactive
                          ? "text-emerald-700"
                          : "text-slate-500"
                      }`}
                    >
                      {!isInactive
                        ? "Active"
                        : "Inactive"}
                    </p>

                    <p className="text-[11px] text-slate-400">
                      {!isInactive
                        ? "This schedule is currently available throughout the system."
                        : "This schedule is currently unavailable for use."}
                    </p>
                  </div>
                </button>
              </div>

              <div className="h-px bg-slate-100" />

              {/* NAME */}
              <Field
                label="Schedule Name"
                description="Update the schedule name if required."
              >
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    updateField(
                      "name",
                      e.target.value
                    )
                  }
                  className="h-11 w-full rounded-lg border border-slate-200 bg-[#fafbfc] px-4 text-sm text-[#17324d] outline-none transition focus:border-[#c6a364] focus:bg-white focus:ring-2 focus:ring-[#c6a364]/10"
                />
              </Field>

              {/* WORKING HOURS */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <Clock3
                    size={16}
                    className="text-[#b1843d]"
                  />

                  <h3 className="text-sm font-semibold text-[#17324d]">
                    Working Hours
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label="Start Time">
                    <input
                      required
                      type="time"
                      value={form.startTime}
                      onChange={(e) =>
                        updateField(
                          "startTime",
                          e.target.value
                        )
                      }
                      className="h-11 w-full rounded-lg border border-slate-200 bg-[#fafbfc] px-4 text-sm text-[#17324d] outline-none transition focus:border-[#c6a364] focus:bg-white focus:ring-2 focus:ring-[#c6a364]/10"
                    />
                  </Field>

                  <Field label="End Time">
                    <input
                      required
                      type="time"
                      value={form.endTime}
                      onChange={(e) =>
                        updateField(
                          "endTime",
                          e.target.value
                        )
                      }
                      className="h-11 w-full rounded-lg border border-slate-200 bg-[#fafbfc] px-4 text-sm text-[#17324d] outline-none transition focus:border-[#c6a364] focus:bg-white focus:ring-2 focus:ring-[#c6a364]/10"
                    />
                  </Field>
                </div>
              </div>

              {/* BREAK INTERVAL */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <Clock3
                    size={16}
                    className="text-[#b1843d]"
                  />

                  <h3 className="text-sm font-semibold text-[#17324d]">
                    Break Interval
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label="Interval Start">
                    <input
                      required
                      type="time"
                      value={form.intervalStart}
                      onChange={(e) =>
                        updateField(
                          "intervalStart",
                          e.target.value
                        )
                      }
                      className="h-11 w-full rounded-lg border border-slate-200 bg-[#fafbfc] px-4 text-sm text-[#17324d] outline-none transition focus:border-[#c6a364] focus:bg-white focus:ring-2 focus:ring-[#c6a364]/10"
                    />
                  </Field>

                  <Field label="Interval End">
                    <input
                      required
                      type="time"
                      value={form.intervalEnd}
                      onChange={(e) =>
                        updateField(
                          "intervalEnd",
                          e.target.value
                        )
                      }
                      className="h-11 w-full rounded-lg border border-slate-200 bg-[#fafbfc] px-4 text-sm text-[#17324d] outline-none transition focus:border-[#c6a364] focus:bg-white focus:ring-2 focus:ring-[#c6a364]/10"
                    />
                  </Field>
                </div>
              </div>

              {/* ERROR */}
              {error && (
                <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>

            {/* ACTION BAR */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-[#fafbfc] px-6 py-4">
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  router.push(
                    "/attendance-plan/schedule"
                  )
                }
                className="h-10 rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex h-10 items-center gap-2 rounded-lg bg-[#0b2945] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#071e34] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save
                  size={16}
                  className="text-[#d6ad66]"
                />

                {saving
                  ? "Updating..."
                  : "Save Changes"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </AdminLayout>
  );
}

function Field({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[#17324d]">
        {label}
        <span className="ml-1 text-red-500">
          *
        </span>
      </label>

      {description && (
        <p className="mb-2 text-[11px] text-slate-400">
          {description}
        </p>
      )}

      {children}
    </div>
  );
}