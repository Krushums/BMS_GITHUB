export type StreakCadence = "daily" | "weekly";

export type Streak = {
  id: string;
  childId: string;
  cadence: StreakCadence;
  currentCount: number;
  bestCount: number;
  lastActivityDate: string | null;
  updatedAt: string;
};
