import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    plan: { type: String, enum: ["basic", "premium", "pro"], required: true },
    billingCycle: { type: String, enum: ["monthly", "yearly"], default: "monthly" },
    status: { type: String, enum: ["active", "canceled", "expired"], default: "active", index: true },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    paymentId: { type: String, required: true },
    autoRenew: { type: Boolean, default: true },
    startedAt: { type: Date, default: Date.now },
    currentPeriodEnd: { type: Date, required: true },
    canceledAt: Date,
  },
  { timestamps: true },
);

subscriptionSchema.index({ user: 1, createdAt: -1 });

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
