export type CalendarAudience = "child" | "parent";

export type CalendarCategory = "lesson" | "revision" | "event" | "exam";

export type CalendarRepeat = "none" | "daily" | "weekly" | "weekdays";

export type CalendarItemSource = "calendar" | "homework" | "reward_goal" | "task";

export type CalendarItem = {
  category: CalendarCategory;
  childId: string;
  createdAt: string;
  createdByParentId?: string | null;
  editable: boolean;
  endAt: string;
  id: string;
  location?: string | null;
  notes?: string | null;
  pointsOnComplete?: number | null;
  repeat: CalendarRepeat;
  requiresEvidence: boolean;
  source: CalendarItemSource;
  sourceId: string;
  startAt: string;
  title: string;
};

export type CalendarFormState = {
  category: CalendarCategory;
  date: string;
  endTime: string;
  notes: string;
  pointsOnComplete: string;
  repeat: CalendarRepeat;
  requiresEvidence: boolean;
  startTime: string;
  title: string;
};
