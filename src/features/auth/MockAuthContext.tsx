import { createContext, PropsWithChildren, useContext, useMemo, useReducer } from "react";

import { ChildProfile, Household, ParentUser } from "@/domain";

type MockParentAccount = ParentUser & {
  password: string;
};

type AuthResult = {
  error?: string;
  needsHousehold?: boolean;
  ok: boolean;
};

type HouseholdSetupInput = {
  childDisplayName: string;
  childUsername: string;
  householdName: string;
};

type ParentSignupInput = {
  email: string;
  fullName: string;
  password: string;
};

type AuthState = {
  activeHouseholdId: string | null;
  childProfiles: ChildProfile[];
  currentChild: ChildProfile | null;
  currentParent: ParentUser | null;
  households: Household[];
  parents: MockParentAccount[];
};

type AuthContextValue = AuthState & {
  continueDemoChild: () => void;
  continueDemoParent: () => void;
  createHousehold: (input: HouseholdSetupInput) => AuthResult;
  loginParent: (email: string, password: string) => AuthResult;
  signUpParent: (input: ParentSignupInput) => AuthResult;
};

type AuthAction =
  | { type: "continueDemoChild" }
  | { type: "continueDemoParent" }
  | { type: "createHousehold"; childProfile: ChildProfile; household: Household }
  | { type: "loginParent"; parent: MockParentAccount }
  | { type: "signUpParent"; parent: MockParentAccount };

const DEMO_PARENT: MockParentAccount = {
  createdAt: "2026-05-13T08:00:00.000Z",
  email: "demo-parent@bloom.local",
  fullName: "Demo Parent",
  id: "demo-parent",
  password: "demo",
  role: "parent"
};

const DEMO_HOUSEHOLD: Household = {
  createdAt: "2026-05-13T08:00:00.000Z",
  createdBy: DEMO_PARENT.id,
  id: "demo-household",
  name: "Demo Household"
};

const DEMO_CHILD: ChildProfile = {
  avatarUrl: null,
  createdAt: "2026-05-13T08:00:00.000Z",
  displayName: "Maya",
  householdId: DEMO_HOUSEHOLD.id,
  id: "demo-child",
  role: "child",
  username: "maya"
};

const MockAuthContext = createContext<AuthContextValue | null>(null);

const initialState: AuthState = {
  activeHouseholdId: null,
  childProfiles: [DEMO_CHILD],
  currentChild: null,
  currentParent: null,
  households: [DEMO_HOUSEHOLD],
  parents: [DEMO_PARENT]
};

export function MockAuthProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      continueDemoChild: () => {
        console.log("demo child selected", DEMO_CHILD.username);
        dispatch({ type: "continueDemoChild" });
      },
      continueDemoParent: () => {
        console.log("demo parent selected", DEMO_PARENT.email);
        dispatch({ type: "continueDemoParent" });
      },
      createHousehold: (input) => {
        const householdName = input.householdName.trim();
        const childDisplayName = input.childDisplayName.trim();
        const childUsername = input.childUsername.trim().toLowerCase();

        if (!state.currentParent) {
          return { error: "Create or log into a parent account first.", ok: false };
        }

        if (!householdName || !childDisplayName || !childUsername) {
          return { error: "Add a household name, child display name, and child username.", ok: false };
        }

        const usernameExists = state.childProfiles.some((child) => child.username.toLowerCase() === childUsername);

        if (usernameExists) {
          return { error: "That child username is already in use in this mock session.", ok: false };
        }

        const now = new Date().toISOString();
        const household: Household = {
          createdAt: now,
          createdBy: state.currentParent.id,
          id: createId("household"),
          name: householdName
        };
        const childProfile: ChildProfile = {
          avatarUrl: null,
          createdAt: now,
          displayName: childDisplayName,
          householdId: household.id,
          id: createId("child"),
          role: "child",
          username: childUsername
        };

        console.log("mock household created", household.name);
        console.log("mock child profile created", childProfile.username);
        dispatch({ childProfile, household, type: "createHousehold" });
        return { ok: true };
      },
      loginParent: (email, password) => {
        const submittedEmail = email.trim().toLowerCase();
        const parent = state.parents.find((item) => item.email.toLowerCase() === submittedEmail && item.password === password);

        if (!parent) {
          return { error: "No mock parent account found. Sign up first or use demo parent.", ok: false };
        }

        const hasHousehold = state.households.some((household) => household.createdBy === parent.id);
        dispatch({ parent, type: "loginParent" });
        return { needsHousehold: !hasHousehold, ok: true };
      },
      signUpParent: (input) => {
        const email = input.email.trim().toLowerCase();
        const fullName = input.fullName.trim();

        if (!fullName || !email || input.password.length < 4) {
          return { error: "Add a full name, email, and password of at least 4 characters.", ok: false };
        }

        const exists = state.parents.some((item) => item.email.toLowerCase() === email);

        if (exists) {
          console.log("mock signup blocked: account exists", email);
          return { error: "A mock parent account already exists for this email. Use Login instead.", ok: false };
        }

        const parent: MockParentAccount = {
          createdAt: new Date().toISOString(),
          email,
          fullName,
          id: createId("parent"),
          password: input.password,
          role: "parent"
        };

        console.log("mock user created", parent.email);
        dispatch({ parent, type: "signUpParent" });
        return { needsHousehold: true, ok: true };
      }
    }),
    [state]
  );

  return <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>;
}

export function useMockAuth() {
  const context = useContext(MockAuthContext);

  if (!context) {
    throw new Error("useMockAuth must be used inside MockAuthProvider");
  }

  return context;
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "continueDemoChild":
      return {
        ...state,
        activeHouseholdId: DEMO_HOUSEHOLD.id,
        currentChild: DEMO_CHILD,
        currentParent: null
      };

    case "continueDemoParent":
      return {
        ...state,
        activeHouseholdId: DEMO_HOUSEHOLD.id,
        currentChild: null,
        currentParent: stripPassword(DEMO_PARENT)
      };

    case "createHousehold":
      return {
        ...state,
        activeHouseholdId: action.household.id,
        childProfiles: [...state.childProfiles, action.childProfile],
        households: [...state.households, action.household]
      };

    case "loginParent":
      return {
        ...state,
        activeHouseholdId: state.households.find((household) => household.createdBy === action.parent.id)?.id ?? null,
        currentChild: null,
        currentParent: stripPassword(action.parent)
      };

    case "signUpParent":
      return {
        ...state,
        activeHouseholdId: null,
        currentChild: null,
        currentParent: stripPassword(action.parent),
        parents: [...state.parents, action.parent]
      };

    default:
      return state;
  }
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function stripPassword(parent: MockParentAccount): ParentUser {
  return {
    createdAt: parent.createdAt,
    email: parent.email,
    fullName: parent.fullName,
    id: parent.id,
    role: parent.role
  };
}
