"use client";

import { API_BASE_URL } from "@/lib/api";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import AdminLayout from "@/components/layout/AdminLayout";
import CasesAppointmentsTabs from "@/components/cases-appointments/CasesAppointmentsTabs";

import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronRight,
  BriefcaseBusiness,
  Scale,
  UsersRound,
  UserRound,
  WalletCards,
  AlertTriangle,
  X,
  RotateCcw,
} from "lucide-react";

// =====================================================
// Types
// =====================================================

type Lawyer = {
  _id: string;
  employeeCode?: string;
  name: string;
  designation?: string;
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

  date?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
};

type CaseItem = {
  _id: string;
  caseCode: string;

  appointment?: Appointment | null;

  title: string;
  description?: string;

  totalCharge: number;
  payment: number;
  due: number;

  isInactive: boolean;

  createdAt?: string;
  updatedAt?: string;
};

// =====================================================
// Page
// =====================================================

export default function CasesPage() {
  const router = useRouter();

  const [cases, setCases] = useState<CaseItem[]>([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [limit, setLimit] = useState("10");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [deleteTarget, setDeleteTarget] =
    useState<CaseItem | null>(null);

  const [deleting, setDeleting] = useState(false);

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
  // Helpers
  // =====================================================

  const formatMoney = (
    amount: number | undefined
  ) => {
    const value = Number(amount) || 0;

    return `৳ ${value.toLocaleString("en-BD")}`;
  };

  const getInitials = (name?: string) => {
    if (!name) {
      return "--";
    }

    return name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) =>
        part.charAt(0).toUpperCase()
      )
      .join("");
  };

  // =====================================================
  // Fetch Cases
  // =====================================================

  const fetchCases = async () => {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.append(
          "caseCode",
          search.trim()
        );
      }

      if (status) {
        params.append("status", status);
      }

      params.append("limit", limit);

      const response = await fetch(
        `${API_BASE_URL}/api/cases?${params.toString()}`,
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
          data.message ||
            "Failed to load cases."
        );
      }

      setCases(data.cases || []);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to load cases.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // Initial / Filter Load
  // =====================================================

  useEffect(() => {
    fetchCases();
  }, [status, limit]);

  // =====================================================
  // Search
  // =====================================================

  const handleSearch = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    fetchCases();
  };

  const handleReset = () => {
    setSearch("");

    if (status) {
      setStatus("");
    } else {
      setTimeout(() => {
        fetchCases();
      }, 0);
    }
  };

  // =====================================================
  // Delete
  // =====================================================

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setDeleting(true);

      const response = await fetch(
        `${API_BASE_URL}/api/cases/${deleteTarget._id}`,
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
            "Failed to delete case."
        );

        return;
      }

      const deletedCaseCode =
        deleteTarget.caseCode;

      setDeleteTarget(null);

      await fetchCases();

      toast.success(
        `${deletedCaseCode} deleted successfully.`
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

        {/* =================================================
            HEADER + MODULE SWITCHER
        ================================================= */}

        <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(260px,1fr)_620px_minmax(260px,1fr)] xl:items-center">

          {/* LEFT */}

          <div className="min-w-0">

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b1843d]">
              Cases & Appointments
            </p>

            <h1 className="mt-1 font-serif text-[34px] font-semibold leading-tight tracking-[-0.02em] text-[#102a43]">
              Cases
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage registered cases, charges, payments and outstanding dues.
            </p>

          </div>

          {/* CENTER */}

          <div className="w-full">
            <CasesAppointmentsTabs />
          </div>

          {/* RIGHT */}

          <div className="flex items-center gap-2 text-xs text-slate-400 xl:justify-end">

            <span>
              Cases & Appointments
            </span>

            <ChevronRight size={13} />

            <span className="font-medium text-[#17324d]">
              Cases
            </span>

          </div>

        </div>

        {/* =================================================
            CASE DIRECTORY
        ================================================= */}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          {/* =================================================
              CARD HEADER
          ================================================= */}

          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fbf3e5] text-[#b1843d]">
                <BriefcaseBusiness size={17} />
              </div>

              <div>

                <h2 className="font-serif text-lg font-semibold text-[#17324d]">
                  Case Directory
                </h2>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  View and manage registered case records.
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/cases-appointments/cases/new"
                )
              }
              className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0b2945] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#071f34]"
            >
              <Plus
                size={15}
                className="text-[#d6ad66]"
              />

              New Case
            </button>

          </div>

          {/* =================================================
              FILTER BAR
          ================================================= */}

          <div className="border-b border-slate-100 bg-[#fcfcfd] px-5 py-4">

            <form
              onSubmit={handleSearch}
              className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(300px,1fr)_190px_130px_auto]"
            >

              {/* SEARCH */}

              <div className="flex gap-2">

                <div className="relative min-w-0 flex-1">

                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(e) =>
                      setSearch(
                        e.target.value
                      )
                    }
                    placeholder="Search by Case ID..."
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-[#17324d] outline-none transition placeholder:text-slate-400 focus:border-[#c6a364] focus:ring-2 focus:ring-[#c6a364]/10"
                  />

                </div>

                <button
                  type="submit"
                  className="h-10 rounded-lg bg-[#17324d] px-4 text-xs font-semibold text-white transition hover:bg-[#0b2945]"
                >
                  Search
                </button>

              </div>

              {/* STATUS */}

              <select
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value
                  )
                }
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs text-[#17324d] outline-none transition focus:border-[#c6a364]"
              >

                <option value="">
                  All Status
                </option>

                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>

              </select>

              {/* ROW LIMIT */}

              <select
                value={limit}
                onChange={(e) =>
                  setLimit(
                    e.target.value
                  )
                }
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs text-[#17324d] outline-none transition focus:border-[#c6a364]"
              >

                {[10, 20, 30, 40, 50].map(
                  (value) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {value} rows
                    </option>
                  )
                )}

              </select>

              {/* RESET */}

              {(search || status) && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-[#17324d]"
                >
                  <RotateCcw size={14} />

                  Reset
                </button>
              )}

            </form>

          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="mx-5 mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-2.5 text-xs text-red-600">
              {error}
            </div>
          )}

          {/* =================================================
              TABLE
          ================================================= */}

          <div className="p-4">

            <div className="w-full overflow-hidden rounded-lg border border-slate-200">

              <table className="w-full table-fixed border-collapse">

                <colgroup>
                  <col className="w-[4%]" />
                  <col className="w-[10%]" />
                  <col className="w-[10%]" />
                  <col className="w-[12%]" />
                  <col className="w-[12%]" />
                  <col className="w-[14%]" />
                  <col className="w-[9%]" />
                  <col className="w-[9%]" />
                  <col className="w-[8%]" />
                  <col className="w-[7%]" />
                  <col className="w-[5%]" />
                </colgroup>

                <thead className="bg-[#f8fafb]">

                  <tr>

                    <TableHead>
                      SL
                    </TableHead>

                    <TableHead>
                      Case Code
                    </TableHead>

                    <TableHead>
                      Appointment
                    </TableHead>

                    <TableHead>
                      Lawyer
                    </TableHead>

                    <TableHead>
                      Client
                    </TableHead>

                    <TableHead>
                      Title
                    </TableHead>

                    <TableHead>
                      Charge
                    </TableHead>

                    <TableHead>
                      Payment
                    </TableHead>

                    <TableHead>
                      Due
                    </TableHead>

                    <TableHead center>
                      Status
                    </TableHead>

                    <TableHead center>
                      Action
                    </TableHead>

                  </tr>

                </thead>

                <tbody>

                  {/* LOADING */}

                  {loading ? (
                    <tr>

                      <td
                        colSpan={11}
                        className="py-14 text-center"
                      >

                        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-[#b1843d]" />

                        <p className="mt-2 text-[10px] text-slate-400">
                          Loading cases...
                        </p>

                      </td>

                    </tr>
                  ) : cases.length === 0 ? (
                    <tr>

                      <td
                        colSpan={11}
                        className="py-14 text-center"
                      >

                        <BriefcaseBusiness
                          size={28}
                          className="mx-auto text-slate-300"
                        />

                        <p className="mt-3 text-xs font-semibold text-[#17324d]">
                          No cases found
                        </p>

                        <p className="mt-1 text-[10px] text-slate-400">
                          Try changing the current filters.
                        </p>

                      </td>

                    </tr>
                  ) : (
                    cases.map(
                      (
                        caseItem,
                        index
                      ) => (
                        <tr
                          key={caseItem._id}
                          className="border-b border-slate-100 transition last:border-b-0 hover:bg-[#fdfbf7]"
                        >

                          {/* SL */}

                          <TableCell>

                            <span className="text-slate-400">
                              {String(
                                index + 1
                              ).padStart(
                                2,
                                "0"
                              )}
                            </span>

                          </TableCell>

                          {/* CASE CODE */}

                          <TableCell>

                            <span
                              className="block truncate font-semibold text-[#17324d]"
                              title={
                                caseItem.caseCode
                              }
                            >
                              {
                                caseItem.caseCode
                              }
                            </span>

                          </TableCell>

                          {/* APPOINTMENT */}

                          <TableCell>

                            {caseItem.appointment
                              ?.appointmentCode ? (
                              <div className="flex min-w-0 items-center gap-1.5">

                                <Scale
                                  size={11}
                                  className="shrink-0 text-[#b1843d]"
                                />

                                <span
                                  className="truncate font-semibold text-[#315d82]"
                                  title={
                                    caseItem
                                      .appointment
                                      .appointmentCode
                                  }
                                >
                                  {
                                    caseItem
                                      .appointment
                                      .appointmentCode
                                  }
                                </span>

                              </div>
                            ) : (
                              <span className="text-slate-400">
                                --
                              </span>
                            )}

                          </TableCell>

                          {/* LAWYER */}

                          <TableCell>

                            {caseItem.appointment
                              ?.lawyer?.name ? (
                              <div className="flex min-w-0 items-center gap-2">

                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#fbf3e5] text-[8px] font-bold text-[#9a6b20]">
                                  {getInitials(
                                    caseItem
                                      .appointment
                                      .lawyer.name
                                  )}
                                </div>

                                <span
                                  className="truncate"
                                  title={
                                    caseItem
                                      .appointment
                                      .lawyer.name
                                  }
                                >
                                  {
                                    caseItem
                                      .appointment
                                      .lawyer.name
                                  }
                                </span>

                              </div>
                            ) : (
                              <span className="text-slate-400">
                                --
                              </span>
                            )}

                          </TableCell>

                          {/* CLIENT */}

                          <TableCell>

                            {caseItem.appointment
                              ?.client?.name ? (
                              <div className="flex min-w-0 items-center gap-2">

                                <UsersRound
                                  size={12}
                                  className="shrink-0 text-slate-400"
                                />

                                <span
                                  className="truncate"
                                  title={
                                    caseItem
                                      .appointment
                                      .client.name
                                  }
                                >
                                  {
                                    caseItem
                                      .appointment
                                      .client.name
                                  }
                                </span>

                              </div>
                            ) : (
                              <span className="text-slate-400">
                                --
                              </span>
                            )}

                          </TableCell>

                          {/* TITLE */}

                          <TableCell>

                            <div className="flex min-w-0 items-center gap-2">

                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#edf3f8] text-[#173f67]">
                                <BriefcaseBusiness
                                  size={12}
                                />
                              </div>

                              <span
                                className="truncate font-semibold text-[#17324d]"
                                title={
                                  caseItem.title
                                }
                              >
                                {
                                  caseItem.title
                                }
                              </span>

                            </div>

                          </TableCell>

                          {/* CHARGE */}

                          <TableCell>

                            <span className="block truncate whitespace-nowrap font-semibold text-[#17324d]">
                              {formatMoney(
                                caseItem.totalCharge
                              )}
                            </span>

                          </TableCell>

                          {/* PAYMENT */}

                          <TableCell>

                            <span className="block truncate whitespace-nowrap font-semibold text-emerald-600">
                              {formatMoney(
                                caseItem.payment
                              )}
                            </span>

                          </TableCell>

                          {/* DUE */}

                          <TableCell>

                            <span
                              className={`block truncate whitespace-nowrap font-semibold ${
                                caseItem.due > 0
                                  ? "text-red-500"
                                  : "text-emerald-600"
                              }`}
                            >
                              {formatMoney(
                                caseItem.due
                              )}
                            </span>

                          </TableCell>

                          {/* STATUS */}

                          <TableCell center>

                            <StatusBadge
                              inactive={
                                caseItem.isInactive
                              }
                            />

                          </TableCell>

                          {/* ACTION */}

                          <TableCell center>

                            <div className="flex items-center justify-center gap-1">

                              <button
                                type="button"
                                title="Edit Case"
                                onClick={() =>
                                  router.push(
                                    `/cases-appointments/cases/${caseItem._id}/edit`
                                  )
                                }
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                              >
                                <Pencil
                                  size={12}
                                />
                              </button>

                              <button
                                type="button"
                                title="Delete Case"
                                onClick={() =>
                                  setDeleteTarget(
                                    caseItem
                                  )
                                }
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-red-50 text-red-500 transition hover:bg-red-100"
                              >
                                <Trash2
                                  size={12}
                                />
                              </button>

                            </div>

                          </TableCell>

                        </tr>
                      )
                    )
                  )}

                </tbody>

              </table>

              {/* TABLE FOOTER */}

              {!loading &&
                cases.length > 0 && (
                  <div className="border-t border-slate-100 px-4 py-2.5 text-[10px] text-slate-400">

                    Showing{" "}
                    {cases.length}{" "}
                    {cases.length === 1
                      ? "case"
                      : "cases"}

                  </div>
                )}

            </div>

          </div>

        </section>

        {/* =================================================
            DELETE CONFIRMATION MODAL
        ================================================= */}

        {deleteTarget && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#071727]/50 px-4 backdrop-blur-[2px]"
            onMouseDown={(event) => {
              if (
                event.target ===
                  event.currentTarget &&
                !deleting
              ) {
                setDeleteTarget(null);
              }
            }}
          >

            <div className="w-full max-w-[440px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">

              {/* HEADER */}

              <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-red-500">
                    <AlertTriangle
                      size={20}
                    />
                  </div>

                  <div>

                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#b1843d]">
                      Law Firm
                    </p>

                    <h2 className="mt-0.5 font-serif text-xl font-semibold text-[#17324d]">
                      Delete Case
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-400">
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
                  className="rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-[#17324d] disabled:opacity-50"
                >
                  <X size={17} />
                </button>

              </div>

              {/* BODY */}

              <div className="px-6 py-6">

                <p className="text-sm leading-6 text-slate-600">
                  Are you sure you want to delete case{" "}

                  <span className="font-semibold text-[#17324d]">
                    {
                      deleteTarget.caseCode
                    }
                  </span>

                  ?
                </p>

                <div className="mt-4 rounded-lg border border-slate-200 bg-[#f8fafb] p-4">

                  <div className="flex items-start gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fbf3e5] text-[#b1843d]">
                      <BriefcaseBusiness
                        size={16}
                      />
                    </div>

                    <div className="min-w-0">

                      <p className="truncate text-sm font-semibold text-[#17324d]">
                        {
                          deleteTarget.title
                        }
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {
                          deleteTarget
                            .appointment
                            ?.appointmentCode ||
                          "No appointment"
                        }
                      </p>

                    </div>

                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-200 pt-3">

                    <CaseMoneyInfo
                      label="Charge"
                      value={formatMoney(
                        deleteTarget.totalCharge
                      )}
                    />

                    <CaseMoneyInfo
                      label="Payment"
                      value={formatMoney(
                        deleteTarget.payment
                      )}
                    />

                    <CaseMoneyInfo
                      label="Due"
                      value={formatMoney(
                        deleteTarget.due
                      )}
                    />

                  </div>

                </div>

                <div className="mt-4 flex gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3">

                  <AlertTriangle
                    size={15}
                    className="mt-0.5 shrink-0 text-red-500"
                  />

                  <p className="text-xs leading-5 text-red-600">
                    The selected case record will be permanently removed.
                  </p>

                </div>

              </div>

              {/* FOOTER */}

              <div className="flex justify-end gap-3 border-t border-slate-100 bg-[#fafbfc] px-6 py-4">

                <button
                  type="button"
                  disabled={deleting}
                  onClick={() =>
                    setDeleteTarget(null)
                  }
                  className="h-10 rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="flex h-10 items-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={15} />

                  {deleting
                    ? "Deleting..."
                    : "Delete Case"}
                </button>

              </div>

            </div>

          </div>
        )}

      </div>
    </AdminLayout>
  );
}

// =====================================================
// Table Head
// =====================================================

function TableHead({
  children,
  center = false,
}: {
  children: React.ReactNode;
  center?: boolean;
}) {
  return (
    <th
      className={`border-b border-slate-200 px-2 py-2.5 text-[9px] font-semibold uppercase tracking-[0.03em] text-slate-500 ${
        center
          ? "text-center"
          : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

// =====================================================
// Table Cell
// =====================================================

function TableCell({
  children,
  center = false,
}: {
  children: React.ReactNode;
  center?: boolean;
}) {
  return (
    <td
      className={`overflow-hidden px-2 py-2.5 text-[10px] text-slate-600 ${
        center
          ? "text-center"
          : "text-left"
      }`}
    >
      {children}
    </td>
  );
}

// =====================================================
// Status Badge
// =====================================================

function StatusBadge({
  inactive,
}: {
  inactive: boolean;
}) {
  if (inactive) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[9px] font-semibold text-red-600">

        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />

        Inactive

      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700">

      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

      Active

    </span>
  );
}

// =====================================================
// Delete Modal Money Info
// =====================================================

function CaseMoneyInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>

      <p className="text-[8px] font-semibold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-[10px] font-semibold text-[#17324d]">
        {value}
      </p>

    </div>
  );
}
