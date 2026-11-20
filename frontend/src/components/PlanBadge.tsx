import { cn } from "@/lib/utils";
import { PLAN_META, isPlanId, type PlanId } from "@/lib/plans";
import { Crown, Music, Star, User } from "lucide-react";

const PLAN_ICONS = {
  free: User,
  basic: Music,
  premium: Star,
  pro: Crown,
} as const;

interface PlanBadgeProps {
  plan?: PlanId | string | null;
  size?: "xs" | "sm" | "md";
  withIcon?: boolean;
  className?: string;
}

export const PlanBadge = ({ plan, size = "sm", withIcon = true, className }: PlanBadgeProps) => {
  const activePlan: PlanId = isPlanId(plan) ? plan : "free";
  const meta = PLAN_META[activePlan];
  const Icon = PLAN_ICONS[activePlan];

  const sizeClass =
    size === "xs"
      ? "gap-1 px-1.5 py-0.5 text-[10px]"
      : size === "md"
        ? "gap-1.5 px-3 py-1 text-xs"
        : "gap-1 px-2 py-0.5 text-[11px]";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-bold uppercase tracking-wide whitespace-nowrap",
        sizeClass,
        meta.badgeClass,
        className,
      )}
    >
      {withIcon && <Icon className={size === "md" ? "size-3.5" : "size-3"} />}
      {meta.label}
    </span>
  );
};

export default PlanBadge;
