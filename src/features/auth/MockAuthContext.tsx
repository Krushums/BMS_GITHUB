import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useReducer, useState } from "react";

import { ChildProfile, Household, ParentUser } from "@/domain";

const STORAGE_KEY = "bloom.mockAuth.v2";

type MockParentAccount = ParentUser & {
  disabledAt: string | null;
  onboardingCompletedAt: string | null;
  password: string;
};

export type MockChildProfile = ChildProfile & {
  age?: string | null;
  starterAvatar?: StarterAvatar | null;
};

type MockAdminAccount = {
  email: string;
  id: string;
  name: string;
  role: "admin";
};

export type ActivityLogEntry = {
  createdAt: string;
  id: string;
  message: string;
  type: "account_created" | "child_created" | "homework_submitted" | "reward_redeemed" | "session" | "testing";
};

export type StarterAvatar = "Bunny" | "Fox" | "Cat" | "Owl";

type AuthResult = {
  error?: string;
  needsChild?: boolean;
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

type CreateChildInput = {
  age?: string;
  displayName: string;
  householdName?: string;
  starterAvatar: StarterAvatar;
};

type AuthState = {
  activeHouseholdId: string | null;
  activityLog: ActivityLogEntry[];
  childProfiles: MockChildProfile[];
  currentAdmin: MockAdminAccount | null;
  currentChild: MockChildProfile | null;
  currentParent: ParentUser | null;
  households: Household[];
  parents: MockParentAccount[];
  tourCompleted: {
    child: boolean;
    parent: boolean;
  };
};

type AuthContextValue = AuthState & {
  adminLogin: (email: string, password: string) => AuthResult;
  completeOnboarding: () => void;
  completeTour: (tour: "child" | "parent") => void;
  continueDemoChild: () => void;
  continueDemoParent: () => void;
  createChildProfile: (input: CreateChildInput) => AuthResult;
  createHousehold: (input: HouseholdSetupInput) => AuthResult;
  deleteAccount: (parentId: string) => void;
  disableAccount: (parentId: string) => void;
  getChildrenForHousehold: (householdId: string) => MockChildProfile[];
  loginParent: (email: string, password: string) => AuthResult;
  logout: () => void;
  resetMockData: () => void;
  signUpParent: (input: ParentSignupInput) => AuthResult;
  useDemoChildForCurrentParent: () => AuthResult;
};

type AuthAction =
  | { type: "adminLogin"; admin: MockAdminAccount }
  | { type: "completeOnboarding" }
  | { type: "completeTour"; tour: "child" | "parent" }
  | { type: "continueDemoChild" }
  | { type: "continueDemoParent" }
  | { type: "createChildProfile"; childProfile: MockChildProfile; household: Household }
  | { type: "createHousehold"; childProfile: MockChildProfile; household: Household }
  | { type: "deleteAccount"; parentId: string }
  | { type: "disableAccount"; parentId: string }
  | { type: "hydrate"; state: AuthState }
  | { type: "loginParent"; parent: MockParentAccount }
  | { type: "logout" }
  | { type: "resetMockData" }
  | { type: "signUpParent"; parent: MockParentAccount }
  | { type: "useDemoChildForCurrentParent"; childProfile: MockChildProfile; household: Household };

const MOCK_ADMIN = {
  email: "admin@bloom.local",
  id: "mock-admin",
  name: "Development Admin",
  password: "admin"
};

const DEMO_PARENT: MockParentAccount = {
  createdAt: "2026-05-13T08:00:00.000Z",
  disabledAt: null,
  email: "demo-parent@bloom.local",
  fullName: "Demo Parent",
  id: "demo-parent",
  onboardingCompletedAt: "2026-05-13T08:00:00.000Z",
  password: "demo",
  role: "parent"
};

const DEMO_HOUSEHOLD: Household = {
  createdAt: "2026-05-13T08:00:00.000Z",
  createdBy: DEMO_PARENT.id,
  id: "demo-household",
  name: "Demo Household"
};

const DEMO_CHILD: MockChildProfile = {
  age: "12",
  avatarUrl: null,
  createdAt: "2026-05-13T08:00:00.000Z",
  displayName: "Maya",
  householdId: DEMO_HOUSEHOLD.id,
  id: "demo-child",
  role: "child",
  starterAvatar: "Fox",
  username: "maya"
};

const MockAuthContext = createContext<AuthContextValue | null>(null);

const initialState: AuthState = {
  activeHouseholdId: null,
  activityLog: [
    {
      createdAt: DEMO_PARENT.createdAt,
      id: "activity-demo-account",
      message: "Demo account created",
      type: "account_created"
    },
    {
      createdAt: DEMO_CHILD.createdAt,
      id: "activity-demo-child",
      message: "Maya child profile created",
      type: "child_created"
    }
  ],
  childProfiles: [DEMO_CHILD],
  currentAdmin: null,
  currentChild: null,
  currentParent: null,
  households: [DEMO_HOUSEHOLD],
  parents: [DEMO_PARENT],
  tourCompleted: {
    child: false,
    parent: false
  }
};

export function MockAuthProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((rawState) => {
        if (!isMounted || !rawState) {
          return;
        }

        const parsed = JSON.parse(rawState) as AuthState;
        dispatch({ state: mergeWithDemoState(parsed), type: "hydrate" });
      })
      .catch((error) => {
        console.warn("mock auth storage load failed", error);
      })
      .finally(() => {
        if (isMounted) {
          setHasLoadedStorage(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage) {
      return;
    }

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch((error) => {
      console.warn("mock auth storage save failed", error);
    });
  }, [hasLoadedStorage, state]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      adminLogin: (email, password) => {
        const submittedEmail = email.trim().toLowerCase();

        if (submittedEmail !== MOCK_ADMIN.email || password !== MOCK_ADMIN.password) {
          return { error: "Admin login failed. Use the local development admin credentials.", ok: false };
        }

        dispatch({
          admin: {
            email: MOCK_ADMIN.email,
            id: MOCK_ADMIN.id,
            name: MOCK_ADMIN.name,
            role: "admin"
          },
          type: "adminLogin"
        });
        return { ok: true };
      },
      completeOnboarding: () => dispatch({ type: "completeOnboarding" }),
      completeTour: (tour) => dispatch({ tour, type: "completeTour" }),
      continueDemoChild: () => {
        dispatch({ type: "continueDemoChild" });
      },
      continueDemoParent: () => {
        dispatch({ type: "continueDemoParent" });
      },
      createChildProfile: (input) => {
        if (!state.currentParent) {
          return { error: "Log into a parent account first.", ok: false };
        }

        const displayName = input.displayName.trim();

        if (!displayName) {
          return { error: "Add your child's name.", ok: false };
        }

        const household = getOrCreateParentHousehold(state, state.currentParent.id, input.householdName);
        const username = createChildUsername(displayName, state.childProfiles);
        const now = new Date().toISOString();
        const childProfile: MockChildProfile = {
          age: input.age?.trim() || null,
          avatarUrl: null,
          createdAt: now,
          displayName,
          householdId: household.id,
          id: createId("child"),
          role: "child",
          starterAvatar: input.starterAvatar,
          username
        };

        dispatch({ childProfile, household, type: "createChildProfile" });
        return { ok: true };
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

        if (state.childProfiles.some((child) => child.username.toLowerCase() === childUsername)) {
          return { error: "That child username is already in use in this mock session.", ok: false };
        }

        const now = new Date().toISOString();
        const household: Household = {
          createdAt: now,
          createdBy: state.currentParent.id,
          id: createId("household"),
          name: householdName
        };
        const childProfile: MockChildProfile = {
          age: null,
          avatarUrl: null,
          createdAt: now,
          displayName: childDisplayName,
          householdId: household.id,
          id: createId("child"),
          role: "child",
          starterAvatar: "Fox",
          username: childUsername
        };

        dispatch({ childProfile, household, type: "createHousehold" });
        return { ok: true };
      },
      deleteAccount: (parentId) => dispatch({ parentId, type: "deleteAccount" }),
      disableAccount: (parentId) => dispatch({ parentId, type: "disableAccount" }),
      getChildrenForHousehold: (householdId) => state.childProfiles.filter((child) => child.householdId === householdId),
      loginParent: (email, password) => {
        const submittedEmail = email.trim().toLowerCase();
        const parent = state.parents.find((item) => item.email.toLowerCase() === submittedEmail && item.password === password);

        if (!parent) {
          return { error: "No mock parent account found. Sign up first or use demo parent.", ok: false };
        }

        if (parent.disabledAt) {
          return { error: "This mock account is disabled from the admin testing tools.", ok: false };
        }

        const household = state.households.find((item) => item.createdBy === parent.id);
        const hasChild = household ? state.childProfiles.some((child) => child.householdId === household.id) : false;
        dispatch({ parent, type: "loginParent" });
        return { needsChild: !hasChild, ok: true };
      },
      logout: () => dispatch({ type: "logout" }),
      resetMockData: () => dispatch({ type: "resetMockData" }),
      signUpParent: (input) => {
        const email = input.email.trim().toLowerCase();
        const fullName = input.fullName.trim();

        if (!fullName || !email || input.password.length < 4) {
          return { error: "Add a full name, email, and password of at least 4 characters.", ok: false };
        }

        if (state.parents.some((item) => item.email.toLowerCase() === email)) {
          return { error: "A mock parent account already exists for this email. Use Login instead.", ok: false };
        }

        const parent: MockParentAccount = {
          createdAt: new Date().toISOString(),
          disabledAt: null,
          email,
          fullName,
          id: createId("parent"),
          onboardingCompletedAt: null,
          password: input.password,
          role: "parent"
        };

        dispatch({ parent, type: "signUpParent" });
        return { ok: true };
      },
      useDemoChildForCurrentParent: () => {
        if (!state.currentParent) {
          return { error: "Log into a parent account first.", ok: false };
        }

        const household = getOrCreateParentHousehold(state, state.currentParent.id);
        const now = new Date().toISOString();
        const childProfile: MockChildProfile = {
          ...DEMO_CHILD,
          createdAt: now,
          householdId: household.id,
          id: createId("child"),
          username: createChildUsername(DEMO_CHILD.displayName, state.childProfiles)
        };

        dispatch({ childProfile, household, type: "useDemoChildForCurrentParent" });
        return { ok: true };
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
    case "adminLogin":
      return {
        ...state,
        currentAdmin: action.admin,
        currentChild: null,
        currentParent: null
      };

    case "completeOnboarding":
      if (!state.currentParent) {
        return state;
      }

      return {
        ...state,
        parents: state.parents.map((parent) =>
          parent.id === state.currentParent?.id ? { ...parent, onboardingCompletedAt: new Date().toISOString() } : parent
        )
      };

    case "completeTour":
      return {
        ...state,
        tourCompleted: {
          ...state.tourCompleted,
          [action.tour]: true
        }
      };

    case "continueDemoChild":
      return {
        ...state,
        activeHouseholdId: DEMO_HOUSEHOLD.id,
        currentAdmin: null,
        currentChild: DEMO_CHILD,
        currentParent: null
      };

    case "continueDemoParent":
      return {
        ...state,
        activeHouseholdId: DEMO_HOUSEHOLD.id,
        currentAdmin: null,
        currentChild: null,
        currentParent: stripPassword(DEMO_PARENT)
      };

    case "createChildProfile":
    case "useDemoChildForCurrentParent":
      return {
        ...state,
        activeHouseholdId: action.household.id,
        activityLog: prependActivity(state, `${action.childProfile.displayName} child profile created`, "child_created"),
        childProfiles: [...state.childProfiles, action.childProfile],
        currentChild: action.childProfile,
        households: upsertHousehold(state.households, action.household)
      };

    case "createHousehold":
      return {
        ...state,
        activeHouseholdId: action.household.id,
        activityLog: prependActivity(state, `${action.childProfile.displayName} child profile created`, "child_created"),
        childProfiles: [...state.childProfiles, action.childProfile],
        currentChild: action.childProfile,
        households: [...state.households, action.household]
      };

    case "deleteAccount": {
      const householdsToRemove = state.households.filter((household) => household.createdBy === action.parentId).map((household) => household.id);

      return {
        ...state,
        activityLog: prependActivity(state, "Mock account deleted from admin testing tools", "testing"),
        activeHouseholdId: householdsToRemove.includes(state.activeHouseholdId ?? "") ? null : state.activeHouseholdId,
        childProfiles: state.childProfiles.filter((child) => !householdsToRemove.includes(child.householdId)),
        currentParent: state.currentParent?.id === action.parentId ? null : state.currentParent,
        households: state.households.filter((household) => household.createdBy !== action.parentId),
        parents: state.parents.filter((parent) => parent.id !== action.parentId)
      };
    }

    case "disableAccount":
      return {
        ...state,
        activityLog: prependActivity(state, "Mock account disabled from admin testing tools", "testing"),
        parents: state.parents.map((parent) => (parent.id === action.parentId ? { ...parent, disabledAt: new Date().toISOString() } : parent))
      };

    case "hydrate":
      return action.state;

    case "loginParent":
      {
        const household = state.households.find((item) => item.createdBy === action.parent.id);
        const activeChild = household ? state.childProfiles.find((child) => child.householdId === household.id) ?? null : null;

        return {
          ...state,
          activeHouseholdId: household?.id ?? null,
          currentAdmin: null,
          currentChild: activeChild,
          currentParent: stripPassword(action.parent)
        };
      }

    case "logout":
      return {
        ...state,
        activeHouseholdId: null,
        currentAdmin: null,
        currentChild: null,
        currentParent: null
      };

    case "resetMockData":
      return {
        ...initialState,
        activityLog: prependActivity(initialState, "Mock auth data reset", "testing"),
        currentAdmin: state.currentAdmin
      };

    case "signUpParent":
      return {
        ...state,
        activeHouseholdId: null,
        activityLog: prependActivity(state, `${action.parent.fullName} account created`, "account_created"),
        currentAdmin: null,
        currentChild: null,
        currentParent: stripPassword(action.parent),
        parents: [...state.parents, action.parent]
      };

    default:
      return state;
  }
}

function createChildUsername(displayName: string, children: MockChildProfile[]) {
  const base = displayName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  let username = base || "child";
  let suffix = 2;

  while (children.some((child) => child.username.toLowerCase() === username)) {
    username = `${base || "child"}-${suffix}`;
    suffix += 1;
  }

  return username;
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getOrCreateParentHousehold(state: AuthState, parentId: string, householdName?: string): Household {
  const existing = state.households.find((household) => household.createdBy === parentId);

  if (existing) {
    return existing;
  }

  const parent = state.parents.find((item) => item.id === parentId);
  const firstName = parent?.fullName.split(" ")[0] || "Family";

  return {
    createdAt: new Date().toISOString(),
    createdBy: parentId,
    id: createId("household"),
    name: householdName?.trim() || `${firstName}'s Household`
  };
}

function mergeWithDemoState(state: AuthState): AuthState {
  const parents = upsertParent(state.parents ?? [], DEMO_PARENT);
  const households = upsertHousehold(state.households ?? [], DEMO_HOUSEHOLD);
  const childProfiles = upsertChild(state.childProfiles ?? [], DEMO_CHILD);

  return {
    ...initialState,
    ...state,
    activityLog: state.activityLog?.length ? state.activityLog : initialState.activityLog,
    childProfiles,
    households,
    parents,
    tourCompleted: state.tourCompleted ?? initialState.tourCompleted
  };
}

function prependActivity(state: AuthState, message: string, type: ActivityLogEntry["type"]) {
  return [
    {
      createdAt: new Date().toISOString(),
      id: createId("activity"),
      message,
      type
    },
    ...state.activityLog
  ].slice(0, 100);
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

function upsertChild(children: MockChildProfile[], child: MockChildProfile) {
  return children.some((item) => item.id === child.id) ? children : [child, ...children];
}

function upsertHousehold(households: Household[], household: Household) {
  return households.some((item) => item.id === household.id) ? households : [...households, household];
}

function upsertParent(parents: MockParentAccount[], parent: MockParentAccount) {
  return parents.some((item) => item.id === parent.id) ? parents : [parent, ...parents];
}
