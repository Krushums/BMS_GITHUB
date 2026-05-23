export type Reward = {
  id: string;
  householdId: string;
  title: string;
  description: string | null;
  pointCost: number;
  tier?: "quick" | "weekly" | "big";
  rewardType?: "small" | "medium" | "big";
  limit?: "once_per_day" | "once_per_week" | "save_up" | "unlimited";
  unlockLevel?: number | null;
  unlockStreak?: number | null;
  unlockLeague?: "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond" | null;
  requiresApproval: boolean;
  isActive: boolean;
  createdAt: string;
};

export type RewardRedemptionStatus = "requested" | "approved" | "rejected" | "fulfilled";

export type RewardRedemption = {
  id: string;
  rewardId: string;
  childId: string;
  status: RewardRedemptionStatus;
  requestedAt: string;
  reviewedAt: string | null;
};
