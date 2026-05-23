export type EvidenceStatus = "pending" | "approved" | "rejected";

export type EvidenceSubmission = {
  id: string;
  assignmentId: string;
  childId: string;
  photoUrl: string | null;
  note: string | null;
  status: EvidenceStatus;
  reviewStatus: EvidenceStatus;
  submittedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
};
