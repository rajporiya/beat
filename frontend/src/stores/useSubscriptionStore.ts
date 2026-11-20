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
import {
  loadRazorpayCheckout,
  openRazorpayCheckout,
  type RazorpaySuccessResponse,
} from "@/lib/razorpay";
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

    const applyCheckoutResult = (data: any, fallbackPlan: PlanId) => {
      const nextPlan: PlanId = isPlanId(data?.plan) ? data.plan : fallbackPlan;
      const definition = planById(get().plans, nextPlan);
      set({
        plan: nextPlan,
        entitlements: (data?.entitlements as Entitlements) ?? definition.entitlements,
        subscription: data?.subscription ?? null,
        isChanging: false,
        error: null,
      });
      applyPlanToAuthUser(nextPlan, data?.subscription?.currentPeriodEnd ?? null);
    };

    try {
      let order: any;
      try {
        const orderRes = await axiosInstance.post("/subscription/razorpay/order", {
          planId,
          billingCycle,
        });
        order = orderRes.data?.data;
      } catch (error: any) {
        // Deployments without Razorpay keys keep the old instant-activation flow.
        if (error?.response?.data?.code === "RAZORPAY_NOT_CONFIGURED") {
          const demoRes = await axiosInstance.post("/subscription/subscribe", { planId, billingCycle });
          applyCheckoutResult(demoRes.data?.data, planId);
          await get().fetchSubscription();
          return true;
        }
        throw error;
      }

      if (!order?.orderId || !order?.keyId) {
        throw new Error("Could not start the Razorpay checkout. Please try again.");
      }

      await loadRazorpayCheckout();

      const outcome = await new Promise<{ ok: boolean; message?: string; data?: any }>((resolve) => {
        let settled = false;
        let paymentSucceeded = false;

        const finish = (result: { ok: boolean; message?: string; data?: any }) => {
          if (settled) return;
          settled = true;
          resolve(result);
        };

        const checkout = openRazorpayCheckout({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency || "INR",
          name: "BeatMusic",
          description: `${order.planName ?? planId} plan · ${billingCycle}`,
          order_id: order.orderId,
          prefill: {
            name: order.prefill?.name ?? "",
            email: order.prefill?.email ?? "",
          },
          notes: { planId, billingCycle },
          theme: { color: "#1ed760" },
          handler: async (response: RazorpaySuccessResponse) => {
            paymentSucceeded = true;
            try {
              const verifyRes = await axiosInstance.post("/subscription/razorpay/verify", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              finish({ ok: true, data: verifyRes.data?.data });
            } catch (error: any) {
              finish({
                ok: false,
                message:
                  error?.response?.data?.message ??
                  "The payment went through but verification failed. Please contact support.",
              });
            }
          },
          modal: {
            ondismiss: () => {
              if (!paymentSucceeded) {
                finish({ ok: false, message: "Checkout was closed before the payment was completed." });
              }
            },
          },
        });

        checkout.on("payment.failed", (response) => {
          const failure = response as { error?: { description?: string } };
          finish({
            ok: false,
            message: failure?.error?.description ?? "The payment failed. Please try again.",
          });
        });
      });

      if (!outcome.ok) {
        throw new Error(outcome.message ?? "Payment could not be completed");
      }

      applyCheckoutResult(outcome.data, planId);
      await get().fetchSubscription();
      return true;
    } catch (error: any) {
      set({
        isChanging: false,
        error:
          error?.response?.data?.message ??
          error?.message ??
          "Could not activate your plan. Please try again.",
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
