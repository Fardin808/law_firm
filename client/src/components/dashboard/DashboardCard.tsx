import { LucideIcon } from "lucide-react";

type DashboardCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: "blue" | "green" | "yellow" | "red" | "slate";
  subtitle?: string;
};

export default function DashboardCard({
  title,
  value,
  icon: Icon,
  variant = "blue",
  subtitle,
}: DashboardCardProps) {
  const styles = {
    blue: {
      iconBg: "bg-[#edf3f8]",
      iconText: "text-[#173f67]",
    },

    green: {
      iconBg: "bg-emerald-50",
      iconText: "text-emerald-600",
    },

    yellow: {
      iconBg: "bg-[#fbf3e5]",
      iconText: "text-[#b1843d]",
    },

    red: {
      iconBg: "bg-red-50",
      iconText: "text-red-500",
    },

    slate: {
      iconBg: "bg-slate-100",
      iconText: "text-slate-600",
    },
  };

  const current = styles[variant];

  return (
    <div
      className="
        group
        rounded-xl
        border
        border-slate-200
        bg-white
        p-5
        shadow-sm
        transition-all
        duration-200
        hover:-translate-y-0.5
        hover:border-[#d8c29c]
        hover:shadow-md
      "
    >
      <div className="flex items-start justify-between gap-4">

        <div className="min-w-0">

          <p className="text-xs font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 font-serif text-[30px] font-semibold leading-none text-[#17324d]">
            {value}
          </p>

          {subtitle && (
            <p className="mt-3 text-[11px] text-slate-400">
              {subtitle}
            </p>
          )}

        </div>

        <div
          className={`
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-lg
            ${current.iconBg}
          `}
        >
          <Icon
            size={20}
            strokeWidth={1.8}
            className={current.iconText}
          />
        </div>

      </div>
    </div>
  );
}