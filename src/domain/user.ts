export type UserRole = "parent" | "child";

export type ParentUser = {
  id: string;
  fullName: string;
  email: string;
  role: "parent";
  createdAt: string;
};

export type ChildProfile = {
  id: string;
  householdId: string;
  displayName: string;
  username: string;
  role: "child";
  avatarUrl: string | null;
  createdAt: string;
};

export type UserProfile = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  createdAt: string;
};
