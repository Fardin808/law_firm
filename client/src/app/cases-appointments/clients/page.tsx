"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import AdminLayout from "@/components/layout/AdminLayout";
import ClientAccountModal from "@/components/clients/ClientAccountModal";
import CasesAppointmentsTabs from "@/components/cases-appointments/CasesAppointmentsTabs";

import {
  Plus,
  Pencil,
  Trash2,
  WalletCards,
  Search,
  ChevronRight,
  UsersRound,
  X,
  AlertTriangle,
  Filter,
  RotateCcw,
} from "lucide-react";

type ClientAccount = {
  _id: string;
  accountCode?: string;
  accountNo?: string;
  accountName?: string;
  description?: string;
  isInactive?: boolean;
};

type Client = {
  _id: string;
  clientCode: string;
  name: string;
  phone: string;
  email: string;
  isInactive: boolean;
  accountInfo?: ClientAccount | null;
};

export default function ClientsPage() {
  const router = useRouter();

  // =====================================================
  // STATE
  // =====================================================

  const [clients, setClients] = useState<Client[]>([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [limit, setLimit] = useState("10");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedAccountClient, setSelectedAccountClient] =
    useState<Client | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<Client | null>(null);

  const [deleting, setDeleting] = useState(false);

  // =====================================================
  // AUTH
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
  // FETCH CLIENTS
  // =====================================================

  const fetchClients = async () => {
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
        params.append("clientCode", search.trim());
      }

      if (status) {
        params.append("status", status);
      }

      params.append("limit", limit);

      const response = await fetch(
        `http://localhost:5000/api/clients?${params.toString()}`,
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
          data.message || "Failed to load clients."
        );
      }

      setClients(data.clients || []);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to load clients.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [status, limit]);

  // =====================================================
  // SEARCH
  // =====================================================

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchClients();
  };

  const handleReset = () => {
    setSearch("");
    setStatus("");
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setDeleting(true);

      const response = await fetch(
        `http://localhost:5000/api/clients/${deleteTarget._id}`,
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
          data.message || "Failed to delete client."
        );
        return;
      }

      toast.success("Client deleted successfully.");

      setDeleteTarget(null);

      await fetchClients();
    } catch {
      toast.error("Unable to connect to the server.");
    } finally {
      setDeleting(false);
    }
  };

  // =====================================================
  // ACCOUNT MODAL
  // =====================================================

  const openAccountModal = (client: Client) => {
    setSelectedAccountClient(client);
  };

  const closeAccountModal = () => {
    setSelectedAccountClient(null);
  };

  const handleAccountSaved = async () => {
    setSelectedAccountClient(null);

    toast.success("Client account updated successfully.");

    await fetchClients();
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

          {/* LEFT - PAGE INFO */}

          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b1843d]">
              Cases & Appointments
            </p>

            <h1 className="mt-1 font-serif text-[34px] font-semibold leading-tight tracking-[-0.02em] text-[#102a43]">
              Clients
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage client information and account setup.
            </p>
          </div>

          {/* CENTER - TRANSACTION / MODULE SWITCHER */}

          <div className="w-full">
            <CasesAppointmentsTabs />
          </div>

          {/* RIGHT - BREADCRUMB */}

          <div className="flex items-center gap-2 text-xs text-slate-400 xl:justify-end">
            <span>Cases & Appointments</span>

            <ChevronRight size={13} />

            <span className="font-medium text-[#17324d]">
              Clients
            </span>
          </div>

        </div>

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">

            {/* NEW CLIENT */}

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/cases-appointments/clients/new"
                )
              }
              className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#0b2945] px-4 text-xs font-semibold text-white shadow-sm transition duration-200 hover:bg-[#071f34]"
            >
              <Plus
                size={15}
                className="text-[#d6ad66]"
              />

              New Client
            </button>

            <div className="hidden h-7 w-px bg-slate-200 xl:block" />

            {/* SEARCH */}

            <form
              onSubmit={handleSearch}
              className="flex min-w-0 flex-1 gap-2"
            >
              <div className="relative min-w-0 flex-1">

                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search by Client ID..."
                  className="h-10 w-full rounded-lg border border-slate-200 bg-[#fafbfc] pl-9 pr-3 text-xs text-[#17324d] outline-none transition placeholder:text-slate-400 focus:border-[#c6a364] focus:bg-white focus:ring-2 focus:ring-[#c6a364]/10"
                />

              </div>

              <button
                type="submit"
                className="h-10 shrink-0 rounded-lg bg-[#17324d] px-5 text-xs font-semibold text-white transition hover:bg-[#0b2945]"
              >
                Search
              </button>
            </form>

            {/* STATUS FILTER */}

            <div className="relative shrink-0">

              <Filter
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#b1843d]"
              />

              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value)
                }
                className="h-10 min-w-[155px] appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-xs font-medium text-[#17324d] outline-none transition focus:border-[#c6a364]"
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

            </div>

            {/* ROW LIMIT */}

            <select
              value={limit}
              onChange={(e) =>
                setLimit(e.target.value)
              }
              className="h-10 min-w-[115px] shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-[#17324d] outline-none transition focus:border-[#c6a364]"
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
                title="Reset filters"
                className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-[#17324d]"
              >
                <RotateCcw size={13} />

                Reset
              </button>
            )}

          </div>

        </section>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-2.5 text-xs text-red-600">
            {error}
          </div>
        )}

        {/* =================================================
            CLIENT DIRECTORY
        ================================================= */}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          {/* CARD HEADER */}

          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fbf3e5] text-[#b1843d]">
                <UsersRound size={17} />
              </div>

              <div>
                <h2 className="font-serif text-lg font-semibold text-[#17324d]">
                  Client Directory
                </h2>

                <p className="mt-0.5 text-[10px] text-slate-400">
                  Registered clients and account information.
                </p>
              </div>

            </div>

            {!loading && (
              <div className="rounded-full bg-[#edf3f8] px-3 py-1 text-[10px] font-semibold text-[#173f67]">
                {clients.length}{" "}
                {clients.length === 1
                  ? "Client"
                  : "Clients"}
              </div>
            )}

          </div>

          {/* =================================================
              TABLE
          ================================================= */}

          <div className="p-4">

            <div className="w-full overflow-hidden rounded-lg border border-slate-200">

              <table className="w-full table-fixed border-collapse">

                <colgroup>
                  <col className="w-[5%]" />
                  <col className="w-[12%]" />
                  <col className="w-[16%]" />
                  <col className="w-[14%]" />
                  <col className="w-[22%]" />
                  <col className="w-[12%]" />
                  <col className="w-[9%]" />
                  <col className="w-[10%]" />
                </colgroup>

                <thead className="bg-[#f8fafb]">

                  <tr>
                    <TableHead center>
                      SL
                    </TableHead>

                    <TableHead>
                      Client ID
                    </TableHead>

                    <TableHead>
                      Name
                    </TableHead>

                    <TableHead>
                      Phone
                    </TableHead>

                    <TableHead>
                      Email
                    </TableHead>

                    <TableHead>
                      Account
                    </TableHead>

                    <TableHead>
                      Status
                    </TableHead>

                    <TableHead center>
                      Action
                    </TableHead>
                  </tr>

                </thead>

                <tbody>

                  {loading ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-14 text-center"
                      >
                        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-[#b1843d]" />

                        <p className="mt-2 text-[10px] text-slate-400">
                          Loading clients...
                        </p>
                      </td>
                    </tr>
                  ) : clients.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-14 text-center"
                      >
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#fbf3e5] text-[#b1843d]">
                          <UsersRound size={18} />
                        </div>

                        <p className="mt-3 text-xs font-semibold text-[#17324d]">
                          No clients found
                        </p>

                        <p className="mt-1 text-[10px] text-slate-400">
                          Try changing the current search or filter.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    clients.map((client, index) => (
                      <tr
                        key={client._id}
                        className="border-b border-slate-100 transition-colors duration-150 last:border-b-0 hover:bg-[#fdfcf9]"
                      >

                        {/* SL */}

                        <TableCell center>
                          <span className="text-slate-400">
                            {index + 1}
                          </span>
                        </TableCell>

                        {/* CLIENT ID */}

                        <TableCell>
                          <span
                            className="block truncate font-semibold text-[#17324d]"
                            title={client.clientCode}
                          >
                            {client.clientCode}
                          </span>
                        </TableCell>

                        {/* NAME */}

                        <TableCell>
                          <div className="flex min-w-0 items-center gap-2">

                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#edf3f8] text-[9px] font-bold uppercase text-[#173f67]">
                              {getInitials(client.name)}
                            </div>

                            <span
                              className="block truncate font-semibold text-[#102a43]"
                              title={client.name}
                            >
                              {client.name}
                            </span>

                          </div>
                        </TableCell>

                        {/* PHONE */}

                        <TableCell>
                          <span
                            className="block truncate"
                            title={client.phone}
                          >
                            {client.phone || "--"}
                          </span>
                        </TableCell>

                        {/* EMAIL */}

                        <TableCell>
                          <span
                            className="block truncate text-slate-500"
                            title={client.email || "--"}
                          >
                            {client.email || "--"}
                          </span>
                        </TableCell>

                        {/* ACCOUNT */}

                        <TableCell>
                          <button
                            type="button"
                            onClick={() =>
                              openAccountModal(client)
                            }
                            title={
                              client.accountInfo
                                ? "Account configured"
                                : "Account not configured"
                            }
                            className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[10px] font-semibold transition ${
                              client.accountInfo
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "bg-red-50 text-red-600 hover:bg-red-100"
                            }`}
                          >
                            <WalletCards size={12} />

                            Account
                          </button>
                        </TableCell>

                        {/* STATUS */}

                        <TableCell>
                          <StatusBadge
                            inactive={client.isInactive}
                          />
                        </TableCell>

                        {/* ACTION */}

                        <TableCell center>
                          <div className="flex items-center justify-center gap-1.5">

                            <button
                              type="button"
                              title="Edit Client"
                              onClick={() =>
                                router.push(
                                  `/cases-appointments/clients/${client._id}/edit`
                                )
                              }
                              className="flex h-7 w-7 items-center justify-center rounded-md bg-[#edf3f8] text-[#173f67] transition hover:bg-[#17324d] hover:text-white"
                            >
                              <Pencil size={12} />
                            </button>

                            <button
                              type="button"
                              title="Delete Client"
                              onClick={() =>
                                setDeleteTarget(client)
                              }
                              className="flex h-7 w-7 items-center justify-center rounded-md bg-red-50 text-red-500 transition hover:bg-red-500 hover:text-white"
                            >
                              <Trash2 size={12} />
                            </button>

                          </div>
                        </TableCell>

                      </tr>
                    ))
                  )}

                </tbody>

              </table>

            </div>

          </div>

        </section>

      </div>

      {/* =====================================================
          ACCOUNT MODAL
      ===================================================== */}

      {selectedAccountClient && (
        <ClientAccountModal
          client={selectedAccountClient}
          onClose={closeAccountModal}
          onSaved={handleAccountSaved}
        />
      )}

      {/* =====================================================
          DELETE MODAL
      ===================================================== */}

      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#071727]/55 px-4 backdrop-blur-[2px]">

          <div className="w-full max-w-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">

              <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
                  <AlertTriangle size={18} />
                </div>

                <div>
                  <h3 className="font-serif text-lg font-semibold text-[#17324d]">
                    Delete Client
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    This action cannot be undone.
                  </p>
                </div>

              </div>

              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  setDeleteTarget(null)
                }
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              >
                <X size={16} />
              </button>

            </div>

            {/* MODAL BODY */}

            <div className="px-5 py-5">

              <p className="text-sm leading-6 text-slate-600">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-[#17324d]">
                  {deleteTarget.name}
                </span>
                ?
              </p>

              <div className="mt-4 rounded-lg border border-slate-100 bg-[#fafbfc] px-4 py-3">

                <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                  Client
                </p>

                <p className="mt-1 text-xs font-semibold text-[#17324d]">
                  {deleteTarget.clientCode}
                  {" · "}
                  {deleteTarget.name}
                </p>

              </div>

            </div>

            {/* MODAL FOOTER */}

            <div className="flex justify-end gap-2 border-t border-slate-100 bg-[#fafbfc] px-5 py-4">

              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  setDeleteTarget(null)
                }
                className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="flex h-9 items-center gap-2 rounded-lg bg-red-500 px-4 text-xs font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <Trash2 size={13} />
                )}

                {deleting
                  ? "Deleting..."
                  : "Delete Client"}
              </button>

            </div>

          </div>

        </div>
      )}

    </AdminLayout>
  );
}

// =====================================================
// TABLE HEAD
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
      className={`border-b border-slate-200 px-2 py-2.5 text-[10px] font-semibold uppercase tracking-[0.03em] text-slate-500 ${
        center ? "text-center" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

// =====================================================
// TABLE CELL
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
      className={`overflow-hidden px-2 py-2.5 text-[11px] text-slate-600 ${
        center ? "text-center" : "text-left"
      }`}
    >
      {children}
    </td>
  );
}

// =====================================================
// STATUS
// =====================================================

function StatusBadge({
  inactive,
}: {
  inactive: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold ${
        inactive
          ? "bg-red-50 text-red-600"
          : "bg-emerald-50 text-emerald-700"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          inactive
            ? "bg-red-400"
            : "bg-emerald-500"
        }`}
      />

      {inactive ? "Inactive" : "Active"}
    </span>
  );
}

// =====================================================
// INITIALS
// =====================================================

function getInitials(name: string) {
  if (!name) return "--";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("");
}