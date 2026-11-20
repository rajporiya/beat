import crypto from "node:crypto";

const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

export const razorpayConfig = () => ({
  keyId: (process.env.RAZORPAY_API_KEY || process.env.RAZORPAY_KEY_ID || "").trim(),
  keySecret: (process.env.RAZORPAY_API_SECRET || process.env.RAZORPAY_KEY_SECRET || "").trim(),
  webhookSecret: (process.env.RAZORPAY_WEBHOOK_SECRET || "").trim(),
});

export const isRazorpayConfigured = () => {
  const { keyId, keySecret } = razorpayConfig();
  return Boolean(keyId && keySecret);
};

const authorizationHeader = () => {
  const { keyId, keySecret } = razorpayConfig();
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
};

export const razorpayRequest = async (path, { method = "GET", body } = {}) => {
  const response = await fetch(`${RAZORPAY_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: authorizationHeader(),
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const description =
      data?.error?.description ||
      data?.error?.reason ||
      `Razorpay request failed with status ${response.status}`;
    const error = new Error(description);
    error.status = response.status >= 500 ? 502 : 400;
    error.gatewayStatus = response.status;
    error.gatewayCode = data?.error?.code;
    throw error;
  }

  return data;
};

export const createRazorpayOrder = (payload) =>
  razorpayRequest("/orders", { method: "POST", body: payload });

export const fetchRazorpayOrder = (orderId) =>
  razorpayRequest(`/orders/${encodeURIComponent(orderId)}`);

export const fetchRazorpayPayment = (paymentId) =>
  razorpayRequest(`/payments/${encodeURIComponent(paymentId)}`);

const safeEqual = (left, right) => {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

/** Verifies the `razorpay_signature` returned by Razorpay Checkout. */
export const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
  const { keySecret } = razorpayConfig();
  if (!keySecret || !orderId || !paymentId || !signature) return false;
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return safeEqual(expected, signature);
};

/** Verifies the `x-razorpay-signature` header on webhook requests. */
export const verifyWebhookSignature = (rawBody, signature) => {
  const { webhookSecret } = razorpayConfig();
  if (!webhookSecret || !signature) return false;
  const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
};

export const toPaise = (rupees) => Math.round(Number(rupees) * 100);
