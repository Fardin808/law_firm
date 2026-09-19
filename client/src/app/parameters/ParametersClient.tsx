"use client";

import { API_BASE_URL } from "@/lib/api";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import AdminLayout from "@/components/layout/AdminLayout";

import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Database,
  Tag,
  Landmark,
  CalendarDays,
  Users,
  Award,
  CalendarCheck,
  CircleUserRound,
  VenusAndMars,
  Heart,
  Globe2,
  SlidersHorizontal,
  ChevronRight,
  X,
  AlertTriangle,
} from "lucide-react";

// =====================================================
// Types
// =====================================================

type ParentParameter = {
  _id: string;
  name: string;
  category: string;
  isActive: boolean;
};

type Parameter = {
  _id: string;
  category: string;
  name: string;
  isActive: boolean;
  parentParameter?: ParentParameter | null;
};

// =====================================================
// Parameter Categories
// =====================================================

const parameterCategories = [
  {
    label: "Account Head",
    value: "account-head",
    icon: Database,
  },
  {
    label: "Account Type",
    value: "account-type",
    icon: Tag,
  },
  {
    label: "Bank Operator",
    value: "bank-operator",
    icon: Landmark,
  },
  {
    label: "Leave Type",
    value: "leave-type",
    icon: CalendarDays,
  },
  {
    label: "Department",
    value: "department",
    icon: Users,
  },
  {
    label: "Designation",
    value: "designation",
    icon: Award,
  },
  {
    label: "Appointment Type",
    value: "appointment-type",
    icon: CalendarCheck,
  },
  {
    label: "Religion",
    value: "religion",
    icon: CircleUserRound,
  },
  {
    label: "Gender",
    value: "gender",
    icon: VenusAndMars,
  },
  {
    label: "Marital Status",
    value: "marital-status",
    icon: Heart,
  },
  {
    label: "Nationalities",
    value: "nationality",
    icon: Globe2,
  },
];

// =====================================================
// Page
// =====================================================

export default function ParametersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const categoryFromUrl = searchParams.get("category");

  const selectedCategory = parameterCategories.some(
    (item) => item.value === categoryFromUrl
  )
    ? categoryFromUrl!
    : "account-head";

  const isBankOperator =
    selectedCategory === "bank-operator";

  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Delete modal states
  const [deleteTarget, setDeleteTarget] =
    useState<Parameter | null>(null);

  const [deleting, setDeleting] = useState(false);

  const currentCategory = parameterCategories.find(
    (item) => item.value === selectedCategory
  );

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
  // Fetch Parameters
  // =====================================================

  const fetchParameters = async () => {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/parameters/${selectedCategory}`,
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
          data.message || "Failed to load parameters."
        );
      }

      setParameters(data.parameters || []);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to load parameters.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParameters();
  }, [selectedCategory]);

  // =====================================================
  // Category Change
  // =====================================================

  const handleCategoryChange = (category: string) => {
    setSearchTerm("");

    router.push(
      `/parameters?category=${category}`
    );
  };

  // =====================================================
  // Open Delete Confirmation
  // =====================================================

  const handleDeleteClick = (
    parameter: Parameter
  ) => {
    setDeleteTarget(parameter);
  };

  // =====================================================
  // Close Delete Confirmation
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
        `${API_BASE_URL}/api/parameters/${selectedCategory}/${deleteTarget._id}`,
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
        const message =
          data.message ||
          `Failed to delete ${currentCategory?.label || "parameter"}.`;

        toast.error(message);
        return;
      }

      const deletedName = deleteTarget.name;

      // Close modal
      setDeleteTarget(null);

      // Refresh table
      await fetchParameters();

      // In-app success notification
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
  // Frontend Search
  // =====================================================

  const filteredParameters = useMemo(() => {
    const query = searchTerm
      .trim()
      .toLowerCase();

    if (!query) {
      return parameters;
    }

    return parameters.filter((parameter) => {
      const name =
        parameter.name?.toLowerCase() || "";

      const parent =
        parameter.parentParameter?.name?.toLowerCase() ||
        "";

      return (
        name.includes(query) ||
        parent.includes(query)
      );
    });
  }, [parameters, searchTerm]);

  const tableColumnCount =
    isBankOperator ? 5 : 4;

  // =====================================================
  // UI
  // =====================================================

  return (
    <AdminLayout>
      <div className="text-[#17324d]">
        {/* PAGE HEADER */}
        <div className="mb-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b1843d]">
                System Configuration
              </p>

              <h1 className="mt-1 font-serif text-[34px] font-semibold leading-tight text-[#102a43]">
                Parameters
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage system configuration and
                reference data for your law firm.
              </p>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Home</span>

              <ChevronRight size={13} />

              <span>Parameters</span>

              <ChevronRight size={13} />

              <span className="font-medium text-[#17324d]">
                {currentCategory?.label}
              </span>
            </div>
          </div>
        </div>

        {/* CATEGORY NAVIGATION */}
        <section className="mb-5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-wrap gap-1">
            {parameterCategories.map((category) => {
              const active =
                selectedCategory === category.value;

              const Icon = category.icon;

              return (
                <button
                  key={category.value}
                  type="button"
                  onClick={() =>
                    handleCategoryChange(
                      category.value
                    )
                  }
                  className={`
                    group relative flex items-center gap-2
                    rounded-lg px-3.5 py-3
                    text-[12px] font-medium
                    transition-all duration-200
                    ${
                      active
                        ? "bg-[#fbf7ef] text-[#17324d]"
                        : "text-slate-500 hover:bg-slate-50 hover:text-[#17324d]"
                    }
                  `}
                >
                  <Icon
                    size={17}
                    strokeWidth={1.7}
                    className={
                      active
                        ? "text-[#b1843d]"
                        : "text-slate-400 transition group-hover:text-[#b1843d]"
                    }
                  />

                  <span>{category.label}</span>

                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-[#c79543]" />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* MAIN CARD */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Card Heading */}
          <div className="border-b border-slate-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fbf3e5] text-[#b1843d]">
                <SlidersHorizontal
                  size={18}
                  strokeWidth={1.8}
                />
              </div>

              <div>
                <h2 className="font-serif text-[20px] font-semibold text-[#17324d]">
                  {currentCategory?.label}
                </h2>

                <p className="mt-0.5 text-xs text-slate-400">
                  Manage{" "}
                  {currentCategory?.label.toLowerCase()}{" "}
                  records
                </p>
              </div>
            </div>
          </div>

          {/* TOOLBAR */}
          <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative w-full sm:max-w-[390px]">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
                placeholder={`Search ${currentCategory?.label.toLowerCase()}...`}
                className="h-11 w-full rounded-lg border border-slate-200 bg-[#fafbfc] pl-10 pr-4 text-sm text-[#17324d] outline-none transition-all placeholder:text-slate-400 focus:border-[#c6a364] focus:bg-white focus:ring-2 focus:ring-[#c6a364]/10"
              />
            </div>

            {/* Add */}
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/parameters/${selectedCategory}/new`
                )
              }
              className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#0b2945] px-5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#071e34] hover:shadow-md"
            >
              <Plus
                size={17}
                className="text-[#d6ad66]"
              />

              New {currentCategory?.label}
            </button>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mx-6 mt-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* TABLE SECTION */}
          <div className="p-6">
            <div className="overflow-hidden rounded-lg border border-slate-200">
              {/* Table Heading */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
                <h3 className="font-serif text-[16px] font-semibold text-[#17324d]">
                  {currentCategory?.label} List
                </h3>

                {!loading && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-500">
                    {filteredParameters.length}{" "}
                    {filteredParameters.length === 1
                      ? "record"
                      : "records"}
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-[#f8fafb]">
                      <th className="w-[90px] px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        SL
                      </th>

                      {isBankOperator && (
                        <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Type
                        </th>
                      )}

                      <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Name
                      </th>

                      <th className="w-[170px] px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>

                      <th className="w-[150px] px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={tableColumnCount}
                          className="px-5 py-14 text-center"
                        >
                          <div className="flex flex-col items-center">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-[#b1843d]" />

                            <p className="mt-3 text-xs text-slate-400">
                              Loading records...
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : filteredParameters.length === 0 ? (
                      <tr>
                        <td
                          colSpan={tableColumnCount}
                          className="px-5 py-14 text-center"
                        >
                          <Database
                            size={30}
                            strokeWidth={1.4}
                            className="mx-auto text-slate-300"
                          />

                          <p className="mt-3 text-sm font-medium text-slate-600">
                            {searchTerm
                              ? "No matching records found"
                              : `No ${currentCategory?.label} found`}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {searchTerm
                              ? "Try using a different search term."
                              : "Create a new record to get started."}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredParameters.map(
                        (parameter, index) => (
                          <tr
                            key={parameter._id}
                            className="transition-colors duration-150 hover:bg-[#fdfbf7]"
                          >
                            {/* SL */}
                            <td className="px-5 py-4 text-sm text-slate-500">
                              {String(
                                index + 1
                              ).padStart(2, "0")}
                            </td>

                            {/* BANK OPERATOR TYPE */}
                            {isBankOperator && (
                              <td className="px-5 py-4">
                                {parameter
                                  .parentParameter
                                  ?.name ? (
                                  <span className="text-sm text-slate-600">
                                    {
                                      parameter
                                        .parentParameter
                                        .name
                                    }
                                  </span>
                                ) : (
                                  <span className="text-xs italic text-slate-400">
                                    Not Assigned
                                  </span>
                                )}
                              </td>
                            )}

                            {/* NAME */}
                            <td className="px-5 py-4">
                              <p className="font-medium text-[#17324d]">
                                {parameter.name}
                              </p>
                            </td>

                            {/* STATUS */}
                            <td className="px-5 py-4">
                              {parameter.isActive ? (
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
                                {/* Edit */}
                                <button
                                  type="button"
                                  title="Edit"
                                  aria-label={`Edit ${parameter.name}`}
                                  onClick={() =>
                                    router.push(
                                      `/parameters/${selectedCategory}/${parameter._id}/edit`
                                    )
                                  }
                                  className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600 transition hover:bg-blue-100 hover:text-blue-700"
                                >
                                  <Pencil size={15} />
                                </button>

                                {/* Delete */}
                                <button
                                  type="button"
                                  title="Delete"
                                  aria-label={`Delete ${parameter.name}`}
                                  onClick={() =>
                                    handleDeleteClick(
                                      parameter
                                    )
                                  }
                                  className="flex h-8 w-8 items-center justify-center rounded-md bg-red-50 text-red-500 transition hover:bg-red-100 hover:text-red-600"
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

            {/* TABLE FOOTER */}
            {!loading &&
              filteredParameters.length > 0 && (
                <div className="mt-4 flex flex-col gap-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    Showing{" "}
                    <span className="font-medium text-slate-600">
                      1
                    </span>{" "}
                    to{" "}
                    <span className="font-medium text-slate-600">
                      {filteredParameters.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-slate-600">
                      {filteredParameters.length}
                    </span>{" "}
                    results
                  </p>

                  <p>{currentCategory?.label}</p>
                </div>
              )}
          </div>
        </section>
      </div>

      {/* =====================================================
          DELETE CONFIRMATION MODAL
      ===================================================== */}

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
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
                  <AlertTriangle size={20} />
                </div>

                <div>
                  <h2 className="font-serif text-[20px] font-semibold text-[#17324d]">
                    Delete{" "}
                    {currentCategory?.label ||
                      "Parameter"}
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

            {/* Modal Body */}
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
                  This record will be permanently
                  removed. This action cannot be
                  undone.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
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
