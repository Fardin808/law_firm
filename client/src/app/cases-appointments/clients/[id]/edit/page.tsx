"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import AdminLayout from "@/components/layout/AdminLayout";

import {
  ArrowLeft,
  Save,
  UserRoundPen,
  ChevronRight,
  UserRound,
  Phone,
  Mail,
  BadgeCheck,
} from "lucide-react";

// =====================================================
// Types
// =====================================================

type Client = {
  _id: string;
  clientCode: string;
  name: string;
  phone: string;
  email: string;
  isInactive: boolean;
};

// =====================================================
// Page
// =====================================================

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();

  const clientId = params.id as string;

  // =====================================================
  // Form State
  // =====================================================

  const [clientCode, setClientCode] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isInactive, setIsInactive] = useState(false);

  // =====================================================
  // UI State
  // =====================================================

  const [loading, setLoading] = useState(true);
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
  // Load Client
  // =====================================================

  useEffect(() => {
    if (!clientId) {
      return;
    }

    const fetchClient = async () => {
      const token = getToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `http://localhost:5000/api/clients/${clientId}`,
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
            data.message || "Failed to load client."
          );
        }

        const client: Client = data.client;

        setClientCode(client.clientCode || "");
        setName(client.name || "");
        setPhone(client.phone || "");
        setEmail(client.email || "");
        setIsInactive(Boolean(client.isInactive));
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to load client.";

        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [clientId, router]);

  // =====================================================
  // Update Client
  // =====================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    if (!name.trim()) {
      setError("Client name is required.");
      return;
    }

    if (!phone.trim()) {
      setError("Phone number is required.");
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
        `http://localhost:5000/api/clients/${clientId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
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
          data.message || "Failed to update client.";

        setError(message);
        toast.error(message);
        return;
      }

      toast.success("Client updated successfully.");

      router.push("/cases-appointments/clients");
      router.refresh();
    } catch {
      const message = "Unable to connect to the server.";

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
              Loading client information...
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
              Edit Client
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Update client information and account status.
            </p>
          </div>

          {/* Breadcrumb */}

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Clients</span>

            <ChevronRight size={13} />

            <span className="max-w-[180px] truncate font-medium text-[#17324d]">
              {clientCode || "Edit Client"}
            </span>
          </div>

        </div>

        {/* =================================================
            BACK BUTTON
        ================================================= */}

        <div className="mb-4">
          <button
            type="button"
            onClick={() =>
              router.push("/cases-appointments/clients")
            }
            className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-[#d8c29c] hover:bg-[#fbf8f2] hover:text-[#17324d]"
          >
            <ArrowLeft size={14} />
            Back to Clients
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
                <UserRoundPen size={17} />
              </div>

              <div>
                <h2 className="font-serif text-lg font-semibold text-[#17324d]">
                  Client Information
                </h2>

                <p className="mt-0.5 text-[10px] text-slate-400">
                  Update information for {clientCode || "this client"}.
                </p>
              </div>
            </div>

            <div className="hidden rounded-full border border-[#eadbbf] bg-[#fbf7ef] px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#9a6b20] sm:block">
              Edit Record
            </div>

          </div>

          {/* =================================================
              FORM
          ================================================= */}

          <form onSubmit={handleSubmit}>

            <div className="p-5">

              {/* Error */}

              {error && (
                <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-2.5 text-xs text-red-600">
                  {error}
                </div>
              )}

              {/* =================================================
                  STATUS
              ================================================= */}

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
                      Client Status
                    </p>

                    <p className="mt-0.5 text-[10px] text-slate-400">
                      Set whether this client is currently active or inactive.
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
                    {isInactive ? "Inactive" : "Active"}
                  </span>

                  <span className="relative inline-flex">

                    <input
                      type="checkbox"
                      checked={isInactive}
                      onChange={(e) =>
                        setIsInactive(e.target.checked)
                      }
                      className="peer sr-only"
                    />

                    <span className="h-6 w-11 rounded-full bg-emerald-500 transition peer-checked:bg-slate-300" />

                    <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />

                  </span>

                </label>

              </div>

              {/* =================================================
                  FORM GRID
              ================================================= */}

              <div className="grid grid-cols-1 gap-x-5 gap-y-4 lg:grid-cols-2">

                {/* CLIENT ID */}

                <FormField
                  label="Client ID"
                  icon={UserRound}
                >
                  <input
                    type="text"
                    value={clientCode}
                    readOnly
                    className={readOnlyClass}
                  />
                </FormField>

                {/* CLIENT NAME */}

                <FormField
                  label="Client Name"
                  required
                  icon={UserRound}
                >
                  <input
                    type="text"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    placeholder="Enter client name"
                    className={inputClass}
                  />
                </FormField>

                {/* PHONE */}

                <FormField
                  label="Phone"
                  required
                  icon={Phone}
                >
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value)
                    }
                    placeholder="Enter phone number"
                    className={inputClass}
                  />
                </FormField>

                {/* EMAIL */}

                <FormField
                  label="Email"
                  icon={Mail}
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="Enter email address"
                    className={inputClass}
                  />
                </FormField>

              </div>

            </div>

            {/* =================================================
                FOOTER
            ================================================= */}

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-[#fafbfc] px-5 py-4 sm:flex-row sm:items-center sm:justify-end">

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  router.push("/cases-appointments/clients")
                }
                className="h-10 rounded-lg border border-slate-200 bg-white px-5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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

                {saving ? "Updating..." : "Update Client"}
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