"use client";

import { API_BASE_URL } from "@/lib/api";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import AdminLayout from "@/components/layout/AdminLayout";

import {
  Save,
  ArrowLeft,
  Pencil,
  ChevronRight,
  UserRound,
  BriefcaseBusiness,
  Phone,
  Mail,
  ShieldCheck,
  Users,
  Hash,
} from "lucide-react";

type Parameter = {
  _id: string;
  category: string;
  name: string;
  isActive: boolean;
};

const initialForm = {
  enrollId: "",
  name: "",
  fatherName: "",
  motherName: "",
  phone: "",
  email: "",
  department: "",
  designation: "",
  gender: "",
  maritalStatus: "",
  nationality: "",
  religion: "",
};

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id as string;

  const [employeeCode, setEmployeeCode] = useState("");
  const [form, setForm] = useState(initialForm);
  const [isInactive, setIsInactive] = useState(false);

  const [pageLoading, setPageLoading] = useState(true);
  const [parametersLoading, setParametersLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [departments, setDepartments] = useState<Parameter[]>([]);
  const [designations, setDesignations] = useState<Parameter[]>([]);
  const [genders, setGenders] = useState<Parameter[]>([]);
  const [maritalStatuses, setMaritalStatuses] = useState<Parameter[]>([]);
  const [nationalities, setNationalities] = useState<Parameter[]>([]);
  const [religions, setReligions] = useState<Parameter[]>([]);

  // ==========================================
  // Helpers
  // ==========================================

  const getToken = () =>
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  const handleUnauthorized = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    router.push("/login");
  };

  const updateField = (
    field: keyof typeof initialForm,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // ==========================================
  // Load employee
  // ==========================================

  useEffect(() => {
    const fetchEmployee = async () => {
      const token = getToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        setPageLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/api/employees/${id}`,
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
            data.message || "Failed to load employee."
          );
        }

        const employee = data.employee;

        setEmployeeCode(employee.employeeCode || "");

        setForm({
          enrollId: employee.enrollId || "",
          name: employee.name || "",
          fatherName: employee.fatherName || "",
          motherName: employee.motherName || "",
          phone: employee.phone || "",
          email: employee.email || "",
          department: employee.department || "",
          designation: employee.designation || "",
          gender: employee.gender || "",
          maritalStatus: employee.maritalStatus || "",
          nationality: employee.nationality || "",
          religion: employee.religion || "",
        });

        setIsInactive(Boolean(employee.isInactive));
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to load employee.";

        setError(message);
        toast.error(message);
      } finally {
        setPageLoading(false);
      }
    };

    if (id) {
      fetchEmployee();
    }
  }, [id, router]);

  // ==========================================
  // Load parameters
  // ==========================================

  useEffect(() => {
    const fetchEmployeeParameters = async () => {
      const token = getToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        setParametersLoading(true);

        const categories = [
          "department",
          "designation",
          "gender",
          "marital-status",
          "nationality",
          "religion",
        ];

        const responses = await Promise.all(
          categories.map((category) =>
            fetch(
              `${API_BASE_URL}/api/parameters/${category}?active=true`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                cache: "no-store",
              }
            )
          )
        );

        if (
          responses.some(
            (response) => response.status === 401
          )
        ) {
          handleUnauthorized();
          return;
        }

        const data = await Promise.all(
          responses.map((response) => response.json())
        );

        const failedIndex = responses.findIndex(
          (response) => !response.ok
        );

        if (failedIndex !== -1) {
          throw new Error(
            data[failedIndex]?.message ||
              "Failed to load employee parameters."
          );
        }

        setDepartments(data[0]?.parameters || []);
        setDesignations(data[1]?.parameters || []);
        setGenders(data[2]?.parameters || []);
        setMaritalStatuses(data[3]?.parameters || []);
        setNationalities(data[4]?.parameters || []);
        setReligions(data[5]?.parameters || []);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to load employee parameters.";

        setError(message);
        toast.error(message);
      } finally {
        setParametersLoading(false);
      }
    };

    fetchEmployeeParameters();
  }, [router]);

  // ==========================================
  // Update employee
  // ==========================================

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError("");

    const hasEmptyField = Object.values(form).some(
      (value) => !value.trim()
    );

    if (hasEmptyField) {
      setError("Please fill in all employee information.");
      return;
    }

    if (parametersLoading) {
      setError(
        "Please wait until employee parameters finish loading."
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
        `${API_BASE_URL}/api/employees/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...form,
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
          data.message || "Failed to update employee.";

        setError(message);
        toast.error(message);
        return;
      }

      toast.success("Employee updated successfully.");

      router.push("/employees/employee-info");
    } catch {
      const message = "Unable to connect to the server.";

      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[350px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-[#b1843d]" />

            <p className="mt-2 text-xs text-slate-400">
              Loading employee...
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="text-[#17324d]">
        {/* HEADER */}

        <div className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b1843d]">
              Employee Management
            </p>

            <h1 className="mt-0.5 font-serif text-[32px] font-semibold leading-tight text-[#102a43]">
              Edit Employee
            </h1>

            <p className="mt-1 text-xs text-slate-500">
              Update employee personal and professional information.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Employee</span>
            <ChevronRight size={13} />

            <button
              type="button"
              onClick={() =>
                router.push("/employees/employee-info")
              }
              className="transition hover:text-[#b1843d]"
            >
              Employee Info
            </button>

            <ChevronRight size={13} />

            <span className="font-medium text-[#17324d]">
              Edit
            </span>
          </div>
        </div>

        {/* EMPLOYEE STRIP */}

        <div className="mb-4 overflow-hidden rounded-xl border border-[#d9c59f] bg-gradient-to-r from-[#0b2945] to-[#173f67] shadow-sm">
          <div className="flex flex-col justify-between gap-3 px-5 py-3.5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d6ad66]/50 bg-white/10 text-[#e6c98f]">
                <Pencil size={16} />
              </div>

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#d6ad66]">
                  Employee Record
                </p>

                <h2 className="mt-0.5 font-serif text-lg font-semibold text-white">
                  {form.name}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <Hash
                size={13}
                className="text-[#d6ad66]"
              />

              <div>
                <p className="text-[9px] uppercase tracking-wider text-white/50">
                  Employee Code
                </p>

                <p className="text-xs font-semibold tracking-wide text-white">
                  {employeeCode}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FORM */}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fbf3e5] text-[#b1843d]">
              <Pencil size={15} />
            </div>

            <div>
              <h2 className="font-serif text-lg font-semibold text-[#17324d]">
                Employee Information
              </h2>

              <p className="text-[11px] text-slate-400">
                Modify the employee record below.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-5"
          >
            {/* STATUS */}

            <div className="mb-5 flex flex-col justify-between gap-3 rounded-lg border border-slate-200 bg-[#fafbfc] px-4 py-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#b1843d] shadow-sm ring-1 ring-slate-200">
                  <ShieldCheck size={15} />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-[#17324d]">
                      Employee Status
                    </p>

                    {!isInactive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                        Inactive
                      </span>
                    )}
                  </div>

                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Control whether this employee record is active.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setIsInactive((previous) => !previous)
                }
                aria-label="Toggle employee status"
                className={`relative h-5 w-9 shrink-0 rounded-full transition ${
                  !isInactive
                    ? "bg-[#0b2945]"
                    : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-[3px] h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-all ${
                    !isInactive
                      ? "left-[19px]"
                      : "left-[3px]"
                  }`}
                />
              </button>
            </div>

            {/* BASIC */}

            <FormSection
              icon={UserRound}
              title="Basic Information"
              description="Identity and family information."
            >
              <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2 xl:grid-cols-3">
                <Field
                  label="Employee Code"
                  required={false}
                >
                  <input
                    value={employeeCode}
                    readOnly
                    className={`${inputClass} cursor-not-allowed bg-slate-100 font-medium text-slate-500`}
                  />
                </Field>

                <Field label="Enroll ID">
                  <input
                    required
                    value={form.enrollId}
                    onChange={(e) =>
                      updateField("enrollId", e.target.value)
                    }
                    placeholder="Enter enroll ID"
                    className={inputClass}
                  />
                </Field>

                <Field label="Name">
                  <input
                    required
                    value={form.name}
                    onChange={(e) =>
                      updateField("name", e.target.value)
                    }
                    placeholder="Enter employee name"
                    className={inputClass}
                  />
                </Field>

                <Field label="Father's Name">
                  <input
                    required
                    value={form.fatherName}
                    onChange={(e) =>
                      updateField("fatherName", e.target.value)
                    }
                    placeholder="Enter father's name"
                    className={inputClass}
                  />
                </Field>

                <Field label="Mother's Name">
                  <input
                    required
                    value={form.motherName}
                    onChange={(e) =>
                      updateField("motherName", e.target.value)
                    }
                    placeholder="Enter mother's name"
                    className={inputClass}
                  />
                </Field>
              </div>
            </FormSection>

            {/* CONTACT */}

            <FormSection
              icon={Mail}
              title="Contact Information"
              description="Employee communication details."
            >
              <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
                <Field label="Phone">
                  <div className="relative">
                    <Phone
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      required
                      type="tel"
                      value={form.phone}
                      onChange={(e) =>
                        updateField("phone", e.target.value)
                      }
                      placeholder="Enter phone number"
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </Field>

                <Field label="Email">
                  <div className="relative">
                    <Mail
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        updateField("email", e.target.value)
                      }
                      placeholder="Enter email address"
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </Field>
              </div>
            </FormSection>

            {/* PROFESSIONAL */}

            <FormSection
              icon={BriefcaseBusiness}
              title="Professional Information"
              description="Department and designation."
            >
              <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
                <Field label="Department">
                  <ParameterSelect
                    value={form.department}
                    onChange={(value) =>
                      updateField("department", value)
                    }
                    loading={parametersLoading}
                    loadingText="Loading Departments..."
                    placeholder="Select Department"
                    currentValue={form.department}
                    parameters={departments}
                  />
                </Field>

                <Field label="Designation">
                  <ParameterSelect
                    value={form.designation}
                    onChange={(value) =>
                      updateField("designation", value)
                    }
                    loading={parametersLoading}
                    loadingText="Loading Designations..."
                    placeholder="Select Designation"
                    currentValue={form.designation}
                    parameters={designations}
                  />
                </Field>
              </div>
            </FormSection>

            {/* PERSONAL */}

            <FormSection
              icon={Users}
              title="Personal Details"
              description="Additional profile information."
              last
            >
              <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
                <Field label="Gender">
                  <ParameterSelect
                    value={form.gender}
                    onChange={(value) =>
                      updateField("gender", value)
                    }
                    loading={parametersLoading}
                    loadingText="Loading Genders..."
                    placeholder="Select Gender"
                    currentValue={form.gender}
                    parameters={genders}
                  />
                </Field>

                <Field label="Marital Status">
                  <ParameterSelect
                    value={form.maritalStatus}
                    onChange={(value) =>
                      updateField("maritalStatus", value)
                    }
                    loading={parametersLoading}
                    loadingText="Loading Marital Status..."
                    placeholder="Select Marital Status"
                    currentValue={form.maritalStatus}
                    parameters={maritalStatuses}
                  />
                </Field>

                <Field label="Nationality">
                  <ParameterSelect
                    value={form.nationality}
                    onChange={(value) =>
                      updateField("nationality", value)
                    }
                    loading={parametersLoading}
                    loadingText="Loading Nationalities..."
                    placeholder="Select Nationality"
                    currentValue={form.nationality}
                    parameters={nationalities}
                  />
                </Field>

                <Field label="Religion">
                  <ParameterSelect
                    value={form.religion}
                    onChange={(value) =>
                      updateField("religion", value)
                    }
                    loading={parametersLoading}
                    loadingText="Loading Religions..."
                    placeholder="Select Religion"
                    currentValue={form.religion}
                    parameters={religions}
                  />
                </Field>
              </div>
            </FormSection>

            {error && (
              <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
                {error}
              </div>
            )}

            {/* ACTIONS */}

            <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  router.push("/employees/employee-info")
                }
                className="flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <ArrowLeft size={14} />
                Back
              </button>

              <button
                type="submit"
                disabled={
                  saving ||
                  parametersLoading
                }
                className="flex h-9 items-center justify-center gap-2 rounded-lg bg-[#0b2945] px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#071e34] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save
                  size={14}
                  className="text-[#d6ad66]"
                />

                {saving
                  ? "Updating..."
                  : parametersLoading
                  ? "Loading..."
                  : "Update Employee"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </AdminLayout>
  );
}

const inputClass =
  "h-9 w-full rounded-md border border-slate-200 bg-[#fafbfc] px-3 text-xs text-[#17324d] outline-none transition placeholder:text-slate-400 focus:border-[#c6a364] focus:bg-white focus:ring-2 focus:ring-[#c6a364]/10 disabled:cursor-not-allowed disabled:bg-slate-100";

function FormSection({
  icon: Icon,
  title,
  description,
  children,
  last = false,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <section
      className={
        last
          ? "pt-4"
          : "border-b border-slate-100 py-4 first:pt-0"
      }
    >
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#fbf3e5] text-[#b1843d]">
          <Icon size={14} />
        </div>

        <div>
          <h3 className="text-xs font-semibold text-[#17324d]">
            {title}
          </h3>

          <p className="text-[10px] text-slate-400">
            {description}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}

function Field({
  label,
  children,
  required = true,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold text-slate-600">
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

function ParameterSelect({
  value,
  onChange,
  loading,
  loadingText,
  placeholder,
  currentValue,
  parameters,
}: {
  value: string;
  onChange: (value: string) => void;
  loading: boolean;
  loadingText: string;
  placeholder: string;
  currentValue: string;
  parameters: Parameter[];
}) {
  return (
    <select
      required
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={loading}
      className={inputClass}
    >
      <option value="">
        {loading ? loadingText : placeholder}
      </option>

      <CurrentValueOption
        currentValue={currentValue}
        parameters={parameters}
      />

      {parameters.map((item) => (
        <option
          key={item._id}
          value={item.name}
        >
          {item.name}
        </option>
      ))}
    </select>
  );
}

function CurrentValueOption({
  currentValue,
  parameters,
}: {
  currentValue: string;
  parameters: Parameter[];
}) {
  if (!currentValue) {
    return null;
  }

  const exists = parameters.some(
    (item) => item.name === currentValue
  );

  if (exists) {
    return null;
  }

  return (
    <option value={currentValue}>
      {currentValue} (Current)
    </option>
  );
}