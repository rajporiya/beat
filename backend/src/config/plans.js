/**
 * BeatMusic subscription plans.
 *
 * `free` is the normal (ad-supported) account. Paid plans unlock features
 * through the `entitlements` object, which is the single source of truth for
 * both the API and the web player.
 */
export const PLAN_ORDER = ["free", "basic", "premium", "pro"];

export const PLAN_CATALOG = {
  free: {
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
  basic: {
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
  premium: {
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
  pro: {
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
};

export const getPlanDefinition = (planId) => PLAN_CATALOG[planId] ?? PLAN_CATALOG.free;

export const planList = () => PLAN_ORDER.map((id) => PLAN_CATALOG[id]);

export const planEntitlements = (planId) => getPlanDefinition(planId).entitlements;

/** Treat expired paid plans as the free plan. */
export const resolveUserPlan = (user) => {
  if (!user) return "free";
  const plan = PLAN_CATALOG[user.plan] ? user.plan : "free";
  if (plan === "free") return "free";
  if (user.planExpiresAt && new Date(user.planExpiresAt).getTime() < Date.now()) return "free";
  return plan;
};

const DOWNLOAD_ENTITLEMENT = {
  song: "songDownloads",
  podcast: "podcastDownloads",
  video: "videoDownloads",
};

export const canDownload = (planId, type) => {
  const entitlement = DOWNLOAD_ENTITLEMENT[type];
  if (!entitlement) return false;
  return Boolean(planEntitlements(planId)[entitlement]);
};

/** The lowest plan that unlocks a given download type. */
export const minimumPlanForDownload = (type) =>
  type === "song" ? "premium" : "pro";
