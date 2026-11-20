import { create } from "zustand";
import type { PlanId } from "@/lib/plans";

interface UpgradeStore {
  isOpen: boolean;
  requiredPlan: PlanId;
  feature: string;
  open: (requiredPlan: PlanId, feature: string) => void;
  close: () => void;
}

export const useUpgradeStore = create<UpgradeStore>((set) => ({
  isOpen: false,
  requiredPlan: "premium",
  feature: "This feature",
  open: (requiredPlan, feature) => set({ isOpen: true, requiredPlan, feature }),
  close: () => set({ isOpen: false }),
}));
