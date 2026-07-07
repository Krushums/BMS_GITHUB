import { ReactNode, useEffect, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";

import { DashboardHeader } from "@/features/dashboard/DashboardHeader";
import { CalendarPanel } from "@/features/calendar/CalendarPanel";
import { useMockAuth } from "@/features/auth/MockAuthContext";
import { useGameplay } from "@/features/gameplay/GameplayContext";
import { HomeworkItem, PointsTransaction, RewardRequest } from "@/domain";
import { RewardCard } from "@/features/rewards/RewardCard";
import { SubmissionCard } from "@/features/submissions/SubmissionCard";
import { AppText } from "@/shared/components/AppText";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { Screen } from "@/shared/components/Screen";
import { ProfileMenu } from "@/shared/components/ProfileMenu";
import { usePreviewMode } from "@/shared/components/PreviewModeContext";
import { SummaryBar, SummaryCardItem } from "@/shared/components/SummaryBar";
import { HighlightTarget, TourOverlay, TourStep } from "@/features/help/TourOverlay";
import { colors, spacing } from "@/shared/theme";
import { addDays, addWeeks, formatDateLabel, formatDateTimeLabel, formatWeekRange, getStartOfWeek } from "@/shared/utils/date";

type ParentTab = "dashboard" | "tasks" | "homework" | "calendar" | "behaviour" | "rewards" | "review" | "history" | "analytics";

const tabs: Array<{ id: ParentTab; label: string }> = [
  { id: "dashboard", label: "Dashboard" },
  { id: "tasks", label: "Tasks" },
  { id: "homework", label: "Homework" },
  { id: "calendar", label: "Calendar" },
  { id: "behaviour", label: "Behaviour" },
  { id: "rewards", label: "Rewards" },
  { id: "review", label: "Review" },
  { id: "history", label: "History" },
  { id: "analytics", label: "Analytics" }
];

const parentTourSteps: Array<TourStep<ParentTab>> = [
  {
    target: "dashboard",
    title: "Dashboard",
    text: "This is your dashboard. Here you'll see approvals, activity and household progress."
  },
  {
    target: "tasks",
    title: "Tasks",
    text: "Create chores, routines and responsibilities. Assign points and due dates."
  },
  {
    target: "behaviour",
    title: "Behaviour",
    text: "Quickly reward positive behaviour or apply behaviour adjustments."
  },
  {
    target: "homework",
    title: "Homework",
    text: "Track homework consistency, review evidence and monitor academic habits."
  },
  {
    target: "rewards",
    title: "Rewards",
    text: "Create rewards your child can unlock using points."
  },
  {
    target: "review",
    title: "Review",
    text: "Approve homework evidence, task submissions and reward requests."
  },
  {
    target: "history",
    title: "History",
    text: "View points history and progress over time."
  }
];

const negativeAdjustments = [
  { amount: -5, category: "Time wasting" },
  { amount: -10, category: "Refused task" },
  { amount: -10, category: "Arguing / disrespect" },
  { amount: -5, category: "Missed routine" },
  { amount: -15, category: "Lying" },
  { amount: -5, category: "Bad language" }
];

const positiveAdjustments = [
  { amount: 10, category: "Helped without being asked" },
  { amount: 10, category: "Stayed calm" },
  { amount: 10, category: "Showed honesty" },
  { amount: 10, category: "Extra effort" }
];

type BehaviourPreset = {
  amount: number;
  category: string;
};

type BehaviourFilter = "today" | "week" | "positive" | "needsImprovement";

const defaultBehaviourPreset: BehaviourPreset = positiveAdjustments[0] ?? {
  amount: 10,
  category: "Helped without being asked"
};

export default function ParentDashboardScreen() {
  const gameplay = useGameplay();
  const auth = useMockAuth();
  const params = useLocalSearchParams<{ tour?: string }>();
  const { mode } = usePreviewMode();
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<ParentTab>("dashboard");
  const [tourIndex, setTourIndex] = useState(0);
  const [tourVisible, setTourVisible] = useState(false);
  const profileName = auth.currentParent?.fullName ?? "Parent";
  const activeTourStep = parentTourSteps[tourIndex] ?? parentTourSteps[0];
  const compact = mode === "phone" || width <= 520;

  useEffect(() => {
    if (params.tour === "parent") {
      setTourIndex(0);
      setTourVisible(true);
      setActiveTab("dashboard");
    }
  }, [params.tour]);

  useEffect(() => {
    if (tourVisible && activeTourStep) {
      setActiveTab(activeTourStep.target);
    }
  }, [activeTourStep, tourVisible]);

  function finishTour() {
    auth.completeTour("parent");
    setTourVisible(false);
  }

  return (
    <Screen>
      <ParentPageLayout>
        <View style={styles.headerRow}>
          <View style={styles.headerContent}>
            <DashboardHeader greeting="Family pulse" points={gameplay.state.child.points} streak={gameplay.state.child.streak} />
          </View>
          <ProfileMenu displayName={profileName} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow} style={styles.tabScroller}>
          {tabs.map((tab) => (
            <HighlightTarget active={tourVisible && activeTourStep?.target === tab.id} key={tab.id}>
              <Button
                label={tab.label}
                onPress={() => setActiveTab(tab.id)}
                style={compact ? styles.parentTabButtonCompact : undefined}
                variant={activeTab === tab.id ? "primary" : "secondary"}
              />
            </HighlightTarget>
          ))}
        </ScrollView>

        <View style={styles.parentTabPanel}>
          {activeTab === "dashboard" ? <DashboardTab gameplay={gameplay} setActiveTab={setActiveTab} /> : null}
          {activeTab === "tasks" ? <TasksTab gameplay={gameplay} /> : null}
          {activeTab === "homework" ? <HomeworkTab gameplay={gameplay} /> : null}
          {activeTab === "calendar" ? <CalendarPanel audience="parent" /> : null}
          {activeTab === "behaviour" ? <BehaviourTab gameplay={gameplay} /> : null}
          {activeTab === "rewards" ? <RewardsTab gameplay={gameplay} /> : null}
          {activeTab === "review" ? <ReviewTab gameplay={gameplay} /> : null}
          {activeTab === "history" ? <HistoryTab gameplay={gameplay} /> : null}
          {activeTab === "analytics" ? <AnalyticsTab gameplay={gameplay} /> : null}
        </View>
        <TourOverlay
          currentIndex={tourIndex}
          onBack={() => setTourIndex((value) => Math.max(0, value - 1))}
          onFinish={finishTour}
          onNext={() => setTourIndex((value) => Math.min(parentTourSteps.length - 1, value + 1))}
          onSkip={finishTour}
          steps={parentTourSteps}
          visible={tourVisible}
        />
      </ParentPageLayout>
    </Screen>
  );
}

type Gameplay = ReturnType<typeof useGameplay>;

function ParentPageLayout({ children }: { children: ReactNode }) {
  return <View style={styles.parentPageLayout}>{children}</View>;
}

function DashboardTab({ gameplay, setActiveTab }: { gameplay: Gameplay; setActiveTab: (tab: ParentTab) => void }) {
  const completedToday = gameplay.todayTasks.filter(({ assignment }) => assignment.status === "approved").length;

  return (
    <>
      <PriorityAlerts gameplay={gameplay} setActiveTab={setActiveTab} />
      <SummaryBar items={getParentSummaryItems(gameplay)} />

      <View style={styles.grid}>
        <Card style={styles.parentGridCard} tone="fresh">
          <AppText variant="heading">{completedToday}/{gameplay.todayTasks.length}</AppText>
          <AppText color={colors.inkMuted} variant="caption">Tasks approved today</AppText>
        </Card>
        <Card style={styles.parentGridCard} tone="warm">
          <AppText variant="heading">{gameplay.pendingSubmissions.length + gameplay.rewardRequests.length + gameplay.pendingRewardGoalRequests.length}</AppText>
          <AppText color={colors.inkMuted} variant="caption">Pending reviews</AppText>
        </Card>
      </View>

      <Card>
        <AppText variant="heading">Quick links</AppText>
        <View style={styles.quickLinks}>
          <Button label="Create task" onPress={() => setActiveTab("tasks")} variant="secondary" />
          <Button label="Homework" onPress={() => setActiveTab("homework")} variant="secondary" />
          <Button label="Behaviour" onPress={() => setActiveTab("behaviour")} variant="secondary" />
          <Button label="Review" onPress={() => setActiveTab("review")} variant="secondary" />
          <Button label="Rewards" onPress={() => setActiveTab("rewards")} variant="secondary" />
          <Button label="Analytics" onPress={() => setActiveTab("analytics")} variant="secondary" />
        </View>
      </Card>
    </>
  );
}

function PriorityAlerts({ gameplay, setActiveTab }: { gameplay: Gameplay; setActiveTab: (tab: ParentTab) => void }) {
  const hasAlerts = gameplay.rewardRequests.length > 0 || gameplay.pendingSubmissions.length > 0 || gameplay.pendingRewardGoalRequests.length > 0;

  if (!hasAlerts) {
    return null;
  }

  return (
    <View style={styles.alertStack}>
      {gameplay.pendingRewardGoalRequests.map((request) => (
        <ParentRewardRequestReviewCard compact gameplay={gameplay} key={request.id} request={request} />
      ))}

      {gameplay.rewardRequests.map(({ redemption, reward }) => (
        <Card key={redemption.id} style={styles.priorityAlert} tone="warm">
          <View style={styles.alertHeader}>
            <View style={styles.alertIcon}>
              <Ionicons color={colors.accent} name="gift" size={22} />
            </View>
            <View style={styles.alertCopy}>
              <AppText variant="body">
                {gameplay.state.child.displayName} requested: {reward.title} — {reward.pointCost} pts
              </AppText>
              <AppText color={colors.inkMuted} variant="caption">
                Requested {formatDateTimeLabel(redemption.requestedAt)}
              </AppText>
            </View>
          </View>
          <View style={styles.actions}>
            <Button label="Reject" onPress={() => gameplay.reviewRewardRedemption(redemption.id, "rejected")} variant="quiet" />
            <Button icon="checkmark" label="Approve" onPress={() => gameplay.reviewRewardRedemption(redemption.id, "approved")} />
          </View>
        </Card>
      ))}

      {gameplay.pendingSubmissions.length > 0 ? (
        <Card style={styles.proofAlert} tone="focus">
          <View style={styles.alertHeader}>
            <View style={styles.alertIcon}>
              <Ionicons color={colors.primary} name="camera" size={22} />
            </View>
            <View style={styles.alertCopy}>
              <AppText variant="body">
                {gameplay.pendingSubmissions.length} proof {gameplay.pendingSubmissions.length === 1 ? "submission" : "submissions"} waiting
              </AppText>
              <AppText color={colors.inkMuted} variant="caption">
                Review task evidence when you have a moment.
              </AppText>
            </View>
          </View>
          <Button label="Open review" onPress={() => setActiveTab("review")} variant="secondary" />
        </Card>
      ) : null}
    </View>
  );
}

function ParentRewardRequestReviewCard({ compact = false, gameplay, request }: { compact?: boolean; gameplay: Gameplay; request: RewardRequest }) {
  const [target, setTarget] = useState(String(request.suggestedPointTarget ?? 100));
  const [conditions, setConditions] = useState("");
  const [deadlineDate, setDeadlineDate] = useState(request.eventDate ?? "");
  const [parentNote, setParentNote] = useState("");

  function approve() {
    const parentPointTarget = Number(target);

    if (!Number.isFinite(parentPointTarget) || parentPointTarget <= 0) {
      Alert.alert("Set a target", "Add the points needed for this goal.");
      return;
    }

    gameplay.reviewRewardRequest({
      conditions,
      deadlineDate,
      decision: "approved",
      parentNote,
      parentPointTarget,
      requestId: request.id
    });
  }

  function deny() {
    gameplay.reviewRewardRequest({
      decision: "denied",
      parentNote: parentNote || "Not right now.",
      requestId: request.id
    });
  }

  return (
    <Card style={styles.priorityAlert} tone="warm">
      <View style={styles.alertHeader}>
        <View style={styles.alertIcon}>
          <Ionicons color={colors.accent} name="flag" size={22} />
        </View>
        <View style={styles.alertCopy}>
          <AppText variant="body">New reward request from {gameplay.state.child.displayName}</AppText>
          <AppText color={colors.inkMuted} variant="caption">
            {request.title} · {request.description}
          </AppText>
          {request.eventDate ? (
            <AppText color={colors.inkMuted} variant="caption">
              Event date: {formatDateLabel(request.eventDate)}
            </AppText>
          ) : null}
        </View>
      </View>

      {!compact ? (
        <View style={styles.formGroup}>
          <TextInput keyboardType="number-pad" onChangeText={setTarget} placeholder="Required points" placeholderTextColor={colors.inkMuted} style={styles.input} value={target} />
          <TextInput onChangeText={setDeadlineDate} placeholder="Deadline / event date optional" placeholderTextColor={colors.inkMuted} style={styles.input} value={deadlineDate} />
          <TextInput multiline onChangeText={setConditions} placeholder="Conditions optional" placeholderTextColor={colors.inkMuted} style={[styles.input, styles.noteInput]} value={conditions} />
          <TextInput multiline onChangeText={setParentNote} placeholder="Parent note optional" placeholderTextColor={colors.inkMuted} style={[styles.input, styles.noteInput]} value={parentNote} />
        </View>
      ) : (
        <View style={styles.formGroup}>
          <TextInput keyboardType="number-pad" onChangeText={setTarget} placeholder="Required points" placeholderTextColor={colors.inkMuted} style={styles.input} value={target} />
          <TextInput onChangeText={setParentNote} placeholder="Optional note" placeholderTextColor={colors.inkMuted} style={styles.input} value={parentNote} />
        </View>
      )}

      <View style={styles.actions}>
        <Button label="Deny" onPress={deny} variant="quiet" />
        <Button icon="checkmark" label="Approve goal" onPress={approve} />
      </View>
    </Card>
  );
}

function TasksTab({ gameplay }: { gameplay: Gameplay }) {
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPoints, setTaskPoints] = useState("25");
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPoints, setEditPoints] = useState("");
  const activeTasks = gameplay.assignedTasks.filter(({ assignment }) => assignment.status !== "approved");

  function handleCreateTask() {
    const pointValue = Number(taskPoints);
    if (!taskTitle.trim() || !Number.isFinite(pointValue)) {
      Alert.alert("Task needs a title and points", "Add a clear task name and a point value.");
      return;
    }

    gameplay.createTask({ description: taskDescription, pointValue, title: taskTitle });
    setTaskTitle("");
    setTaskDescription("");
    setTaskPoints("25");
  }

  function startEditing(assignmentId: string) {
    const item = gameplay.assignedTasks.find(({ assignment }) => assignment.id === assignmentId);
    if (!item) return;
    setEditingAssignmentId(assignmentId);
    setEditTitle(item.task.title);
    setEditDescription(item.task.description ?? "");
    setEditPoints(String(item.task.pointValue));
  }

  function saveEdit() {
    if (!editingAssignmentId) return;
    const pointValue = Number(editPoints);
    if (!editTitle.trim() || !Number.isFinite(pointValue)) {
      Alert.alert("Task needs a title and points", "Add a clear task name and a point value.");
      return;
    }
    gameplay.updateTask({ assignmentId: editingAssignmentId, description: editDescription, pointValue, title: editTitle });
    setEditingAssignmentId(null);
  }

  function confirmDelete(assignmentId: string) {
    if (Platform.OS === "web") {
      const confirmed = globalThis.confirm?.("Cancel this task? It will disappear from active parent and child views.") ?? true;
      if (confirmed) gameplay.cancelTask(assignmentId);
      return;
    }
    Alert.alert("Cancel this task?", "It will disappear from active parent and child views.", [
      { style: "cancel", text: "Keep task" },
      { onPress: () => gameplay.cancelTask(assignmentId), style: "destructive", text: "Cancel task" }
    ]);
  }

  return (
    <>
      <Card>
        <AppText variant="heading">Create task</AppText>
        <TextInput onChangeText={setTaskTitle} placeholder="Task title" placeholderTextColor={colors.inkMuted} style={styles.input} value={taskTitle} />
        <TextInput onChangeText={setTaskDescription} placeholder="Short description" placeholderTextColor={colors.inkMuted} style={styles.input} value={taskDescription} />
        <TextInput keyboardType="number-pad" onChangeText={setTaskPoints} placeholder="Points" placeholderTextColor={colors.inkMuted} style={styles.input} value={taskPoints} />
        <Button icon="add" label="Assign to Maya" onPress={handleCreateTask} />
      </Card>

      <AppText variant="heading">Today’s tasks</AppText>
      {gameplay.todayTasks.map(({ assignment, submission, task }) => (
        <TaskEditorCard
          assignmentId={assignment.id}
          childName={gameplay.state.child.displayName}
          editingAssignmentId={editingAssignmentId}
          editDescription={editDescription}
          editPoints={editPoints}
          editTitle={editTitle}
          key={assignment.id}
          onCancelEdit={() => setEditingAssignmentId(null)}
          onDelete={() => confirmDelete(assignment.id)}
          onEdit={() => startEditing(assignment.id)}
          onSave={saveEdit}
          setEditDescription={setEditDescription}
          setEditPoints={setEditPoints}
          setEditTitle={setEditTitle}
          taskInfo={{ assignment, submission, task }}
        />
      ))}

      <AppText variant="heading">Active assigned tasks</AppText>
      {activeTasks.length === 0 ? <Card><AppText color={colors.inkMuted}>No active tasks right now.</AppText></Card> : null}
      {activeTasks.map(({ assignment, submission, task }) => (
        <TaskEditorCard
          assignmentId={assignment.id}
          childName={gameplay.state.child.displayName}
          editingAssignmentId={editingAssignmentId}
          editDescription={editDescription}
          editPoints={editPoints}
          editTitle={editTitle}
          key={assignment.id}
          onCancelEdit={() => setEditingAssignmentId(null)}
          onDelete={() => confirmDelete(assignment.id)}
          onEdit={() => startEditing(assignment.id)}
          onSave={saveEdit}
          setEditDescription={setEditDescription}
          setEditPoints={setEditPoints}
          setEditTitle={setEditTitle}
          taskInfo={{ assignment, submission, task }}
        />
      ))}
    </>
  );
}

function TaskEditorCard(props: {
  assignmentId: string;
  childName: string;
  editingAssignmentId: string | null;
  editDescription: string;
  editPoints: string;
  editTitle: string;
  onCancelEdit: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onSave: () => void;
  setEditDescription: (value: string) => void;
  setEditPoints: (value: string) => void;
  setEditTitle: (value: string) => void;
  taskInfo: Gameplay["assignedTasks"][number];
}) {
  const { assignment, task } = props.taskInfo;
  const isEditing = props.editingAssignmentId === props.assignmentId;

  return (
    <Card>
      {isEditing ? (
        <View style={styles.formGroup}>
          <TextInput onChangeText={props.setEditTitle} placeholder="Task title" placeholderTextColor={colors.inkMuted} style={styles.input} value={props.editTitle} />
          <TextInput onChangeText={props.setEditDescription} placeholder="Short description" placeholderTextColor={colors.inkMuted} style={styles.input} value={props.editDescription} />
          <TextInput keyboardType="number-pad" onChangeText={props.setEditPoints} placeholder="Points" placeholderTextColor={colors.inkMuted} style={styles.input} value={props.editPoints} />
          <View style={styles.actions}>
            <Button label="Cancel" onPress={props.onCancelEdit} variant="quiet" />
            <Button icon="checkmark" label="Save" onPress={props.onSave} />
          </View>
        </View>
      ) : (
        <>
          <AppText variant="body">{task.title}</AppText>
          <AppText color={colors.inkMuted} variant="caption">
            Assigned to {props.childName} • {task.pointValue} points • {assignment.status}
          </AppText>
          <AppText color={colors.inkMuted} variant="caption">
            Due {formatDateLabel(assignment.dueDate)} • Created {formatDateTimeLabel(assignment.createdAt)}
          </AppText>
          <View style={styles.actions}>
            <Button label="Edit" onPress={props.onEdit} variant="secondary" />
            <Button label="Delete" onPress={props.onDelete} variant="quiet" />
          </View>
        </>
      )}
    </Card>
  );
}

function HomeworkTab({ gameplay }: { gameplay: Gameplay }) {
  const [weekStart, setWeekStart] = useState(getStartOfWeek(new Date()));
  const analytics = getParentHomeworkAnalytics(gameplay, weekStart);
  const weekEntries = getCurrentWeekParentHomework(gameplay, weekStart);
  const weekDays = getWeekDays(weekStart);
  const [subjectDraft, setSubjectDraft] = useState("");

  function addSubject() {
    const nextSubject = subjectDraft.trim();

    if (!nextSubject) {
      return;
    }

    gameplay.addHomeworkSubject(nextSubject);
    setSubjectDraft("");
  }

  return (
    <>
      <Card tone="focus">
        <View style={styles.sectionHeader}>
          <View style={styles.cardText}>
            <AppText variant="heading">Weekly Homework</AppText>
            <AppText color={colors.inkMuted}>A lightweight weekly view for daily academic accountability.</AppText>
          </View>
        </View>
        <View style={styles.summaryTriplet}>
          <LedgerMetric color={colors.success} label="Completion" value={`${analytics.completionPercent}%`} />
          <LedgerMetric color={colors.sky} label="Evidence days" value={analytics.evidenceDays} />
          <LedgerMetric color={colors.accent} label="In progress" value={analytics.inProgressDays} />
          <LedgerMetric color={colors.success} label="Complete days" value={analytics.completedDays} />
        </View>
      </Card>

      <Card>
        <View style={styles.homeworkNav}>
          <Button label="Prev" onPress={() => setWeekStart(addWeeks(weekStart, -1))} style={styles.homeworkNavButton} variant="secondary" />
          <Button label="This week" onPress={() => setWeekStart(getStartOfWeek(new Date()))} style={styles.homeworkNavButton} variant="secondary" />
          <Button label="Next" onPress={() => setWeekStart(addWeeks(weekStart, 1))} style={styles.homeworkNavButton} variant="secondary" />
        </View>
        <AppText color={colors.inkMuted} variant="caption">
          Week beginning: {formatWeekRange(weekStart)}
        </AppText>
      </Card>

      <Card>
        <View style={styles.sectionHeader}>
          <View>
            <AppText variant="heading">Subjects</AppText>
            <AppText color={colors.inkMuted} variant="caption">Keep the child homework dropdown simple and household-specific.</AppText>
          </View>
        </View>
        <View style={styles.subjectRow}>
          <TextInput
            onChangeText={setSubjectDraft}
            onSubmitEditing={addSubject}
            placeholder="Add subject"
            placeholderTextColor={colors.inkMuted}
            style={[styles.input, styles.subjectInput]}
            value={subjectDraft}
          />
          <Button label="Add" onPress={addSubject} variant="secondary" />
        </View>
        <View style={styles.subjectChips}>
          {gameplay.state.homeworkSubjects.map((subject) => (
            <View key={subject} style={styles.subjectChip}>
              <AppText variant="caption">{subject}</AppText>
            </View>
          ))}
        </View>
      </Card>

      <AppText variant="heading">Current week</AppText>
      <View style={styles.homeworkWeekGrid}>
        {weekDays.map((date) => (
          <ParentHomeworkDayCard date={date} gameplay={gameplay} items={weekEntries} key={date} />
        ))}
      </View>
    </>
  );
}

function ParentHomeworkDayCard({ date, gameplay, items }: { date: string; gameplay: Gameplay; items: HomeworkItem[] }) {
  const dueItems = items.filter((homework) => isSameDate(homework.dueDate, date));
  const completedItems = items.filter((homework) => isSameDate(homework.completedDate, date));

  return (
    <Card style={styles.homeworkGridCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.cardText}>
          <AppText variant="body">{formatShortWeekday(date)}</AppText>
          <AppText color={colors.inkMuted} variant="caption">{formatDateLabel(date)}</AppText>
        </View>
      </View>

      <ParentHomeworkGroup gameplay={gameplay} items={dueItems} title="Due this day" />
      <ParentHomeworkGroup gameplay={gameplay} items={completedItems} title="Submitted/completed this day" />
    </Card>
  );
}

function ParentHomeworkGroup({ gameplay, items, title }: { gameplay: Gameplay; items: HomeworkItem[]; title: string }) {
  return (
    <View style={styles.homeworkGroup}>
      <AppText color={colors.inkMuted} variant="caption">{title}</AppText>
      {items.length === 0 ? <AppText color={colors.inkMuted} variant="caption">None</AppText> : null}
      {items.slice(0, 3).map((homework) => (
        <ParentHomeworkMiniCard gameplay={gameplay} homework={homework} key={homework.id} />
      ))}
      {items.length > 3 ? <AppText color={colors.inkMuted} variant="caption">+{items.length - 3} more</AppText> : null}
    </View>
  );
}

function ParentHomeworkMiniCard({ gameplay, homework }: { gameplay: Gameplay; homework: HomeworkItem }) {
  const evidence = gameplay.state.homeworkEvidence.filter((item) => item.homeworkId === homework.id && !item.deletedAt);
  const hasEvidence = evidence.length > 0;

  return (
    <View style={[styles.homeworkMiniCard, getParentHomeworkListToneStyle(homework.status)]}>
      <View style={styles.homeworkMiniHeader}>
        <View style={styles.cardText}>
          <AppText variant="body">{homework.title}</AppText>
          <AppText color={colors.inkMuted} variant="caption">
            {homework.subject || "No subject"}
          </AppText>
        </View>
        <View style={[styles.statusPill, getParentHomeworkStatusPillStyle(homework.status)]}>
          <AppText color={homework.status === "completed" ? colors.success : homework.status === "incomplete" ? colors.danger : homework.status === "in_progress" ? colors.accent : colors.inkMuted} variant="caption">
            {formatHomeworkStatus(homework.status)}
          </AppText>
        </View>
      </View>
      {homework.description ? <AppText color={colors.inkMuted} style={styles.notePreview} variant="caption">{homework.description}</AppText> : null}
      <View style={styles.summaryTriplet}>
        <AppText color={hasEvidence ? colors.success : colors.inkMuted} variant="caption">
          Evidence {hasEvidence ? "uploaded" : "not uploaded"}
        </AppText>
        <AppText color={homework.status === "completed" ? colors.success : colors.inkMuted} variant="caption">
          {homework.status === "completed" ? "Completed" : homework.status === "incomplete" ? "Incomplete" : homework.status === "in_progress" ? "In progress" : "N/A"}
        </AppText>
        <AppText color={colors.inkMuted} variant="caption">Due {formatDateLabel(homework.dueDate)}</AppText>
        <AppText color={colors.inkMuted} variant="caption">Done {homework.completedDate ? formatDateLabel(homework.completedDate) : "Not yet"}</AppText>
      </View>
      {evidence.slice(0, 2).map((item) => (
        <AppText color={colors.inkMuted} key={item.id} style={styles.notePreview} variant="caption">
          Evidence submitted {formatDateTimeLabel(item.submittedAt)}{item.comment ? ` · ${item.comment}` : ""}
        </AppText>
      ))}
    </View>
  );
}

function BehaviourTab({ gameplay }: { gameplay: Gameplay }) {
  const [presetNote, setPresetNote] = useState("");
  const [customCategory, setCustomCategory] = useState(defaultBehaviourPreset.category);
  const [customPoints, setCustomPoints] = useState(String(defaultBehaviourPreset.amount));
  const [customNote, setCustomNote] = useState("");
  const [filter, setFilter] = useState<BehaviourFilter>("today");
  const [confirmation, setConfirmation] = useState<{ message: string; transactionId: string } | null>(null);

  const behaviourTransactions = gameplay.state.pointsTransactions.filter((transaction) => transaction.type === "behaviour_adjustment");
  const visibleTransactions = filterBehaviourTransactions(behaviourTransactions, filter);

  function applyPreset(preset: BehaviourPreset) {
    const transactionId = gameplay.applyBehaviourAdjustment({
      amount: preset.amount,
      category: preset.category,
      note: presetNote
    });
    setConfirmation({
      message: `${preset.amount >= 0 ? "+" : ""}${preset.amount} ${preset.category} added for ${gameplay.state.child.displayName}`,
      transactionId
    });
    setPresetNote("");
  }

  function applyCustomAdjustment() {
    const amount = Number(customPoints);

    if (!customCategory.trim() || !Number.isFinite(amount) || amount === 0) {
      Alert.alert("Adjustment needs details", "Add a behaviour name and a positive or negative point value.");
      return;
    }

    const transactionId = gameplay.applyBehaviourAdjustment({
      amount,
      category: customCategory,
      note: customNote
    });
    setConfirmation({
      message: `${amount >= 0 ? "+" : ""}${amount} ${customCategory} added for ${gameplay.state.child.displayName}`,
      transactionId
    });
    setCustomNote("");
  }

  function undoTransaction(transactionId: string) {
    gameplay.reversePointsTransaction(transactionId);
    setConfirmation(null);
  }

  return (
    <>
      <SummaryBar items={getParentSummaryItems(gameplay)} />

      <View style={styles.behaviourShell}>
        <Card style={styles.behaviourColumn}>
          <View style={styles.sectionHeader}>
            <View>
              <AppText variant="heading">Behaviour settings</AppText>
              <AppText color={colors.inkMuted}>Tap once to recognise momentum or log a quick reset.</AppText>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => Alert.alert("Demo child selected", `${gameplay.state.child.displayName} is the active child for this MVP.`)}
            style={styles.childSelector}
          >
            <View>
              <AppText color={colors.inkMuted} variant="caption">
                Selected child
              </AppText>
              <AppText variant="body">{gameplay.state.child.displayName}</AppText>
            </View>
            <Ionicons color={colors.inkMuted} name="chevron-down" size={20} />
          </Pressable>

          {confirmation ? (
            <View style={styles.confirmationBox}>
              <AppText color={colors.primaryDark} variant="caption">
                {confirmation.message}
              </AppText>
              <Button label="Undo" onPress={() => undoTransaction(confirmation.transactionId)} variant="quiet" />
            </View>
          ) : null}

          <TextInput
            multiline
            onChangeText={setPresetNote}
            placeholder="Optional note for the next quick action"
            placeholderTextColor={colors.inkMuted}
            style={[styles.input, styles.noteInput]}
            value={presetNote}
          />

          <BehaviourPresetSection
            accentColor={colors.success}
            icon="star"
            items={positiveAdjustments}
            title="Positive actions"
            onSelect={applyPreset}
          />

          <BehaviourPresetSection
            accentColor="#F25A1D"
            icon="alert-circle"
            items={negativeAdjustments}
            title="Needs improvement"
            onSelect={applyPreset}
          />

          <View style={styles.customAdjustmentBox}>
            <AppText variant="body">Custom adjustment</AppText>
            <TextInput onChangeText={setCustomCategory} placeholder="Behaviour category" placeholderTextColor={colors.inkMuted} style={styles.input} value={customCategory} />
            <TextInput keyboardType="numbers-and-punctuation" onChangeText={setCustomPoints} placeholder="Point change" placeholderTextColor={colors.inkMuted} style={styles.input} value={customPoints} />
            <TextInput multiline onChangeText={setCustomNote} placeholder="Optional note" placeholderTextColor={colors.inkMuted} style={[styles.input, styles.noteInput]} value={customNote} />
            <Button icon="swap-horizontal" label="Apply custom adjustment" onPress={applyCustomAdjustment} variant="secondary" />
          </View>
        </Card>

        <Card style={styles.behaviourColumn}>
          <View style={styles.sectionHeader}>
            <View>
              <AppText variant="heading">Behaviour points log</AppText>
              <AppText color={colors.inkMuted}>Recent adjustments stay visible and fair.</AppText>
            </View>
          </View>

          <View style={styles.filterRow}>
            <FilterButton active={filter === "today"} label="Today" onPress={() => setFilter("today")} />
            <FilterButton active={filter === "week"} label="This week" onPress={() => setFilter("week")} />
            <FilterButton active={filter === "positive"} label="Positive" onPress={() => setFilter("positive")} />
            <FilterButton active={filter === "needsImprovement"} label="Needs improvement" onPress={() => setFilter("needsImprovement")} />
          </View>

          {visibleTransactions.length === 0 ? (
            <View style={styles.emptyLog}>
              <AppText color={colors.inkMuted}>No behaviour adjustments for this filter yet.</AppText>
            </View>
          ) : null}

          {visibleTransactions.map((transaction) => (
            <BehaviourLogItem
              childName={gameplay.state.child.displayName}
              key={transaction.id}
              onUndo={() => undoTransaction(transaction.id)}
              transaction={transaction}
            />
          ))}
        </Card>
      </View>
    </>
  );
}

function BehaviourPresetSection({
  accentColor,
  icon,
  items,
  onSelect,
  title
}: {
  accentColor: string;
  icon: keyof typeof Ionicons.glyphMap;
  items: BehaviourPreset[];
  onSelect: (preset: BehaviourPreset) => void;
  title: string;
}) {
  return (
    <View style={styles.behaviourSection}>
      <View style={styles.behaviourSectionTitle}>
        <Ionicons color={accentColor} name={icon} size={18} />
        <AppText color={accentColor} variant="body">
          {title}
        </AppText>
      </View>
      <View style={styles.behaviourGrid}>
        {items.map((item) => (
          <BehaviourPresetCard
            accentColor={accentColor}
            item={item}
            key={item.category}
            onPress={() => onSelect(item)}
          />
        ))}
      </View>
    </View>
  );
}

function BehaviourPresetCard({
  accentColor,
  item,
  onPress
}: {
  accentColor: string;
  item: BehaviourPreset;
  onPress: () => void;
}) {
  const isPositive = item.amount > 0;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.behaviourPresetCard,
        isPositive ? styles.positivePreset : styles.negativePreset,
        pressed && styles.pressedCard
      ]}
    >
      <View style={[styles.presetIcon, { backgroundColor: isPositive ? "#DDF8EA" : "#FFE3D6" }]}>
        <Ionicons color={accentColor} name={isPositive ? "happy" : "time"} size={24} />
      </View>
      <AppText style={styles.presetTitle} variant="caption">
        {item.category}
      </AppText>
      <AppText color={isPositive ? colors.success : "#D12F05"} variant="caption">
        {item.amount >= 0 ? "+" : ""}{item.amount} pts
      </AppText>
    </Pressable>
  );
}

function FilterButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.filterButton, active && styles.filterButtonActive]}>
      <AppText color={active ? colors.surface : colors.ink} variant="caption">
        {label}
      </AppText>
    </Pressable>
  );
}

function BehaviourLogItem({ childName, onUndo, transaction }: { childName: string; onUndo: () => void; transaction: PointsTransaction }) {
  const isPositive = transaction.amount > 0;

  return (
    <View style={styles.logItem}>
      <View style={[styles.logIcon, { backgroundColor: isPositive ? "#DDF8EA" : "#FFE3D6" }]}>
        <Ionicons color={isPositive ? colors.success : "#F25A1D"} name={isPositive ? "sparkles" : "refresh"} size={18} />
      </View>
      <View style={styles.logContent}>
        <View style={styles.logHeader}>
          <AppText variant="body">{childName}</AppText>
          <View style={styles.logActions}>
            <AppText color={isPositive ? colors.success : colors.danger} variant="body">
              {transaction.amount >= 0 ? "+" : ""}{transaction.amount}
            </AppText>
            <Pressable accessibilityLabel="Undo behaviour adjustment" accessibilityRole="button" onPress={onUndo} style={styles.iconButton}>
              <Ionicons color={colors.inkMuted} name="trash-outline" size={18} />
            </Pressable>
          </View>
        </View>
        <AppText variant="caption">{transaction.category}</AppText>
        {transaction.note ? (
          <AppText color={colors.inkMuted} variant="caption">
            {transaction.note}
          </AppText>
        ) : null}
        <View style={styles.logMetaRow}>
          <AppText color={colors.inkMuted} variant="caption">
            {formatDateTimeLabel(transaction.createdAt)}
          </AppText>
          <AppText color={isPositive ? colors.success : "#F25A1D"} variant="caption">
            {isPositive ? "positive" : "needs improvement"}
          </AppText>
        </View>
      </View>
    </View>
  );
}

function filterBehaviourTransactions(transactions: PointsTransaction[], filter: BehaviourFilter) {
  const now = new Date();
  const todayDate = now.toISOString().slice(0, 10);
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);

  return transactions.filter((transaction) => {
    if (filter === "today") {
      return transaction.createdAt.slice(0, 10) === todayDate;
    }

    if (filter === "week") {
      return new Date(transaction.createdAt) >= weekAgo;
    }

    if (filter === "positive") {
      return transaction.amount > 0;
    }

    return transaction.amount < 0;
  });
}

function formatHomeworkStatus(status: HomeworkItem["status"]) {
  if (status === "not_started") return "Not started";
  if (status === "in_progress") return "In progress";
  if (status === "completed") return "Completed";
  if (status === "incomplete") return "Incomplete";
  return "N/A";
}

function getParentHomeworkListToneStyle(status: HomeworkItem["status"]) {
  if (status === "completed") return styles.homeworkMiniComplete;
  if (status === "incomplete") return styles.homeworkMiniIncomplete;
  if (status === "in_progress") return styles.homeworkMiniInProgress;
  return null;
}

function getParentHomeworkStatusPillStyle(status: HomeworkItem["status"]) {
  if (status === "completed") return styles.statusPillComplete;
  if (status === "incomplete") return styles.statusPillIncomplete;
  if (status === "in_progress") return styles.statusPillInProgress;
  return null;
}

function getParentHomeworkAnalytics(gameplay: Gameplay, weekStart: string) {
  const weekEnd = addDays(weekStart, 6);
  const weekEntries = gameplay.state.homeworkItems.filter(
    (item) =>
      !item.deletedAt &&
      !isPlaceholderHomework(item) &&
      (isDateKeyInRange(item.dueDate, weekStart, weekEnd) || isDateKeyInRange(item.completedDate, weekStart, weekEnd))
  );
  const accountableItems = weekEntries.filter((item) => item.status !== "not_applicable");
  const completedItems = accountableItems.filter((item) => item.status === "completed");
  const evidenceDays = new Set(
    gameplay.state.homeworkEvidence
      .filter((evidence) => !evidence.deletedAt)
      .map((evidence) => gameplay.state.homeworkItems.find((item) => item.id === evidence.homeworkId))
      .filter(
        (item): item is HomeworkItem =>
          Boolean(
            item &&
              !isPlaceholderHomework(item) &&
              (isDateKeyInRange(item.dueDate, weekStart, weekEnd) || isDateKeyInRange(item.completedDate, weekStart, weekEnd))
          )
      )
      .map((item) => (item.completedDate ?? item.dueDate).slice(0, 10))
  ).size;

  return {
    completedDays: completedItems.length,
    completionPercent: accountableItems.length === 0 ? 100 : Math.round((completedItems.length / accountableItems.length) * 100),
    evidenceDays,
    inProgressDays: weekEntries.filter((item) => item.status === "in_progress").length
  };
}

function getCurrentWeekParentHomework(gameplay: Gameplay, weekStart: string) {
  const weekEnd = addDays(weekStart, 6);

  return gameplay.state.homeworkItems
    .filter(
      (item) =>
        !item.deletedAt &&
        !isPlaceholderHomework(item) &&
        (isDateKeyInRange(item.dueDate, weekStart, weekEnd) || isDateKeyInRange(item.completedDate, weekStart, weekEnd))
    )
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
}

function getWeekDays(weekStart: string) {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

function isSameDate(value: string | null, date: string) {
  const valueKey = toSafeDateKey(value);
  const dateKey = toSafeDateKey(date);
  return Boolean(valueKey && dateKey && valueKey === dateKey);
}

function formatShortWeekday(date: string) {
  const parsedDate = parseDateKey(date) ?? new Date();
  return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(parsedDate);
}

function parseDateKey(date: string | null | undefined) {
  if (!date) {
    return null;
  }

  const parsedDate = new Date(`${date.slice(0, 10)}T12:00:00.000Z`);
  return Number.isFinite(parsedDate.getTime()) ? parsedDate : null;
}

function toSafeDateKey(date: string | null | undefined) {
  return parseDateKey(date)?.toISOString().slice(0, 10) ?? null;
}

function isPlaceholderHomework(item: HomeworkItem) {
  return item.status === "not_applicable" && !item.subject.trim() && !item.description?.trim();
}

function getHomeworkConsistencyStreak(gameplay: Gameplay) {
  const activeDays = new Set<string>();
  gameplay.state.homeworkSessions.filter((session) => !session.deletedAt).forEach((session) => activeDays.add(session.startedAt.slice(0, 10)));
  gameplay.state.homeworkEvidence.filter((evidence) => !evidence.deletedAt).forEach((evidence) => activeDays.add(evidence.submittedAt.slice(0, 10)));
  gameplay.state.homeworkItems.forEach((item) => {
    if (!item.deletedAt && item.completedAt) activeDays.add(item.completedAt.slice(0, 10));
  });

  let streak = 0;
  const cursor = new Date();

  while (activeDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

function getParentSummaryItems(gameplay: Gameplay): SummaryCardItem[] {
  return [
    {
      details: [
        {
          color: colors.success,
          label: "Earned",
          value: `${gameplay.pointsSummary.earned}`
        },
        {
          color: colors.accent,
          label: "Spent",
          value: `${gameplay.pointsSummary.spent}`
        },
        {
          color: colors.sky,
          label: "Available",
          value: `${gameplay.pointsSummary.available}`
        }
      ],
      icon: "pulse",
      label: "Points summary",
      value: "Ledger",
      accentColor: colors.success
    },
    {
      caption: "Keep it going",
      icon: "flame",
      label: "Streak",
      value: `${gameplay.state.child.streak} days`,
      accentColor: colors.accent
    },
    {
      caption: `${gameplay.state.child.displayName}'s balance`,
      icon: "sparkles",
      label: "Balance",
      value: `${gameplay.pointsSummary.available} pts`,
      accentColor: colors.sky
    },
    {
      caption: "Top 20%",
      icon: "shield-checkmark",
      label: "League",
      value: "Gold",
      accentColor: colors.accent
    }
  ];
}

function RewardsTab({ gameplay }: { gameplay: Gameplay }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("100");

  function createReward() {
    const pointCost = Number(cost);
    if (!title.trim() || !Number.isFinite(pointCost)) {
      Alert.alert("Reward needs a title and cost", "Add a reward name and point cost.");
      return;
    }
    gameplay.createReward({ description, pointCost, title });
    setTitle("");
    setDescription("");
    setCost("100");
  }

  return (
    <>
      <Card tone="focus">
        <AppText variant="heading">Points ledger</AppText>
        <View style={styles.summaryTriplet}>
          <LedgerMetric color={colors.success} label="Earned" value={gameplay.pointsSummary.earned} />
          <LedgerMetric color={colors.accent} label="Spent" value={gameplay.pointsSummary.spent} />
          <LedgerMetric color={colors.sky} label="Available" value={gameplay.pointsSummary.available} />
        </View>
      </Card>

      <Card>
        <AppText variant="heading">Create reward</AppText>
        <TextInput onChangeText={setTitle} placeholder="Reward title" placeholderTextColor={colors.inkMuted} style={styles.input} value={title} />
        <TextInput onChangeText={setDescription} placeholder="Reward description" placeholderTextColor={colors.inkMuted} style={styles.input} value={description} />
        <TextInput keyboardType="number-pad" onChangeText={setCost} placeholder="Point cost" placeholderTextColor={colors.inkMuted} style={styles.input} value={cost} />
        <Button icon="gift" label="Add to shop" onPress={createReward} variant="secondary" />
      </Card>
      <AppText variant="heading">Active reward shop</AppText>
      {gameplay.state.rewards.map((reward) => <RewardCard key={reward.id} reward={reward} />)}
      <AppText variant="heading">Child goal requests</AppText>
      {gameplay.pendingRewardGoalRequests.length === 0 ? <Card><AppText color={colors.inkMuted}>No new child reward goals waiting for review.</AppText></Card> : null}
      {gameplay.pendingRewardGoalRequests.map((request) => (
        <ParentRewardRequestReviewCard gameplay={gameplay} key={request.id} request={request} />
      ))}
      <AppText variant="heading">Approved goals</AppText>
      {gameplay.approvedRewardGoals.length === 0 ? <Card><AppText color={colors.inkMuted}>No approved goals yet.</AppText></Card> : null}
      {gameplay.approvedRewardGoals.map((goal) => (
        <Card key={goal.id} tone="focus">
          <AppText variant="body">{goal.title}</AppText>
          <AppText color={colors.inkMuted} variant="caption">
            Target {goal.parentPointTarget ?? goal.suggestedPointTarget ?? 0} pts · {goal.status === "redeemed" ? "Redeemed" : "In progress"}
          </AppText>
          {goal.conditions ? <AppText color={colors.inkMuted} variant="caption">Conditions: {goal.conditions}</AppText> : null}
        </Card>
      ))}
      <AppText variant="heading">Pending redemptions</AppText>
      {gameplay.rewardRequests.length === 0 ? <Card><AppText color={colors.inkMuted}>No reward requests right now.</AppText></Card> : null}
      {gameplay.rewardRequests.map(({ redemption, reward }) => (
        <Card key={redemption.id} tone="warm">
          <AppText variant="body">{gameplay.state.child.displayName} requested {reward.title}</AppText>
          <AppText color={colors.inkMuted} variant="caption">
            {reward.pointCost} pts · Requested {formatDateTimeLabel(redemption.requestedAt)}
          </AppText>
          <View style={styles.actions}>
            <Button label="Reject" onPress={() => gameplay.reviewRewardRedemption(redemption.id, "rejected")} variant="quiet" />
            <Button icon="checkmark" label="Approve" onPress={() => gameplay.reviewRewardRedemption(redemption.id, "approved")} />
          </View>
        </Card>
      ))}
    </>
  );
}

function LedgerMetric({ color, label, value }: { color: string; label: string; value: number | string }) {
  return (
    <View style={styles.ledgerMetric}>
      <AppText color={color} variant="heading">
        {value}
      </AppText>
      <AppText color={colors.inkMuted} variant="caption">
        {label}
      </AppText>
    </View>
  );
}

function ReviewTab({ gameplay }: { gameplay: Gameplay }) {
  return (
    <>
      <AppText variant="heading">Task evidence submissions</AppText>
      {gameplay.pendingSubmissions.length === 0 ? <Card><AppText color={colors.inkMuted}>No task evidence waiting for review.</AppText></Card> : null}
      {gameplay.pendingSubmissions.map(({ submission, task }) => (
        <SubmissionCard
          key={submission.id}
          submission={submission}
          task={task}
          onApprove={() => gameplay.reviewSubmission(submission.id, "approved")}
          onReject={() => gameplay.reviewSubmission(submission.id, "rejected")}
        />
      ))}
    </>
  );
}

function HistoryTab({ gameplay }: { gameplay: Gameplay }) {
  return (
    <>
      <AppText variant="heading">Points ledger</AppText>
      {gameplay.state.pointsTransactions.map((transaction) => (
        <Card key={transaction.id} tone={transaction.amount >= 0 ? "fresh" : "default"}>
          <AppText color={transaction.amount >= 0 ? colors.success : colors.danger} variant="body">
            {transaction.amount >= 0 ? "+" : ""}{transaction.amount} points: {transaction.category}
          </AppText>
          {transaction.note ? <AppText color={colors.inkMuted} variant="caption">{transaction.note}</AppText> : null}
          <AppText color={colors.inkMuted} variant="caption">{formatDateTimeLabel(transaction.createdAt)}</AppText>
        </Card>
      ))}
      <AppText variant="heading">Completed tasks</AppText>
      {gameplay.recentCompletedTasks.length === 0 ? <Card><AppText color={colors.inkMuted}>No completed tasks yet.</AppText></Card> : null}
      {gameplay.recentCompletedTasks.map(({ assignment, task }) => (
        <Card key={assignment.id} tone="fresh">
          <AppText variant="body">{task.title}</AppText>
          <AppText color={colors.inkMuted} variant="caption">{task.pointValue} points • {formatDateTimeLabel(assignment.completedAt)}</AppText>
        </Card>
      ))}
      <AppText variant="heading">Reward redemption history</AppText>
      {gameplay.state.redemptions.map((redemption) => {
        const reward = gameplay.state.rewards.find((item) => item.id === redemption.rewardId);
        return reward ? (
          <Card key={redemption.id}>
            <AppText variant="body">{reward.title}</AppText>
            <AppText color={colors.inkMuted} variant="caption">{redemption.status} • Requested {formatDateTimeLabel(redemption.requestedAt)}</AppText>
          </Card>
        ) : null;
      })}
    </>
  );
}

function AnalyticsTab({ gameplay }: { gameplay: Gameplay }) {
  const analytics = getAnalytics(gameplay);

  return (
    <>
      <SummaryBar
        items={[
          {
            accentColor: analytics.bestWeek.netTotal >= 0 ? colors.success : colors.danger,
            caption: `${formatDateLabel(analytics.bestWeek.weekStart)} to ${formatDateLabel(analytics.bestWeek.weekEnd)}`,
            icon: "trophy",
            label: "Best week",
            value: `${analytics.bestWeek.netTotal >= 0 ? "+" : ""}${analytics.bestWeek.netTotal}`
          },
          {
            accentColor: analytics.homeworkConsistency.percent >= 70 ? colors.success : colors.accent,
            caption: `${analytics.homeworkConsistency.thisWeekDays} this week · ${analytics.homeworkConsistency.lastWeekDays} last week`,
            icon: "school",
            label: "Homework consistency",
            value: `${analytics.homeworkConsistency.percent}%`
          },
          {
            accentColor: colors.sky,
            caption: "Across tracked days",
            icon: "analytics",
            label: "Average daily points",
            value: `${analytics.averageDailyPoints >= 0 ? "+" : ""}${analytics.averageDailyPoints}`
          },
          {
            accentColor: colors.accent,
            caption: "Current momentum",
            icon: "flame",
            label: "Current streak",
            value: `${gameplay.state.child.streak} days`
          }
        ]}
      />

      <Card>
        <AppText variant="heading">Weekly summary</AppText>
        <View style={styles.analyticsTable}>
          <AnalyticsHeaderRow />
          {analytics.weeklySummaries.map((week) => (
            <View key={week.weekStart} style={styles.analyticsRow}>
              <AnalyticsCell label="Week" value={`${formatDateLabel(week.weekStart)} - ${formatDateLabel(week.weekEnd)}`} wide />
              <AnalyticsCell color={colors.success} label="Earned" value={`+${week.pointsEarned}`} />
              <AnalyticsCell color={colors.danger} label="Lost" value={`-${week.pointsLost}`} />
              <AnalyticsCell color={week.netTotal >= 0 ? colors.success : colors.danger} label="Net" value={`${week.netTotal >= 0 ? "+" : ""}${week.netTotal}`} />
              <AnalyticsCell label="Tasks" value={String(week.tasksCompleted)} />
              <AnalyticsCell label="Homework" value={String(week.homeworkCompletions)} />
              <AnalyticsCell label="Revision" value={String(week.revisionCompletions)} />
              <AnalyticsCell color={colors.success} label="Bonuses" value={String(week.behaviourBonuses)} />
              <AnalyticsCell color={colors.danger} label="Corrections" value={String(week.behaviourCorrections)} />
              <AnalyticsCell label="Level" value={week.level} />
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.analyticsGrid}>
        <InsightCard label="Most common positive" value={analytics.mostCommonPositive} tone="positive" />
        <InsightCard label="Most common needs improvement" value={analytics.mostCommonNegative} tone="negative" />
        <InsightCard label="Weakest week" value={`${formatDateLabel(analytics.weakestWeek.weekStart)} · ${analytics.weakestWeek.netTotal >= 0 ? "+" : ""}${analytics.weakestWeek.netTotal}`} />
        <InsightCard label="Homework days this week" value={`${analytics.homeworkConsistency.thisWeekDays}/7`} />
      </View>

      <View style={styles.analyticsGrid}>
        <CategoryBreakdownCard title="Positive behaviour" items={analytics.positiveBreakdown} tone="positive" />
        <CategoryBreakdownCard title="Needs improvement" items={analytics.negativeBreakdown} tone="negative" />
      </View>
    </>
  );
}

function AnalyticsHeaderRow() {
  return (
    <View style={[styles.analyticsRow, styles.analyticsHeaderRow]}>
      <AnalyticsCell label="Week" value="Week" wide />
      <AnalyticsCell label="Earned" value="Earned" />
      <AnalyticsCell label="Lost" value="Lost" />
      <AnalyticsCell label="Net" value="Net" />
      <AnalyticsCell label="Tasks" value="Tasks" />
      <AnalyticsCell label="Homework" value="Homework" />
      <AnalyticsCell label="Revision" value="Revision" />
      <AnalyticsCell label="Bonuses" value="Bonuses" />
      <AnalyticsCell label="Corrections" value="Corrections" />
      <AnalyticsCell label="Level" value="Level" />
    </View>
  );
}

function AnalyticsCell({ color, value, wide }: { color?: string; label: string; value: string; wide?: boolean }) {
  return (
    <View style={[styles.analyticsCell, wide && styles.analyticsWideCell]}>
      <AppText color={color ?? colors.ink} variant="caption">
        {value}
      </AppText>
    </View>
  );
}

function InsightCard({ label, tone, value }: { label: string; tone?: "positive" | "negative"; value: string }) {
  const color = tone === "positive" ? colors.success : tone === "negative" ? colors.danger : colors.ink;

  return (
    <Card style={styles.analyticsCard}>
      <AppText color={colors.inkMuted} variant="caption">
        {label}
      </AppText>
      <AppText color={color} variant="body">
        {value}
      </AppText>
    </Card>
  );
}

function CategoryBreakdownCard({
  items,
  title,
  tone
}: {
  items: CategoryBreakdownItem[];
  title: string;
  tone: "positive" | "negative";
}) {
  const color = tone === "positive" ? colors.success : colors.danger;

  return (
    <Card style={styles.analyticsColumn}>
      <AppText variant="heading">{title}</AppText>
      {items.map((item) => (
        <View key={item.category} style={styles.breakdownRow}>
          <View style={styles.breakdownLabel}>
            <AppText variant="caption">{item.category}</AppText>
            <AppText color={colors.inkMuted} variant="caption">
              {item.count} logged
            </AppText>
          </View>
          <AppText color={color} variant="body">
            {item.totalImpact >= 0 ? "+" : ""}{item.totalImpact}
          </AppText>
        </View>
      ))}
    </Card>
  );
}

type WeeklySummary = {
  behaviourBonuses: number;
  behaviourCorrections: number;
  homeworkCompletions: number;
  level: string;
  netTotal: number;
  pointsEarned: number;
  pointsLost: number;
  revisionCompletions: number;
  tasksCompleted: number;
  weekEnd: string;
  weekStart: string;
};

type CategoryBreakdownItem = {
  category: string;
  count: number;
  totalImpact: number;
};

function getAnalytics(gameplay: Gameplay) {
  const weeklySummaries = getWeeklySummaries(gameplay);
  const behaviourTransactions = gameplay.state.pointsTransactions.filter((transaction) => transaction.type === "behaviour_adjustment");
  const positiveBreakdown = getCategoryBreakdown(positiveAdjustments, behaviourTransactions);
  const negativeBreakdown = getCategoryBreakdown(negativeAdjustments, behaviourTransactions);
  const fallbackWeek = createEmptyWeeklySummary(getStartOfWeek(new Date()));
  const firstWeek = weeklySummaries[0] ?? fallbackWeek;
  const bestWeek = weeklySummaries.reduce((best, week) => (week.netTotal > best.netTotal ? week : best), firstWeek);
  const weakestWeek = weeklySummaries.reduce((weakest, week) => (week.netTotal < weakest.netTotal ? week : weakest), firstWeek);
  const homeworkConsistency = getHomeworkConsistency(gameplay);

  return {
    averageDailyPoints: getAverageDailyPoints(gameplay.state.pointsTransactions),
    bestWeek,
    homeworkConsistency,
    mostCommonNegative: getMostCommonCategory(negativeBreakdown),
    mostCommonPositive: getMostCommonCategory(positiveBreakdown),
    negativeBreakdown,
    positiveBreakdown,
    weakestWeek,
    weeklySummaries
  };
}

function createEmptyWeeklySummary(weekStart: string): WeeklySummary {
  return {
    behaviourBonuses: 0,
    behaviourCorrections: 0,
    homeworkCompletions: 0,
    level: "Bronze",
    netTotal: 0,
    pointsEarned: 0,
    pointsLost: 0,
    revisionCompletions: 0,
    tasksCompleted: 0,
    weekEnd: addDays(weekStart, 6),
    weekStart
  };
}

function getWeeklySummaries(gameplay: Gameplay): WeeklySummary[] {
  const weekKeys = new Set<string>([getStartOfWeek(new Date())]);

  gameplay.state.pointsTransactions.forEach((transaction) => weekKeys.add(getStartOfWeek(transaction.createdAt)));
  gameplay.state.assignments.forEach((assignment) => {
    if (assignment.completedAt) {
      weekKeys.add(getStartOfWeek(assignment.completedAt));
    }
  });

  return [...weekKeys]
    .sort((a, b) => (a < b ? 1 : -1))
    .slice(0, 8)
    .map((weekStart) => {
      const weekEnd = addDays(weekStart, 6);
      const transactions = gameplay.state.pointsTransactions.filter((transaction) => isDateKeyInRange(transaction.createdAt, weekStart, weekEnd));
      const completedTasks = gameplay.state.assignments.filter(
        (assignment) => assignment.status === "approved" && Boolean(assignment.completedAt) && isDateKeyInRange(assignment.completedAt, weekStart, weekEnd)
      );

      const pointsEarned = transactions.filter((transaction) => transaction.amount > 0).reduce((total, transaction) => total + transaction.amount, 0);
      const pointsLost = Math.abs(transactions.filter((transaction) => transaction.amount < 0).reduce((total, transaction) => total + transaction.amount, 0));
      const netTotal = pointsEarned - pointsLost;
      const behaviourTransactions = transactions.filter((transaction) => transaction.type === "behaviour_adjustment");

      return {
        behaviourBonuses: behaviourTransactions.filter((transaction) => transaction.amount > 0).length,
        behaviourCorrections: behaviourTransactions.filter((transaction) => transaction.amount < 0).length,
        homeworkCompletions: completedTasks.filter((assignment) => isHomeworkTask(gameplay, assignment.taskId)).length,
        level: getWeeklyLevel(netTotal),
        netTotal,
        pointsEarned,
        pointsLost,
        revisionCompletions: completedTasks.filter((assignment) => isRevisionTask(gameplay, assignment.taskId)).length,
        tasksCompleted: completedTasks.length,
        weekEnd,
        weekStart
      };
    });
}

function getCategoryBreakdown(presets: BehaviourPreset[], transactions: PointsTransaction[]): CategoryBreakdownItem[] {
  return presets.map((preset) => {
    const matching = transactions.filter((transaction) => normaliseCategory(transaction.category) === normaliseCategory(preset.category));
    return {
      category: preset.category,
      count: matching.length,
      totalImpact: matching.reduce((total, transaction) => total + transaction.amount, 0)
    };
  });
}

function getMostCommonCategory(items: CategoryBreakdownItem[]) {
  const firstItem = items[0] ?? { category: "No entries yet", count: 0, totalImpact: 0 };
  const best = items.reduce((current, item) => (item.count > current.count ? item : current), firstItem);
  return best && best.count > 0 ? `${best.category} (${best.count})` : "No entries yet";
}

function getHomeworkConsistency(gameplay: Gameplay) {
  const currentWeekStart = getStartOfWeek(new Date());
  const currentWeekEnd = addDays(currentWeekStart, 6);
  const lastWeekStart = addDays(currentWeekStart, -7);
  const lastWeekEnd = addDays(currentWeekStart, -1);
  const thisWeekDays = getHomeworkCompletionDays(gameplay, currentWeekStart, currentWeekEnd);
  const lastWeekDays = getHomeworkCompletionDays(gameplay, lastWeekStart, lastWeekEnd);

  return {
    lastWeekDays,
    percent: Math.round((thisWeekDays / 7) * 100),
    thisWeekDays
  };
}

function getHomeworkCompletionDays(gameplay: Gameplay, startKey: string, endKey: string) {
  const days = new Set<string>();

  gameplay.state.assignments.forEach((assignment) => {
    if (assignment.status !== "approved" || !assignment.completedAt || !isHomeworkTask(gameplay, assignment.taskId)) {
      return;
    }

    if (isDateKeyInRange(assignment.completedAt, startKey, endKey)) {
      days.add(assignment.completedAt.slice(0, 10));
    }
  });

  return days.size;
}

function getAverageDailyPoints(transactions: PointsTransaction[]) {
  if (transactions.length === 0) {
    return 0;
  }

  const totalsByDay = new Map<string, number>();
  transactions.forEach((transaction) => {
    const day = transaction.createdAt.slice(0, 10);
    totalsByDay.set(day, (totalsByDay.get(day) ?? 0) + transaction.amount);
  });

  const total = [...totalsByDay.values()].reduce((sum, value) => sum + value, 0);
  return Math.round(total / totalsByDay.size);
}

function isHomeworkTask(gameplay: Gameplay, taskId: string) {
  const task = gameplay.state.tasks.find((item) => item.id === taskId);
  return Boolean(task && ((task.category as string) === "homework" || task.title.toLowerCase().includes("homework")));
}

function isRevisionTask(gameplay: Gameplay, taskId: string) {
  const task = gameplay.state.tasks.find((item) => item.id === taskId);
  return Boolean(task && task.title.toLowerCase().includes("revision"));
}

function getWeeklyLevel(netTotal: number) {
  if (netTotal >= 150) return "Platinum";
  if (netTotal >= 100) return "Gold";
  if (netTotal >= 50) return "Silver";
  if (netTotal >= 0) return "Bronze";
  return "Reset";
}

function isDateKeyInRange(value: string | null, startKey: string, endKey: string) {
  if (!value) {
    return false;
  }

  const dateKey = value.slice(0, 10);
  return dateKey >= startKey && dateKey <= endKey;
}

function normaliseCategory(value: string) {
  return value.trim().toLowerCase();
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "flex-end"
  },
  alertCopy: {
    flex: 1,
    gap: spacing.xs
  },
  alertHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  alertIcon: {
    alignItems: "center",
    backgroundColor: "#FFF0D2",
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  alertStack: {
    gap: spacing.md
  },
  analyticsCard: {
    flexBasis: 220,
    flexGrow: 1,
    minWidth: 180
  },
  analyticsCell: {
    flexBasis: 92,
    flexGrow: 1,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: spacing.sm
  },
  analyticsColumn: {
    flexBasis: 280,
    flexGrow: 1,
    minWidth: 0
  },
  analyticsGrid: {
    alignItems: "stretch",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  analyticsHeaderRow: {
    backgroundColor: colors.surfaceMuted
  },
  analyticsRow: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    padding: spacing.sm
  },
  analyticsTable: {
    gap: spacing.sm
  },
  analyticsWideCell: {
    flexBasis: 170
  },
  behaviourGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  behaviourPresetCard: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: 136,
    flexGrow: 1,
    gap: spacing.sm,
    minHeight: 152,
    padding: spacing.md
  },
  behaviourColumn: {
    flexBasis: 320,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0
  },
  behaviourSection: {
    gap: spacing.md
  },
  behaviourSectionTitle: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  behaviourShell: {
    alignItems: "stretch",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg
  },
  childSelector: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.md
  },
  confirmationBox: {
    alignItems: "center",
    backgroundColor: "#E6FAF4",
    borderColor: colors.primary,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between",
    padding: spacing.md
  },
  customAdjustmentBox: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md
  },
  breakdownLabel: {
    flex: 1,
    gap: spacing.xs
  },
  breakdownRow: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.md
  },
  emptyLog: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    padding: spacing.lg
  },
  filterButton: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  filterButtonActive: {
    backgroundColor: colors.primary
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  formGroup: {
    gap: spacing.sm
  },
  grid: {
    alignItems: "stretch",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  headerContent: {
    flex: 1,
    minWidth: 0
  },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    width: "100%"
  },
  cardText: {
    flex: 1,
    flexShrink: 1,
    gap: spacing.xs,
    minWidth: 0
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: spacing.md
  },
  homeworkGridCard: {
    flexBasis: 260,
    flexGrow: 1,
    minWidth: 0
  },
  homeworkGroup: {
    gap: spacing.sm
  },
  homeworkMiniCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    minWidth: 0,
    padding: spacing.md
  },
  homeworkMiniComplete: {
    borderColor: colors.success
  },
  homeworkMiniHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
    minWidth: 0
  },
  homeworkMiniIncomplete: {
    borderColor: colors.danger
  },
  homeworkMiniInProgress: {
    borderColor: colors.accent
  },
  homeworkNav: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "flex-end"
  },
  homeworkNavButton: {
    flexBasis: 0,
    flexGrow: 1,
    minWidth: 88,
    paddingHorizontal: spacing.sm
  },
  homeworkWeekGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  logActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  ledgerMetric: {
    flexBasis: 96,
    flexGrow: 1,
    gap: spacing.xs
  },
  logContent: {
    flex: 1,
    gap: spacing.xs
  },
  logHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  logIcon: {
    alignItems: "center",
    borderRadius: 8,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  logItem: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md
  },
  logMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  negativePreset: {
    backgroundColor: "#FFF8F4"
  },
  notePreview: {
    flexShrink: 1,
    lineHeight: 18
  },
  noteInput: {
    minHeight: 88,
    paddingTop: spacing.md,
    textAlignVertical: "top"
  },
  parentPageLayout: {
    alignSelf: "center",
    gap: spacing.lg,
    maxWidth: 1180,
    width: "100%"
  },
  parentGridCard: {
    flexBasis: 260,
    flexGrow: 1,
    minWidth: 0
  },
  parentTabPanel: {
    alignItems: "stretch",
    gap: spacing.lg,
    width: "100%"
  },
  parentTabButtonCompact: {
    minWidth: 96,
    paddingHorizontal: spacing.sm
  },
  positivePreset: {
    backgroundColor: "#F4FFFA"
  },
  priorityAlert: {
    borderColor: colors.accent,
    borderWidth: 2
  },
  proofAlert: {
    borderColor: colors.primary
  },
  pressedCard: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }]
  },
  presetIcon: {
    alignItems: "center",
    borderRadius: 999,
    height: 52,
    justifyContent: "center",
    width: 52
  },
  presetTitle: {
    minHeight: 36,
    textAlign: "center"
  },
  quickLinks: {
    gap: spacing.sm
  },
  sectionHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    minWidth: 0
  },
  subjectChip: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  subjectChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  subjectInput: {
    flex: 1
  },
  subjectRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  statusPill: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  statusPillComplete: {
    backgroundColor: "#DDF8EA"
  },
  statusPillIncomplete: {
    backgroundColor: "#FFE4E4"
  },
  statusPillInProgress: {
    backgroundColor: "#FFF2D8"
  },
  summaryTriplet: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  tabRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingRight: spacing.md
  },
  tabScroller: {
    width: "100%"
  }
});
