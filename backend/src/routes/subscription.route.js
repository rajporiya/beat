import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  cancelSubscription,
  createSubscriptionOrder,
  getDownloadHistory,
  getMySubscription,
  getPlans,
  subscribe,
  verifySubscriptionPayment,
} from "../controller/subscription.controller.js";

const router = Router();

router.get("/plans", getPlans);
router.get("/me", protectRoute, getMySubscription);
router.post("/subscribe", protectRoute, subscribe);

// Razorpay checkout: create an order, then verify the signed payment result.
router.post("/razorpay/order", protectRoute, createSubscriptionOrder);
router.post("/razorpay/verify", protectRoute, verifySubscriptionPayment);

router.post("/cancel", protectRoute, cancelSubscription);
router.get("/downloads", protectRoute, getDownloadHistory);

export default router;
