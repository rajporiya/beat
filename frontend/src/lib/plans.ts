export type PlanId = "free" | "basic" | "premium" | "pro";
export type BillingCycle = "monthly" | "yearly";

export interface Entitlements {
  adsFree: boolean;
  allSongs: boolean;
  unlimitedSkips: boolean;
  lyrics: boolean;
  offline: boolean;
  songDownloads: boolean;
  podcastDownloads: boolean;
  videoDownloads: boolean;
  audioQuality: string;
  hiRes: boolean;
  earlyAccess: boolean;
  proBadge: boolean;
  devices: number | string;
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  subtitle: string;
  currency: string;
  prices: { monthly: number; yearly: number };
  entitlements: Entitlements;
  features: string[];
}

export const PLAN_ORDER: PlanId[] = ["free", "basic", "premium", "pro"];

/** Plans shown on the pricing page. Normal/free remains the default account state. */
export const PAID_PLAN_ORDER: PlanId[] = ["basic", "premium", "pro"];

/** Local fallback so the pricing page still renders if the API is offline. */
export const FALLBACK_PLANS: PlanDefinition[] = [
  {
    id: "free",
    name: "Normal",
    subtitle: "Free, ad-supported listening",
    currency: "INR",
    prices: { monthly: 0, yearly: 0 },
    entitlements: {
      adsFree: false,
      allSongs: true,
      unlimitedSkips: false,
      lyrics: false,
      offline: false,
      songDownloads: false,
      podcastDownloads: false,
      videoDownloads: false,
      audioQuality: "Standard",
      hiRes: false,
      earlyAccess: false,
      proBadge: false,
      devices: 1,
    },
    features: [
      "Listen to all songs, podcasts & videos",
      "Standard audio quality",
      "Shuffle play",
      "Ads between songs",
      "1 device",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    subtitle: "Ad-free music for everyday listening",
    currency: "INR",
    prices: { monthly: 59, yearly: 590 },
    entitlements: {
      adsFree: true,
      allSongs: true,
      unlimitedSkips: true,
      lyrics: true,
      offline: false,
      songDownloads: false,
      podcastDownloads: false,
      videoDownloads: false,
      audioQuality: "Standard",
      hiRes: false,
      earlyAccess: false,
      proBadge: false,
      devices: 2,
    },
    features: [
      "Everything in Normal",
      "Ad-free listening on all songs",
      "Unlimited skips",
      "Full lyrics on every song",
      "Standard audio quality",
      "2 devices",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    subtitle: "Downloads, offline mode and high quality audio",
    currency: "INR",
    prices: { monthly: 149, yearly: 1490 },
    entitlements: {
      adsFree: true,
      allSongs: true,
      unlimitedSkips: true,
      lyrics: true,
      offline: true,
      songDownloads: true,
      podcastDownloads: false,
      videoDownloads: false,
      audioQuality: "High 320 kbps",
      hiRes: false,
      earlyAccess: false,
      proBadge: false,
      devices: 5,
    },
    features: [
      "Everything in Basic",
      "Download songs as MP3",
      "Offline listening",
      "High quality 320 kbps audio",
      "5 devices",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    subtitle: "Every download and every feature, without limits",
    currency: "INR",
    prices: { monthly: 299, yearly: 2990 },
    entitlements: {
      adsFree: true,
      allSongs: true,
      unlimitedSkips: true,
      lyrics: true,
      offline: true,
      songDownloads: true,
      podcastDownloads: true,
      videoDownloads: true,
      audioQuality: "Lossless Hi-Fi",
      hiRes: true,
      earlyAccess: true,
      proBadge: true,
      devices: "Unlimited",
    },
    features: [
      "Everything in Premium",
      "Download podcast audio",
      "Download video episodes",
      "Lossless Hi-Fi audio (24-bit)",
      "Early access to new drops",
      "Pro profile badge",
      "Unlimited devices",
    ],
  },
];

export const FREE_ENTITLEMENTS = FALLBACK_PLANS[0].entitlements;

export interface PlanMeta {
  label: string;
  badgeClass: string;
  ringClass: string;
  borderClass: string;
  textClass: string;
  gradientClass: string;
  accentClass: string;
  accentColor: string;
}

export const PLAN_META: Record<PlanId, PlanMeta> = {
  free: {
    label: "Normal",
    badgeClass: "border border-zinc-500/40 bg-zinc-500/15 text-zinc-300",
    ringClass: "ring-zinc-500/60",
    borderClass: "border-zinc-700/70",
    textClass: "text-zinc-300",
    gradientClass: "from-zinc-800/80 via-zinc-900 to-[#121212]",
    accentClass: "text-zinc-300",
    accentColor: "#a1a1aa",
  },
  basic: {
    label: "Basic",
    badgeClass: "border border-sky-400/40 bg-sky-500/15 text-sky-300",
    ringClass: "ring-sky-400/70",
    borderClass: "border-sky-500/40",
    textClass: "text-sky-300",
    gradientClass: "from-sky-950/80 via-zinc-900 to-[#121212]",
    accentClass: "text-sky-400",
    accentColor: "#38bdf8",
  },
  premium: {
    label: "Premium",
    badgeClass: "border border-emerald-400/40 bg-emerald-500/15 text-emerald-300",
    ringClass: "ring-emerald-400/70",
    borderClass: "border-emerald-500/50",
    textClass: "text-emerald-300",
    gradientClass: "from-emerald-950/80 via-zinc-900 to-[#121212]",
    accentClass: "text-emerald-400",
    accentColor: "#1ed760",
  },
  pro: {
    label: "Pro",
    badgeClass: "border border-amber-300/50 bg-gradient-to-r from-amber-300 to-orange-400 text-black",
    ringClass: "ring-amber-400/80",
    borderClass: "border-amber-400/60",
    textClass: "text-amber-300",
    gradientClass: "from-amber-950/70 via-zinc-900 to-[#121212]",
    accentClass: "text-amber-400",
    accentColor: "#fbbf24",
  },
};

export const PLAN_RANK: Record<PlanId, number> = {
  free: 0,
  basic: 1,
  premium: 2,
  pro: 3,
};

export const isPlanId = (value: unknown): value is PlanId =>
  typeof value === "string" && PLAN_ORDER.includes(value as PlanId);

export const planRank = (plan: PlanId) => PLAN_RANK[plan] ?? 0;

export const isPlanAtLeast = (plan: PlanId, required: PlanId) =>
  planRank(plan) >= planRank(required);

export const planById = (plans: PlanDefinition[], id: PlanId) =>
  plans.find((plan) => plan.id === id) ??
  FALLBACK_PLANS.find((plan) => plan.id === id) ??
  FALLBACK_PLANS[0];

export const formatPrice = (value: number) =>
  value === 0 ? "Free" : `₹${value.toLocaleString("en-IN")}`;

export const planPeriodLabel = (cycle: BillingCycle) =>
  cycle === "yearly" ? "year" : "month";

/** Generic sample MP4 used for demo video downloads when an episode has no file. */
export const DEMO_VIDEO_URL =
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
