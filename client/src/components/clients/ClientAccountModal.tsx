"use client";

import { useEffect, useState } from "react";
import {
  Save,
  WalletCards,
  X,
} from "lucide-react";

type Client = {
  _id: string;
  clientCode: string;
  name: string;
};

type Parameter = {
  _id: string;
  category: string;
  name: string;
  isActive: boolean;

  parentParameter?: string | {
    _id: string;
  } | null;
};

type Account = {
  _id: string;

  accountHead?: {
    _id: string;
    name: string;
  };

  accountType?: {
    _id: string;
    name: string;
  };

  bankOperator?: {
    _id: string;
    name: string;
  } | null;

  accountCode?: string;
  accountNo?: string;
  accountName?: string;
  description?: string;
  isInactive?: boolean;
};

type Props = {
  client: Client;
  onClose: () => void;
  onSaved: () => void;
};

export default function ClientAccountModal({
  client,
  onClose,
  onSaved,
}: Props) {
  const [accountHeads, setAccountHeads] =
    useState<Parameter[]>([]);

  const [accountTypes, setAccountTypes] =
    useState<Parameter[]>([]);

  const [bankOperators, setBankOperators] =
    useState<Parameter[]>([]);

  const [accountHead, setAccountHead] =
    useState("");

  const [accountType, setAccountType] =
    useState("");

  const [bankOperator, setBankOperator] =
    useState("");

  const [accountCode, setAccountCode] =
    useState("");

  const [accountNo, setAccountNo] =
    useState("");

  const [accountName, setAccountName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [isInactive, setIsInactive] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const getToken = () =>
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  // =====================================================
  // Load Parameters + Existing Account
  // =====================================================

  useEffect(() => {
    const loadData = async () => {
      const token = getToken();

      if (!token) {
        setError("Authentication token not found.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [
          accountHeadResponse,
          accountTypeResponse,
          bankOperatorResponse,
          accountResponse,
        ] = await Promise.all([
          fetch(
            "http://localhost:5000/api/parameters/account-head?active=true",
            { headers }
          ),

          fetch(
            "http://localhost:5000/api/parameters/account-type?active=true",
            { headers }
          ),

          fetch(
            "http://localhost:5000/api/parameters/bank-operator?active=true",
            { headers }
          ),

          fetch(
            `http://localhost:5000/api/clients/${client._id}/account`,
            { headers }
          ),
        ]);

        const accountHeadData =
          await accountHeadResponse.json();

        const accountTypeData =
          await accountTypeResponse.json();

        const bankOperatorData =
          await bankOperatorResponse.json();

        const accountData =
          await accountResponse.json();

        if (
          !accountHeadResponse.ok ||
          !accountTypeResponse.ok ||
          !bankOperatorResponse.ok
        ) {
          throw new Error(
            "Failed to load account parameters."
          );
        }

        if (!accountResponse.ok) {
          throw new Error(
            accountData.message ||
              "Failed to load client account."
          );
        }

        setAccountHeads(
          accountHeadData.parameters || []
        );

        setAccountTypes(
          accountTypeData.parameters || []
        );

        setBankOperators(
          bankOperatorData.parameters || []
        );

        // Existing account = populate form
        if (
          accountData.hasAccount &&
          accountData.account
        ) {
          const account: Account =
            accountData.account;

          setAccountHead(
            account.accountHead?._id || ""
          );

          setAccountType(
            account.accountType?._id || ""
          );

          setBankOperator(
            account.bankOperator?._id || ""
          );

          setAccountCode(
            account.accountCode || ""
          );

          setAccountNo(
            account.accountNo || ""
          );

          setAccountName(
            account.accountName || ""
          );

          setDescription(
            account.description || ""
          );

          setIsInactive(
            Boolean(account.isInactive)
          );
        } else {
          // Useful default for new account
          setAccountName(client.name);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load account information."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [client]);

  // =====================================================
  // Filter dependent bank operators
  // =====================================================

  const filteredBankOperators =
    bankOperators.filter((operator) => {
      if (!operator.parentParameter) {
        return true;
      }

      const parentId =
        typeof operator.parentParameter ===
        "string"
          ? operator.parentParameter
          : operator.parentParameter._id;

      return parentId === accountType;
    });

  // Clear incompatible operator when type changes
  useEffect(() => {
    if (!bankOperator) {
      return;
    }

    const selected =
      bankOperators.find(
        (item) =>
          item._id === bankOperator
      );

    if (!selected?.parentParameter) {
      return;
    }

    const parentId =
      typeof selected.parentParameter ===
      "string"
        ? selected.parentParameter
        : selected.parentParameter._id;

    if (parentId !== accountType) {
      setBankOperator("");
    }
  }, [
    accountType,
    bankOperator,
    bankOperators,
  ]);

  // =====================================================
  // Save
  // =====================================================

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!accountHead) {
      setError(
        "Please select an Account Head."
      );
      return;
    }

    if (!accountType) {
      setError(
        "Please select an Account Type."
      );
      return;
    }

    const token = getToken();

    if (!token) {
      setError(
        "Authentication token not found."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `http://localhost:5000/api/clients/${client._id}/account`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            accountHead,
            accountType,

            bankOperator:
              bankOperator || null,

            accountCode:
              accountCode.trim(),

            accountNo:
              accountNo.trim(),

            accountName:
              accountName.trim(),

            description:
              description.trim(),

            isInactive,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to save account."
        );
      }

      onSaved();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save account."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">

      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

        {/* Header */}

        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <WalletCards size={20} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Apply Account Info
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                {client.clientCode} • {client.name}
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>

        </div>

        {loading ? (
          <div className="flex min-h-[350px] items-center justify-center">

            <div className="text-center">

              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="mt-3 text-sm text-slate-500">
                Loading account information...
              </p>

            </div>

          </div>
        ) : (
          <form onSubmit={handleSubmit}>

            <div className="p-6">

              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Inactive */}

              <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">

                <label className="flex cursor-pointer items-center gap-3">

                  <input
                    type="checkbox"
                    checked={isInactive}
                    onChange={(e) =>
                      setIsInactive(
                        e.target.checked
                      )
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />

                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      Inactive Account
                    </p>

                    <p className="text-xs text-slate-400">
                      Mark this account as inactive.
                    </p>
                  </div>

                </label>

              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                {/* Account Head */}

                <FormField
                  label="Account Head"
                  required
                >
                  <select
                    value={accountHead}
                    onChange={(e) =>
                      setAccountHead(
                        e.target.value
                      )
                    }
                    className={inputClass}
                  >
                    <option value="">
                      Select Account Head
                    </option>

                    {accountHeads.map(
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

                {/* Account Code */}

                <FormField label="Account Code">
                  <input
                    type="text"
                    value={accountCode}
                    onChange={(e) =>
                      setAccountCode(
                        e.target.value
                      )
                    }
                    placeholder="e.g. ACC-001"
                    className={inputClass}
                  />
                </FormField>

                {/* Account Type */}

                <FormField
                  label="Account Type"
                  required
                >
                  <select
                    value={accountType}
                    onChange={(e) =>
                      setAccountType(
                        e.target.value
                      )
                    }
                    className={inputClass}
                  >
                    <option value="">
                      Select Account Type
                    </option>

                    {accountTypes.map(
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

                {/* Bank Operator */}

                <FormField label="Bank / Operator">
                  <select
                    value={bankOperator}
                    onChange={(e) =>
                      setBankOperator(
                        e.target.value
                      )
                    }
                    disabled={!accountType}
                    className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-100`}
                  >
                    <option value="">
                      No Bank / Operator
                    </option>

                    {filteredBankOperators.map(
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

                {/* Account No */}

                <FormField label="Account No">
                  <input
                    type="text"
                    value={accountNo}
                    onChange={(e) =>
                      setAccountNo(
                        e.target.value
                      )
                    }
                    placeholder="Enter account number"
                    className={inputClass}
                  />
                </FormField>

                {/* Account Name */}

                <FormField label="Account Name">
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) =>
                      setAccountName(
                        e.target.value
                      )
                    }
                    placeholder="Enter account name"
                    className={inputClass}
                  />
                </FormField>

                {/* Description */}

                <div className="md:col-span-2">
                  <FormField label="Description">
                    <textarea
                      value={description}
                      onChange={(e) =>
                        setDescription(
                          e.target.value
                        )
                      }
                      rows={4}
                      placeholder="Enter account description..."
                      className={`${inputClass} resize-none`}
                    />
                  </FormField>
                </div>

              </div>

            </div>

            {/* Footer */}

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">

              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={17} />

                {saving
                  ? "Saving..."
                  : "Save Account"}
              </button>

            </div>

          </form>
        )}

      </div>

    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      {children}

    </div>
  );
}