import { axiosInstance } from "@/lib/axios";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  FALLBACK_PLANS,
  FREE_ENTITLEMENTS,
  isPlanId,
  planById,
  type BillingCycle,
  type Entitlements,
  type PlanDefinition,
  type PlanId,
} from "@/lib/plans";
import { create } from "zustand";

export interface SubscriptionRecord {
  _id: string;
  plan: PlanId;
  billingCycle: BillingCycle;
  status: "active" | "canceled" | "expired";
  amount: number;
  currency: string;
  paymentId: string;
  autoRenew: boolean;
  startedAt: string;
  currentPeriodEnd: string;
  canceledAt?: string | null;
  createdAt: string;
}

export interface DownloadRecord {
  _id: string;
  type: "song" | "podcast" | "video";
  title: string;
  filename: string;
  plan: PlanId;
  createdAt: string;
}

interface SubscriptionStore {
  plans: PlanDefinition[];
  plan: PlanId;
  entitlements: Entitlements;
  subscription: SubscriptionRecord | null;
  history: SubscriptionRecord[];
  downloads: DownloadRecord[];
  isLoading: boolean;
  isChanging: boolean;
  error: string | null;

  fetchPlans: () => Promise<void>;
  fetchSubscription: () => Promise<void>;
  fetchDownloads: () => Promise<void>;
  subscribe: (planId: PlanId, billingCycle: BillingCycle) => Promise<boolean>;
  cancel: () => Promise<boolean>;
  reset: () => void;
}

const applyPlanToAuthUser = (plan: PlanId, expiresAt?: string | null) => {
  const { user, setUser } = useAuthStore.getState();
  if (!user) return;
  const nextExpiry = expiresAt ?? null;
  if (user.plan === plan && (user.planExpiresAt ?? null) === nextExpiry) return;
  setUser({ ...user, plan, planExpiresAt: nextExpiry });
};

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  plans: FALLBACK_PLANS,
  plan: "free",
  entitlements: FREE_ENTITLEMENTS,
  subscription: null,
  history: [],
  downloads: [],
  isLoading: false,
  isChanging: false,
  error: null,

  fetchPlans: async () => {
    try {
      const res = await axiosInstance.get("/subscription/plans");
      const plans = res.data?.data?.plans;
      if (Array.isArray(plans) && plans.length) {
        set({ plans });
      }
    } catch {
      // Keep the local catalog when the API is unreachable.
    }
  },

  fetchSubscription: async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("beat_token") : null;
    if (!token) {
      set({
        plan: "free",
        entitlements: FREE_ENTITLEMENTS,
        subscription: null,
        history: [],
        downloads: [],
      });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.get("/subscription/me");
      const data = res.data?.data;
      const plan: PlanId = isPlanId(data?.plan) ? data.plan : "free";
      const definition = planById(get().plans, plan);
      set({
        plan,
        entitlements: (data?.entitlements as Entitlements) ?? definition.entitlements,
        subscription: data?.subscription ?? null,
        history: Array.isArray(data?.history) ? data.history : [],
        isLoading: false,
        error: null,
      });
      applyPlanToAuthUser(plan, data?.subscription?.currentPeriodEnd ?? null);
    } catch (error: any) {
      set({ isLoading: false });
      if (error?.response?.status === 401) {
        set({
          plan: "free",
          entitlements: FREE_ENTITLEMENTS,
          subscription: null,
          history: [],
          downloads: [],
        });
      }
    }
  },

  fetchDownloads: async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("beat_token") : null;
    if (!token) return;
    try {
      const res = await axiosInstance.get("/subscription/downloads");
      set({ downloads: Array.isArray(res.data?.data) ? res.data.data : [] });
    } catch {
      // Download history is non-critical.
    }
  },

  subscribe: async (planId, billingCycle) => {
    set({ isChanging: true, error: null });
    try {
      const res = await axiosInstance.post("/subscription/subscribe", {
        planId,
        billingCycle,
      });
      const data = res.data?.data;
      const plan: PlanId = isPlanId(data?.plan) ? data.plan : planId;
      const definition = planById(get().plans, plan);

      set({
        plan,
        entitlements: (data?.entitlements as Entitlements) ?? definition.entitlements,
        subscription: data?.subscription ?? null,
        isChanging: false,
        error: null,
      });
      applyPlanToAuthUser(plan, data?.subscription?.currentPeriodEnd ?? null);
      await get().fetchSubscription();
      return true;
    } catch (error: any) {
      set({
        isChanging: false,
        error: error?.response?.data?.message ?? "Could not activate your plan. Please try again.",
      });
      return false;
    }
  },

  cancel: async () => {
    set({ isChanging: true, error: null });
    try {
      await axiosInstance.post("/subscription/cancel");
      set({
        plan: "free",
        entitlements: FREE_ENTITLEMENTS,
        subscription: null,
        isChanging: false,
        error: null,
      });
      applyPlanToAuthUser("free", null);
      await get().fetchSubscription();
      return true;
    } catch (error: any) {
      set({
        isChanging: false,
        error: error?.response?.data?.message ?? "Could not cancel your plan. Please try again.",
      });
      return false;
    }
  },

  reset: () => {
    set({
      plans: FALLBACK_PLANS,
      plan: "free",
      entitlements: FREE_ENTITLEMENTS,
      subscription: null,
      history: [],
      downloads: [],
      isLoading: false,
      isChanging: false,
      error: null,
    });
  },
}));
