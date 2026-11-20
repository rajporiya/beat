import { Search, Sparkles, X } from "lucide-react";
import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const fieldClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-[#242424] px-3.5 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-[#1ed760] focus:ring-2 focus:ring-[#1ed760]/15";

export const labelClass = "block text-[13px] font-semibold text-zinc-200";

export const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#1ed760] px-4 py-2.5 text-sm font-bold text-black transition-all hover:bg-[#3be477] hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100";

export const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:border-white/30 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-50";

type AdminSearchProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export const AdminSearch = ({ value, onChange, placeholder = "Search...", className }: AdminSearchProps) => (
  <div className={cn("relative w-full sm:max-w-xs", className)}>
    <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-10 w-full rounded-full border border-white/10 bg-[#202020] pl-10 pr-9 text-sm text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-[#1ed760]/60 focus:bg-[#242424]"
    />
    {value && (
      <button
        type="button"
        aria-label="Clear search"
        onClick={() => onChange("")}
        className="absolute right-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white"
      >
        <X className="size-3.5" />
      </button>
    )}
  </div>
);

type PageIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: ElementType;
  accent?: string;
  actions?: ReactNode;
};

export const PageIntro = ({ eyebrow, title, description, icon: Icon, accent = "text-[#1ed760]", actions }: PageIntroProps) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="flex items-start gap-4">
      <div className={cn("grid size-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]", accent)}>
        <Icon className="size-6" />
      </div>
      <div>
        <p className={cn("text-[11px] font-bold uppercase tracking-[0.18em]", accent)}>{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-400">{description}</p>
      </div>
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ElementType;
  action?: ReactNode;
};

export const EmptyState = ({ title, description, icon: Icon = Sparkles, action }: EmptyStateProps) => (
  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center">
    <div className="mx-auto grid size-14 place-items-center rounded-full bg-white/[0.06] text-zinc-400">
      <Icon className="size-6" />
    </div>
    <p className="mt-4 font-bold text-white">{title}</p>
    {description && <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">{description}</p>}
    {action && <div className="mt-5 flex justify-center">{action}</div>}
  </div>
);

export const ProgressBar = ({ value }: { value: number }) => (
  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
    <div
      className="h-full rounded-full bg-gradient-to-r from-[#1ed760] to-emerald-300 transition-[width] duration-300"
      style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
    />
  </div>
);

export const StatusPill = ({ status }: { status: "published" | "draft" }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold capitalize",
      status === "published" ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300",
    )}
  >
    <span className={cn("size-1.5 rounded-full", status === "published" ? "bg-emerald-400" : "bg-amber-400")} />
    {status}
  </span>
);

export const Tag = ({ children, tone = "zinc" }: { children: ReactNode; tone?: "zinc" | "green" | "violet" | "blue" }) => {
  const tones = {
    zinc: "bg-white/10 text-zinc-300",
    green: "bg-emerald-500/15 text-emerald-300",
    violet: "bg-violet-500/15 text-violet-300",
    blue: "bg-blue-500/15 text-blue-300",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold", tones[tone])}>{children}</span>;
};
