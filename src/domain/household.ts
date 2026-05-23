import { UserRole } from "@/domain/user";

export type Household = {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
};

export type HouseholdMember = {
  householdId: string;
  userId: string;
  role: UserRole;
  joinedAt: string;
};
