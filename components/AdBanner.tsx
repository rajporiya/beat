import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Megaphone, Sparkles, X } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSubscriptionStore } from "@/stores/useSubscriptionStore";
import { cn } from "@/lib/utils";

interface AdBannerProps {
  compact?: boolean;
  className?: string;
}

/**
 * Visible only on the ad-supported (Normal) plan. Basic, Premium and Pro are
 * ad-free, which is one of the clearest differences between the plans.
 */
export const AdBanner = ({ compact = false, className }: AdBannerProps) => {
  const { user } = useAuthStore();
  const { entitlements } = useSubscriptionStore();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (user && entitlements.adsFree) return null;

  if (compact) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-950/80 via-[#251031] to-[#181818] p-3.5",
          className,
        )}
      >
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss ad"
          className="absolute right-2 top-2 text-fuchsia-200/50 transition-colors hover:text-white"
        >
          <X className="size-3" />
        </button>
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-fuchsia-200/80">
          <Megaphone className="size-3" />
          Advertisement
        </div>
        <p className="mt-2 text-sm font-bold text-white">Noise Buds VS104</p>
        <p className="mt-0.5 text-xs text-fuchsia-100/70">40% off for BeatMusic listeners.</p>
        <Link
          to="/plans"
          className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-black hover:scale-[1.03] transition-transform"
        >
          Remove ads
          <ArrowRight className="size-3" />
        </Link>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-fuchsia-500/30 bg-gradient-to-r from-fuchsia-950/80 via-purple-950/60 to-[#181818] p-4 sm:p-5",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-10 size-40 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss ad"
        className="absolute right-3 top-3 z-10 text-fuchsia-200/50 transition-colors hover:text-white"
      >
        <X className="size-4" />
      </button>

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-fuchsia-400/30 bg-black/30">
            <Megaphone className="size-5 text-fuchsia-300" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia-200/70">
              Advertisement · Sponsored
            </p>
            <p className="mt-1 text-sm font-bold text-white sm:text-base">
              Noise Buds VS104 — 40% off for BeatMusic listeners
            </p>
            <p className="mt-0.5 text-xs text-fuchsia-100/60">
              {user
                ? "You are on the ad-supported Normal plan. Basic removes ads and unlocks unlimited skips."
                : "Ads keep free listening going. Upgrade to Basic to remove them and unlock unlimited skips."}
            </p>
          </div>
        </div>

        <Link
          to="/plans"
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-black transition-transform hover:scale-[1.03]"
        >
          <Sparkles className="size-3.5" />
          Go ad-free
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default AdBanner;
