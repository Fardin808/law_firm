"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import AdminLayout from "@/components/layout/AdminLayout";

import {
  ArrowLeft,
  Save,
  CalendarPlus,
  ChevronRight,
  FileText,
  Scale,
  UsersRound,
  CalendarDays,
  Clock3,
  BadgeCheck,
  ClipboardList,
} from "lucide-react";

// =====================================================
// Types
// =====================================================

type Parameter = {
  _id: string;
  name: string;
  category: string;
  isActive: boolean;
};

type Employee = {
  _id: string;
  employeeCode: string;
  name: string;
  department?: string;
  designation?: string;
  isInactive?: boolean;
};

type Client = {
  _id: string;
  clientCode: string;
  name: string;
  isInactive?: boolean;
};

// =====================================================
// Page
// =====================================================

export default function NewAppointmentPage() {
  const router = useRouter();

  // =====================================================
  // Form State
  // =====================================================

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [appointmentType, setAppointmentType] = useState("");
  const [lawyer, setLawyer] = useState("");
  const [client, setClient] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [appointmentDetails, setAppointmentDetails] =
    useState("");
  const [isInactive, setIsInactive] = useState(false);

  // =====================================================
  // Dropdown Options
  // =====================================================

  const [appointmentTypes, setAppointmentTypes] = useState<
    Parameter[]
  >([]);

  const [lawyers, setLawyers] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // =====================================================
  // UI State
  // =====================================================

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // Authentication
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
  // Load Dropdown Data
  // =====================================================

  useEffect(() => {
    const fetchOptions = async () => {
      const token = getToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        setLoadingOptions(true);
        setError("");

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [
          typeResponse,
          employeeResponse,
          clientResponse,
        ] = await Promise.all([
          fetch(
            "http://localhost:5000/api/parameters/appointment-type?active=true",
            {
              headers,
              cache: "no-store",
            }
          ),

          fetch(
            "http://localhost:5000/api/employees?limit=100",
            {
              headers,
              cache: "no-store",
            }
          ),

          fetch(
            "http://localhost:5000/api/clients?status=active&limit=100",
            {
              headers,
              cache: "no-store",
            }
          ),
        ]);

        if (
          typeResponse.status === 401 ||
          employeeResponse.status === 401 ||
          clientResponse.status === 401
        ) {
          handleUnauthorized();
          return;
        }

        const [
          typeData,
          employeeData,
          clientData,
        ] = await Promise.all([
          typeResponse.json(),
          employeeResponse.json(),
          clientResponse.json(),
        ]);

        if (!typeResponse.ok) {
          throw new Error(
            typeData.message ||
              "Failed to load Appointment Types."
          );
        }

        if (!employeeResponse.ok) {
          throw new Error(
            employeeData.message ||
              "Failed to load employees."
          );
        }

        if (!clientResponse.ok) {
          throw new Error(
            clientData.message ||
              "Failed to load clients."
          );
        }

        // Appointment Types
        setAppointmentTypes(
          typeData.parameters || []
        );

        // Only active employees whose designation is Lawyer
        const lawyerEmployees: Employee[] = (
          employeeData.employees || []
        ).filter((employee: Employee) => {
          const designation =
            employee.designation
              ?.trim()
              .toLowerCase() || "";

          return (
            !employee.isInactive &&
            designation === "lawyer"
          );
        });

        setLawyers(lawyerEmployees);

        // Active Clients from backend
        setClients(clientData.clients || []);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to load appointment form data.";

        setError(message);
        toast.error(message);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [router]);

  // =====================================================
  // Submit
  // =====================================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");

    if (!title.trim()) {
      setError(
        "Appointment title is required."
      );
      return;
    }

    if (!appointmentType) {
      setError(
        "Please select an Appointment Type."
      );
      return;
    }

    if (!lawyer) {
      setError(
        "Please select a Lawyer."
      );
      return;
    }

    if (!client) {
      setError(
        "Please select a Client."
      );
      return;
    }

    if (!date) {
      setError(
        "Appointment date is required."
      );
      return;
    }

    if (!startTime || !endTime) {
      setError(
        "Start Time and End Time are required."
      );
      return;
    }

    if (endTime <= startTime) {
      setError(
        "End Time must be after Start Time."
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
        "http://localhost:5000/api/appointments",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            appointmentType,
            lawyer,
            client,
            date,
            startTime,
            endTime,
            appointmentDetails:
              appointmentDetails.trim(),
            isInactive,
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
          "Failed to create appointment.";

        setError(message);
        toast.error(message);
        return;
      }

      toast.success(
        "Appointment created successfully."
      );

      router.push(
        "/cases-appointments/appointments"
      );

      router.refresh();
    } catch {
      const message =
        "Unable to connect to the server.";

      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <AdminLayout>
      <div className="text-[#17324d]">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

          <div className="min-w-0">

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b1843d]">
              Cases & Appointments
            </p>

            <h1 className="mt-1 font-serif text-[34px] font-semibold leading-tight tracking-[-0.02em] text-[#102a43]">
              New Appointment
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Schedule a new appointment between a client and lawyer.
            </p>

          </div>

          {/* Breadcrumb */}

          <div className="flex items-center gap-2 text-xs text-slate-400">

            <span>
              Appointments
            </span>

            <ChevronRight size={13} />

            <span className="font-medium text-[#17324d]">
              New Appointment
            </span>

          </div>

        </div>

        {/* =================================================
            BACK
        ================================================= */}

        <div className="mb-4">

          <button
            type="button"
            onClick={() =>
              router.push(
                "/cases-appointments/appointments"
              )
            }
            className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-[#d8c29c] hover:bg-[#fbf8f2] hover:text-[#17324d]"
          >
            <ArrowLeft size={14} />

            Back to Appointments
          </button>

        </div>

        {/* =================================================
            FORM CARD
        ================================================= */}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          {/* Card Header */}

          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fbf3e5] text-[#b1843d]">
                <CalendarPlus size={17} />
              </div>

              <div>

                <h2 className="font-serif text-lg font-semibold text-[#17324d]">
                  Appointment Information
                </h2>

                <p className="mt-0.5 text-[10px] text-slate-400">
                  Enter the information required to schedule the appointment.
                </p>

              </div>

            </div>

            <div className="hidden rounded-full border border-[#eadbbf] bg-[#fbf7ef] px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#9a6b20] sm:block">
              New Record
            </div>

          </div>

          <form onSubmit={handleSubmit}>

            <div className="p-5">

              {/* Error */}

              {error && (
                <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-2.5 text-xs text-red-600">
                  {error}
                </div>
              )}

              {/* =================================================
                  LOADING
              ================================================= */}

              {loadingOptions ? (
                <div className="flex min-h-[280px] items-center justify-center">

                  <div className="text-center">

                    <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-[#b1843d]" />

                    <p className="mt-3 text-xs text-slate-400">
                      Loading appointment options...
                    </p>

                  </div>

                </div>
              ) : (
                <>

                  {/* =============================================
                      RECORD STATUS
                  ============================================= */}

                  <div className="mb-5 flex flex-col gap-3 rounded-lg border border-slate-200 bg-[#f8fafb] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-center gap-3">

                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          isInactive
                            ? "bg-red-50 text-red-500"
                            : "bg-emerald-50 text-emerald-600"
                        }`}
                      >
                        <BadgeCheck size={15} />
                      </div>

                      <div>

                        <p className="text-xs font-semibold text-[#17324d]">
                          Record Status
                        </p>

                        <p className="mt-0.5 text-[10px] text-slate-400">
                          Set whether this appointment should be active or inactive.
                        </p>

                      </div>

                    </div>

                    <label className="flex cursor-pointer items-center gap-3">

                      <span
                        className={`text-[10px] font-semibold ${
                          isInactive
                            ? "text-red-500"
                            : "text-emerald-600"
                        }`}
                      >
                        {isInactive
                          ? "Inactive"
                          : "Active"}
                      </span>

                      <span className="relative inline-flex">

                        <input
                          type="checkbox"
                          checked={isInactive}
                          onChange={(e) =>
                            setIsInactive(
                              e.target.checked
                            )
                          }
                          className="peer sr-only"
                        />

                        <span className="h-6 w-11 rounded-full bg-emerald-500 transition peer-checked:bg-slate-300" />

                        <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />

                      </span>

                    </label>

                  </div>

                  {/* =============================================
                      FORM FIELDS
                  ============================================= */}

                  <div className="grid grid-cols-1 gap-x-5 gap-y-4 lg:grid-cols-2">

                    {/* TITLE */}

                    <FormField
                      label="Title"
                      required
                      icon={FileText}
                    >

                      <input
                        type="text"
                        value={title}
                        onChange={(e) =>
                          setTitle(
                            e.target.value
                          )
                        }
                        placeholder="Enter appointment title"
                        className={inputClass}
                      />

                    </FormField>

                    {/* APPOINTMENT TYPE */}

                    <FormField
                      label="Appointment Type"
                      required
                      icon={CalendarPlus}
                    >

                      <select
                        value={appointmentType}
                        onChange={(e) =>
                          setAppointmentType(
                            e.target.value
                          )
                        }
                        className={inputClass}
                      >

                        <option value="">
                          Select Appointment Type
                        </option>

                        {appointmentTypes.map(
                          (item) => (
                            <option
                              key={item._id}
                              value={item._id}
                            >
                              {item.name}
                            </option>
                          )
                        )}

                      </select>

                    </FormField>

                    {/* LAWYER */}

                    <FormField
                      label="Lawyer"
                      required
                      icon={Scale}
                    >

                      <select
                        value={lawyer}
                        onChange={(e) =>
                          setLawyer(
                            e.target.value
                          )
                        }
                        className={inputClass}
                      >

                        <option value="">
                          Select Lawyer
                        </option>

                        {lawyers.map(
                          (employee) => (
                            <option
                              key={employee._id}
                              value={employee._id}
                            >
                              {employee.employeeCode}
                              {" - "}
                              {employee.name}
                              {" (Lawyer)"}
                            </option>
                          )
                        )}

                      </select>

                      {lawyers.length === 0 && (
                        <p className="mt-1.5 text-[10px] text-amber-600">
                          No active employees with Lawyer designation found.
                        </p>
                      )}

                    </FormField>

                    {/* CLIENT */}

                    <FormField
                      label="Client"
                      required
                      icon={UsersRound}
                    >

                      <select
                        value={client}
                        onChange={(e) =>
                          setClient(
                            e.target.value
                          )
                        }
                        className={inputClass}
                      >

                        <option value="">
                          Select Client
                        </option>

                        {clients.map(
                          (item) => (
                            <option
                              key={item._id}
                              value={item._id}
                            >
                              {item.clientCode}
                              {" - "}
                              {item.name}
                            </option>
                          )
                        )}

                      </select>

                      {clients.length === 0 && (
                        <p className="mt-1.5 text-[10px] text-amber-600">
                          No active clients are currently available.
                        </p>
                      )}

                    </FormField>

                    {/* DATE */}

                    <FormField
                      label="Date"
                      required
                      icon={CalendarDays}
                    >

                      <input
                        type="date"
                        value={date}
                        onChange={(e) =>
                          setDate(
                            e.target.value
                          )
                        }
                        className={inputClass}
                      />

                    </FormField>

                    {/* TIME */}

                    <div>

                      <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">

                        <Clock3
                          size={12}
                          className="text-[#b1843d]"
                        />

                        Appointment Time

                        <span className="text-red-500">
                          *
                        </span>

                      </label>

                      <div className="grid grid-cols-2 gap-2">

                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) =>
                            setStartTime(
                              e.target.value
                            )
                          }
                          className={inputClass}
                          aria-label="Start Time"
                        />

                        <input
                          type="time"
                          value={endTime}
                          min={
                            startTime ||
                            undefined
                          }
                          onChange={(e) =>
                            setEndTime(
                              e.target.value
                            )
                          }
                          className={inputClass}
                          aria-label="End Time"
                        />

                      </div>

                      <div className="mt-1 flex justify-between text-[9px] text-slate-400">
                        <span>Start Time</span>
                        <span>End Time</span>
                      </div>

                    </div>

                    {/* DESCRIPTION */}

                    <div className="lg:col-span-2">

                      <FormField
                        label="Description"
                        icon={FileText}
                      >

                        <textarea
                          value={description}
                          onChange={(e) =>
                            setDescription(
                              e.target.value
                            )
                          }
                          rows={2}
                          placeholder="Enter a short appointment description..."
                          className={`${textareaClass} resize-none`}
                        />

                      </FormField>

                    </div>

                    {/* APPOINTMENT DETAILS */}

                    <div className="lg:col-span-2">

                      <FormField
                        label="Appointment Details"
                        icon={ClipboardList}
                      >

                        <textarea
                          value={appointmentDetails}
                          onChange={(e) =>
                            setAppointmentDetails(
                              e.target.value
                            )
                          }
                          rows={3}
                          placeholder="Enter additional appointment details..."
                          className={`${textareaClass} resize-none`}
                        />

                      </FormField>

                    </div>

                  </div>

                </>
              )}

            </div>

            {/* =================================================
                FOOTER
            ================================================= */}

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-[#fafbfc] px-5 py-4 sm:flex-row sm:items-center sm:justify-end">

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  router.push(
                    "/cases-appointments/appointments"
                  )
                }
                className="h-10 rounded-lg border border-slate-200 bg-white px-5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  saving ||
                  loadingOptions
                }
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0b2945] px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#071f34] disabled:cursor-not-allowed disabled:opacity-60"
              >

                {saving ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <Save
                    size={14}
                    className="text-[#d6ad66]"
                  />
                )}

                {saving
                  ? "Saving..."
                  : "Save Appointment"}

              </button>

            </div>

          </form>

        </section>

      </div>
    </AdminLayout>
  );
}

// =====================================================
// Styles
// =====================================================

const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-[#17324d] outline-none transition placeholder:text-slate-400 focus:border-[#c6a364] focus:ring-2 focus:ring-[#c6a364]/10";

const textareaClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-[#17324d] outline-none transition placeholder:text-slate-400 focus:border-[#c6a364] focus:ring-2 focus:ring-[#c6a364]/10";

// =====================================================
// Form Field
// =====================================================

function FormField({
  label,
  required = false,
  icon: Icon,
  children,
}: {
  label: string;
  required?: boolean;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div>

      <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">

        {Icon && (
          <Icon
            size={12}
            className="text-[#b1843d]"
          />
        )}

        {label}

        {required && (
          <span className="text-red-500">
            *
          </span>
        )}

      </label>

      {children}

    </div>
  );
}