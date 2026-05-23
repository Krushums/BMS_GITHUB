export type TaskCadence = "once" | "daily" | "weekly";
export type TaskStatus = "open" | "submitted" | "approved" | "rejected" | "cancelled";

export type TaskCategory = "home" | "school" | "wellbeing" | "responsibility";

export type Task = {
  id: string;
  householdId: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  cadence: TaskCadence;
  recurrenceType: TaskCadence;
  pointValue: number;
  createdBy: string;
  createdAt: string;
};

export type TaskAssignment = {
  id: string;
  taskId: string;
  childId: string;
  createdAt: string;
  dueDate: string | null;
  status: TaskStatus;
  completedAt: string | null;
  archivedAt: string | null;
};
