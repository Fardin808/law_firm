"use client";

import { API_BASE_URL } from "@/lib/api";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import AdminLayout from "@/components/layout/AdminLayout";

import {
  ArrowLeft,
  Save,
  Pencil,
  ChevronRight,
  BriefcaseBusiness,
  CalendarDays,
  UserRound,
  UsersRound,
  WalletCards,
  FileText,
  CircleDollarSign,
} from "lucide-react";

// =====================================================
// Types
// =====================================================

type Lawyer = {
  _id: string;
  employeeCode?: string;
  name: string;
};

type Client = {
  _id: string;
  clientCode?: string;
  name: string;
};

type Appointment = {
  _id: string;
  appointmentCode: string;
  title?: string;
  lawyer?: Lawyer | null;
  client?: Client | null;
};

type CaseData = {
  _id: string;
  caseCode: string;
  appointment: Appointment | string;
  title: string;
  description?: string;
  totalCharge: number;
  payment: number;
  due: number;
  isInactive: boolean;
};

// =====================================================
// Page
// =====================================================

export default function EditCasePage() {
  const router = useRouter();
  const params = useParams();

  const caseId = params.id as string;

  // =====================================================
  // Form
  // =====================================================

  const [caseCode, setCaseCode] = useState("");
  const [appointment, setAppointment] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [totalCharge, setTotalCharge] = useState("");
  const [payment, setPayment] = useState("");
  const [isInactive, setIsInactive] = useState(false);

  // =====================================================
  // Appointment Options
  // =====================================================

  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // =====================================================
  // UI
  // =====================================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // Selected Appointment
  // =====================================================

  const selectedAppointment =
    appointments.find((item) => item._id === appointment) || null;

  // =====================================================
  // Due Calculation
  // =====================================================

  const chargeNumber = Number(totalCharge) || 0;
  const paymentNumber = Number(payment) || 0;

  const calculatedDue = Math.max(
    chargeNumber - paymentNumber,
    0
  );

  // =====================================================
  // Auth
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
  // Load
  // =====================================================

  useEffect(() => {
    if (!caseId) {
      return;
    }

    const loadCase = async () => {
      const token = getToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        // =================================================
        // Current Case
        // =================================================

        const caseResponse = await fetch(
          `${API_BASE_URL}/api/cases/${caseId}`,
          {
            headers,
            cache: "no-store",
          }
        );

        const caseData = await caseResponse.json();

        if (caseResponse.status === 401) {
          handleUnauthorized();
          return;
        }

        if (!caseResponse.ok) {
          throw new Error(
            caseData.message || "Failed to load Case."
          );
        }

        const currentCase: CaseData = caseData.case;

        const currentAppointment =
          typeof currentCase.appointment === "string"
            ? null
            : currentCase.appointment;

        const currentAppointmentId =
          typeof currentCase.appointment === "string"
            ? currentCase.appointment
            : currentCase.appointment?._id || "";

        // =================================================
        // Available Appointments
        // =================================================

        const availableResponse = await fetch(
          `${API_BASE_URL}/api/cases/available-appointments`,
          {
            headers,
            cache: "no-store",
          }
        );

        const availableData = await availableResponse.json();

        if (availableResponse.status === 401) {
          handleUnauthorized();
          return;
        }

        if (!availableResponse.ok) {
          throw new Error(
            availableData.message ||
              "Failed to load Appointment options."
          );
        }

        const availableAppointments: Appointment[] =
          availableData.appointments || [];

        // Current appointment is already attached to this case,
        // therefore available-appointments may not return it.
        const combined = currentAppointment
          ? [
              currentAppointment,
              ...availableAppointments.filter(
                (item) => item._id !== currentAppointment._id
              ),
            ]
          : availableAppointments;

        setAppointments(combined);

        // =================================================
        // Populate Form
        // =================================================

        setCaseCode(currentCase.caseCode || "");
        setAppointment(currentAppointmentId);
        setTitle(currentCase.title || "");
        setDescription(currentCase.description || "");

        setTotalCharge(
          String(currentCase.totalCharge ?? 0)
        );

        setPayment(
          String(currentCase.payment ?? 0)
        );

        setIsInactive(
          Boolean(currentCase.isInactive)
        );
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to load Case.";

        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadCase();
  }, [caseId, router]);

  // =====================================================
  // Submit
  // =====================================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");

    if (!appointment) {
      setError("Please select an Appointment.");
      return;
    }

    if (!title.trim()) {
      setError("Case title is required.");
      return;
    }

    const charge = Number(totalCharge);
    const paid = Number(payment);

    if (
      totalCharge === "" ||
      Number.isNaN(charge) ||
      charge < 0
    ) {
      setError(
        "Please enter a valid Total Charge."
      );
      return;
    }

    if (
      payment === "" ||
      Number.isNaN(paid) ||
      paid < 0
    ) {
      setError(
        "Please enter a valid Payment amount."
      );
      return;
    }

    if (paid > charge) {
      setError(
        "Payment cannot be greater than Total Charge."
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
        `${API_BASE_URL}/api/cases/${caseId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            appointment,
            title: title.trim(),
            description: description.trim(),
            totalCharge: charge,
            payment: paid,
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
          "Failed to update Case.";

        setError(message);
        toast.error(message);
        return;
      }

      toast.success(
        "Case updated successfully."
      );

      router.push(
        "/cases-appointments/cases"
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
  // Loading
  // =====================================================

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[450px] items-center justify-center">

          <div className="text-center">

            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-[#b1843d]" />

            <p className="mt-3 text-xs text-slate-400">
              Loading case information...
            </p>

          </div>

        </div>
      </AdminLayout>
    );
  }

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
              Edit Case
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Update case information, payment and outstanding due.
            </p>

          </div>

          {/* Breadcrumb */}

          <div className="flex items-center gap-2 text-xs text-slate-400">

            <span>
              Cases
            </span>

            <ChevronRight size={13} />

            <span className="max-w-[180px] truncate font-medium text-[#17324d]">
              {caseCode || "Edit Case"}
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
                "/cases-appointments/cases"
              )
            }
            className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-[#d8c29c] hover:bg-[#fbf8f2] hover:text-[#17324d]"
          >
            <ArrowLeft size={14} />

            Back to Cases
          </button>

        </div>

        {/* =================================================
            FORM CARD
        ================================================= */}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          {/* CARD HEADER */}

          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fbf3e5] text-[#b1843d]">
                <Pencil size={16} />
              </div>

              <div>

                <h2 className="font-serif text-lg font-semibold text-[#17324d]">
                  Case Information
                </h2>

                <p className="mt-0.5 text-[10px] text-slate-400">
                  {caseCode || "Case record"}
                </p>

              </div>

            </div>

            <div className="hidden rounded-full border border-[#eadbbf] bg-[#fbf7ef] px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#9a6b20] sm:block">
              Edit Record
            </div>

          </div>

          <form onSubmit={handleSubmit}>

            <div className="p-5">

              {/* =========================================
                  ERROR
              ========================================= */}

              {error && (
                <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-2.5 text-xs text-red-600">
                  {error}
                </div>
              )}

              {/* =========================================
                  STATUS
              ========================================= */}

              <div className="mb-5 flex flex-col gap-3 rounded-lg border border-slate-200 bg-[#f8fafb] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <p className="text-xs font-semibold text-[#17324d]">
                    Case Status
                  </p>

                  <p className="mt-0.5 text-[10px] text-slate-400">
                    Set whether this case is currently active or inactive.
                  </p>

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

              {/* =========================================
                  FORM GRID
              ========================================= */}

              <div className="grid grid-cols-1 gap-x-5 gap-y-4 lg:grid-cols-2">

                {/* CASE CODE */}

                <FormField
                  label="Case Code"
                  icon={BriefcaseBusiness}
                >

                  <input
                    type="text"
                    value={caseCode}
                    readOnly
                    className={readOnlyClass}
                  />

                </FormField>

                {/* APPOINTMENT */}

                <FormField
                  label="Appointment"
                  required
                  icon={CalendarDays}
                >

                  <select
                    value={appointment}
                    onChange={(e) =>
                      setAppointment(
                        e.target.value
                      )
                    }
                    className={inputClass}
                  >

                    <option value="">
                      Select Appointment
                    </option>

                    {appointments.map(
                      (item) => (
                        <option
                          key={item._id}
                          value={item._id}
                        >
                          {item.appointmentCode}
                          {" - "}
                          {item.title ||
                            "Appointment"}
                        </option>
                      )
                    )}

                  </select>

                </FormField>

                {/* LAWYER */}

                <FormField
                  label="Lawyer"
                  icon={UserRound}
                >

                  <input
                    type="text"
                    value={
                      selectedAppointment
                        ?.lawyer?.name || ""
                    }
                    placeholder="Selected appointment lawyer"
                    readOnly
                    className={readOnlyClass}
                  />

                </FormField>

                {/* CLIENT */}

                <FormField
                  label="Client"
                  icon={UsersRound}
                >

                  <input
                    type="text"
                    value={
                      selectedAppointment
                        ?.client?.name || ""
                    }
                    placeholder="Selected appointment client"
                    readOnly
                    className={readOnlyClass}
                  />

                </FormField>

                {/* TITLE */}

                <FormField
                  label="Case Title"
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
                    placeholder="Enter case title"
                    className={inputClass}
                  />

                </FormField>

                {/* TOTAL CHARGE */}

                <FormField
                  label="Total Charge"
                  required
                  icon={CircleDollarSign}
                >

                  <div className="relative">

                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      ৳
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={totalCharge}
                      onChange={(e) =>
                        setTotalCharge(
                          e.target.value
                        )
                      }
                      placeholder="0.00"
                      className={`${inputClass} pl-8`}
                    />

                  </div>

                </FormField>

                {/* PAYMENT */}

                <FormField
                  label="Payment"
                  required
                  icon={WalletCards}
                >

                  <div className="relative">

                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      ৳
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={payment}
                      onChange={(e) =>
                        setPayment(
                          e.target.value
                        )
                      }
                      placeholder="0.00"
                      className={`${inputClass} pl-8`}
                    />

                  </div>

                  <p className="mt-1 text-[10px] text-slate-400">
                    Total amount already paid by the client.
                  </p>

                </FormField>

                {/* DUE */}

                <FormField
                  label="Outstanding Due"
                  icon={WalletCards}
                >

                  <div
                    className={`flex h-10 items-center rounded-lg border px-3 text-sm font-semibold ${
                      calculatedDue > 0
                        ? "border-red-100 bg-red-50 text-red-600"
                        : "border-emerald-100 bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    ৳{" "}
                    {calculatedDue.toLocaleString(
                      "en-BD"
                    )}
                  </div>

                  <p className="mt-1 text-[10px] text-slate-400">
                    Automatically calculated from Total Charge − Payment.
                  </p>

                </FormField>

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
                      rows={3}
                      placeholder="Enter case description..."
                      className={`${inputClass} resize-none py-2.5`}
                    />

                  </FormField>

                </div>

              </div>

            </div>

            {/* =========================================
                FOOTER
            ========================================= */}

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-[#fafbfc] px-5 py-4 sm:flex-row sm:items-center sm:justify-end">

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  router.push(
                    "/cases-appointments/cases"
                  )
                }
                className="h-10 rounded-lg border border-slate-200 bg-white px-5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
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
                  ? "Updating..."
                  : "Update Case"}

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

const readOnlyClass =
  "h-10 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-[#f4f6f8] px-3 text-xs font-medium text-slate-500 outline-none";

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