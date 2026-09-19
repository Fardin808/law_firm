"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  UsersRound,
  CalendarDays,
  BriefcaseBusiness,
} from "lucide-react";

const tabs = [
  {
    label: "Clients",
    href: "/cases-appointments/clients",
    icon: UsersRound,
  },
  {
    label: "Appointments",
    href: "/cases-appointments/appointments",
    icon: CalendarDays,
  },
  {
    label: "Cases",
    href: "/cases-appointments/cases",
    icon: BriefcaseBusiness,
  },
];

export default function CasesAppointmentsTabs() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-[0_8px_28px_rgba(15,42,67,0.08)]">
      <div className="grid grid-cols-3">
        {tabs.map((tab, index) => {
          const Icon = tab.icon;

          const active =
            pathname === tab.href ||
            pathname.startsWith(`${tab.href}/`);

          return (
            <div
              key={tab.href}
              className="relative flex items-center"
            >
              {index !== 0 && (
                <div className="absolute left-0 top-1/2 h-7 w-px -translate-y-1/2 bg-slate-200" />
              )}

              <button
                type="button"
                onClick={() => router.push(tab.href)}
                className={`group relative flex h-[58px] w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl px-4 transition-all duration-300 ${
                  active
                    ? "bg-gradient-to-r from-[#081f34] to-[#123b5f] text-white shadow-[0_6px_16px_rgba(8,31,52,0.18)]"
                    : "text-slate-500 hover:bg-[#faf8f3] hover:text-[#17324d]"
                }`}
              >
                {/* Active gold bottom accent */}
                {active && (
                  <span className="absolute bottom-0 left-[18%] right-[18%] h-[2px] rounded-t-full bg-[#d6ad66]" />
                )}

                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                    active
                      ? "bg-white/10 text-[#e0bd79]"
                      : "bg-slate-50 text-slate-400 group-hover:bg-[#fbf3e5] group-hover:text-[#b1843d]"
                  }`}
                >
                  <Icon
                    size={17}
                    strokeWidth={1.8}
                  />
                </span>

                <span
                  className={`text-[13px] font-semibold transition ${
                    active
                      ? "text-white"
                      : "text-[#52667a] group-hover:text-[#17324d]"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}