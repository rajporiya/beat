import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Crown,
  Gem,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { PlanBadge } from "@/components/PlanBadge";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSubscriptionStore } from "@/stores/useSubscriptionStore";
import {
  PAID_PLAN_ORDER,
  PLAN_META,
  formatPrice,
  planById,
  planPeriodLabel,
  planRank,
  isPlanAtLeast,
  type BillingCycle,
  type PlanDefinition,
  type PlanId,
} from "@/lib/plans";
import { cn } from "@/lib/utils";

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

type CompareValue = string | boolean;
interface CompareRow {
  label: string;
  value: (plan: PlanDefinition) => CompareValue;
}

const COMPARE_ROWS: CompareRow[] = [
  { label: "Ad-free listening", value: (plan) => plan.entitlements.adsFree },
  { label: "All songs, podcasts & videos", value: (plan) => plan.entitlements.allSongs },
  { label: "Unlimited skips", value: (plan) => plan.entitlements.unlimitedSkips },
  { label: "Full lyrics", value: (plan) => plan.entitlements.lyrics },
  { label: "MP3 song downloads", value: (plan) => plan.entitlements.songDownloads },
  { label: "Offline listening", value: (plan) => plan.entitlements.offline },
  { label: "Podcast audio downloads", value: (plan) => plan.entitlements.podcastDownloads },
  { label: "Video episode downloads", value: (plan) => plan.entitlements.videoDownloads },
  { label: "Audio quality", value: (plan) => plan.entitlements.audioQuality },
  { label: "Hi-Fi / lossless", value: (plan) => plan.entitlements.hiRes },
  { label: "Early access to drops", value: (plan) => plan.entitlements.earlyAccess },
  { label: "Pro profile badge", value: (plan) => plan.entitlements.proBadge },
  { label: "Devices", value: (plan) => String(plan.entitlements.devices) },
];

interface PlanCardProps {
  definition: PlanDefinition;
  billing: BillingCycle;
  currentPlan: PlanId;
  isChanging: boolean;
  signedIn: boolean;
  onSelect: (definition: PlanDefinition) => void;
}

const PlanCard = ({ definition, billing, currentPlan, isChanging, signedIn, onSelect }: PlanCardProps) => {
  const meta = PLAN_META[definition.id];
  const isCurrent = signedIn && definition.id === currentPlan;
  const price = billing === "monthly" ? definition.prices.monthly : definition.prices.yearly;
  const isPro = definition.id === "pro";
  const isPremium = definition.id === "premium";

  const ctaLabel = isCurrent
    ? "Your current plan"
    : !signedIn
      ? `Choose ${definition.name}`
      : planRank(definition.id) > planRank(currentPlan)
        ? `Upgrade to ${definition.name}`
        : `Switch to ${definition.name}`;

  return (
    <div
      className={cn(
        "relative rounded-3xl p-[1px]",
        isPro
          ? "bg-gradient-to-b from-amber-300/70 via-orange-500/30 to-transparent shadow-[0_0_40px_-12px_rgba(251,191,36,0.45)]"
          : isPremium
            ? "bg-gradient-to-b from-emerald-400/60 via-emerald-500/20 to-transparent"
            : "bg-white/10",
      )}
    >
      {(isPro || isPremium) && (
        <div
          className={cn(
            "absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest",
            isPro ? "bg-amber-300 text-black" : "bg-emerald-400 text-black",
          )}
        >
          {isPro ? "Best value" : "Most popular"}
        </div>
      )}

      <div
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-3xl border bg-gradient-to-b p-5",
          meta.gradientClass,
          isCurrent ? meta.borderClass : "border-white/10",
        )}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full blur-3xl" style={{ backgroundColor: `${meta.accentColor}22` }} />

        <div className="relative">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {isPro ? (
                <Crown className="size-5 text-amber-300" />
              ) : isPremium ? (
                <Gem className="size-5 text-emerald-400" />
              ) : (
                <Sparkles className={cn("size-5", definition.id === "basic" ? "text-sky-400" : "text-zinc-400")} />
              )}
              <h3 className="text-lg font-black text-white">{definition.name}</h3>
            </div>
            {isCurrent && <PlanBadge plan={currentPlan} size="xs" withIcon={false} />}
          </div>
          <p className="mt-1 min-h-10 text-xs leading-relaxed text-zinc-400">{definition.subtitle}</p>

          <div className="mt-4">
            <div className="flex items-end gap-1">
              <span className="text-3xl font-black tracking-tight text-white">{formatPrice(price)}</span>
              <span className="pb-1 text-xs font-medium text-zinc-400">/{planPeriodLabel(billing)}</span>
            </div>
            {billing === "yearly" ? (
              <p className="mt-1 text-[11px] font-medium text-emerald-400">
                ≈ ₹{Math.round(price / 12).toLocaleString("en-IN")}/month · billed yearly
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-zinc-400">Cancel anytime · demo checkout</p>
            )}
          </div>
        </div>

        <ul className="relative mt-5 flex-1 space-y-2.5">
          {definition.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-xs leading-snug text-zinc-300">
              <Check className="mt-0.5 size-3.5 shrink-0" style={{ color: meta.accentColor }} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => onSelect(definition)}
          disabled={isCurrent || isChanging}
          className={cn(
            "relative mt-5 flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-bold transition-all disabled:cursor-default",
            isCurrent
              ? "bg-white/10 text-zinc-400"
              : isPro
                ? "bg-gradient-to-r from-amber-300 to-orange-400 text-black hover:scale-[1.02]"
                : isPremium
                  ? "bg-[#1ed760] text-black hover:scale-[1.02] hover:bg-[#3be477]"
                  : "bg-white text-black hover:scale-[1.02]",
          )}
        >
          {isChanging && !isCurrent ? <Loader2 className="size-3.5 animate-spin" /> : null}
          {isCurrent ? (
            <>
              <Check className="size-3.5" />
              Current plan
            </>
          ) : (
            <>
              {ctaLabel}
              <ArrowRight className="size-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default function PlansPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    plans,
    plan: currentPlan,
    subscription,
    isChanging,
    error,
    fetchPlans,
    fetchSubscription,
    subscribe,
    cancel,
  } = useSubscriptionStore();

  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [checkoutPlan, setCheckoutPlan] = useState<PlanDefinition | null>(null);
  const [successPlan, setSuccessPlan] = useState<PlanDefinition | null>(null);
  const [showCancel, setShowCancel] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
    if (user) fetchSubscription();
  }, [fetchPlans, fetchSubscription, user]);

  const currentDefinition = useMemo(
    () => planById(plans, currentPlan),
    [plans, currentPlan],
  );

  const activeSubscription = subscription?.status === "active" ? subscription : null;
  const renewsOn = formatDate(activeSubscription?.currentPeriodEnd);

  const handleSelect = (definition: PlanDefinition) => {
    setLocalError(null);
    setNotice(null);

    if (!user) {
      navigate("/login");
      return;
    }
    if (definition.id === currentPlan) return;

    setCheckoutPlan(definition);
  };

  const handlePay = async () => {
    if (!checkoutPlan) return;
    setLocalError(null);
    const activated = await subscribe(checkoutPlan.id, billing);
    if (activated) {
      setSuccessPlan(checkoutPlan);
      setCheckoutPlan(null);
    } else {
      setLocalError(useSubscriptionStore.getState().error ?? "Payment could not be completed");
    }
  };

  const handleCancelPlan = async () => {
    setLocalError(null);
    const canceled = await cancel();
    if (canceled) {
      setShowCancel(false);
      setNotice("Your paid plan has ended. You are back on the ad-supported Normal plan.");
    } else {
      setLocalError(useSubscriptionStore.getState().error ?? "Could not cancel your plan");
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#121212]">
      <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-zinc-300">
            <ShieldCheck className="size-3.5 text-[#1ed760]" />
            BeatMusic plans
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
            Pick the plan that matches your ears
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Go ad-free with Basic, download MP3s with Premium, or unlock absolutely everything —
            including podcast and video downloads — with Pro.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="mt-6 flex justify-center">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-[#181818] p-1">
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-bold transition-colors",
                billing === "monthly" ? "bg-white text-black" : "text-zinc-400 hover:text-white",
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBilling("yearly")}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors",
                billing === "yearly" ? "bg-white text-black" : "text-zinc-400 hover:text-white",
              )}
            >
              Yearly
              <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-black uppercase text-emerald-400">
                2 months free
              </span>
            </button>
          </div>
        </div>

        {/* Current plan status */}
        {user && (
          <div className={cn("mt-6 flex flex-col gap-3 rounded-2xl border bg-gradient-to-r p-4 sm:flex-row sm:items-center sm:justify-between", PLAN_META[currentPlan].borderClass, PLAN_META[currentPlan].gradientClass)}>
            <div className="flex items-center gap-3">
              <PlanBadge plan={currentPlan} size="md" />
              <div>
                <p className="text-sm font-bold text-white">
                  {currentPlan === "free" ? "No paid plan yet" : `You are on the ${currentDefinition.name} plan`}
                </p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  {currentPlan === "free"
                    ? "Ad-supported listening · pick a plan below to remove ads"
                    : activeSubscription
                      ? `${activeSubscription.billingCycle === "yearly" ? "Yearly" : "Monthly"} billing${renewsOn ? ` · renews ${renewsOn}` : ""}`
                      : "Your plan is active"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:border-white/60"
              >
                View profile
              </Link>
              {currentPlan !== "free" && (
                <button
                  type="button"
                  onClick={() => setShowCancel(true)}
                  className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 transition-colors hover:bg-red-500/20"
                >
                  Cancel plan
                </button>
              )}
            </div>
          </div>
        )}

        {notice && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
            {notice}
          </div>
        )}
        {(localError || error) && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {localError || error}
          </div>
        )}

        {/* Plan cards */}
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {PAID_PLAN_ORDER.map((id) => (
            <PlanCard
              key={id}
              definition={planById(plans, id)}
              billing={billing}
              currentPlan={currentPlan}
              isChanging={isChanging}
              signedIn={Boolean(user)}
              onSelect={handleSelect}
            />
          ))}
        </div>

        <p className="mt-4 text-center text-[11px] text-zinc-500">
          Demo checkout — no real payment is charged. Plans can be changed or canceled at any time.
        </p>

        {/* Comparison table */}
        <section className="mt-12 overflow-hidden rounded-2xl border border-white/10 bg-[#181818]">
          <div className="border-b border-white/10 p-5">
            <h2 className="text-lg font-black text-white">Compare everything</h2>
            <p className="mt-1 text-xs text-zinc-400">A side-by-side look at all three paid BeatMusic plans.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400">
                  <th className="px-5 py-3 font-medium">Feature</th>
                  {PAID_PLAN_ORDER.map((id) => {
                    const definition = planById(plans, id);
                    return (
                      <th key={id} className="px-4 py-3 text-center font-bold text-white">
                        <span className="inline-flex flex-col items-center gap-1.5">
                          <PlanBadge plan={id} size="xs" withIcon={false} />
                          <span>{formatPrice(definition.prices.monthly)}</span>
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                    <td className="px-5 py-3 font-medium text-zinc-300">{row.label}</td>
                    {PAID_PLAN_ORDER.map((id) => {
                      const value = row.value(planById(plans, id));
                      return (
                        <td key={id} className="px-4 py-3 text-center">
                          {typeof value === "boolean" ? (
                            value ? (
                              <Check className="mx-auto size-4 text-emerald-400" />
                            ) : (
                              <X className="mx-auto size-4 text-zinc-600" />
                            )
                          ) : (
                            <span className="text-zinc-300">{value}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ-ish reassurance */}
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            { title: "Cancel anytime", body: "No lock-in. Downgrade back to Normal whenever you want." },
            { title: "Downloads need Premium", body: "MP3 song downloads start with Premium. Podcast and video downloads are Pro." },
            { title: "Ad-free from Basic", body: "Basic and above never show ads across music, podcasts and videos." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-[#181818] p-4">
              <p className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Lock className="size-3.5 text-zinc-500" />
                {item.title}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Checkout modal */}
      {checkoutPlan && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={() => setCheckoutPlan(null)}>
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#181818] p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white">Confirm your plan</h2>
              <button type="button" onClick={() => setCheckoutPlan(null)} className="grid size-8 place-items-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white" aria-label="Close checkout">
                <X className="size-4" />
              </button>
            </div>

            <div className={cn("mt-4 rounded-2xl border bg-gradient-to-b p-4", PLAN_META[checkoutPlan.id].borderClass, PLAN_META[checkoutPlan.id].gradientClass)}>
              <div className="flex items-center justify-between">
                <PlanBadge plan={checkoutPlan.id} />
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">{billing}</span>
              </div>
              <p className="mt-2 text-2xl font-black text-white">
                {formatPrice(billing === "monthly" ? checkoutPlan.prices.monthly : checkoutPlan.prices.yearly)}
                <span className="text-xs font-medium text-zinc-400">/{planPeriodLabel(billing)}</span>
              </p>
              <p className="mt-1 text-xs text-zinc-400">{checkoutPlan.subtitle}</p>
            </div>

            <ul className="mt-4 space-y-2">
              {checkoutPlan.features.slice(0, 3).map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-xs text-zinc-300">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
                  {feature}
                </li>
              ))}
            </ul>

            {isPlanAtLeast(checkoutPlan.id, "premium") && (
              <p className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/5 p-2.5 text-[11px] text-amber-200/80">
                {checkoutPlan.id === "pro"
                  ? "Pro includes song, podcast and video downloads."
                  : "Premium includes MP3 song downloads. Podcast and video downloads need Pro."}
              </p>
            )}

            {localError && <p className="mt-3 text-xs text-red-400">{localError}</p>}

            <button
              type="button"
              onClick={handlePay}
              disabled={isChanging}
              className={cn(
                "mt-4 flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold transition-transform disabled:opacity-60",
                checkoutPlan.id === "pro"
                  ? "bg-gradient-to-r from-amber-300 to-orange-400 text-black"
                  : "bg-[#1ed760] text-black",
              )}
            >
              {isChanging ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
              {isChanging ? "Activating..." : `Pay ${formatPrice(billing === "monthly" ? checkoutPlan.prices.monthly : checkoutPlan.prices.yearly)} (demo)`}
            </button>
            <p className="mt-2 text-center text-[10px] text-zinc-500">
              This is a demo. No card is charged.
            </p>
          </div>
        </div>
      )}

      {/* Success modal */}
      {successPlan && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-emerald-500/30 bg-[#181818] p-6 text-center shadow-2xl">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-500/15">
              <Check className="size-7 text-emerald-400" />
            </div>
            <h2 className="mt-4 text-2xl font-black text-white">You are now {successPlan.name}</h2>
            <p className="mt-2 text-sm text-zinc-400">
              {successPlan.id === "pro"
                ? "Every feature is unlocked: MP3 songs, podcast audio, video downloads, lossless audio and early access."
                : successPlan.id === "premium"
                  ? "Ad-free listening, MP3 downloads, offline mode and 320 kbps audio are all unlocked."
                  : "Ads are gone and unlimited skips are unlocked. Enjoy the music."}
            </p>
            <div className="mt-5">
              <PlanBadge plan={successPlan.id} size="md" />
            </div>
            <button
              type="button"
              onClick={() => {
                setSuccessPlan(null);
                navigate("/home");
              }}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-bold text-black hover:scale-[1.02] transition-transform"
            >
              Start listening
              <ArrowRight className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setSuccessPlan(null)}
              className="mt-2 w-full rounded-full py-2.5 text-xs font-semibold text-zinc-400 hover:text-white"
            >
              Stay on this page
            </button>
          </div>
        </div>
      )}

      {/* Cancel confirmation */}
      {showCancel && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={() => setShowCancel(false)}>
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#181818] p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <h2 className="text-lg font-black text-white">Cancel your paid plan?</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              You will return to the ad-supported Normal plan immediately and lose downloads,
              offline listening and ad-free playback.
            </p>
            {localError && <p className="mt-3 text-xs text-red-400">{localError}</p>}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={handleCancelPlan}
                disabled={isChanging}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-red-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-400 disabled:opacity-60"
              >
                {isChanging && <Loader2 className="size-4 animate-spin" />}
                Yes, cancel
              </button>
              <button
                type="button"
                onClick={() => setShowCancel(false)}
                className="flex-1 rounded-full border border-white/20 px-4 py-2.5 text-sm font-bold text-white hover:border-white/60"
              >
                Keep plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
