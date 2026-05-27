export type HomeworkStatus = "not_started" | "in_progress" | "completed" | "incomplete" | "not_applicable";

export type HomeworkItem = {
  id: string;
  childId: string;
  title: string;
  subject: string;
  description: string | null;
  assignedAt: string;
  createdAt: string;
  dueAt: string;
  dueDate: string;
  status: HomeworkStatus;
  estimatedEffortMinutes: number | null;
  createdBy: string;
  completedAt: string | null;
  completedDate: string | null;
  submittedAt: string | null;
  updatedAt: string;
  deletedAt: string | null;
};

export type HomeworkSession = {
  id: string;
  homeworkId: string;
  startedAt: string;
  durationMinutes: number;
  notes: string | null;
  deletedAt: string | null;
};

export type HomeworkEvidence = {
  id: string;
  homeworkId: string;
  imageUri: string | null;
  submittedAt: string;
  comment: string | null;
  deletedAt: string | null;
};
