import crypto from "node:crypto";
import { User } from "../models/user.models.js";
import { Subscription } from "../models/subscription.models.js";
import { PaymentOrder } from "../models/paymentOrder.models.js";
import { Download } from "../models/download.models.js";
import {
  PLAN_CATALOG,
  getPlanDefinition,
  planEntitlements,
  planList,
  resolveUserPlan,
} from "../config/plans.js";
import { asyncHandler, fail, ok } from "../utils/api.js";
import {
  createRazorpayOrder,
  fetchRazorpayOrder,
  fetchRazorpayPayment,
  isRazorpayConfigured,
  razorpayConfig,
  toPaise,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from "../lib/razorpay.js";

const PAID_PLANS = ["basic", "premium", "pro"];

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

const parseCheckoutRequest = (body) => {
  const planId = body?.planId ?? body?.plan;
  const billingCycle = body?.billingCycle === "yearly" ? "yearly" : "monthly";

  if (!planId || !PAID_PLANS.includes(planId)) {
    throw fail(422, "Choose a valid paid plan: basic, premium or pro");
  }

  const definition = PLAN_CATALOG[planId];
  return {
    planId,
    billingCycle,
    definition,
    amount: definition.prices[billingCycle],
    currency: definition.currency,
  };
};

/**
 * Marks the user's previous plan as canceled, records the new subscription and
 * copies the plan state onto the user. Idempotent for a given Razorpay order.
 */
const activatePlan = async ({
  user,
  planId,
  billingCycle,
  paymentId,
  orderId,
  signature,
  gateway = "razorpay",
  method,
}) => {
  const definition = PLAN_CATALOG[planId];
  const now = new Date();
  const currentPeriodEnd = addPeriod(now, billingCycle);

  if (orderId) {
    const existing = await Subscription.findOne({ orderId });
    if (existing) {
      const currentUser = await User.findById(user._id).select("-password");
      return { subscription: existing, user: currentUser, definition, alreadyProcessed: true };
    }
  }

  await Subscription.updateMany(
    { user: user._id, status: "active" },
    { $set: { status: "canceled", canceledAt: now, autoRenew: false } },
  );

  let subscription;
  try {
    subscription = await Subscription.create({
      user: user._id,
      plan: planId,
      billingCycle,
      status: "active",
      amount: definition.prices[billingCycle],
      currency: definition.currency,
      paymentId,
      orderId,
      signature,
      gateway,
      method,
      startedAt: now,
      currentPeriodEnd,
    });
  } catch (error) {
    // A duplicate key means the webhook and the checkout callback raced.
    if (error?.code === 11000 && orderId) {
      subscription = await Subscription.findOne({ orderId });
    } else {
      throw error;
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    user._id,
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

  return { subscription, user: updatedUser, definition };
};

const checkoutResponse = async (result) => ({
  ...(await subscriptionPayload(result.user)),
  user: {
    id: result.user._id,
    plan: result.user.plan,
    planExpiresAt: result.user.planExpiresAt,
  },
});

/** Completes an order that Razorpay has already confirmed. */
const fulfillOrder = async (record, { paymentId, signature, method }) => {
  const user = await User.findById(record.user);
  if (!user) throw fail(404, "The account for this payment no longer exists");

  const result = await activatePlan({
    user,
    planId: record.plan,
    billingCycle: record.billingCycle,
    paymentId,
    orderId: record.orderId,
    signature,
    gateway: "razorpay",
    method,
  });

  if (record.status !== "paid") {
    record.status = "paid";
    record.paymentId = paymentId;
    record.signature = signature;
    await record.save();
  }

  return result;
};

export const getPlans = asyncHandler(async (_req, res) => {
  ok(res, { plans: planList(), razorpayEnabled: isRazorpayConfigured() }, "Plans fetched");
});

export const getMySubscription = asyncHandler(async (req, res) => {
  const payload = await subscriptionPayload(req.user);
  const history = await Subscription.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(10);
  ok(res, { ...payload, history }, "Subscription fetched");
});

/**
 * Demo activation. Only available when Razorpay is not configured, so a real
 * deployment can never hand out paid plans for free.
 */
export const subscribe = asyncHandler(async (req, res) => {
  if (isRazorpayConfigured()) {
    throw fail(409, "Razorpay checkout is enabled. Start a payment with /api/subscription/razorpay/order.");
  }

  const { planId, billingCycle, definition } = parseCheckoutRequest(req.body);

  const result = await activatePlan({
    user: req.user,
    planId,
    billingCycle,
    paymentId: `pay_demo_${crypto.randomBytes(8).toString("hex")}`,
    gateway: "demo",
  });

  ok(res, await checkoutResponse(result), `Subscription activated — welcome to ${definition.name}`, 201);
});

/** Step 1: create a Razorpay order for the plan the user picked. */
export const createSubscriptionOrder = asyncHandler(async (req, res) => {
  if (!isRazorpayConfigured()) {
    throw fail(
      503,
      "Razorpay is not configured. Add RAZORPAY_API_KEY and RAZORPAY_API_SECRET to the backend .env file.",
      "RAZORPAY_NOT_CONFIGURED",
    );
  }

  const { planId, billingCycle, definition, amount, currency } = parseCheckoutRequest(req.body);

  const order = await createRazorpayOrder({
    amount: toPaise(amount),
    currency,
    receipt: `bm_${Date.now().toString(36)}_${crypto.randomBytes(3).toString("hex")}`,
    notes: {
      userId: String(req.user._id),
      planId,
      billingCycle,
    },
  });

  await PaymentOrder.create({
    user: req.user._id,
    orderId: order.id,
    plan: planId,
    billingCycle,
    amount: toPaise(amount),
    currency,
    status: "created",
  });

  ok(
    res,
    {
      keyId: razorpayConfig().keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      plan: planId,
      planName: definition.name,
      billingCycle,
      prefill: {
        name: req.user.fullName,
        email: req.user.email,
      },
    },
    "Razorpay order created",
    201,
  );
});

/** Step 2: verify the checkout signature and activate the plan. */
export const verifySubscriptionPayment = asyncHandler(async (req, res) => {
  if (!isRazorpayConfigured()) {
    throw fail(503, "Razorpay is not configured on this server.");
  }

  const orderId = String(req.body?.razorpay_order_id || req.body?.orderId || "").trim();
  const paymentId = String(req.body?.razorpay_payment_id || req.body?.paymentId || "").trim();
  const signature = String(req.body?.razorpay_signature || req.body?.signature || "").trim();

  if (!orderId || !paymentId || !signature) {
    throw fail(422, "Missing Razorpay payment reference (order, payment and signature are required)");
  }

  const record = await PaymentOrder.findOne({ orderId });
  if (!record) throw fail(404, "This payment order was not created by BeatMusic");
  if (String(record.user) !== String(req.user._id)) {
    throw fail(403, "This payment belongs to a different account");
  }

  // Idempotent: refreshing or double-calling must not create a second subscription.
  if (record.status === "paid") {
    const user = await User.findById(record.user).select("-password");
    if (!user) throw fail(404, "The account for this payment no longer exists");
    return ok(
      res,
      {
        ...(await subscriptionPayload(user)),
        user: { id: user._id, plan: user.plan, planExpiresAt: user.planExpiresAt },
      },
      "Payment already verified",
    );
  }

  if (!verifyPaymentSignature({ orderId, paymentId, signature })) {
    throw fail(400, "Payment signature verification failed");
  }

  const order = await fetchRazorpayOrder(orderId);
  if (Number(order.amount) !== Number(record.amount) || order.currency !== record.currency) {
    throw fail(422, "The Razorpay order does not match this plan's price");
  }

  const payment = await fetchRazorpayPayment(paymentId);
  if (payment.order_id !== orderId) {
    throw fail(422, "The payment does not belong to this order");
  }
  if (!["captured", "authorized"].includes(payment.status)) {
    throw fail(402, `Payment is ${payment.status}. Complete the payment to activate your plan.`);
  }

  const result = await fulfillOrder(record, {
    paymentId,
    signature,
    method: payment.method,
  });

  ok(
    res,
    await checkoutResponse(result),
    `Subscription activated — welcome to ${result.definition.name}`,
    201,
  );
});

/**
 * Optional server-to-server confirmation. Mounted with a raw body parser in
 * index.js so the HMAC can be checked against the exact bytes Razorpay sent.
 */
export const razorpayWebhook = asyncHandler(async (req, res) => {
  const signature = String(req.headers["x-razorpay-signature"] || "");
  const rawBody = Buffer.isBuffer(req.body)
    ? req.body
    : Buffer.from(typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {}));

  if (!verifyWebhookSignature(rawBody, signature)) {
    throw fail(400, "Invalid Razorpay webhook signature");
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch {
    throw fail(400, "Invalid Razorpay webhook payload");
  }

  const event = payload?.event;
  const payment = payload?.payload?.payment?.entity;
  const orderId = payment?.order_id;

  if (orderId && ["payment.captured", "payment.authorized", "order.paid"].includes(event)) {
    const record = await PaymentOrder.findOne({ orderId });
    if (record && record.status !== "paid") {
      await fulfillOrder(record, {
        paymentId: payment.id,
        signature,
        method: payment.method,
      });
    }
  }

  res.status(200).json({ success: true, message: "Webhook processed" });
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
