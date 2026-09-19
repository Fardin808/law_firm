"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Save, ArrowLeft, Pencil } from "lucide-react";
import { toast } from "sonner";

import AdminLayout from "@/components/layout/AdminLayout";

type Parameter = {
  _id: string;
  category: string;
  name: string;
  isActive: boolean;

  parentParameter?: {
    _id: string;
    name: string;
    category: string;
    isActive: boolean;
  } | null;
};

const categoryLabels: Record<string, string> = {
  "account-head": "Account Head",
  "account-type": "Account Type",
  "bank-operator": "Bank Operator",
  "leave-type": "Leave Type",
  department: "Department",
  designation: "Designation",
  "appointment-type": "Appointment Type",
  religion: "Religion",
  gender: "Gender",
  "marital-status": "Marital Status",
  nationality: "Nationality",
};

export default function EditParameterPage() {
  const router = useRouter();
  const params = useParams();

  const category = params.category as string;
  const id = params.id as string;

  const label = categoryLabels[category] || "Parameter";
  const isBankOperator = category === "bank-operator";

  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Bank Operator Account Type
  const [parentParameter, setParentParameter] = useState("");
  const [currentParentName, setCurrentParentName] = useState("");

  const [accountTypes, setAccountTypes] = useState<Parameter[]>([]);
  const [accountTypesLoading, setAccountTypesLoading] = useState(false);

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  // ---------------------------------------
  // GET JWT TOKEN
  // ---------------------------------------

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      sessionStorage.getItem("token")
    );
  };

  // ---------------------------------------
  // LOAD EXISTING PARAMETER
  // ---------------------------------------

  useEffect(() => {
    const fetchParameter = async () => {
      const token = getToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        setPageLoading(true);
        setError("");

        const response = await fetch(
          `http://localhost:5000/api/parameters/${category}/${id}`,
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
            data.message || `Failed to load ${label}.`
          );
        }

        const parameter: Parameter = data.parameter;

        setName(parameter.name || "");
        setIsActive(parameter.isActive !== false);

        // Bank Operator parent Account Type
        if (
          isBankOperator &&
          parameter.parentParameter
        ) {
          setParentParameter(
            parameter.parentParameter._id
          );

          setCurrentParentName(
            parameter.parentParameter.name
          );
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : `Unable to load ${label}.`;

        setError(message);
        toast.error(message);
      } finally {
        setPageLoading(false);
      }
    };

    if (category && id) {
      fetchParameter();
    }
  }, [
    category,
    id,
    router,
    isBankOperator,
    label,
  ]);

  // ---------------------------------------
  // LOAD ACTIVE ACCOUNT TYPES
  // ---------------------------------------

  useEffect(() => {
    if (!isBankOperator) return;

    const fetchAccountTypes = async () => {
      const token = getToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        setAccountTypesLoading(true);

        const response = await fetch(
          "http://localhost:5000/api/parameters/account-type?active=true",
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
              "Failed to load Account Types."
          );
        }

        setAccountTypes(data.parameters || []);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to load Account Types.";

        setError(message);
        toast.error(message);
      } finally {
        setAccountTypesLoading(false);
      }
    };

    fetchAccountTypes();
  }, [isBankOperator, router]);

  // ---------------------------------------
  // UPDATE PARAMETER
  // ---------------------------------------

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");

    // Form validation
    if (!name.trim()) {
      setError(`${label} name is required.`);
      return;
    }

    if (isBankOperator && !parentParameter) {
      setError(
        "Account Type is required for Bank Operator."
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

      const body: {
        name: string;
        isActive: boolean;
        parentParameter?: string;
      } = {
        name: name.trim(),
        isActive,
      };

      if (isBankOperator) {
        body.parentParameter = parentParameter;
      }

      const response = await fetch(
        `http://localhost:5000/api/parameters/${category}/${id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");

        router.push("/login");
        return;
      }

      // Backend/API error
      if (!response.ok) {
        const message =
          data.message ||
          `Failed to update ${label}.`;

        setError(message);
        toast.error(message);

        return;
      }

      // Success
      toast.success(
        `${label} updated successfully.`
      );

      router.replace(
        `/parameters?category=${category}`
      );
    } catch {
      const message =
        "Unable to connect to the server.";

      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------
  // PAGE LOADING
  // ---------------------------------------

  if (pageLoading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#b1843d]" />

            <p className="mt-3 text-sm text-slate-400">
              Loading {label.toLowerCase()}...
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
                `/parameters?category=${category}`
              )
            }
            className="mb-4 flex items-center gap-2 text-xs font-medium text-slate-400 transition hover:text-[#a97828]"
          >
            <ArrowLeft size={14} />
            Back to {label} List
          </button>

          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b1843d]">
            System Configuration
          </p>

          <h1 className="mt-1 font-serif text-[32px] font-semibold text-[#102a43]">
            Edit {label}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Update the information for this{" "}
            {label.toLowerCase()}.
          </p>
        </div>

        {/* FORM CARD */}
        <section className="max-w-[900px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* CARD HEADER */}
          <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#fbf3e5] text-[#b1843d]">
              <Pencil size={18} />
            </div>

            <div>
              <h2 className="font-serif text-[19px] font-semibold text-[#17324d]">
                {label} Information
              </h2>

              <p className="mt-0.5 text-xs text-slate-400">
                Modify the information below and save
                your changes.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6 p-6 md:p-7">
              {/* STATUS */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#17324d]">
                  Status
                </label>

                <button
                  type="button"
                  onClick={() =>
                    setIsActive(
                      (current) => !current
                    )
                  }
                  className="flex items-center gap-3"
                >
                  <div
                    className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
                      isActive
                        ? "bg-[#0b2945]"
                        : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200 ${
                        isActive
                          ? "left-6"
                          : "left-1"
                      }`}
                    />
                  </div>

                  <div className="text-left">
                    <p
                      className={`text-sm font-medium ${
                        isActive
                          ? "text-emerald-700"
                          : "text-slate-500"
                      }`}
                    >
                      {isActive
                        ? "Active"
                        : "Inactive"}
                    </p>

                    <p className="text-[11px] text-slate-400">
                      {isActive
                        ? "This record is currently available throughout the system."
                        : "This record is currently unavailable for use."}
                    </p>
                  </div>
                </button>
              </div>

              <div className="h-px bg-slate-100" />

              {/* BANK OPERATOR ACCOUNT TYPE */}
              {isBankOperator && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#17324d]">
                    Account Type
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <p className="mb-2 text-[11px] text-slate-400">
                    Select the account type associated
                    with this bank operator.
                  </p>

                  <select
                    required
                    value={parentParameter}
                    onChange={(e) => {
                      setParentParameter(
                        e.target.value
                      );

                      if (error) {
                        setError("");
                      }
                    }}
                    disabled={accountTypesLoading}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-[#fafbfc] px-4 text-sm text-[#17324d] outline-none transition focus:border-[#c6a364] focus:bg-white focus:ring-2 focus:ring-[#c6a364]/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">
                      {accountTypesLoading
                        ? "Loading Account Types..."
                        : "Select Account Type"}
                    </option>

                    {/* Keep current parent available even if inactive */}
                    {parentParameter &&
                      currentParentName &&
                      !accountTypes.some(
                        (item) =>
                          item._id ===
                          parentParameter
                      ) && (
                        <option
                          value={parentParameter}
                        >
                          {currentParentName} (Current)
                        </option>
                      )}

                    {accountTypes.map((item) => (
                      <option
                        key={item._id}
                        value={item._id}
                      >
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* NAME */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#17324d]">
                  {label} Name
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <p className="mb-2 text-[11px] text-slate-400">
                  Update the record name if required.
                </p>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);

                    if (error) {
                      setError("");
                    }
                  }}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-[#fafbfc] px-4 text-sm text-[#17324d] outline-none transition focus:border-[#c6a364] focus:bg-white focus:ring-2 focus:ring-[#c6a364]/10"
                />
              </div>

              {/* INLINE ERROR */}
              {error && (
                <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>

            {/* ACTIONS */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-[#fafbfc] px-6 py-4">
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  router.push(
                    `/parameters?category=${category}`
                  )
                }
                className="h-10 rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  saving ||
                  accountTypesLoading
                }
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