import crypto from "node:crypto";
import { User } from "../models/user.models.js";
import { Subscription } from "../models/subscription.models.js";
import { Download } from "../models/download.models.js";
import {
  PLAN_CATALOG,
  getPlanDefinition,
  planEntitlements,
  planList,
  resolveUserPlan,
} from "../config/plans.js";
import { asyncHandler, fail, ok } from "../utils/api.js";

const addPeriod = (date, billingCycle) => {
  const next = new Date(date);
  if (billingCycle === "yearly") next.setFullYear(next.getFullYear() + 1);
  else next.setMonth(next.getMonth() + 1);
  return next;
};

const subscriptionPayload = async (user) => {
  const plan = resolveUserPlan(user);
  const subscription = await Subscription.findOne({ user: user._id, status: "active" }).sort({ createdAt: -1 });
  return {
    plan,
    definition: getPlanDefinition(plan),
    entitlements: planEntitlements(plan),
    subscription,
  };
};

export const getPlans = asyncHandler(async (_req, res) => {
  ok(res, { plans: planList() }, "Plans fetched");
});

export const getMySubscription = asyncHandler(async (req, res) => {
  const payload = await subscriptionPayload(req.user);
  const history = await Subscription.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(10);
  ok(res, { ...payload, history }, "Subscription fetched");
});

export const subscribe = asyncHandler(async (req, res) => {
  const planId = req.body?.planId ?? req.body?.plan;
  const billingCycle = req.body?.billingCycle === "yearly" ? "yearly" : "monthly";

  if (!planId || planId === "free" || !["basic", "premium", "pro"].includes(planId)) {
    throw fail(422, "Choose a valid paid plan: basic, premium or pro");
  }

  const definition = PLAN_CATALOG[planId];
  const now = new Date();
  const currentPeriodEnd = addPeriod(now, billingCycle);
  const amount = definition.prices[billingCycle];

  // Only one active subscription at a time.
  await Subscription.updateMany(
    { user: req.user._id, status: "active" },
    { $set: { status: "canceled", canceledAt: now, autoRenew: false } },
  );

  const subscription = await Subscription.create({
    user: req.user._id,
    plan: planId,
    billingCycle,
    status: "active",
    amount,
    currency: definition.currency,
    paymentId: `pay_demo_${crypto.randomBytes(8).toString("hex")}`,
    startedAt: now,
    currentPeriodEnd,
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        plan: planId,
        planBillingCycle: billingCycle,
        planStartedAt: now,
        planExpiresAt: currentPeriodEnd,
        planCanceledAt: null,
      },
    },
    { new: true },
  ).select("-password");

  ok(
    res,
    {
      ...(await subscriptionPayload(user)),
      user: { id: user._id, plan: user.plan, planExpiresAt: user.planExpiresAt },
    },
    `Subscription activated — welcome to ${definition.name}`,
    201,
  );
});

export const cancelSubscription = asyncHandler(async (req, res) => {
  const now = new Date();
  const active = await Subscription.findOne({ user: req.user._id, status: "active" });

  if (!active) {
    throw fail(404, "You do not have an active paid subscription");
  }

  active.status = "canceled";
  active.canceledAt = now;
  active.autoRenew = false;
  await active.save();

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        plan: "free",
        planBillingCycle: "monthly",
        planStartedAt: null,
        planExpiresAt: null,
        planCanceledAt: now,
      },
    },
    { new: true },
  ).select("-password");

  ok(res, { ...(await subscriptionPayload(user)), canceledAt: now }, "Plan canceled — you are back on Normal");
});

export const getDownloadHistory = asyncHandler(async (req, res) => {
  const downloads = await Download.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30);
  ok(res, downloads, "Download history fetched");
});
