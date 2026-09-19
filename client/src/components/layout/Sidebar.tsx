"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  SlidersHorizontal,
  CalendarClock,
  CalendarCheck2,
  Users,
  ClipboardCheck,
  ChevronDown,
  ChevronRight,
  Circle,
  Scale,
  BriefcaseBusiness,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const [parametersOpen, setParametersOpen] =
    useState(false);

  const [
    attendancePlanOpen,
    setAttendancePlanOpen,
  ] = useState(false);

  const [leaveOpen, setLeaveOpen] =
    useState(false);

  const [employeesOpen, setEmployeesOpen] =
    useState(false);

  const [
    attendanceInfoOpen,
    setAttendanceInfoOpen,
  ] = useState(false);

  const [
    casesAppointmentsOpen,
    setCasesAppointmentsOpen,
  ] = useState(false);

  return (
    <aside
      className="
        sticky
        top-0
        hidden
        h-screen
        w-[245px]
        shrink-0
        flex-col
        bg-[#081f34]
        text-slate-300
        lg:flex
      "
    >

      {/* =====================================
          BRAND
      ====================================== */}

      <div className="flex h-20 shrink-0 items-center border-b border-white/10 px-5">

        <div className="flex items-center gap-3">

          <Scale
            size={32}
            strokeWidth={1.4}
            className="text-[#d1a34c]"
          />

          <div>

            <h1 className="font-serif text-[18px] font-semibold tracking-[0.08em] text-white">
              LAW FIRM
            </h1>

            <div className="mt-1 h-px w-10 bg-[#c89b4b]" />

            <p className="mt-1.5 text-[8px] tracking-[0.12em] text-slate-400">
              MANAGEMENT SYSTEM
            </p>

          </div>

        </div>

      </div>

      {/* =====================================
          NAVIGATION
      ====================================== */}

      <nav className="flex-1 overflow-y-auto px-3 py-5">

        <p
          className="
            mb-3
            px-3
            text-[9px]
            font-semibold
            uppercase
            tracking-[0.2em]
            text-slate-500
          "
        >
          Main Menu
        </p>

        {/* Dashboard */}

        <MainLink
          href="/dashboard"
          label="Dashboard"
          icon={
            <LayoutDashboard size={18} />
          }
          active={
            pathname === "/dashboard"
          }
        />

        {/* Parameters */}

        <MenuButton
          label="Parameters"
          icon={
            <SlidersHorizontal size={18} />
          }
          open={parametersOpen}
          onClick={() =>
            setParametersOpen(
              !parametersOpen
            )
          }
          active={pathname.startsWith(
            "/parameters"
          )}
        />

        {parametersOpen && (
          <SubMenuContainer>

            <SubMenu
              href="/parameters?category=account-head"
              label="Account Head"
            />

            <SubMenu
              href="/parameters?category=account-type"
              label="Account Type"
            />

            <SubMenu
              href="/parameters?category=bank-operator"
              label="Bank Operator"
            />

            <SubMenu
              href="/parameters?category=leave-type"
              label="Leave Type"
            />

            <SubMenu
              href="/parameters?category=department"
              label="Department"
            />

            <SubMenu
              href="/parameters?category=designation"
              label="Designation"
            />

            <SubMenu
              href="/parameters?category=appointment-type"
              label="Appointment Type"
            />

            <SubMenu
              href="/parameters?category=religion"
              label="Religion"
            />

            <SubMenu
              href="/parameters?category=gender"
              label="Gender"
            />

            <SubMenu
              href="/parameters?category=marital-status"
              label="Marital Status"
            />

            <SubMenu
              href="/parameters?category=nationality"
              label="Nationalities"
            />

          </SubMenuContainer>
        )}

        {/* Attendance Plan */}

        <MenuButton
          label="Attendance Plan"
          icon={
            <CalendarClock size={18} />
          }
          open={attendancePlanOpen}
          onClick={() =>
            setAttendancePlanOpen(
              !attendancePlanOpen
            )
          }
          active={pathname.startsWith(
            "/attendance-plan"
          )}
        />

        {attendancePlanOpen && (
          <SubMenuContainer>

            <SubMenu
              href="/attendance-plan/schedule"
              label="Schedule"
            />

          </SubMenuContainer>
        )}

        {/* Leave Plan */}

        <MenuButton
          label="Leave Plan"
          icon={
            <CalendarCheck2 size={18} />
          }
          open={leaveOpen}
          onClick={() =>
            setLeaveOpen(!leaveOpen)
          }
          active={pathname.startsWith(
            "/leave-plan"
          )}
        />

        {leaveOpen && (
          <SubMenuContainer>

            <SubMenu
              href="/leave-plan/leave-schedule"
              label="Leave Schedule"
            />

          </SubMenuContainer>
        )}

        {/* Employees */}

        <MenuButton
          label="Employees"
          icon={<Users size={18} />}
          open={employeesOpen}
          onClick={() =>
            setEmployeesOpen(
              !employeesOpen
            )
          }
          active={pathname.startsWith(
            "/employees"
          )}
        />

        {employeesOpen && (
          <SubMenuContainer>

            <SubMenu
              href="/employees/employee-info"
              label="Employee Info"
            />

            <SubMenu
              href="/employees/leave-application"
              label="Leave Application"
            />

            <SubMenu
              href="/employees/leave-balance"
              label="Leave Details"
            />

          </SubMenuContainer>
        )}

        {/* Attendance */}

        <MenuButton
          label="Attendance"
          icon={
            <ClipboardCheck size={18} />
          }
          open={attendanceInfoOpen}
          onClick={() =>
            setAttendanceInfoOpen(
              !attendanceInfoOpen
            )
          }
          active={pathname.startsWith(
            "/attendance/"
          )}
        />

        {attendanceInfoOpen && (
          <SubMenuContainer>

            <SubMenu
              href="/attendance/attendance-info"
              label="Attendance Info"
            />

          </SubMenuContainer>
        )}

        {/* Cases & Appointments */}

        <MenuButton
          label="Cases & Appointments"
          icon={
            <BriefcaseBusiness size={18} />
          }
          open={casesAppointmentsOpen}
          onClick={() =>
            setCasesAppointmentsOpen(
              !casesAppointmentsOpen
            )
          }
          active={pathname.startsWith(
            "/cases-appointments"
          )}
        />

        {casesAppointmentsOpen && (
          <SubMenuContainer>

            <SubMenu
              href="/cases-appointments/clients"
              label="Clients"
            />

            <SubMenu
              href="/cases-appointments/appointments"
              label="Appointments"
            />

            <SubMenu
              href="/cases-appointments/cases"
              label="Cases"
            />

          </SubMenuContainer>
        )}

      </nav>

      {/* =====================================
          BOTTOM
      ====================================== */}

      <div className="shrink-0 border-t border-white/10 p-4">

        <div
          className="
            rounded-lg
            border
            border-white/[0.06]
            bg-white/[0.04]
            px-4
            py-3
          "
        >

          <div className="flex items-center gap-2">

            <div className="h-1.5 w-1.5 rounded-full bg-[#d1a34c]" />

            <p className="text-xs font-medium text-white">
              Law Firm Admin
            </p>

          </div>

          <p className="mt-1.5 pl-3.5 text-[10px] text-slate-500">
            Administration Panel
          </p>

        </div>

      </div>

    </aside>
  );
}

/* =====================================================
   MAIN LINK
===================================================== */

function MainLink({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`
        relative
        mb-1
        flex
        items-center
        gap-3
        rounded-lg
        px-3
        py-2.5
        text-[13px]
        font-medium
        transition-all
        duration-200
        ${
          active
            ? "bg-white/[0.08] text-white"
            : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
        }
      `}
    >

      {active && (
        <span className="absolute bottom-2 left-0 top-2 w-[2px] rounded-r bg-[#d1a34c]" />
      )}

      <span
        className={
          active
            ? "text-[#d1a34c]"
            : ""
        }
      >
        {icon}
      </span>

      <span>{label}</span>

    </Link>
  );
}

/* =====================================================
   MENU BUTTON
===================================================== */

function MenuButton({
  label,
  icon,
  open,
  onClick,
  active,
}: {
  label: string;
  icon: React.ReactNode;
  open: boolean;
  onClick: () => void;
  active: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative
        mb-1
        flex
        w-full
        items-center
        justify-between
        rounded-lg
        px-3
        py-2.5
        text-[13px]
        font-medium
        transition-all
        duration-200
        ${
          active
            ? "bg-white/[0.08] text-white"
            : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
        }
      `}
    >

      {active && (
        <span className="absolute bottom-2 left-0 top-2 w-[2px] rounded-r bg-[#d1a34c]" />
      )}

      <div className="flex min-w-0 items-center gap-3">

        <span
          className={
            active
              ? "text-[#d1a34c]"
              : ""
          }
        >
          {icon}
        </span>

        <span className="truncate">
          {label}
        </span>

      </div>

      {open ? (
        <ChevronDown
          size={14}
          className="shrink-0 text-[#c89b4b]"
        />
      ) : (
        <ChevronRight
          size={14}
          className="shrink-0 text-slate-600"
        />
      )}

    </button>
  );
}

/* =====================================================
   SUB MENU CONTAINER
===================================================== */

function SubMenuContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2 ml-[21px] border-l border-white/10 py-1 pl-3">
      {children}
    </div>
  );
}

/* =====================================================
   SUB MENU
===================================================== */

function SubMenu({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const pathname = usePathname();

  const cleanHref =
    href.split("?")[0];

  const active =
    pathname === cleanHref;

  return (
    <Link
      href={href}
      className={`
        flex
        items-center
        gap-2.5
        rounded-md
        px-2.5
        py-2
        text-[12px]
        transition
        ${
          active
            ? "bg-[#c89b4b]/10 text-[#d6ad66]"
            : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-200"
        }
      `}
    >

      <Circle
        size={5}
        fill="currentColor"
      />

      <span>{label}</span>

    </Link>
  );
}