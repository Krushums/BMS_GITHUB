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

export type RewardRequestCategory = "experience" | "privilege" | "item" | "money" | "custom";

export type RewardRequestStatus = "pending_parent_review" | "approved_goal" | "denied" | "redeemed";

export type RewardRequest = {
  id: string;
  childId: string;
  householdId: string;
  title: string;
  description: string;
  category: RewardRequestCategory;
  suggestedPointTarget: number | null;
  parentPointTarget: number | null;
  eventDate: string | null;
  deadlineDate: string | null;
  conditions: string | null;
  parentNote: string | null;
  status: RewardRequestStatus;
  createdAt: string;
  reviewedAt: string | null;
  approvedAt: string | null;
  deniedAt: string | null;
};
