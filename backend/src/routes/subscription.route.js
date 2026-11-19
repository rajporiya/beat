import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  cancelSubscription,
  getDownloadHistory,
  getMySubscription,
  getPlans,
  subscribe,
} from "../controller/subscription.controller.js";

const router = Router();

router.get("/plans", getPlans);
router.get("/me", protectRoute, getMySubscription);
router.post("/subscribe", protectRoute, subscribe);
router.post("/cancel", protectRoute, cancelSubscription);
router.get("/downloads", protectRoute, getDownloadHistory);

export default router;
