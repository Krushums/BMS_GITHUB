import { createContext, PropsWithChildren, useContext, useMemo, useReducer } from "react";

import {
  CalendarEvent,
  CalendarEventCategory,
  CalendarEventKind,
  CalendarEventType,
  EvidenceSubmission,
  HomeworkEvidence,
  HomeworkItem,
  HomeworkSession,
  HomeworkStatus,
  PointsTransaction,
  Reward,
  RewardRequest,
  RewardRequestCategory,
  RewardRedemption,
  Task,
  TaskAssignment
} from "@/domain";

const childId = "child-1";
const householdId = "household-1";
const parentId = "parent-1";

type ChildProgress = {
  childId: string;
  displayName: string;
  points: number;
  streak: number;
  bestStreak: number;
  lastActivityDate: string | null;
};

type GameplayState = {
  tasks: Task[];
  assignments: TaskAssignment[];
  submissions: EvidenceSubmission[];
  pointsTransactions: PointsTransaction[];
  rewards: Reward[];
  rewardRequests: RewardRequest[];
  redemptions: RewardRedemption[];
  child: ChildProgress;
  morningRoutineCompletions: MorningRoutineCompletion[];
  homeworkItems: HomeworkItem[];
  homeworkSessions: HomeworkSession[];
  homeworkEvidence: HomeworkEvidence[];
  homeworkSubjects: string[];
  calendarEvents: CalendarEvent[];
};

type MorningRoutineCompletion = {
  childId: string;
  completedAt: string | null;
  completedItemIds: string[];
  date: string;
  id: string;
  submittedAt: string | null;
};

type MorningRoutineState = {
  completedAt: string | null;
  completedItemIds: string[];
  date: string;
  isComplete: boolean;
  isSubmitted: boolean;
  items: MorningRoutineItem[];
  pointValue: number;
  title: string;
};

type MorningRoutineItem = {
  id: string;
  label: string;
};

type CreateTaskInput = {
  title: string;
  description?: string;
  pointValue: number;
};

type UpdateTaskInput = {
  assignmentId: string;
  title: string;
  description?: string;
  pointValue: number;
};

type CreateRewardInput = {
  title: string;
  description?: string;
  pointCost: number;
};

type CreateRewardRequestInput = {
  title: string;
  description: string;
  category: RewardRequestCategory;
  suggestedPointTarget?: number | null;
  eventDate?: string | null;
};

type ReviewRewardRequestInput = {
  requestId: string;
  decision: "approved" | "denied";
  parentPointTarget?: number | null;
  deadlineDate?: string | null;
  conditions?: string | null;
  parentNote?: string | null;
};

type BehaviourAdjustmentInput = {
  id?: string;
  amount: number;
  category: string;
  note?: string;
};

type CreateHomeworkInput = {
  title: string;
  subject: string;
  description?: string;
  dueAt: string;
  completedAt?: string | null;
  status?: HomeworkStatus;
  estimatedEffortMinutes?: number | null;
};

type UpdateHomeworkInput = {
  homeworkId: string;
  title?: string;
  subject?: string;
  description?: string | null;
  dueAt?: string;
  completedAt?: string | null;
  estimatedEffortMinutes?: number | null;
};

type HomeworkEvidenceInput = {
  id?: string;
  homeworkId: string;
  imageUri: string | null;
  evidenceType?: "live_photo" | "photo_library" | "file_upload";
  comment?: string;
};

type CalendarEventInput = {
  title: string;
  type: CalendarEventType;
  date: string;
  kind?: CalendarEventKind;
  category?: CalendarEventCategory;
  color?: string;
  subject?: string | null;
  time?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  allDay?: boolean;
  location?: string | null;
  alert?: string | null;
  repeat?: string | null;
  isCompleted?: boolean;
  pointsValue?: number;
  isRecurring?: boolean;
  notes?: string | null;
};

type UpdateCalendarEventInput = CalendarEventInput & {
  eventId: string;
};

type HomeworkSessionInput = {
  homeworkId: string;
  durationMinutes: number;
  notes?: string;
};

type DailyPointsSummary = {
  earned: number;
  lost: number;
  net: number;
};

type PointsLedgerSummary = {
  adjustments: number;
  available: number;
  earned: number;
  spent: number;
};

type GameplayContextValue = {
  state: GameplayState;
  assignedTasks: GameplayTask[];
  childTasks: GameplayTask[];
  todayTasks: GameplayTask[];
  pendingReviewTasks: GameplayTask[];
  completedTodayTasks: GameplayTask[];
  upcomingTasks: GameplayTask[];
  recentCompletedTasks: GameplayTask[];
  dailyPointsSummary: DailyPointsSummary;
  pointsSummary: PointsLedgerSummary;
  reservedRewardPoints: number;
  morningRoutine: MorningRoutineState;
  pendingSubmissions: Array<{ assignment: TaskAssignment; submission: EvidenceSubmission; task: Task }>;
  rewardRequests: Array<{ redemption: RewardRedemption; reward: Reward }>;
  pendingRewardGoalRequests: RewardRequest[];
  approvedRewardGoals: RewardRequest[];
  applyBehaviourAdjustment: (input: BehaviourAdjustmentInput) => string;
  reversePointsTransaction: (transactionId: string) => void;
  createTask: (input: CreateTaskInput) => void;
  updateTask: (input: UpdateTaskInput) => void;
  cancelTask: (assignmentId: string) => void;
  submitTask: (assignmentId: string, note: string, photoUrl: string | null) => void;
  reviewSubmission: (submissionId: string, decision: "approved" | "rejected") => void;
  createReward: (input: CreateRewardInput) => void;
  createRewardRequest: (input: CreateRewardRequestInput) => void;
  requestReward: (rewardId: string) => void;
  redeemRewardGoal: (requestId: string) => void;
  reviewRewardRequest: (input: ReviewRewardRequestInput) => void;
  reviewRewardRedemption: (redemptionId: string, decision: "approved" | "rejected") => void;
  submitMorningRoutine: () => void;
  toggleMorningRoutineItem: (itemId: string) => void;
  createHomework: (input: CreateHomeworkInput) => string;
  updateHomework: (input: UpdateHomeworkInput) => void;
  deleteHomework: (homeworkId: string) => void;
  restoreHomework: (homeworkId: string) => void;
  updateHomeworkStatus: (homeworkId: string, status: HomeworkStatus, completedAt?: string | null) => void;
  logHomeworkSession: (input: HomeworkSessionInput) => void;
  deleteHomeworkSession: (sessionId: string) => void;
  restoreHomeworkSession: (sessionId: string) => void;
  submitHomeworkEvidence: (input: HomeworkEvidenceInput) => string;
  deleteHomeworkEvidence: (evidenceId: string) => void;
  restoreHomeworkEvidence: (evidenceId: string) => void;
  addHomeworkSubject: (subject: string) => void;
  createCalendarEvent: (input: CalendarEventInput) => void;
  updateCalendarEvent: (input: UpdateCalendarEventInput) => void;
  deleteCalendarEvent: (eventId: string) => void;
};

type GameplayAction =
  | { type: "applyBehaviourAdjustment"; input: BehaviourAdjustmentInput }
  | { type: "reversePointsTransaction"; transactionId: string }
  | { type: "createTask"; input: CreateTaskInput }
  | { type: "updateTask"; input: UpdateTaskInput }
  | { type: "cancelTask"; assignmentId: string }
  | { type: "submitTask"; assignmentId: string; note: string; photoUrl: string | null }
  | { type: "reviewSubmission"; submissionId: string; decision: "approved" | "rejected" }
  | { type: "createReward"; input: CreateRewardInput }
  | { type: "createRewardRequest"; input: CreateRewardRequestInput }
  | { type: "requestReward"; rewardId: string }
  | { type: "redeemRewardGoal"; requestId: string }
  | { type: "reviewRewardRequest"; input: ReviewRewardRequestInput }
  | { type: "reviewRewardRedemption"; redemptionId: string; decision: "approved" | "rejected" }
  | { type: "submitMorningRoutine" }
  | { type: "toggleMorningRoutineItem"; itemId: string }
  | { type: "createHomework"; input: CreateHomeworkInput & { id?: string } }
  | { type: "updateHomework"; input: UpdateHomeworkInput }
  | { type: "deleteHomework"; homeworkId: string }
  | { type: "restoreHomework"; homeworkId: string }
  | { type: "updateHomeworkStatus"; homeworkId: string; status: HomeworkStatus; completedAt?: string | null }
  | { type: "logHomeworkSession"; input: HomeworkSessionInput }
  | { type: "deleteHomeworkSession"; sessionId: string }
  | { type: "restoreHomeworkSession"; sessionId: string }
  | { type: "submitHomeworkEvidence"; input: HomeworkEvidenceInput }
  | { type: "deleteHomeworkEvidence"; evidenceId: string }
  | { type: "restoreHomeworkEvidence"; evidenceId: string }
  | { type: "addHomeworkSubject"; subject: string }
  | { type: "createCalendarEvent"; input: CalendarEventInput }
  | { type: "updateCalendarEvent"; input: UpdateCalendarEventInput }
  | { type: "deleteCalendarEvent"; eventId: string };

export type GameplayTask = {
  assignment: TaskAssignment;
  task: Task;
  submission: EvidenceSubmission | null;
};

const morningRoutineItems: MorningRoutineItem[] = [
  { id: "wake-up", label: "Wake up" },
  { id: "shower", label: "Have shower" },
  { id: "brush-teeth", label: "Brush teeth" },
  { id: "breakfast", label: "Eat breakfast" },
  { id: "ready-on-time", label: "Ready on time" }
];

const morningRoutinePointValue = 5;

const initialState: GameplayState = {
  assignments: [
    {
      childId,
      completedAt: null,
      createdAt: new Date().toISOString(),
      dueDate: today(),
      id: "assignment-reset-room",
      status: "open",
      taskId: "task-reset-room",
      archivedAt: null
    }
  ],
  calendarEvents: [],
  child: {
    bestStreak: 3,
    childId,
    displayName: "Maya",
    lastActivityDate: null,
    points: 90,
    streak: 3
  },
  homeworkEvidence: [],
  homeworkItems: createInitialHomeworkWeekEntries(),
  homeworkSessions: [],
  homeworkSubjects: ["Maths", "English", "Science", "History", "Geography", "Art"],
  morningRoutineCompletions: [],
  pointsTransactions: [
    {
      amount: 90,
      category: "Opening balance",
      childId,
      createdAt: new Date(Date.now() - 86_400_000).toISOString(),
      householdId,
      id: "points-opening-balance",
      note: "Prototype starting balance",
      reason: "Opening balance",
      deletedAt: null,
      reversedAt: null,
      sourceRewardId: null,
      sourceTaskId: null,
      type: "manual_adjustment"
    }
  ],
  redemptions: [],
  rewardRequests: [],
  rewards: [
    {
      createdAt: new Date().toISOString(),
      description: "A small win you can enjoy today.",
      householdId,
      id: "reward-sweet-treat",
      isActive: true,
      limit: "once_per_day",
      pointCost: 25,
      requiresApproval: true,
      rewardType: "small",
      tier: "quick",
      title: "Sweet treat"
    },
    {
      createdAt: new Date().toISOString(),
      description: "Extra time to chat, scroll, or play.",
      householdId,
      id: "reward-phone-30",
      isActive: true,
      limit: "once_per_day",
      pointCost: 20,
      requiresApproval: true,
      rewardType: "small",
      tier: "quick",
      title: "Extra 30 mins phone"
    },
    {
      createdAt: new Date().toISOString(),
      description: "One focused hour of TV time.",
      householdId,
      id: "reward-tv-hour",
      isActive: true,
      limit: "once_per_day",
      pointCost: 50,
      requiresApproval: true,
      rewardType: "medium",
      tier: "quick",
      title: "TV 1 hr"
    },
    {
      createdAt: new Date().toISOString(),
      description: "Pick something small after a strong week.",
      householdId,
      id: "reward-temu-order",
      isActive: true,
      limit: "once_per_week",
      pointCost: 150,
      requiresApproval: true,
      rewardType: "medium",
      tier: "weekly",
      title: "Temu order"
    },
    {
      createdAt: new Date().toISOString(),
      description: "One later evening when plans are agreed.",
      householdId,
      id: "reward-later-curfew",
      isActive: true,
      limit: "once_per_week",
      pointCost: 120,
      requiresApproval: true,
      rewardType: "medium",
      tier: "weekly",
      title: "Later curfew one night"
    },
    {
      createdAt: new Date().toISOString(),
      description: "A bigger social reward for consistent effort.",
      householdId,
      id: "reward-day-out",
      isActive: true,
      limit: "once_per_week",
      pointCost: 200,
      requiresApproval: true,
      rewardType: "big",
      tier: "weekly",
      title: "Day out with friends"
    },
    {
      createdAt: new Date().toISOString(),
      description: "Save points and cash out a bigger win.",
      householdId,
      id: "reward-ten-pounds",
      isActive: true,
      limit: "save_up",
      pointCost: 250,
      requiresApproval: true,
      rewardType: "big",
      tier: "big",
      title: "£10"
    },
    {
      createdAt: new Date().toISOString(),
      description: "A serious trust unlock for a strong run.",
      householdId,
      id: "reward-independence",
      isActive: true,
      limit: "save_up",
      pointCost: 750,
      requiresApproval: true,
      rewardType: "big",
      tier: "big",
      title: "Major independence privilege",
      unlockLevel: 4
    },
    {
      createdAt: new Date().toISOString(),
      description: "The big comeback unlock.",
      householdId,
      id: "reward-pc-back",
      isActive: true,
      limit: "save_up",
      pointCost: 1000,
      requiresApproval: true,
      rewardType: "big",
      tier: "big",
      title: "PC Back",
      unlockLevel: 5
    }
  ],
  submissions: [],
  tasks: [
    {
      category: "home",
      cadence: "daily",
      createdAt: new Date().toISOString(),
      createdBy: parentId,
      description: "Bed made, clothes away, desk clear.",
      householdId,
      id: "task-reset-room",
      pointValue: 30,
      recurrenceType: "daily",
      title: "Reset your room"
    }
  ]
};

const GameplayContext = createContext<GameplayContextValue | null>(null);

export function GameplayProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(gameplayReducer, initialState);

  const value = useMemo<GameplayContextValue>(() => {
    const activePointsTransactions = state.pointsTransactions.filter(isActivePointsTransaction);
    const pointsBalance = getPointsBalance(activePointsTransactions);
    const reservedRewardPoints = getReservedRewardPoints(state.rewards, state.redemptions);
    const pointsSummary = getPointsLedgerSummary(activePointsTransactions);
    const visibleState: GameplayState = {
      ...state,
      child: {
        ...state.child,
        points: pointsBalance
      },
      pointsTransactions: activePointsTransactions
    };
    const assignedTasks = state.assignments
      .filter((assignment) => assignment.status !== "cancelled")
      .map((assignment) => {
        const task = state.tasks.find((item) => item.id === assignment.taskId);
        if (!task) {
          return null;
        }

        const submission = state.submissions.find((item) => item.assignmentId === assignment.id) ?? null;
        return { assignment, submission, task };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
    const childTasks = assignedTasks.filter((item) => item.assignment.childId === childId);
    const todayDate = today();
    const todayTasks = childTasks.filter((item) => item.assignment.dueDate === todayDate);
    const pendingReviewTasks = childTasks.filter((item) => item.assignment.status === "submitted");
    const completedTodayTasks = childTasks.filter(
      (item) => item.assignment.status === "approved" && item.assignment.completedAt?.slice(0, 10) === todayDate
    );
    const upcomingTasks = childTasks.filter((item) => Boolean(item.assignment.dueDate && item.assignment.dueDate > todayDate));
    const recentCompletedTasks = childTasks.filter((item) => item.assignment.status === "approved").slice(0, 5);
    const dailyPointsSummary = getDailyPointsSummary(activePointsTransactions);
    const morningRoutine = getMorningRoutineState(state.morningRoutineCompletions);

    const pendingSubmissions = state.submissions
      .filter((submission) => submission.status === "pending")
      .map((submission) => {
        const assignment = state.assignments.find((item) => item.id === submission.assignmentId);
        const task = assignment ? state.tasks.find((item) => item.id === assignment.taskId) : null;

        if (!assignment || assignment.status === "cancelled" || !task) {
          return null;
        }

        return { assignment, submission, task };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    const rewardRequests = state.redemptions
      .filter((redemption) => redemption.status === "requested")
      .map((redemption) => {
        const reward = state.rewards.find((item) => item.id === redemption.rewardId);
        return reward ? { redemption, reward } : null;
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
    const pendingRewardGoalRequests = state.rewardRequests.filter((request) => request.status === "pending_parent_review");
    const approvedRewardGoals = state.rewardRequests.filter((request) => request.status === "approved_goal" || request.status === "redeemed");

    return {
      addHomeworkSubject: (subject) => dispatch({ subject, type: "addHomeworkSubject" }),
      applyBehaviourAdjustment: (input) => {
        const id = input.id ?? createId("points");
        dispatch({ input: { ...input, id }, type: "applyBehaviourAdjustment" });
        return id;
      },
      assignedTasks,
      cancelTask: (assignmentId) => dispatch({ assignmentId, type: "cancelTask" }),
      childTasks,
      completedTodayTasks,
      approvedRewardGoals,
      createCalendarEvent: (input) => dispatch({ input, type: "createCalendarEvent" }),
      createHomework: (input) => {
        const id = createId("homework");
        dispatch({ input: { ...input, id }, type: "createHomework" });
        return id;
      },
      deleteCalendarEvent: (eventId) => dispatch({ eventId, type: "deleteCalendarEvent" }),
      deleteHomework: (homeworkId) => dispatch({ homeworkId, type: "deleteHomework" }),
      deleteHomeworkEvidence: (evidenceId) => dispatch({ evidenceId, type: "deleteHomeworkEvidence" }),
      deleteHomeworkSession: (sessionId) => dispatch({ sessionId, type: "deleteHomeworkSession" }),
      dailyPointsSummary,
      pointsSummary,
      reservedRewardPoints,
      morningRoutine,
      createReward: (input) => dispatch({ input, type: "createReward" }),
      createRewardRequest: (input) => dispatch({ input, type: "createRewardRequest" }),
      createTask: (input) => dispatch({ input, type: "createTask" }),
      pendingRewardGoalRequests,
      pendingSubmissions,
      pendingReviewTasks,
      redeemRewardGoal: (requestId) => dispatch({ requestId, type: "redeemRewardGoal" }),
      requestReward: (rewardId) => dispatch({ rewardId, type: "requestReward" }),
      reviewRewardRequest: (input) => dispatch({ input, type: "reviewRewardRequest" }),
      reviewRewardRedemption: (redemptionId, decision) =>
        dispatch({ decision, redemptionId, type: "reviewRewardRedemption" }),
      reviewSubmission: (submissionId, decision) => dispatch({ decision, submissionId, type: "reviewSubmission" }),
      reversePointsTransaction: (transactionId) => dispatch({ transactionId, type: "reversePointsTransaction" }),
      restoreHomework: (homeworkId) => dispatch({ homeworkId, type: "restoreHomework" }),
      restoreHomeworkEvidence: (evidenceId) => dispatch({ evidenceId, type: "restoreHomeworkEvidence" }),
      restoreHomeworkSession: (sessionId) => dispatch({ sessionId, type: "restoreHomeworkSession" }),
      rewardRequests,
      recentCompletedTasks,
      state: visibleState,
      submitMorningRoutine: () => dispatch({ type: "submitMorningRoutine" }),
      submitHomeworkEvidence: (input) => {
        const id = input.id ?? createId("homework-evidence");
        dispatch({ input: { ...input, id }, type: "submitHomeworkEvidence" });
        return id;
      },
      submitTask: (assignmentId, note, photoUrl) => dispatch({ assignmentId, note, photoUrl, type: "submitTask" }),
      todayTasks,
      toggleMorningRoutineItem: (itemId) => dispatch({ itemId, type: "toggleMorningRoutineItem" }),
      logHomeworkSession: (input) => dispatch({ input, type: "logHomeworkSession" }),
      updateHomework: (input) => dispatch({ input, type: "updateHomework" }),
      updateHomeworkStatus: (homeworkId, status, completedAt) =>
        dispatch({ ...(completedAt !== undefined ? { completedAt } : {}), homeworkId, status, type: "updateHomeworkStatus" }),
      updateCalendarEvent: (input) => dispatch({ input, type: "updateCalendarEvent" }),
      updateTask: (input) => dispatch({ input, type: "updateTask" }),
      upcomingTasks
    };
  }, [state]);

  return <GameplayContext.Provider value={value}>{children}</GameplayContext.Provider>;
}

export function useGameplay() {
  const context = useContext(GameplayContext);

  if (!context) {
    throw new Error("useGameplay must be used inside GameplayProvider");
  }

  return context;
}

function gameplayReducer(state: GameplayState, action: GameplayAction): GameplayState {
  switch (action.type) {
    case "applyBehaviourAdjustment": {
      const now = new Date().toISOString();

      return {
        ...state,
        pointsTransactions: [
          {
            amount: action.input.amount,
            category: action.input.category,
            childId,
            createdAt: now,
            householdId,
            id: action.input.id ?? createId("points"),
            note: action.input.note?.trim() || null,
            reason: action.input.category,
            deletedAt: null,
            reversedAt: null,
            sourceRewardId: null,
            sourceTaskId: null,
            type: "behaviour_adjustment"
          },
          ...state.pointsTransactions
        ]
      };
    }

    case "reversePointsTransaction": {
      const now = new Date().toISOString();

      return {
        ...state,
        pointsTransactions: state.pointsTransactions.map((transaction) =>
          transaction.id === action.transactionId && isActivePointsTransaction(transaction)
            ? {
                ...transaction,
                reversedAt: now
              }
            : transaction
        )
      };
    }

    case "createTask": {
      const taskId = createId("task");
      const assignmentId = createId("assignment");
      const now = new Date().toISOString();

      return {
        ...state,
        assignments: [
          {
            childId,
            completedAt: null,
            createdAt: now,
            dueDate: today(),
            id: assignmentId,
            status: "open",
            taskId,
            archivedAt: null
          },
          ...state.assignments
        ],
        tasks: [
          {
            category: "responsibility",
            cadence: "daily",
            createdAt: now,
            createdBy: parentId,
            description: action.input.description?.trim() || null,
            householdId,
            id: taskId,
            pointValue: Math.max(0, action.input.pointValue),
            recurrenceType: "daily",
            title: action.input.title.trim()
          },
          ...state.tasks
        ]
      };
    }

    case "toggleMorningRoutineItem": {
      const date = today();
      const current = state.morningRoutineCompletions.find((item) => item.date === date && item.childId === childId);

      if (current?.completedAt) {
        return state;
      }

      if (!morningRoutineItems.some((item) => item.id === action.itemId)) {
        return state;
      }

      if (!current) {
        return {
          ...state,
          morningRoutineCompletions: [
            {
              childId,
              completedAt: null,
              completedItemIds: [action.itemId],
              date,
              id: createId("routine"),
              submittedAt: null
            },
            ...state.morningRoutineCompletions
          ]
        };
      }

      const completedItemIds = current.completedItemIds.includes(action.itemId)
        ? current.completedItemIds.filter((itemId) => itemId !== action.itemId)
        : [...current.completedItemIds, action.itemId];

      return {
        ...state,
        morningRoutineCompletions: state.morningRoutineCompletions.map((item) =>
          item.id === current.id ? { ...item, completedItemIds } : item
        )
      };
    }

    case "submitMorningRoutine": {
      const date = today();
      const current = state.morningRoutineCompletions.find((item) => item.date === date && item.childId === childId);

      if (!current || current.completedAt || current.completedItemIds.length < morningRoutineItems.length) {
        return state;
      }

      const now = new Date().toISOString();
      const shouldExtendStreak = state.child.lastActivityDate !== date;
      const nextStreak = shouldExtendStreak ? state.child.streak + 1 : state.child.streak;
      const pointTransaction: PointsTransaction = {
        amount: morningRoutinePointValue,
        category: "Morning Routine",
        childId,
        createdAt: now,
        deletedAt: null,
        householdId,
        id: createId("points"),
        note: "Daily routine completed",
        reason: "Morning Routine completed",
        reversedAt: null,
        sourceRewardId: null,
        sourceTaskId: null,
        type: "task_reward"
      };

      return {
        ...state,
        child: {
          ...state.child,
          bestStreak: Math.max(state.child.bestStreak, nextStreak),
          lastActivityDate: date,
          streak: nextStreak
        },
        morningRoutineCompletions: state.morningRoutineCompletions.map((item) =>
          item.id === current.id ? { ...item, completedAt: now, submittedAt: now } : item
        ),
        pointsTransactions: [pointTransaction, ...state.pointsTransactions]
      };
    }

    case "updateTask": {
      const assignment = state.assignments.find((item) => item.id === action.input.assignmentId);

      if (!assignment || assignment.status === "cancelled") {
        return state;
      }

      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === assignment.taskId
            ? {
                ...task,
                description: action.input.description?.trim() || null,
                pointValue: Math.max(0, action.input.pointValue),
                title: action.input.title.trim()
              }
            : task
        )
      };
    }

    case "createHomework": {
      const now = new Date().toISOString();
      const completedAt = action.input.status === "completed" ? action.input.completedAt ?? now : null;

      return {
        ...state,
        homeworkItems: [
          {
            assignedAt: now,
            childId,
            completedAt,
            completedDate: completedAt,
            createdAt: now,
            createdBy: parentId,
            deletedAt: null,
            description: action.input.description?.trim() || null,
            dueAt: action.input.dueAt,
            dueDate: action.input.dueAt,
            estimatedEffortMinutes: action.input.estimatedEffortMinutes ?? null,
            id: action.input.id ?? createId("homework"),
            status: action.input.status ?? "not_started",
            subject: action.input.subject.trim(),
            submittedAt: action.input.status ? now : null,
            title: action.input.title.trim(),
            updatedAt: now
          },
          ...state.homeworkItems
        ]
      };
    }

    case "updateHomework": {
      const now = new Date().toISOString();

      return {
        ...state,
        homeworkItems: state.homeworkItems.map((item) =>
          item.id === action.input.homeworkId
            ? {
                ...item,
                completedAt: action.input.completedAt === undefined ? item.completedAt : action.input.completedAt,
                completedDate: action.input.completedAt === undefined ? item.completedDate : action.input.completedAt,
                description: action.input.description === undefined ? item.description : action.input.description?.trim() || null,
                dueAt: action.input.dueAt ?? item.dueAt,
                dueDate: action.input.dueAt ?? item.dueDate,
                estimatedEffortMinutes:
                  action.input.estimatedEffortMinutes === undefined
                    ? item.estimatedEffortMinutes
                    : action.input.estimatedEffortMinutes,
                subject: action.input.subject?.trim() || item.subject,
                title: action.input.title?.trim() || item.title,
                updatedAt: now
              }
            : item
        )
      };
    }

    case "deleteHomework":
    case "restoreHomework": {
      const now = new Date().toISOString();
      const isDelete = action.type === "deleteHomework";

      return {
        ...state,
        homeworkItems: state.homeworkItems.map((item) =>
          item.id === action.homeworkId
            ? {
                ...item,
                deletedAt: isDelete ? now : null,
                updatedAt: now
              }
            : item
        )
      };
    }

    case "updateHomeworkStatus": {
      const now = new Date().toISOString();
      const completedAt =
        action.status === "completed"
          ? action.completedAt ?? now
          : null;

      return {
        ...state,
        homeworkItems: state.homeworkItems.map((item) =>
          item.id === action.homeworkId
            ? {
                ...item,
                completedAt,
                completedDate: completedAt,
                status: action.status,
                submittedAt: now,
                updatedAt: now
              }
            : item
        )
      };
    }

    case "logHomeworkSession": {
      const durationMinutes = Math.max(1, Math.round(action.input.durationMinutes));

      return {
        ...state,
        homeworkItems: state.homeworkItems.map((item) =>
          item.id === action.input.homeworkId && item.status === "not_started" ? { ...item, status: "in_progress" } : item
        ),
        homeworkSessions: [
          {
            durationMinutes,
            deletedAt: null,
            homeworkId: action.input.homeworkId,
            id: createId("homework-session"),
            notes: action.input.notes?.trim() || null,
            startedAt: new Date().toISOString()
          },
          ...state.homeworkSessions
        ]
      };
    }

    case "deleteHomeworkSession":
    case "restoreHomeworkSession": {
      const now = new Date().toISOString();
      const isDelete = action.type === "deleteHomeworkSession";

      return {
        ...state,
        homeworkSessions: state.homeworkSessions.map((session) =>
          session.id === action.sessionId
            ? {
                ...session,
                deletedAt: isDelete ? now : null
              }
            : session
        )
      };
    }

    case "submitHomeworkEvidence": {
      const now = new Date().toISOString();

      return {
        ...state,
        homeworkEvidence: [
          {
            comment: action.input.comment?.trim() || null,
            createdAt: now,
            deletedAt: null,
            evidenceType: action.input.evidenceType ?? "photo_library",
            homeworkId: action.input.homeworkId,
            id: action.input.id ?? createId("homework-evidence"),
            imageUri: action.input.imageUri,
            submittedAt: now
          },
          ...state.homeworkEvidence
        ]
      };
    }

    case "deleteHomeworkEvidence":
    case "restoreHomeworkEvidence": {
      const now = new Date().toISOString();
      const isDelete = action.type === "deleteHomeworkEvidence";

      return {
        ...state,
        homeworkEvidence: state.homeworkEvidence.map((evidence) =>
          evidence.id === action.evidenceId
            ? {
                ...evidence,
                deletedAt: isDelete ? now : null
              }
            : evidence
        )
      };
    }

    case "cancelTask": {
      const assignment = state.assignments.find((item) => item.id === action.assignmentId);

      if (!assignment || assignment.status === "cancelled") {
        return state;
      }

      return {
        ...state,
        assignments: state.assignments.map((item) =>
          item.id === action.assignmentId
            ? {
                ...item,
                archivedAt: new Date().toISOString(),
                status: "cancelled"
              }
            : item
        )
      };
    }

    case "submitTask": {
      const assignment = state.assignments.find((item) => item.id === action.assignmentId);

      if (!assignment || (assignment.status !== "open" && assignment.status !== "rejected")) {
        return state;
      }

      const submission: EvidenceSubmission = {
        assignmentId: assignment.id,
        childId,
        id: createId("submission"),
        note: action.note.trim() || null,
        photoUrl: action.photoUrl,
        reviewedAt: null,
        reviewedBy: null,
        reviewStatus: "pending",
        status: "pending",
        submittedAt: new Date().toISOString()
      };

      return {
        ...state,
        assignments: state.assignments.map((item) =>
          item.id === action.assignmentId ? { ...item, status: "submitted" } : item
        ),
        submissions: [
          submission,
          ...state.submissions.filter((item) => item.assignmentId !== assignment.id || item.status !== "rejected")
        ]
      };
    }

    case "reviewSubmission": {
      const submission = state.submissions.find((item) => item.id === action.submissionId);
      const assignment = submission
        ? state.assignments.find((item) => item.id === submission.assignmentId)
        : undefined;
      const task = assignment ? state.tasks.find((item) => item.id === assignment.taskId) : undefined;

      if (!submission || !assignment || !task || submission.status !== "pending") {
        return state;
      }

      const approved = action.decision === "approved";
      const activityDate = today();
      const shouldExtendStreak = approved && state.child.lastActivityDate !== activityDate;
      const nextStreak = shouldExtendStreak ? state.child.streak + 1 : state.child.streak;
      const reviewedAt = new Date().toISOString();
      const pointTransaction: PointsTransaction | null = approved
        ? {
            amount: task.pointValue,
            childId,
            createdAt: reviewedAt,
            householdId,
            id: createId("points"),
            note: `Approved task: ${task.title}`,
            reason: "Task approved",
            deletedAt: null,
            reversedAt: null,
            sourceRewardId: null,
            sourceTaskId: task.id,
            type: "task_reward",
            category: task.title
          }
        : null;

      return {
        ...state,
        assignments: state.assignments.map((item) =>
          item.id === assignment.id
            ? {
              ...item,
              completedAt: approved ? reviewedAt : null,
              status: approved ? "approved" : "rejected"
              }
            : item
        ),
        child: approved
          ? {
              ...state.child,
              bestStreak: Math.max(state.child.bestStreak, nextStreak),
              lastActivityDate: activityDate,
              streak: nextStreak
            }
          : state.child,
        submissions: state.submissions.map((item) =>
          item.id === submission.id
            ? {
                ...item,
                reviewedAt,
                reviewedBy: parentId,
                reviewStatus: action.decision,
                status: action.decision
              }
            : item
        ),
        pointsTransactions: pointTransaction ? [pointTransaction, ...state.pointsTransactions] : state.pointsTransactions
      };
    }

    case "createReward": {
      return {
        ...state,
        rewards: [
          {
            createdAt: new Date().toISOString(),
            description: action.input.description?.trim() || null,
            householdId,
            id: createId("reward"),
            isActive: true,
            limit: "unlimited",
            pointCost: Math.max(0, action.input.pointCost),
            requiresApproval: true,
            rewardType: "medium",
            tier: "weekly",
            title: action.input.title.trim()
          },
          ...state.rewards
        ]
      };
    }

    case "createRewardRequest": {
      const now = new Date().toISOString();
      const title = action.input.title.trim();
      const description = action.input.description.trim();

      if (!title || !description) {
        return state;
      }

      return {
        ...state,
        rewardRequests: [
          {
            approvedAt: null,
            category: action.input.category,
            childId,
            conditions: null,
            createdAt: now,
            deadlineDate: null,
            deniedAt: null,
            description,
            eventDate: action.input.eventDate?.trim() || null,
            householdId,
            id: createId("reward-request"),
            parentNote: null,
            parentPointTarget: null,
            reviewedAt: null,
            status: "pending_parent_review",
            suggestedPointTarget:
              action.input.suggestedPointTarget === null || action.input.suggestedPointTarget === undefined
                ? null
                : Math.max(0, Math.round(action.input.suggestedPointTarget)),
            title
          },
          ...state.rewardRequests
        ]
      };
    }

    case "requestReward": {
      const reward = state.rewards.find((item) => item.id === action.rewardId);
      const alreadyRequested = state.redemptions.some(
        (item) => item.rewardId === action.rewardId && item.status === "requested"
      );
      const activeBalance = getPointsBalance(state.pointsTransactions.filter(isActivePointsTransaction));
      const reservedPoints = getReservedRewardPoints(state.rewards, state.redemptions);

      if (!reward || activeBalance - reservedPoints < reward.pointCost || alreadyRequested) {
        return state;
      }

      return {
        ...state,
        redemptions: [
          {
            childId,
            id: createId("redemption"),
            requestedAt: new Date().toISOString(),
            reviewedAt: null,
            rewardId: reward.id,
            status: "requested"
          },
          ...state.redemptions
        ]
      };
    }

    case "reviewRewardRedemption": {
      const redemption = state.redemptions.find((item) => item.id === action.redemptionId);
      const reward = redemption ? state.rewards.find((item) => item.id === redemption.rewardId) : undefined;

      if (!redemption || !reward || redemption.status !== "requested") {
        return state;
      }

      const approved = action.decision === "approved";
      const reviewedAt = new Date().toISOString();
      const pointTransaction: PointsTransaction | null = approved
        ? {
            amount: -reward.pointCost,
            childId,
            createdAt: reviewedAt,
            householdId,
            id: createId("points"),
            note: `Reward redeemed: ${reward.title}`,
            reason: "Reward redeemed",
            deletedAt: null,
            reversedAt: null,
            sourceRewardId: reward.id,
            sourceTaskId: null,
            type: "reward_redemption",
            category: reward.title
          }
        : null;

      return {
        ...state,
        redemptions: state.redemptions.map((item) =>
          item.id === action.redemptionId
            ? {
                ...item,
                reviewedAt,
                status: approved ? "approved" : "rejected"
              }
            : item
        ),
        pointsTransactions: pointTransaction ? [pointTransaction, ...state.pointsTransactions] : state.pointsTransactions
      };
    }

    case "reviewRewardRequest": {
      const now = new Date().toISOString();
      const request = state.rewardRequests.find((item) => item.id === action.input.requestId);

      if (!request || request.status !== "pending_parent_review") {
        return state;
      }

      const approved = action.input.decision === "approved";
      const parentPointTarget = Math.max(1, Math.round(action.input.parentPointTarget ?? request.suggestedPointTarget ?? 100));

      return {
        ...state,
        rewardRequests: state.rewardRequests.map((item) =>
          item.id === request.id
            ? {
                ...item,
                approvedAt: approved ? now : null,
                conditions: approved ? action.input.conditions?.trim() || null : null,
                deadlineDate: approved ? action.input.deadlineDate?.trim() || item.eventDate : null,
                deniedAt: approved ? null : now,
                parentNote: action.input.parentNote?.trim() || null,
                parentPointTarget: approved ? parentPointTarget : null,
                reviewedAt: now,
                status: approved ? "approved_goal" : "denied"
              }
            : item
        )
      };
    }

    case "redeemRewardGoal": {
      const request = state.rewardRequests.find((item) => item.id === action.requestId);
      const activeBalance = getPointsBalance(state.pointsTransactions.filter(isActivePointsTransaction));
      const target = request?.parentPointTarget ?? request?.suggestedPointTarget ?? null;

      if (!request || request.status !== "approved_goal" || !target || activeBalance < target) {
        return state;
      }

      const now = new Date().toISOString();
      const pointTransaction: PointsTransaction = {
        amount: -target,
        category: request.title,
        childId,
        createdAt: now,
        deletedAt: null,
        householdId,
        id: createId("points"),
        note: `Goal redeemed: ${request.title}`,
        reason: "Reward goal redeemed",
        reversedAt: null,
        sourceRewardId: request.id,
        sourceTaskId: null,
        type: "reward_redemption"
      };

      return {
        ...state,
        pointsTransactions: [pointTransaction, ...state.pointsTransactions],
        rewardRequests: state.rewardRequests.map((item) => (item.id === request.id ? { ...item, status: "redeemed", reviewedAt: now } : item))
      };
    }

    case "addHomeworkSubject": {
      const subject = action.subject.trim();

      if (!subject || state.homeworkSubjects.some((item) => item.toLowerCase() === subject.toLowerCase())) {
        return state;
      }

      return {
        ...state,
        homeworkSubjects: [...state.homeworkSubjects, subject]
      };
    }

    case "createCalendarEvent": {
      const now = new Date().toISOString();
      const title = action.input.title.trim();
      const date = action.input.date.trim().slice(0, 10);

      if (!title || !date) {
        return state;
      }

      return {
        ...state,
        calendarEvents: [
          {
            alert: action.input.alert?.trim() || null,
            allDay: action.input.allDay ?? false,
            category: action.input.category ?? "custom",
            childId,
            color: action.input.color?.trim() || "#64748B",
            createdAt: now,
            date,
            deletedAt: null,
            endTime: action.input.endTime?.trim() || null,
            householdId,
            id: createId("calendar"),
            isCompleted: action.input.isCompleted ?? false,
            isRecurring: action.input.isRecurring ?? false,
            kind: action.input.kind ?? "event",
            location: action.input.location?.trim() || null,
            notes: action.input.notes?.trim() || null,
            pointsValue: action.input.pointsValue ?? 0,
            repeat: action.input.repeat?.trim() || null,
            sourceHomeworkId: null,
            sourceRewardRequestId: null,
            startTime: action.input.startTime?.trim() || action.input.time?.trim() || null,
            subject: action.input.subject?.trim() || null,
            time: action.input.time?.trim() || null,
            title,
            type: action.input.type,
            updatedAt: now
          },
          ...state.calendarEvents
        ]
      };
    }

    case "updateCalendarEvent": {
      const now = new Date().toISOString();

      return {
        ...state,
        calendarEvents: state.calendarEvents.map((event) =>
          event.id === action.input.eventId
            ? {
                ...event,
                alert: action.input.alert?.trim() || null,
                allDay: action.input.allDay ?? false,
                category: action.input.category ?? event.category ?? "custom",
                color: action.input.color?.trim() || event.color || "#64748B",
                date: action.input.date.trim().slice(0, 10),
                endTime: action.input.endTime?.trim() || null,
                isCompleted: action.input.isCompleted ?? event.isCompleted ?? false,
                isRecurring: action.input.isRecurring ?? event.isRecurring ?? false,
                kind: action.input.kind ?? event.kind ?? "event",
                location: action.input.location?.trim() || null,
                notes: action.input.notes?.trim() || null,
                pointsValue: action.input.pointsValue ?? event.pointsValue ?? 0,
                repeat: action.input.repeat?.trim() || null,
                startTime: action.input.startTime?.trim() || action.input.time?.trim() || null,
                subject: action.input.subject?.trim() || null,
                time: action.input.time?.trim() || null,
                title: action.input.title.trim(),
                type: action.input.type,
                updatedAt: now
              }
            : event
        )
      };
    }

    case "deleteCalendarEvent":
      return {
        ...state,
        calendarEvents: state.calendarEvents.map((event) =>
          event.id === action.eventId ? { ...event, deletedAt: new Date().toISOString() } : event
        )
      };

    default:
      return state;
  }
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function createInitialHomeworkWeekEntries(): HomeworkItem[] {
  const weekStart = getWeekStartKey(new Date());
  const dayLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const now = new Date().toISOString();

  return dayLabels.map((dayLabel, index) => {
    const date = addDays(weekStart, index);

    return {
      assignedAt: now,
      childId,
      completedAt: null,
      completedDate: null,
      createdAt: now,
      createdBy: parentId,
      deletedAt: null,
      description: "",
      dueAt: `${date}T20:00:00.000Z`,
      dueDate: `${date}T20:00:00.000Z`,
      estimatedEffortMinutes: null,
      id: `homework-${date}`,
      status: "not_applicable",
      subject: "",
      submittedAt: null,
      title: dayLabel,
      updatedAt: now
    };
  });
}

function getWeekStartKey(date: Date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = start.getUTCDay();
  const distanceFromMonday = day === 0 ? 6 : day - 1;
  start.setUTCDate(start.getUTCDate() - distanceFromMonday);
  return start.toISOString().slice(0, 10);
}

function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function getMorningRoutineState(completions: MorningRoutineCompletion[]): MorningRoutineState {
  const date = today();
  const completion = completions.find((item) => item.date === date && item.childId === childId);
  const completedItemIds = completion?.completedItemIds ?? [];

  return {
    completedAt: completion?.completedAt ?? null,
    completedItemIds,
    date,
    isComplete: completedItemIds.length === morningRoutineItems.length,
    isSubmitted: Boolean(completion?.completedAt),
    items: morningRoutineItems,
    pointValue: morningRoutinePointValue,
    title: "Morning Routine"
  };
}

function getPointsBalance(transactions: PointsTransaction[]) {
  return transactions.reduce((total, transaction) => total + transaction.amount, 0);
}

function getReservedRewardPoints(rewards: Reward[], redemptions: RewardRedemption[]) {
  return redemptions
    .filter((redemption) => redemption.status === "requested")
    .reduce((total, redemption) => {
      const reward = rewards.find((item) => item.id === redemption.rewardId);
      return total + (reward?.pointCost ?? 0);
    }, 0);
}

function isActivePointsTransaction(transaction: PointsTransaction) {
  return !transaction.deletedAt && !transaction.reversedAt;
}

function getDailyPointsSummary(transactions: PointsTransaction[]): DailyPointsSummary {
  return transactions
    .filter((transaction) => transaction.createdAt.slice(0, 10) === today())
    .reduce(
      (summary, transaction) => {
        if (transaction.amount >= 0) {
          summary.earned += transaction.amount;
        } else {
          summary.lost += Math.abs(transaction.amount);
        }

        summary.net += transaction.amount;
        return summary;
      },
      { earned: 0, lost: 0, net: 0 }
    );
}

function getPointsLedgerSummary(transactions: PointsTransaction[]): PointsLedgerSummary {
  return transactions.reduce(
    (summary, transaction) => {
      if (transaction.type === "reward_redemption") {
        summary.spent += Math.abs(transaction.amount);
      } else if (transaction.amount > 0) {
        summary.earned += transaction.amount;
      } else {
        summary.adjustments += transaction.amount;
      }

      summary.available += transaction.amount;
      return summary;
    },
    { adjustments: 0, available: 0, earned: 0, spent: 0 }
  );
}
