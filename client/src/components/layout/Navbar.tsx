"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  Menu,
  Bell,
  Search,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Settings2,
  CalendarClock,
  CalendarRange,
  UsersRound,
  FileText,
  WalletCards,
  ClipboardCheck,
  UserRound,
  CalendarDays,
  BriefcaseBusiness,
  X,
} from "lucide-react";

// =====================================================
// Search Pages
// Static navigation configuration only.
// No business/database data is hardcoded here.
// =====================================================

const searchablePages = [
  {
    label: "Dashboard",
    description: "System overview and summary",
    href: "/dashboard",
    icon: LayoutDashboard,
    keywords: ["home", "overview", "dashboard"],
  },
  {
    label: "Parameters",
    description: "System configuration parameters",
    href: "/parameters",
    icon: Settings2,
    keywords: [
      "parameter",
      "configuration",
      "department",
      "designation",
      "gender",
      "nationality",
      "religion",
      "appointment type",
      "leave type",
    ],
  },
  {
    label: "Attendance Schedule",
    description: "Manage attendance schedules",
    href: "/attendance-plan/schedule",
    icon: CalendarClock,
    keywords: ["attendance plan", "schedule"],
  },
  {
    label: "Leave Schedule",
    description: "Manage leave schedules",
    href: "/leave-plan/leave-schedule",
    icon: CalendarRange,
    keywords: ["leave plan", "leave schedule"],
  },
  {
    label: "Employee Info",
    description: "View and manage employees",
    href: "/employees/employee-info",
    icon: UsersRound,
    keywords: ["employee", "staff", "employee information"],
  },
  {
    label: "Leave Application",
    description: "Employee leave applications",
    href: "/employees/leave-application",
    icon: FileText,
    keywords: ["leave", "application", "leave request"],
  },
  {
    label: "Leave Balance",
    description: "Employee leave balances",
    href: "/employees/leave-balance",
    icon: WalletCards,
    keywords: ["leave balance", "balance"],
  },
  {
    label: "Attendance Info",
    description: "Daily employee attendance",
    href: "/attendance/attendance-info",
    icon: ClipboardCheck,
    keywords: ["attendance", "present", "absent", "late"],
  },
  {
    label: "Clients",
    description: "View and manage clients",
    href: "/cases-appointments/clients",
    icon: UserRound,
    keywords: ["client", "clients"],
  },
  {
    label: "Appointments",
    description: "View and manage appointments",
    href: "/cases-appointments/appointments",
    icon: CalendarDays,
    keywords: ["appointment", "appointments", "meeting"],
  },
  {
    label: "Cases",
    description: "View and manage legal cases",
    href: "/cases-appointments/cases",
    icon: BriefcaseBusiness,
    keywords: ["case", "cases", "legal case"],
  },
];

// =====================================================
// Navbar
// =====================================================

export default function Navbar() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const adminRef = useRef<HTMLDivElement>(null);

  // =====================================================
  // Search
  // =====================================================

  const filteredPages = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return searchablePages;
    }

    return searchablePages.filter((page) => {
      const searchableText = [
        page.label,
        page.description,
        ...page.keywords,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [search]);

  const handleNavigate = (href: string) => {
    setSearch("");
    setSearchOpen(false);
    router.push(href);
  };

  // =====================================================
  // Logout
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    setAdminOpen(false);

    router.replace("/login");
    router.refresh();
  };

  // =====================================================
  // Click Outside
  // =====================================================

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        searchRef.current &&
        !searchRef.current.contains(target)
      ) {
        setSearchOpen(false);
      }

      if (
        adminRef.current &&
        !adminRef.current.contains(target)
      ) {
        setAdminOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // =====================================================
  // UI
  // =====================================================

  return (
    <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur md:px-7 lg:px-8 xl:px-9">

      {/* =================================================
          LEFT
      ================================================= */}

      <div className="flex items-center gap-4">

        {/* Mobile Menu */}

        <button
          type="button"
          aria-label="Open menu"
          className="rounded-lg border border-slate-200 p-2.5 text-[#17324d] transition hover:border-[#d8c29c] hover:bg-[#fbf8f2]"
        >
          <Menu size={19} />
        </button>

        {/* =================================================
            SEARCH
        ================================================= */}

        <div
          ref={searchRef}
          className="relative hidden md:block"
        >

          <div
            className={`flex h-10 items-center gap-3 rounded-lg border bg-[#f8fafb] px-4 transition ${
              searchOpen
                ? "border-[#c6a364] bg-white"
                : "border-slate-200"
            }`}
          >
            <Search
              size={16}
              className="shrink-0 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => {
                setSearch(e.target.value);
                setSearchOpen(true);
              }}
              placeholder="Search modules..."
              className="w-48 bg-transparent text-sm text-[#17324d] outline-none placeholder:text-slate-400 lg:w-60"
            />

            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setSearch("");
                  setSearchOpen(true);
                }}
                className="text-slate-400 transition hover:text-[#17324d]"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Search Dropdown */}

          {searchOpen && (
            <div className="absolute left-0 top-[48px] z-50 w-[340px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,42,67,0.14)]">

              {/* Header */}

              <div className="border-b border-slate-100 px-4 py-3">

                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#b1843d]">
                  Quick Navigation
                </p>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  Search available modules and pages
                </p>

              </div>

              {/* Results */}

              <div className="max-h-[380px] overflow-y-auto p-2">

                {filteredPages.length > 0 ? (
                  filteredPages.map((page) => {
                    const Icon = page.icon;

                    return (
                      <button
                        key={page.href}
                        type="button"
                        onClick={() =>
                          handleNavigate(page.href)
                        }
                        className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-[#fbf8f2]"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f4f7f9] text-slate-500 transition group-hover:bg-[#fbf3e5] group-hover:text-[#b1843d]">
                          <Icon
                            size={16}
                            strokeWidth={1.8}
                          />
                        </div>

                        <div className="min-w-0">

                          <p className="text-xs font-semibold text-[#17324d]">
                            {page.label}
                          </p>

                          <p className="mt-0.5 truncate text-[10px] text-slate-400">
                            {page.description}
                          </p>

                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-4 py-8 text-center">

                    <Search
                      size={22}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-2 text-xs font-medium text-slate-500">
                      No matching page found
                    </p>

                    <p className="mt-1 text-[10px] text-slate-400">
                      Try searching with another keyword.
                    </p>

                  </div>
                )}

              </div>

            </div>
          )}

        </div>

      </div>

      {/* =================================================
          RIGHT
      ================================================= */}

      <div className="flex items-center gap-3">

        {/* Notification */}

        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-[#f8f5ef] hover:text-[#a97828]"
        >
          <Bell
            size={19}
            strokeWidth={1.8}
          />

          <span className="absolute right-[9px] top-[8px] h-[7px] w-[7px] rounded-full border border-white bg-[#c89b4b]" />
        </button>

        {/* Divider */}

        <div className="mx-1 hidden h-8 w-px bg-slate-200 sm:block" />

        {/* =================================================
            ADMIN DROPDOWN
        ================================================= */}

        <div
          ref={adminRef}
          className="relative"
        >

          <button
            type="button"
            aria-expanded={adminOpen}
            onClick={() => {
              setAdminOpen((previous) => !previous);
              setSearchOpen(false);
            }}
            className={`flex items-center gap-3 rounded-lg px-2 py-1.5 transition ${
              adminOpen
                ? "bg-[#f8fafb]"
                : "hover:bg-[#f8fafb]"
            }`}
          >

            {/* Avatar */}

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0b2945] text-xs font-semibold tracking-wide text-white ring-2 ring-[#eadbbf]">
              AD
            </div>

            {/* Details */}

            <div className="hidden text-left sm:block">

              <p className="text-sm font-semibold text-[#17324d]">
                Admin
              </p>

              <p className="mt-0.5 text-[11px] text-slate-400">
                Administrator
              </p>

            </div>

            <ChevronDown
              size={15}
              className={`hidden text-slate-400 transition-transform duration-200 sm:block ${
                adminOpen ? "rotate-180" : ""
              }`}
            />

          </button>

          {/* Dropdown */}

          {adminOpen && (
            <div className="absolute right-0 top-[54px] z-50 w-[230px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,42,67,0.14)]">

              {/* Admin Info */}

              <div className="border-b border-slate-100 px-4 py-3">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0b2945] text-[10px] font-semibold text-white ring-2 ring-[#eadbbf]">
                    AD
                  </div>

                  <div>

                    <p className="text-xs font-semibold text-[#17324d]">
                      Admin
                    </p>

                    <p className="mt-0.5 text-[10px] text-slate-400">
                      Administrator
                    </p>

                  </div>

                </div>

              </div>

              {/* Logout */}

              <div className="p-2">

                <button
                  type="button"
                  onClick={handleLogout}
                  className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-red-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500 transition group-hover:bg-red-100">
                    <LogOut
                      size={15}
                      strokeWidth={1.8}
                    />
                  </div>

                  <div>

                    <p className="text-xs font-semibold text-red-600">
                      Logout
                    </p>

                    <p className="mt-0.5 text-[9px] text-slate-400">
                      Sign out of admin account
                    </p>

                  </div>

                </button>

              </div>

            </div>
          )}

        </div>

      </div>

    </header>
  );
}