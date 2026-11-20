import mongoose from "mongoose";

/**
 * A Razorpay order created by the backend before checkout opens. It keeps the
 * plan the user is paying for, so the verification step never has to trust the
 * plan or amount sent back by the browser.
 */
const paymentOrderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    orderId: { type: String, required: true, unique: true, index: true },
    plan: { type: String, enum: ["basic", "premium", "pro"], required: true },
    billingCycle: { type: String, enum: ["monthly", "yearly"], default: "monthly" },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["created", "paid", "failed"], default: "created", index: true },
    gateway: { type: String, default: "razorpay" },
    paymentId: String,
    signature: String,
  },
  { timestamps: true },
);

paymentOrderSchema.index({ user: 1, createdAt: -1 });

export const PaymentOrder = mongoose.model("PaymentOrder", paymentOrderSchema);
