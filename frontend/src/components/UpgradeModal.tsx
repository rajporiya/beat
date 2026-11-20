import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, Lock, Sparkles, X } from "lucide-react";
import { useUpgradeStore } from "@/stores/useUpgradeStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSubscriptionStore } from "@/stores/useSubscriptionStore";
import { PlanBadge } from "@/components/PlanBadge";
import { PLAN_META, planById, formatPrice } from "@/lib/plans";

export const UpgradeModal = () => {
  const { isOpen, close, requiredPlan, feature } = useUpgradeStore();
  const { user } = useAuthStore();
  const { plans } = useSubscriptionStore();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const meta = PLAN_META[requiredPlan];
  const plan = planById(plans, requiredPlan);

  const goToPlans = () => {
    close();
    navigate(user ? "/plans" : "/login");
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={close}>
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#181818] p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${meta.gradientClass} opacity-70`} />

        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 grid size-8 place-items-center rounded-full bg-black/30 text-zinc-300 transition-colors hover:bg-black/60 hover:text-white"
        >
          <X className="size-4" />
        </button>

        <div className="relative">
          <div className={`grid size-12 place-items-center rounded-2xl border bg-black/40 ${meta.borderClass}`}>
            <Lock className={`size-5 ${meta.textClass}`} />
          </div>

          <h2 className="mt-4 text-2xl font-black tracking-tight text-white">
            Unlock {feature}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
            Your current plan does not include{" "}
            <span className="font-semibold text-white">{feature}</span>.{" "}
            {requiredPlan === "pro" ? (
              <>It is available with the <span className="font-bold text-amber-300">Pro</span> plan.</>
            ) : (
              <>
                It is available with the{" "}
                <span className={`font-bold ${meta.textClass}`}>{meta.label}</span> plan and every plan above it.
              </>
            )}
          </p>

          <div className={`mt-5 rounded-2xl border ${meta.borderClass} bg-black/30 p-4`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <PlanBadge plan={requiredPlan} />
                <span className="text-sm font-semibold text-white">{plan.name}</span>
              </div>
              <p className="text-sm font-bold text-white">
                {formatPrice(plan.prices.monthly)}
                <span className="text-xs font-normal text-zinc-400">/mo</span>
              </p>
            </div>

            <ul className="mt-3 space-y-2">
              {plan.features.slice(0, 4).map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-zinc-300">
                  <Check className={`mt-0.5 size-3.5 shrink-0 ${meta.textClass}`} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={goToPlans}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-black transition-transform hover:scale-[1.02]"
          >
            <Sparkles className="size-4" />
            {user ? "See all plans" : "Log in to upgrade"}
            <ArrowRight className="size-4" />
          </button>

          <button
            type="button"
            onClick={close}
            className="mt-2 w-full rounded-full px-5 py-2.5 text-xs font-semibold text-zinc-400 transition-colors hover:text-white"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
