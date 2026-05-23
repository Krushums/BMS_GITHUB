export type PointsTransactionType =
  | "task_reward"
  | "behaviour_adjustment"
  | "reward_redemption"
  | "manual_adjustment";

export type PointsTransaction = {
  id: string;
  householdId: string;
  childId: string;
  amount: number;
  type: PointsTransactionType;
  category: string;
  sourceTaskId: string | null;
  sourceRewardId: string | null;
  reason: string;
  note: string | null;
  createdAt: string;
  reversedAt: string | null;
  deletedAt: string | null;
};
