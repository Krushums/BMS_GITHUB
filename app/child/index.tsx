import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";

import { HomeworkItem, HomeworkStatus, PointsTransaction, Reward, RewardRequest, RewardRequestCategory } from "@/domain";
import { DashboardHeader } from "@/features/dashboard/DashboardHeader";
import { useMockAuth } from "@/features/auth/MockAuthContext";
import { useGameplay } from "@/features/gameplay/GameplayContext";
import { ProofSubmissionCard } from "@/features/tasks/ProofSubmissionCard";
import { TaskCard } from "@/features/tasks/TaskCard";
import { HighlightTarget, TourOverlay, TourStep } from "@/features/help/TourOverlay";
import { AppText } from "@/shared/components/AppText";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { ProfileMenu } from "@/shared/components/ProfileMenu";
import { Screen } from "@/shared/components/Screen";
import { SummaryBar } from "@/shared/components/SummaryBar";
import { colors, spacing } from "@/shared/theme";
import { addDays, addWeeks, formatDateTimeLabel, formatWeekRange, getStartOfWeek, isSameDay, isSameWeek } from "@/shared/utils/date";

type ChildTab = "today" | "homework" | "rewards" | "progress" | "activity";

const childTabs: Array<{ icon: keyof typeof Ionicons.glyphMap; id: ChildTab; label: string }> = [
  { icon: "sunny", id: "today", label: "Today" },
  { icon: "book", id: "homework", label: "Homework" },
  { icon: "gift", id: "rewards", label: "Rewards" },
  { icon: "trending-up", id: "progress", label: "Progress" },
  { icon: "sparkles", id: "activity", label: "Activity" }
];

const childTourSteps: Array<TourStep<ChildTab>> = [
  {
    target: "today",
    title: "Today's Quests",
    text: "Complete quests to earn points."
  },
  {
    target: "homework",
    title: "Homework",
    text: "Log homework, add proof and keep your streak alive."
  },
  {
    target: "rewards",
    title: "Rewards Shop",
    text: "Spend points in the rewards shop."
  },
  {
    target: "progress",
    title: "Progress",
    text: "Track your points, level and achievements here."
  },
  {
    target: "activity",
    title: "Activity",
    text: "See a friendly log of points earned, rewards and adjustments."
  }
];

export default function ChildDashboardScreen() {
  const gameplay = useGameplay();
  const auth = useMockAuth();
  const params = useLocalSearchParams<{ tour?: string }>();
  const [activeTab, setActiveTab] = useState<ChildTab>("today");
  const [tourIndex, setTourIndex] = useState(0);
  const [tourVisible, setTourVisible] = useState(false);
  const profileName = auth.currentChild?.displayName ?? gameplay.state.child.displayName;
  const activeTourStep = childTourSteps[tourIndex] ?? childTourSteps[0];

  useEffect(() => {
    if (params.tour === "child") {
      setTourIndex(0);
      setTourVisible(true);
      setActiveTab("today");
    }
  }, [params.tour]);

  useEffect(() => {
    if (tourVisible && activeTourStep) {
      setActiveTab(activeTourStep.target);
    }
  }, [activeTourStep, tourVisible]);

  function finishTour() {
    auth.completeTour("child");
    setTourVisible(false);
  }

  return (
    <Screen>
      <View style={styles.headerRow}>
        <View style={styles.headerContent}>
          <DashboardHeader
            greeting={`Nice momentum, ${profileName}`}
            points={gameplay.state.child.points}
            streak={gameplay.state.child.streak}
          />
        </View>
        <ProfileMenu displayName={profileName} />
      </View>
      <SummaryBar items={getChildSummaryItems(gameplay)} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
        {childTabs.map((tab) => (
          <HighlightTarget active={tourVisible && activeTourStep?.target === tab.id} key={tab.id}>
            <Button
              icon={tab.icon}
              label={tab.label}
              onPress={() => {
                console.log(`child tab pressed: ${tab.id}`);
                setActiveTab(tab.id);
              }}
              style={styles.childTabButton}
              variant={activeTab === tab.id ? "primary" : "secondary"}
            />
          </HighlightTarget>
        ))}
      </ScrollView>

      {activeTab === "today" ? <TodayTab gameplay={gameplay} /> : null}
      {activeTab === "homework" ? <HomeworkTab gameplay={gameplay} /> : null}
      {activeTab === "rewards" ? <RewardsTab gameplay={gameplay} /> : null}
      {activeTab === "progress" ? <ProgressTab gameplay={gameplay} /> : null}
      {activeTab === "activity" ? <ActivityTab gameplay={gameplay} /> : null}
      <TourOverlay
        currentIndex={tourIndex}
        onBack={() => setTourIndex((value) => Math.max(0, value - 1))}
        onFinish={finishTour}
        onNext={() => setTourIndex((value) => Math.min(childTourSteps.length - 1, value + 1))}
        onSkip={finishTour}
        steps={childTourSteps}
        visible={tourVisible}
      />
    </Screen>
  );
}

function HomeworkTab({ gameplay }: { gameplay: Gameplay }) {
  const [undo, setUndo] = useState<{ label: string; onUndo: () => void } | null>(null);
  const [weekStart, setWeekStart] = useState(getStartOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const weekDays = getWeekDays(weekStart);
  const weekEntries = getHomeworkForWeek(gameplay, weekStart);
  const analytics = getHomeworkMomentum(gameplay, weekStart);
  const selectedEntries = getHomeworkForDate(gameplay, selectedDate);
  const selectedHomework = selectedEntries.completed[0] ?? selectedEntries.due[0] ?? null;
  const currentWeekStart = getStartOfWeek(new Date());

  function selectWeek(nextWeekStart: string) {
    setWeekStart(nextWeekStart);
    setSelectedDate(isSameWeek(nextWeekStart, currentWeekStart) ? new Date().toISOString().slice(0, 10) : nextWeekStart);
  }

  return (
    <>
      {undo ? <UndoToast label={undo.label} onDismiss={() => setUndo(null)} onUndo={undo.onUndo} /> : null}

      <Card tone="focus">
        <View style={styles.homeworkHeader}>
          <View style={styles.rewardCopy}>
            <AppText variant="heading">Homework this week</AppText>
            <AppText color={colors.inkMuted}>A quick weekly view for homework completed and homework due.</AppText>
          </View>
        </View>
        <AppText color={colors.inkMuted}>A quick daily check-in for homework, Satchel screenshots, WhatsApp proof, and worksheet photos.</AppText>
        <View style={styles.homeworkStats}>
          <MiniStat label="Completion" value={`${analytics.completionPercent}%`} />
          <MiniStat label="Evidence days" value={String(analytics.evidenceDays)} />
          <MiniStat label="In progress" value={String(analytics.inProgressDays)} />
          <MiniStat label="Complete days" value={String(analytics.completedDays)} />
        </View>
      </Card>

      <HomeworkWeekNavigator
        onCurrent={() => selectWeek(currentWeekStart)}
        onNext={() => selectWeek(addWeeks(weekStart, 1))}
        onPrevious={() => selectWeek(addWeeks(weekStart, -1))}
        weekStart={weekStart}
      />

      <WeekStrip
        days={weekDays}
        entries={weekEntries}
        gameplay={gameplay}
        onSelect={setSelectedDate}
        selectedDate={selectedDate}
      />

      <HomeworkDayCard
        completedItems={selectedEntries.completed}
        dueItems={selectedEntries.due}
        gameplay={gameplay}
        homework={selectedHomework}
        key={`${selectedDate}-${selectedHomework?.id ?? "new"}`}
        selectedDate={selectedDate}
        setUndo={setUndo}
      />

      <HomeworkForDateSection completedItems={selectedEntries.completed} dueItems={selectedEntries.due} gameplay={gameplay} />
    </>
  );
}

function WeekStrip({
  days,
  entries,
  gameplay,
  onSelect,
  selectedDate
}: {
  days: string[];
  entries: HomeworkItem[];
  gameplay: Gameplay;
  onSelect: (date: string) => void;
  selectedDate: string;
}) {
  return (
    <Card>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekStrip}>
        {days.map((date) => {
          const dayItems = entries.filter((homework) => isSameDate(getHomeworkDueDate(homework), date) || isSameDate(getHomeworkCompletedDate(homework), date));
          const primary = dayItems.find((item) => isSameDate(getHomeworkCompletedDate(item), date)) ?? dayItems[0] ?? null;
          const evidence = dayItems.some((homework) =>
            gameplay.state.homeworkEvidence.some((item) => item.homeworkId === homework.id && !item.deletedAt)
          );
          const selected = date === selectedDate;
          const status = primary?.status ?? "not_started";
          const isNeutral = status === "not_started" || status === "not_applicable";
          const textColor = selected || !isNeutral ? colors.surface : colors.ink;

          return (
            <Pressable
              accessibilityRole="button"
              key={date}
              onPress={() => onSelect(date)}
              style={[styles.weekDayButton, getHomeworkDayToneStyle(status), selected && styles.weekDayButtonActive]}
            >
              <AppText color={textColor} style={styles.weekDayLabel} variant="caption">
                {formatShortWeekday(date)}
              </AppText>
              <AppText color={textColor} style={styles.weekDayLabel} variant="caption">
                {formatDayNumber(date)}
              </AppText>
              <Ionicons color={selected || !isNeutral ? colors.surface : getHomeworkStatusColor(status)} name={getHomeworkStatusIcon(status)} size={18} />
              {evidence ? <Ionicons color={selected ? colors.surface : colors.accent} name="camera" size={14} /> : <View style={styles.weekEvidenceSpacer} />}
            </Pressable>
          );
        })}
      </ScrollView>
    </Card>
  );
}

function HomeworkWeekNavigator({
  onCurrent,
  onNext,
  onPrevious,
  weekStart
}: {
  onCurrent: () => void;
  onNext: () => void;
  onPrevious: () => void;
  weekStart: string;
}) {
  return (
    <Card>
      <View style={styles.weekNavActions}>
        <Button icon="chevron-back" label="Prev" onPress={onPrevious} style={styles.weekNavButton} variant="secondary" />
        <Button label="This week" onPress={onCurrent} style={styles.weekNavButton} variant="secondary" />
        <Button icon="chevron-forward" label="Next" onPress={onNext} style={styles.weekNavButton} variant="secondary" />
      </View>
      <AppText color={colors.inkMuted} variant="caption">
        Week beginning: {formatWeekRange(weekStart)}
      </AppText>
    </Card>
  );
}

function UndoToast({ label, onDismiss, onUndo }: { label: string; onDismiss: () => void; onUndo: () => void }) {
  return (
    <View style={styles.undoToast}>
      <AppText color={colors.surface} variant="caption">
        {label}
      </AppText>
      <View style={styles.undoActions}>
        <Button
          label="Undo"
          onPress={() => {
            onUndo();
            onDismiss();
          }}
          variant="secondary"
        />
        <Button label="Dismiss" onPress={onDismiss} variant="quiet" />
      </View>
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniStat}>
      <AppText variant="body">{value}</AppText>
      <AppText color={colors.inkMuted} variant="caption">
        {label}
      </AppText>
    </View>
  );
}

function MiniDueCalendar({
  disabled,
  onSelect,
  selectedDate
}: {
  disabled: boolean;
  onSelect: (date: string) => void;
  selectedDate: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonthDate, setVisibleMonthDate] = useState(selectedDate || new Date().toISOString().slice(0, 10));
  const calendarDays = getMiniCalendarDays(visibleMonthDate);

  return (
    <View style={styles.datePickerShell}>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => setIsOpen((current) => !current)}
        style={[styles.datePickerField, disabled && styles.disabledSection]}
      >
        <Ionicons color={colors.primaryDark} name="calendar" size={18} />
        <AppText color={selectedDate ? colors.ink : colors.inkMuted} variant="body">
          {selectedDate ? formatFriendlyDueDate(selectedDate) : "No due date selected"}
        </AppText>
      </Pressable>

      {isOpen ? (
        <View style={styles.miniCalendar}>
          <View style={styles.miniCalendarHeader}>
            <Button icon="chevron-back" label="Prev" onPress={() => setVisibleMonthDate(addMonths(visibleMonthDate, -1))} style={styles.miniCalendarNavButton} variant="quiet" />
            <View style={styles.miniCalendarTitle}>
              <AppText variant="body">{formatMonthTitle(visibleMonthDate)}</AppText>
            </View>
            <Button icon="chevron-forward" label="Next" onPress={() => setVisibleMonthDate(addMonths(visibleMonthDate, 1))} style={styles.miniCalendarNavButton} variant="quiet" />
          </View>
          <View style={styles.miniCalendarGrid}>
            {calendarDays.map((date) => {
              const selected = isSameDay(date, selectedDate);

              return (
                <Pressable
                  accessibilityRole="button"
                  key={date}
                  onPress={() => {
                    onSelect(date);
                    setIsOpen(false);
                  }}
                  style={[styles.miniCalendarDay, selected && styles.miniCalendarDayActive]}
                >
                  <AppText color={selected ? colors.surface : colors.inkMuted} style={styles.miniCalendarLabel} variant="caption">
                    {formatShortWeekday(date)}
                  </AppText>
                  <AppText color={selected ? colors.surface : colors.ink} style={styles.miniCalendarLabel} variant="caption">
                    {formatDayNumber(date)}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function HomeworkForDateSection({
  completedItems,
  dueItems,
  gameplay
}: {
  completedItems: HomeworkItem[];
  dueItems: HomeworkItem[];
  gameplay: Gameplay;
}) {
  return (
    <Card>
      <AppText variant="heading">Homework for this date</AppText>
      <HomeworkDateGroup gameplay={gameplay} items={dueItems} title="Due on this date" type="due" />
      <HomeworkDateGroup gameplay={gameplay} items={completedItems} title="Completed/submitted on this date" type="completed" />
    </Card>
  );
}

function HomeworkDateGroup({
  gameplay,
  items,
  title,
  type
}: {
  gameplay: Gameplay;
  items: HomeworkItem[];
  title: string;
  type: "completed" | "due";
}) {
  return (
    <View style={styles.homeworkDateListGroup}>
      <AppText color={colors.inkMuted} variant="caption">{title}</AppText>
      {items.length === 0 ? <AppText color={colors.inkMuted}>No homework here yet.</AppText> : null}
      {items.map((item) => (
        <View key={`${type}-${item.id}`} style={[styles.homeworkDateListItem, getHomeworkListToneStyle(item.status)]}>
          <View style={styles.rewardCopy}>
            <AppText variant="body">{item.subject || "No subject"}</AppText>
            <AppText color={colors.inkMuted} variant="caption">{item.description || item.title || "No notes added"}</AppText>
          </View>
          <View style={styles.homeworkDateListMeta}>
            <AppText color={getHomeworkStatusColor(item.status)} variant="caption">{formatHomeworkStatus(item.status)}</AppText>
            <AppText color={colors.inkMuted} variant="caption">Due {formatFriendlyDueDate(getHomeworkDueDate(item))}</AppText>
            <AppText color={colors.inkMuted} variant="caption">
              {getHomeworkCompletedDate(item) ? `Completed ${formatFriendlyDueDate(getHomeworkCompletedDate(item))}` : "Not completed"}
            </AppText>
            <AppText color={hasHomeworkEvidence(gameplay, item.id) ? colors.accent : colors.inkMuted} variant="caption">
              Evidence {hasHomeworkEvidence(gameplay, item.id) ? "yes" : "no"}
            </AppText>
          </View>
        </View>
      ))}
    </View>
  );
}

function HomeworkDayCard({
  completedItems,
  dueItems,
  gameplay,
  homework,
  selectedDate,
  setUndo,
}: {
  completedItems: HomeworkItem[];
  dueItems: HomeworkItem[];
  gameplay: Gameplay;
  homework: HomeworkItem | null;
  selectedDate: string;
  setUndo: (undo: { label: string; onUndo: () => void } | null) => void;
}) {
  const evidence = homework ? gameplay.state.homeworkEvidence.filter((item) => item.homeworkId === homework.id && !item.deletedAt) : [];
  const [notesDraft, setNotesDraft] = useState(homework?.description ?? "");
  const [selectedSubject, setSelectedSubject] = useState(homework?.subject || gameplay.state.homeworkSubjects[0] || "");
  const [selectedStatus, setSelectedStatus] = useState<HomeworkStatus>(homework?.status ?? "not_started");
  const [dueDateDraft, setDueDateDraft] = useState(getHomeworkDueDate(homework ?? undefined) ?? selectedDate);
  const firstEvidence = evidence[0] ?? null;
  const dayLabel = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", weekday: "long" }).format(new Date(`${selectedDate}T12:00:00.000Z`));
  const detailsDisabled = selectedStatus === "incomplete";
  const isSubmitted = Boolean(homework?.submittedAt);
  const showIncompleteConfirmation = selectedStatus === "incomplete";

  function saveDay(status = selectedStatus) {
    const statusToSave = status === "not_started" ? "in_progress" : status;
    const completedAt = statusToSave === "completed" ? `${selectedDate}T12:00:00.000Z` : null;
    const dueDateForSave = statusToSave === "incomplete" ? selectedDate : dueDateDraft || selectedDate;
    const dueAt = `${dueDateForSave}T20:00:00.000Z`;
    const savingDisablesDetails = status === "incomplete";
    const previousStatus = homework?.status;
    const previousSubject = homework?.subject;
    const previousNotes = homework?.description;
    const previousDueAt = homework?.dueAt;
    const homeworkId = homework?.id ?? gameplay.createHomework({
      completedAt,
      description: savingDisablesDetails ? "" : notesDraft,
      dueAt,
      status: statusToSave,
      subject: savingDisablesDetails ? "" : selectedSubject || "General",
      title: dayLabel
    });

    if (homework) {
      gameplay.updateHomework({
        description: savingDisablesDetails ? "" : notesDraft,
        dueAt,
        homeworkId,
        subject: savingDisablesDetails ? "" : selectedSubject || "General",
        title: dayLabel
      });
      gameplay.updateHomeworkStatus(homeworkId, statusToSave, completedAt);
    }

    setUndo({
      label: getHomeworkSavedMessage(statusToSave),
      onUndo: () => {
        if (homework && previousStatus) {
          gameplay.updateHomework({
            ...(previousNotes !== undefined ? { description: previousNotes } : {}),
            ...(previousDueAt !== undefined ? { dueAt: previousDueAt } : {}),
            homeworkId,
            ...(previousSubject !== undefined ? { subject: previousSubject } : {})
          });
          gameplay.updateHomeworkStatus(homeworkId, previousStatus, homework.completedAt);
        }
      }
    });
  }

  async function addEvidence(source: "camera" | "library" | "file") {
    if (source === "file") {
      const fileResult = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });

      if (!fileResult.canceled) {
        attachEvidence(fileResult.assets[0]?.uri ?? null, fileResult.assets[0]?.name ?? "Homework file");
      }

      return;
    }

    const result = source === "camera" ? await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.75
    }) : await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.75
    });

    if (!result.canceled) {
      attachEvidence(result.assets[0]?.uri ?? null);
    }
  }

function attachEvidence(imageUri: string | null, fileName?: string) {
    const homeworkId = homework?.id ?? createDraftHomework("in_progress");

    if (firstEvidence) {
      gameplay.deleteHomeworkEvidence(firstEvidence.id);
    }

    const evidenceId = gameplay.submitHomeworkEvidence({
      homeworkId,
      imageUri,
      ...(fileName ? { comment: fileName } : {})
    });
    setUndo({
      label: firstEvidence ? "Evidence replaced" : "Evidence attached",
      onUndo: () => {
        gameplay.deleteHomeworkEvidence(evidenceId);
        if (firstEvidence) {
          gameplay.restoreHomeworkEvidence(firstEvidence.id);
        }
      }
    });
  }

  function createDraftHomework(status: HomeworkStatus) {
    const statusToSave = status === "not_started" ? "in_progress" : status;
    const completedAt = statusToSave === "completed" ? `${selectedDate}T12:00:00.000Z` : null;
    const dueDateForSave = statusToSave === "incomplete" ? selectedDate : dueDateDraft || selectedDate;

    return gameplay.createHomework({
      completedAt,
      description: statusToSave === "incomplete" ? "" : notesDraft,
      dueAt: `${dueDateForSave}T20:00:00.000Z`,
      status: statusToSave,
      subject: statusToSave === "incomplete" ? "" : selectedSubject || "General",
      title: dayLabel
    });
  }

  function deleteEvidence(evidenceId: string) {
    gameplay.deleteHomeworkEvidence(evidenceId);
    setUndo({
      label: "Evidence deleted",
      onUndo: () => gameplay.restoreHomeworkEvidence(evidenceId)
    });
  }

  return (
    <Card>
      <View style={styles.homeworkHeader}>
        <View style={styles.rewardCopy}>
          <AppText variant="heading">{isTodayKey(selectedDate) ? "Today's Homework" : "Selected Day"}</AppText>
          <AppText color={colors.inkMuted} variant="caption">
            {dayLabel}{isSubmitted ? ` · Submitted ${formatDateTimeLabel(homework?.submittedAt ?? null)}` : ""}
          </AppText>
        </View>
        <StatusPill status={homework?.status ?? selectedStatus} />
      </View>

      {completedItems.length > 0 ? (
        <View style={styles.homeworkDuePanel}>
          <AppText variant="body">Homework completed on this day</AppText>
          {completedItems.map((item) => (
            <View key={item.id} style={styles.homeworkDueItem}>
              <AppText variant="caption">{item.subject || "No subject"}</AppText>
              <AppText color={colors.inkMuted} variant="caption">
                {item.description || item.title}
              </AppText>
              <AppText color={colors.inkMuted} variant="caption">
                Due {formatDateTimeLabel(item.dueAt)}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}

      {dueItems.length > 0 ? (
        <View style={styles.homeworkDuePanel}>
          <AppText variant="body">{isTodayKey(selectedDate) ? "Due today" : "Homework due this day"}</AppText>
          {dueItems.map((item) => (
            <View key={item.id} style={styles.homeworkDueItem}>
              <AppText variant="caption">{item.subject || "No subject"}</AppText>
              <AppText color={colors.inkMuted} variant="caption">
                {item.description || item.title}
              </AppText>
              <View style={styles.dueMetaRow}>
                <AppText color={getHomeworkCompletedDate(item) ? colors.success : colors.danger} variant="caption">
                  {getHomeworkCompletedDate(item) ? `Completed on ${formatDateTimeLabel(getHomeworkCompletedDate(item))}` : "Needs completing"}
                </AppText>
                <AppText color={hasHomeworkEvidence(gameplay, item.id) ? colors.accent : colors.inkMuted} variant="caption">
                  {hasHomeworkEvidence(gameplay, item.id) ? "Evidence attached" : "No evidence"}
                </AppText>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.completionToggle}>
        <AppText variant="body">Homework completed today?</AppText>
        <View style={styles.toggleRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setSelectedStatus("completed")}
            style={[styles.toggleButton, selectedStatus === "completed" && styles.toggleButtonActive]}
          >
            <AppText color={selectedStatus === "completed" ? colors.surface : colors.ink} variant="caption">Yes</AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setSelectedStatus("incomplete")}
            style={[styles.toggleButton, selectedStatus === "incomplete" && styles.toggleButtonWarning]}
          >
            <AppText color={selectedStatus === "incomplete" ? colors.surface : colors.ink} variant="caption">No</AppText>
          </Pressable>
        </View>
      </View>

      {showIncompleteConfirmation ? (
        <View style={styles.incompletePanel}>
          <Ionicons color={colors.danger} name="alert-circle" size={24} />
          <View style={styles.rewardCopy}>
            <AppText variant="body">Mark today's homework as incomplete?</AppText>
            <AppText color={colors.inkMuted}>This will save that homework was not completed today.</AppText>
          </View>
          <View style={styles.homeworkEvidenceBar}>
            <Button icon="checkmark-circle" label="Submit incomplete" onPress={() => saveDay("incomplete")} />
            <Button label="Change answer" onPress={() => setSelectedStatus("not_started")} variant="secondary" />
          </View>
        </View>
      ) : (
        <>
          <View style={styles.statusGrid}>
            {simpleHomeworkStatuses.map((status) => (
              <Pressable
                accessibilityRole="button"
                key={status}
                onPress={() => setSelectedStatus(status)}
                style={[styles.statusButton, selectedStatus === status && styles.statusButtonActive]}
              >
                <AppText color={selectedStatus === status ? colors.surface : colors.ink} variant="caption">
                  {formatHomeworkStatus(status)}
                </AppText>
              </Pressable>
            ))}
          </View>

          <View style={styles.homeworkDateRow}>
            <View style={styles.rewardCopy}>
              <AppText variant="caption">Due date</AppText>
              <MiniDueCalendar disabled={false} selectedDate={dueDateDraft} onSelect={setDueDateDraft} />
            </View>
          </View>

          <View style={styles.filterRow}>
            {gameplay.state.homeworkSubjects.map((subject) => (
              <Pressable
                accessibilityRole="button"
                key={subject}
                onPress={() => {
                  setSelectedSubject(subject);
                }}
                style={[styles.filterChip, selectedSubject === subject && styles.filterChipActive]}
              >
                <AppText color={selectedSubject === subject ? colors.surface : colors.ink} variant="caption">
                  {subject}
                </AppText>
              </Pressable>
            ))}
          </View>

          <TextInput
            multiline
            onChangeText={setNotesDraft}
            placeholder="Quick note: fractions worksheet, science revision, English essay..."
            placeholderTextColor={colors.inkMuted}
            style={[styles.homeworkInput, styles.homeworkNotesInput]}
            value={notesDraft}
          />

          <View style={styles.homeworkEvidenceBar}>
            <Button icon="camera" label="Live photo" onPress={() => addEvidence("camera")} variant="secondary" />
            <Button icon="image" label="Photo library" onPress={() => addEvidence("library")} variant="secondary" />
            <Button icon="document-attach" label="File upload" onPress={() => addEvidence("file")} variant="secondary" />
          </View>

          <View style={styles.homeworkEvidenceBar}>
            <Button icon="checkmark-circle" label="Submit / Save today" onPress={() => saveDay(selectedStatus)} />
          </View>

          {evidence.length > 0 ? (
            <View style={styles.timelineItem}>
              <Ionicons color={colors.accent} name="image" size={18} />
              <View style={styles.rewardCopy}>
                <AppText variant="caption">Evidence uploaded</AppText>
                <AppText color={colors.inkMuted} variant="caption">
                  {firstEvidence?.comment ? `${firstEvidence.comment} · ` : ""}
                  {formatDateTimeLabel(firstEvidence?.submittedAt ?? null)}
                </AppText>
              </View>
              <Pressable accessibilityRole="button" onPress={() => firstEvidence ? deleteEvidence(firstEvidence.id) : undefined} style={styles.smallIconButton}>
                <Ionicons color={colors.inkMuted} name="trash-outline" size={16} />
              </Pressable>
            </View>
          ) : null}
          {firstEvidence?.imageUri && isPreviewableImage(firstEvidence.imageUri) ? <Image source={{ uri: firstEvidence.imageUri }} style={styles.homeworkPreview} /> : null}
        </>
      )}
    </Card>
  );
}

const simpleHomeworkStatuses: HomeworkStatus[] = ["completed", "in_progress", "incomplete"];

function StatusPill({ status }: { status: HomeworkStatus }) {
  const isComplete = status === "completed" || status === "not_applicable";
  return (
    <View style={[styles.statusPill, isComplete && styles.statusPillGood]}>
      <AppText color={isComplete ? colors.success : colors.inkMuted} variant="caption">
        {formatHomeworkStatus(status)}
      </AppText>
    </View>
  );
}

function formatHomeworkStatus(status: HomeworkStatus) {
  if (status === "not_started") return "Not started";
  if (status === "in_progress") return "In progress";
  if (status === "completed") return "Completed";
  if (status === "incomplete") return "Incomplete";
  return "N/A";
}

function getHomeworkStatusIcon(status: HomeworkStatus): keyof typeof Ionicons.glyphMap {
  if (status === "completed") return "checkmark-circle";
  if (status === "in_progress") return "time";
  if (status === "incomplete") return "close-circle";
  return "remove-circle";
}

function getHomeworkStatusColor(status: HomeworkStatus) {
  if (status === "completed") return colors.success;
  if (status === "in_progress") return colors.accent;
  if (status === "incomplete") return colors.danger;
  return colors.inkMuted;
}

function getHomeworkSavedMessage(status: HomeworkStatus) {
  if (status === "completed") return "Homework saved as complete";
  if (status === "incomplete") return "Homework saved as incomplete";
  if (status === "in_progress") return "Homework saved as in progress";
  return "Homework saved";
}

function getHomeworkDayToneStyle(status: HomeworkStatus) {
  if (status === "completed") return styles.weekDayComplete;
  if (status === "incomplete") return styles.weekDayIncomplete;
  if (status === "in_progress") return styles.weekDayInProgress;
  return styles.weekDayNeutral;
}

function getHomeworkListToneStyle(status: HomeworkStatus) {
  if (status === "completed") return styles.homeworkDateListComplete;
  if (status === "incomplete") return styles.homeworkDateListIncomplete;
  if (status === "in_progress") return styles.homeworkDateListInProgress;
  return null;
}

function getHomeworkDueDate(homework: HomeworkItem | null | undefined) {
  return homework?.dueDate ?? homework?.dueAt ?? null;
}

function getHomeworkCompletedDate(homework: HomeworkItem | null | undefined) {
  return homework?.completedDate ?? homework?.completedAt ?? null;
}

function formatShortWeekday(date: string) {
  const parsedDate = parseDateKey(date) ?? new Date();
  return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(parsedDate);
}

function formatDayNumber(date: string) {
  const parsedDate = parseDateKey(date) ?? new Date();
  return new Intl.DateTimeFormat(undefined, { day: "numeric" }).format(parsedDate);
}

function formatFriendlyDueDate(date: string | null | undefined) {
  const parsedDate = parseDateKey(date);

  if (!parsedDate) {
    return "No due date selected";
  }

  const weekday = new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(parsedDate);
  const day = Number(new Intl.DateTimeFormat(undefined, { day: "numeric" }).format(parsedDate));
  const month = new Intl.DateTimeFormat(undefined, { month: "long" }).format(parsedDate);
  return `${weekday} ${day}${getOrdinalSuffix(day)} ${month}`;
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

function getOrdinalSuffix(day: number) {
  if (day % 100 >= 11 && day % 100 <= 13) return "th";
  if (day % 10 === 1) return "st";
  if (day % 10 === 2) return "nd";
  if (day % 10 === 3) return "rd";
  return "th";
}

function getMiniCalendarDays(anchorDate: string) {
  const start = new Date(`${anchorDate}T12:00:00.000Z`);
  start.setUTCDate(1);
  const daysInMonth = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), index + 1, 12));
    return date.toISOString().slice(0, 10);
  });
}

function addMonths(dateKey: string, months: number) {
  const date = new Date(`${dateKey}T12:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() + months, 1);
  return date.toISOString().slice(0, 10);
}

function formatMonthTitle(dateKey: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric"
  }).format(new Date(`${dateKey}T12:00:00.000Z`));
}

function isTodayKey(date: string) {
  return date.slice(0, 10) === new Date().toISOString().slice(0, 10);
}

function isPreviewableImage(uri: string) {
  return /\.(jpg|jpeg|png|gif|webp|heic)$/i.test(uri.split("?")[0] ?? "");
}

function hasHomeworkEvidence(gameplay: Gameplay, homeworkId: string) {
  return gameplay.state.homeworkEvidence.some((item) => item.homeworkId === homeworkId && !item.deletedAt);
}

type Gameplay = ReturnType<typeof useGameplay>;

function TodayTab({ gameplay }: { gameplay: Gameplay }) {
  const openTasks = gameplay.todayTasks.filter(({ assignment }) => assignment.status === "open" || assignment.status === "rejected");

  return (
    <>
      <Card tone="fresh">
        <AppText variant="heading">{openTasks.length + (gameplay.morningRoutine.isSubmitted ? 0 : 1)} quests ready</AppText>
        <AppText color={colors.inkMuted}>Finish a quest, collect points, and keep your streak glowing.</AppText>
      </Card>

      <MorningRoutineCard gameplay={gameplay} />

      <AppText variant="heading">Other quests</AppText>
      {gameplay.todayTasks.length === 0 ? (
        <Card>
          <AppText color={colors.inkMuted}>No extra quests today. Your routine still counts.</AppText>
        </Card>
      ) : null}
      {gameplay.todayTasks.map(({ assignment, submission, task }) => (
        <View key={assignment.id} style={styles.taskBlock}>
          <TaskCard assignment={assignment} note={submission?.note} task={task} />
          {assignment.status === "open" || assignment.status === "rejected" ? (
            <ProofSubmissionCard
              onSubmit={({ note, photoUrl }) => {
                gameplay.submitTask(assignment.id, note, photoUrl);
              }}
            />
          ) : null}
        </View>
      ))}

      {gameplay.pendingReviewTasks.length > 0 ? (
        <>
          <AppText variant="heading">Waiting for review</AppText>
          {gameplay.pendingReviewTasks.map(({ assignment, submission, task }) => (
            <TaskCard assignment={assignment} key={assignment.id} note={submission?.note} task={task} />
          ))}
        </>
      ) : null}

      {gameplay.upcomingTasks.length > 0 ? (
        <>
          <AppText variant="heading">Coming up</AppText>
          {gameplay.upcomingTasks.map(({ assignment, submission, task }) => (
            <TaskCard assignment={assignment} key={assignment.id} note={submission?.note} task={task} />
          ))}
        </>
      ) : null}
    </>
  );
}

function MorningRoutineCard({ gameplay }: { gameplay: Gameplay }) {
  const routine = gameplay.morningRoutine;

  return (
    <Card tone="focus">
      <View style={styles.routineHeader}>
        <View>
          <AppText variant="heading">Morning Routine</AppText>
          <AppText color={colors.inkMuted}>Complete all five for +{routine.pointValue} points.</AppText>
        </View>
        <View style={styles.routineBadge}>
          <AppText color={colors.primaryDark} variant="caption">
            {routine.completedItemIds.length}/{routine.items.length}
          </AppText>
        </View>
      </View>

      <View style={styles.checklist}>
        {routine.items.map((item) => {
          const isChecked = routine.completedItemIds.includes(item.id);

          return (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isChecked, disabled: routine.isSubmitted }}
              disabled={routine.isSubmitted}
              key={item.id}
              onPress={() => gameplay.toggleMorningRoutineItem(item.id)}
              style={[styles.checkItem, isChecked && styles.checkItemDone]}
            >
              <Ionicons
                color={isChecked ? colors.surface : colors.primary}
                name={isChecked ? "checkmark-circle" : "ellipse-outline"}
                size={22}
              />
              <AppText color={isChecked ? colors.surface : colors.ink} variant="body">
                {item.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <Button
        disabled={!routine.isComplete || routine.isSubmitted}
        icon={routine.isSubmitted ? "checkmark-circle" : "sparkles"}
        label={routine.isSubmitted ? "Routine complete today" : "Claim 5 points"}
        onPress={gameplay.submitMorningRoutine}
      />
    </Card>
  );
}

function RewardsTab({ gameplay }: { gameplay: Gameplay }) {
  const shop = getRewardShopState(gameplay);

  return (
    <View style={styles.shopPage}>
      <View style={styles.shopHero}>
        <View style={styles.heroGlow} />
        <View style={styles.heroContent}>
          <View style={styles.heroCopy}>
            <AppText color={colors.surface} style={styles.shopTitle}>
              Rewards Shop
            </AppText>
            <AppText color="#DFFCF6">Unlock rewards with your points. Save up for bigger wins.</AppText>
          </View>
          <View style={styles.heroBalance}>
            <AppText color="#DFFCF6" variant="caption">
              Available
            </AppText>
            <AppText color={colors.surface} variant="title">
              {shop.availablePoints} pts
            </AppText>
            <AppText color="#DFFCF6" variant="caption">
              Earned {gameplay.pointsSummary.earned} · Spent {gameplay.pointsSummary.spent} · Balance {gameplay.pointsSummary.available}
            </AppText>
            {shop.reservedPoints > 0 ? (
              <AppText color="#DFFCF6" variant="caption">
                {shop.reservedPoints} pts pending approval
              </AppText>
            ) : null}
          </View>
        </View>

        <View style={styles.shopStats}>
          <ShopStat label="Level" value={`Level ${shop.level}`} />
          <ShopStat label="League" value={shop.league} />
          <ShopStat label="Weekly" value={`${shop.weeklyProgressPercent}%`} />
        </View>

        <View style={styles.nextLevelBlock}>
          <View style={styles.nextLevelText}>
            <AppText color={colors.surface} variant="caption">
              Progress to next level
            </AppText>
            <AppText color="#DFFCF6" variant="caption">
              {shop.pointsUntilNextLevel} points until {shop.nextLeague}
            </AppText>
          </View>
          <View style={styles.shopProgressTrack}>
            <View style={[styles.shopProgressFill, { width: `${shop.levelProgressPercent}%` }]} />
          </View>
        </View>
      </View>

      <RewardRequestPanel gameplay={gameplay} shop={shop} />
      <RewardGoalsSection gameplay={gameplay} shop={shop} />

      <RewardTierSection
        description="Small instant wins for everyday momentum."
        gameplay={gameplay}
        rewards={shop.quickRewards}
        shop={shop}
        title="Quick Rewards"
      />
      <RewardTierSection
        description="Bigger weekly treats for consistency."
        gameplay={gameplay}
        rewards={shop.weeklyRewards}
        shop={shop}
        title="Weekly Rewards"
      />
      <RewardTierSection
        description="Prestige rewards worth saving for."
        gameplay={gameplay}
        rewards={shop.bigRewards}
        shop={shop}
        title="Big Unlocks"
      />
    </View>
  );
}

const rewardRequestCategories: RewardRequestCategory[] = ["experience", "privilege", "item", "money", "custom"];

function RewardRequestPanel({ gameplay, shop }: { gameplay: Gameplay; shop: RewardShopState }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<RewardRequestCategory>("experience");
  const childRequests = gameplay.state.rewardRequests.filter((request) => request.childId === gameplay.state.child.childId);
  const pendingRequests = childRequests.filter((request) => request.status === "pending_parent_review");
  const deniedRequests = childRequests.filter((request) => request.status === "denied").slice(0, 2);

  function submitRequest() {
    if (!title.trim() || !description.trim()) {
      return;
    }

    gameplay.createRewardRequest({
      category,
      description,
      title
    });
    setTitle("");
    setDescription("");
    setCategory("experience");
    setIsOpen(false);
  }

  return (
    <Card tone="focus">
      <View style={styles.rewardCardTop}>
        <View style={styles.rewardCopy}>
          <AppText variant="heading">Set a goal</AppText>
          <AppText color={colors.inkMuted}>Ask for a meaningful reward and work toward it once approved.</AppText>
        </View>
        <Button icon={isOpen ? "close" : "add"} label={isOpen ? "Close" : "Request a reward"} onPress={() => setIsOpen((value) => !value)} variant="secondary" />
      </View>

      {isOpen ? (
        <View style={styles.goalRequestForm}>
          <TextInput onChangeText={setTitle} placeholder="Reward title" placeholderTextColor={colors.inkMuted} style={styles.homeworkInput} value={title} />
          <TextInput
            multiline
            onChangeText={setDescription}
            placeholder="Why do you want it?"
            placeholderTextColor={colors.inkMuted}
            style={[styles.homeworkInput, styles.homeworkNotesInput]}
            value={description}
          />
          <View style={styles.filterRow}>
            {rewardRequestCategories.map((item) => (
              <Pressable
                accessibilityRole="button"
                key={item}
                onPress={() => setCategory(item)}
                style={[styles.goalCategoryChip, category === item && styles.goalCategoryChipActive]}
              >
                <AppText color={category === item ? colors.surface : colors.ink} variant="caption">
                  {formatGoalCategory(item)}
                </AppText>
              </Pressable>
            ))}
          </View>
          <Button disabled={!title.trim() || !description.trim()} icon="send" label="Send for parent review" onPress={submitRequest} />
        </View>
      ) : null}

      {pendingRequests.map((request) => (
        <View key={request.id} style={styles.goalStatusCard}>
          <Ionicons color={colors.accent} name="hourglass" size={18} />
          <View style={styles.rewardCopy}>
            <AppText variant="caption">{request.title}</AppText>
            <AppText color={colors.inkMuted} variant="caption">Waiting for parent approval</AppText>
          </View>
        </View>
      ))}

      {deniedRequests.map((request) => (
        <View key={request.id} style={styles.goalStatusCard}>
          <Ionicons color={colors.danger} name="close-circle" size={18} />
          <View style={styles.rewardCopy}>
            <AppText variant="caption">{request.title}</AppText>
            <AppText color={colors.inkMuted} variant="caption">
              Request not approved{request.parentNote ? ` · ${request.parentNote}` : ""}
            </AppText>
          </View>
        </View>
      ))}
    </Card>
  );
}

function RewardGoalsSection({ gameplay, shop }: { gameplay: Gameplay; shop: RewardShopState }) {
  const goals = gameplay.approvedRewardGoals.filter((request) => request.childId === gameplay.state.child.childId);

  if (goals.length === 0) {
    return null;
  }

  return (
    <View style={styles.rewardTier}>
      <View>
        <AppText variant="heading">Goals</AppText>
        <AppText color={colors.inkMuted}>Approved rewards you can work toward.</AppText>
      </View>
      <View style={styles.rewardGrid}>
        {goals.map((goal) => (
          <RewardGoalCard gameplay={gameplay} goal={goal} key={goal.id} shop={shop} />
        ))}
      </View>
    </View>
  );
}

function RewardGoalCard({ gameplay, goal, shop }: { gameplay: Gameplay; goal: RewardRequest; shop: RewardShopState }) {
  const target = goal.parentPointTarget ?? goal.suggestedPointTarget ?? 0;
  const progressPercent = target > 0 ? Math.min(100, Math.round((shop.availablePoints / target) * 100)) : 0;
  const remaining = Math.max(0, target - shop.availablePoints);
  const canRedeem = goal.status === "approved_goal" && target > 0 && shop.availablePoints >= target;

  return (
    <View style={[styles.shopRewardCard, styles.shopRewardCardBig, goal.status === "redeemed" && styles.shopRewardCardLocked]}>
      <View style={styles.rewardCardTop}>
        <View style={[styles.rewardGem, styles.rewardGemBig]}>
          <Ionicons color={colors.accent} name={goal.status === "redeemed" ? "checkmark-circle" : "flag"} size={24} />
        </View>
        <View style={styles.rewardStatusPill}>
          <AppText color={colors.primaryDark} variant="caption">{goal.status === "redeemed" ? "Redeemed" : "Goal approved"}</AppText>
        </View>
      </View>
      <AppText variant="body">{goal.title}</AppText>
      <AppText color={colors.inkMuted} variant="caption">{goal.description}</AppText>
      <View style={styles.rewardProgressTrack}>
        <View style={[styles.rewardProgressFill, { width: `${progressPercent}%` }]} />
      </View>
      <AppText color={colors.inkMuted} variant="caption">
        Target {target} pts · Current {shop.availablePoints} pts · {remaining} pts to go
      </AppText>
      {goal.deadlineDate ? <AppText color={colors.inkMuted} variant="caption">Deadline: {formatDateTimeLabel(goal.deadlineDate)}</AppText> : null}
      {goal.eventDate ? <AppText color={colors.inkMuted} variant="caption">Event date: {formatDateTimeLabel(goal.eventDate)}</AppText> : null}
      {goal.conditions ? <AppText color={colors.inkMuted} variant="caption">Conditions: {goal.conditions}</AppText> : null}
      <Button
        disabled={!canRedeem}
        icon={goal.status === "redeemed" ? "checkmark-circle" : canRedeem ? "sparkles" : "trending-up"}
        label={goal.status === "redeemed" ? "Goal redeemed" : canRedeem ? "Redeem goal" : "Keep saving"}
        onPress={() => gameplay.redeemRewardGoal(goal.id)}
        variant={canRedeem ? "primary" : "secondary"}
      />
    </View>
  );
}

function ShopStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.shopStat}>
      <AppText color="#DFFCF6" variant="caption">
        {label}
      </AppText>
      <AppText color={colors.surface} variant="body">
        {value}
      </AppText>
    </View>
  );
}

function RewardTierSection({
  description,
  gameplay,
  rewards,
  shop,
  title
}: {
  description: string;
  gameplay: Gameplay;
  rewards: Reward[];
  shop: RewardShopState;
  title: string;
}) {
  return (
    <View style={styles.rewardTier}>
      <View>
        <AppText variant="heading">{title}</AppText>
        <AppText color={colors.inkMuted}>{description}</AppText>
      </View>
      <View style={styles.rewardGrid}>
        {rewards.map((reward) => (
          <ShopRewardCard gameplay={gameplay} key={reward.id} reward={reward} shop={shop} />
        ))}
      </View>
    </View>
  );
}

function ShopRewardCard({ gameplay, reward, shop }: { gameplay: Gameplay; reward: Reward; shop: RewardShopState }) {
  const pendingRequest = gameplay.state.redemptions.find(
    (redemption) => redemption.rewardId === reward.id && redemption.status === "requested"
  );
  const latestRequest = gameplay.state.redemptions.find((redemption) => redemption.rewardId === reward.id);
  const lockedReason = getLockedReason(reward, shop);
  const isLocked = Boolean(lockedReason);
  const canAfford = shop.availablePoints >= reward.pointCost;
  const remainingPoints = Math.max(0, reward.pointCost - shop.availablePoints);
  const canRedeem = !isLocked && canAfford && !pendingRequest;
  const progressPercent = Math.min(100, Math.round((shop.availablePoints / reward.pointCost) * 100));
  const isBig = getRewardTier(reward) === "big";

  return (
    <View style={[styles.shopRewardCard, isBig && styles.shopRewardCardBig, isLocked && styles.shopRewardCardLocked]}>
      <View style={styles.rewardCardTop}>
        <View style={[styles.rewardGem, isBig && styles.rewardGemBig]}>
          <Ionicons color={isLocked ? colors.inkMuted : colors.accent} name={isLocked ? "lock-closed" : "diamond"} size={24} />
        </View>
        <View style={styles.rewardStatusPill}>
          <AppText color={isLocked ? colors.inkMuted : colors.primaryDark} variant="caption">
            {isLocked ? "Locked" : pendingRequest ? "Pending" : canAfford ? "Unlocked" : "Saving"}
          </AppText>
        </View>
      </View>

      <View style={styles.rewardCopy}>
        <AppText color={isLocked ? colors.inkMuted : colors.ink} variant="body">
          {reward.title}
        </AppText>
        <AppText color={colors.inkMuted} variant="caption">
          {getRewardTypeLabel(reward)} · {getLimitLabel(reward)}
        </AppText>
      </View>

      {reward.description ? (
        <AppText color={colors.inkMuted} variant="caption">
          {reward.description}
        </AppText>
      ) : null}

      <View style={styles.rewardCostRow}>
        <AppText color={isLocked ? colors.inkMuted : colors.accent} variant="heading">
          {reward.pointCost}
        </AppText>
        <AppText color={colors.inkMuted} variant="caption">
          pts
        </AppText>
      </View>

      {!canAfford && !isLocked ? (
        <>
          <View style={styles.rewardProgressTrack}>
            <View style={[styles.rewardProgressFill, { width: `${progressPercent}%` }]} />
          </View>
          <AppText color={colors.inkMuted} variant="caption">
            {remainingPoints} more points needed
          </AppText>
        </>
      ) : null}

      {isLocked ? (
        <AppText color={colors.inkMuted} variant="caption">
          {lockedReason}
        </AppText>
      ) : pendingRequest ? (
        <AppText color={colors.inkMuted} variant="caption">
          Pending parent approval · Requested {formatDateTimeLabel(pendingRequest.requestedAt)}
        </AppText>
      ) : latestRequest?.status === "rejected" ? (
        <AppText color={colors.inkMuted} variant="caption">
          Last request was declined
        </AppText>
      ) : null}

      <Button
        disabled={!canRedeem}
        icon={pendingRequest ? "hourglass" : isLocked ? "lock-closed" : canAfford ? "sparkles" : "trending-up"}
        label={pendingRequest ? "Pending approval" : isLocked ? "Locked" : canAfford ? "Redeem" : "Save up"}
        onPress={() => gameplay.requestReward(reward.id)}
        variant={canRedeem ? "primary" : "secondary"}
      />
    </View>
  );
}

function ProgressTab({ gameplay }: { gameplay: Gameplay }) {
  const progress = getChildProgress(gameplay);

  return (
    <>
      <View style={styles.progressGrid}>
        <ProgressCard icon="wallet" label="Available" value={`${gameplay.pointsSummary.available} pts`} />
        <ProgressCard icon="archive" label="Spent" value={`${gameplay.pointsSummary.spent} pts`} />
        <ProgressCard icon="flame" label="Streak" value={`${gameplay.state.child.streak} days`} />
        <ProgressCard icon="sparkles" label="Earned this week" value={`+${progress.weeklyPointsEarned}`} />
        <ProgressCard icon="checkmark-done" label="Quests this week" value={String(progress.tasksCompletedThisWeek)} />
      </View>

      <Card tone="fresh">
        <View style={styles.routineHeader}>
          <View>
            <AppText variant="heading">Gold League</AppText>
            <AppText color={colors.inkMuted}>Weekly progress</AppText>
          </View>
          <AppText color={colors.success} variant="body">
            {progress.weeklyProgressPercent}%
          </AppText>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress.weeklyProgressPercent}%` }]} />
        </View>
        <AppText color={colors.inkMuted} variant="caption">
          {progress.weeklyPointsEarned}/100 weekly points
        </AppText>
      </Card>
    </>
  );
}

function ProgressCard({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <Card style={styles.progressCard}>
      <Ionicons color={colors.primary} name={icon} size={24} />
      <AppText variant="heading">{value}</AppText>
      <AppText color={colors.inkMuted} variant="caption">
        {label}
      </AppText>
    </Card>
  );
}

function ActivityTab({ gameplay }: { gameplay: Gameplay }) {
  return (
    <>
      <AppText variant="heading">Activity log</AppText>
      {gameplay.state.pointsTransactions.slice(0, 12).map((transaction) => (
        <ActivityRow key={transaction.id} transaction={transaction} />
      ))}
    </>
  );
}

function ActivityRow({ transaction }: { transaction: PointsTransaction }) {
  const isPositive = transaction.amount >= 0;

  return (
    <Card tone={isPositive ? "fresh" : "default"}>
      <View style={styles.activityRow}>
        <View style={[styles.activityIcon, { backgroundColor: isPositive ? "#DDF8EA" : "#FFE3D6" }]}>
          <Ionicons color={isPositive ? colors.success : colors.danger} name={getActivityIcon(transaction)} size={20} />
        </View>
        <View style={styles.rewardCopy}>
          <AppText color={isPositive ? colors.success : colors.danger} variant="body">
            {transaction.amount >= 0 ? "+" : ""}{transaction.amount} {getActivityLabel(transaction)}
          </AppText>
          {transaction.note ? (
            <AppText color={colors.inkMuted} variant="caption">
              {transaction.note}
            </AppText>
          ) : null}
          <AppText color={colors.inkMuted} variant="caption">
            {formatDateTimeLabel(transaction.createdAt)}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

function getChildSummaryItems(gameplay: Gameplay) {
  const shop = getRewardShopState(gameplay);

  return [
    {
      accentColor: colors.success,
      caption: `Spent ${gameplay.pointsSummary.spent}`,
      icon: "sparkles" as const,
      label: "Total earned",
      value: `${gameplay.pointsSummary.earned}`
    },
    {
      accentColor: colors.accent,
      caption: "Keep it going",
      icon: "flame" as const,
      label: "Streak",
      value: `${gameplay.state.child.streak} days`
    },
    {
      accentColor: colors.sky,
      caption: "Ready for rewards",
      icon: "wallet" as const,
      label: "Available",
      value: `${shop.availablePoints} pts`
    },
    {
      accentColor: colors.accent,
      caption: "Top 20%",
      icon: "shield-checkmark" as const,
      label: "League",
      value: shop.league
    }
  ];
}

type League = "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";

type RewardShopState = {
  availablePoints: number;
  bigRewards: Reward[];
  league: League;
  level: number;
  levelProgressPercent: number;
  nextLeague: League;
  pointsUntilNextLevel: number;
  quickRewards: Reward[];
  reservedPoints: number;
  weeklyProgressPercent: number;
  weeklyRewards: Reward[];
};

function getRewardShopState(gameplay: Gameplay): RewardShopState {
  const progress = getChildProgress(gameplay);
  const level = Math.max(1, Math.floor(gameplay.state.child.points / 200) + 1);
  const levelBase = (level - 1) * 200;
  const nextLevelAt = level * 200;
  const pointsUntilNextLevel = Math.max(0, nextLevelAt - gameplay.state.child.points);
  const league = getLeague({
    level,
    streak: gameplay.state.child.streak,
    weeklyPointsEarned: progress.weeklyPointsEarned
  });
  const reservedPoints = getReservedRewardPoints(gameplay);
  const rewards = gameplay.state.rewards.filter((reward) => reward.isActive);

  return {
    availablePoints: Math.max(0, gameplay.pointsSummary.available - reservedPoints),
    bigRewards: rewards.filter((reward) => getRewardTier(reward) === "big"),
    league,
    level,
    levelProgressPercent: Math.min(100, Math.round(((gameplay.pointsSummary.available - levelBase) / 200) * 100)),
    nextLeague: getNextLeague(league),
    pointsUntilNextLevel,
    quickRewards: rewards.filter((reward) => getRewardTier(reward) === "quick"),
    reservedPoints,
    weeklyProgressPercent: progress.weeklyProgressPercent,
    weeklyRewards: rewards.filter((reward) => getRewardTier(reward) === "weekly")
  };
}

function getReservedRewardPoints(gameplay: Gameplay) {
  return gameplay.state.redemptions
    .filter((redemption) => redemption.status === "requested")
    .reduce((total, redemption) => {
      const reward = gameplay.state.rewards.find((item) => item.id === redemption.rewardId);
      return total + (reward?.pointCost ?? 0);
    }, 0);
}

function getRewardTier(reward: Reward) {
  if (reward.tier) {
    return reward.tier;
  }

  if (reward.pointCost <= 75) return "quick";
  if (reward.pointCost <= 220) return "weekly";
  return "big";
}

function getLeague({
  level,
  streak,
  weeklyPointsEarned
}: {
  level: number;
  streak: number;
  weeklyPointsEarned: number;
}): League {
  if (level >= 5 || streak >= 14 || weeklyPointsEarned >= 250) return "Diamond";
  if (level >= 4 || streak >= 10 || weeklyPointsEarned >= 180) return "Platinum";
  if (level >= 3 || streak >= 5 || weeklyPointsEarned >= 100) return "Gold";
  if (level >= 2 || weeklyPointsEarned >= 50) return "Silver";
  return "Bronze";
}

function getNextLeague(league: League): League {
  if (league === "Bronze") return "Silver";
  if (league === "Silver") return "Gold";
  if (league === "Gold") return "Platinum";
  return "Diamond";
}

function getLockedReason(reward: Reward, shop: RewardShopState) {
  if (reward.unlockLevel && shop.level < reward.unlockLevel) {
    return `Locked until Level ${reward.unlockLevel}`;
  }

  if (reward.unlockStreak && reward.unlockStreak > 0) {
    return `Locked until ${reward.unlockStreak} day streak`;
  }

  if (reward.unlockLeague && !hasLeagueReached(shop.league, reward.unlockLeague)) {
    return `Locked until ${reward.unlockLeague} League`;
  }

  return null;
}

function hasLeagueReached(current: League, required: League) {
  const order: League[] = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"];
  return order.indexOf(current) >= order.indexOf(required);
}

function getRewardTypeLabel(reward: Reward) {
  const rewardType = reward.rewardType ?? (reward.pointCost <= 75 ? "small" : reward.pointCost <= 220 ? "medium" : "big");
  if (rewardType === "small") return "Small reward";
  if (rewardType === "medium") return "Medium reward";
  return "Big unlock";
}

function formatGoalCategory(category: RewardRequestCategory) {
  if (category === "experience") return "Experience";
  if (category === "privilege") return "Privilege";
  if (category === "item") return "Item";
  if (category === "money") return "Money";
  return "Custom";
}

function getLimitLabel(reward: Reward) {
  if (reward.limit === "once_per_day") return "1 per day";
  if (reward.limit === "once_per_week") return "1 per week";
  if (reward.limit === "save_up") return "Save up";
  return "Unlimited";
}

function getChildProgress(gameplay: Gameplay) {
  const weekStart = getStartOfWeek(new Date());
  const weekEnd = addDays(weekStart, 6);
  const weeklyTransactions = gameplay.state.pointsTransactions.filter((transaction) =>
    isDateKeyInRange(transaction.createdAt, weekStart, weekEnd)
  );
  const weeklyPointsEarned = weeklyTransactions
    .filter((transaction) => transaction.amount > 0)
    .reduce((total, transaction) => total + transaction.amount, 0);
  const completedAssignments = gameplay.state.assignments.filter(
    (assignment) => assignment.status === "approved" && isDateKeyInRange(assignment.completedAt, weekStart, weekEnd)
  ).length;
  const completedRoutineDays = gameplay.state.morningRoutineCompletions.filter((routine) =>
    Boolean(routine.completedAt) && isDateKeyInRange(routine.completedAt, weekStart, weekEnd)
  ).length;

  return {
    tasksCompletedThisWeek: completedAssignments + completedRoutineDays,
    weeklyPointsEarned,
    weeklyProgressPercent: Math.min(100, Math.round((weeklyPointsEarned / 100) * 100))
  };
}

function getActivityLabel(transaction: PointsTransaction) {
  if (transaction.type === "reward_redemption") {
    return `Reward redeemed: ${transaction.category}`;
  }

  if (transaction.type === "behaviour_adjustment" && transaction.amount < 0) {
    return transaction.category;
  }

  return transaction.category;
}

function getActivityIcon(transaction: PointsTransaction): keyof typeof Ionicons.glyphMap {
  if (transaction.type === "reward_redemption") return "gift";
  if (transaction.type === "behaviour_adjustment" && transaction.amount < 0) return "refresh";
  if (transaction.category === "Morning Routine") return "sunny";
  return "sparkles";
}

function getWeekDays(weekStart: string) {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

function getHomeworkForWeek(gameplay: Gameplay, weekStart: string) {
  const weekEnd = addDays(weekStart, 6);

  return gameplay.state.homeworkItems
    .filter(
      (item) =>
        !item.deletedAt &&
        !isPlaceholderHomework(item) &&
        (isDateKeyInRange(getHomeworkDueDate(item), weekStart, weekEnd) || isDateKeyInRange(getHomeworkCompletedDate(item), weekStart, weekEnd))
    )
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
}

function getHomeworkForDate(gameplay: Gameplay, date: string) {
  const activeItems = gameplay.state.homeworkItems.filter((item) => !item.deletedAt && !isPlaceholderHomework(item));

  return {
    completed: activeItems.filter((item) => isSameDate(getHomeworkCompletedDate(item), date)),
    due: activeItems.filter((item) => isSameDate(getHomeworkDueDate(item), date))
  };
}

function getHomeworkMomentum(gameplay: Gameplay, weekStart: string) {
  const weekEnd = addDays(weekStart, 6);
  const weekEntries = getHomeworkForWeek(gameplay, weekStart);
  const accountableItems = weekEntries.filter((item) => item.status !== "not_applicable");
  const completedItems = accountableItems.filter((item) => item.status === "completed");
  const evidenceDays = new Set(
    gameplay.state.homeworkEvidence
      .filter((evidence) => !evidence.deletedAt)
      .map((evidence) => gameplay.state.homeworkItems.find((item) => item.id === evidence.homeworkId))
      .filter((item): item is HomeworkItem => Boolean(item && isDateKeyInRange(getHomeworkDueDate(item), weekStart, weekEnd)))
      .map((item) => getHomeworkDueDate(item)?.slice(0, 10) ?? "")
  ).size;

  return {
    completedDays: completedItems.length,
    completionPercent: accountableItems.length === 0 ? 100 : Math.round((completedItems.length / accountableItems.length) * 100),
    evidenceDays,
    inProgressDays: weekEntries.filter((item) => item.status === "in_progress").length
  };
}

function isSameDate(value: string | null, date: string) {
  const valueKey = toSafeDateKey(value);
  const dateKey = toSafeDateKey(date);
  return Boolean(valueKey && dateKey && valueKey === dateKey);
}

function getHomeworkConsistencyStreak(gameplay: Gameplay) {
  const activeDays = new Set<string>();
  gameplay.state.homeworkSessions.filter((session) => !session.deletedAt).forEach((session) => activeDays.add(session.startedAt.slice(0, 10)));
  gameplay.state.homeworkEvidence.filter((evidence) => !evidence.deletedAt).forEach((evidence) => activeDays.add(evidence.submittedAt.slice(0, 10)));
  gameplay.state.homeworkItems.forEach((item) => {
    if (!item.deletedAt && item.completedAt) activeDays.add(item.completedAt.slice(0, 10));
  });

  let streak = 0;
  let cursor = new Date();

  while (activeDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

function isDateKeyInRange(value: string | null, startKey: string, endKey: string) {
  if (!value) {
    return false;
  }

  const dateKey = value.slice(0, 10);
  return dateKey >= startKey && dateKey <= endKey;
}

const styles = StyleSheet.create({
  activityIcon: {
    alignItems: "center",
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  activityRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  checkItem: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 52,
    padding: spacing.md
  },
  checkItemDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark
  },
  checklist: {
    gap: spacing.sm
  },
  completionToggle: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    gap: spacing.sm,
    padding: spacing.md
  },
  disabledInput: {
    color: colors.inkMuted
  },
  disabledSection: {
    opacity: 0.42
  },
  datePickerField: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md
  },
  datePickerShell: {
    gap: spacing.sm
  },
  dueMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  filterChip: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  filterChipActive: {
    backgroundColor: colors.primary
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  formFlex: {
    flexBasis: 160,
    flexGrow: 1
  },
  goalCategoryChip: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  goalCategoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark
  },
  goalRequestForm: {
    gap: spacing.md
  },
  goalStatusCard: {
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md
  },
  homeworkFormRow: {
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
    justifyContent: "space-between"
  },
  homeworkHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  homeworkEvidenceBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  homeworkDateRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  homeworkDateListComplete: {
    borderColor: colors.success
  },
  homeworkDateListGroup: {
    gap: spacing.sm
  },
  homeworkDateListIncomplete: {
    borderColor: colors.danger
  },
  homeworkDateListInProgress: {
    borderColor: colors.accent
  },
  homeworkDateListItem: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    padding: spacing.md
  },
  homeworkDateListMeta: {
    flexBasis: 150,
    flexGrow: 1,
    gap: spacing.xs
  },
  homeworkDueItem: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md
  },
  homeworkDuePanel: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    gap: spacing.sm,
    padding: spacing.md
  },
  homeworkInput: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.ink,
    flex: 1,
    fontSize: 16,
    minHeight: 48,
    minWidth: 0,
    paddingHorizontal: spacing.md
  },
  homeworkNotesInput: {
    minHeight: 96,
    paddingTop: spacing.md,
    textAlignVertical: "top"
  },
  homeworkMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  homeworkPreview: {
    aspectRatio: 4 / 3,
    borderRadius: 8,
    width: "100%"
  },
  homeworkStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  incompletePanel: {
    alignItems: "flex-start",
    backgroundColor: "#FFF4F4",
    borderColor: "#FFD6D6",
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md
  },
  journalDetail: {
    gap: spacing.md
  },
  miniStat: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: 120,
    flexGrow: 1,
    padding: spacing.md
  },
  miniCalendar: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.sm
  },
  miniCalendarDay: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    width: 42,
    gap: 2,
    minHeight: 52,
    paddingVertical: spacing.xs
  },
  miniCalendarDayActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark
  },
  miniCalendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  miniCalendarHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  miniCalendarLabel: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 14,
    textAlign: "center"
  },
  miniCalendarNavButton: {
    minWidth: 78,
    paddingHorizontal: spacing.sm
  },
  miniCalendarTitle: {
    alignItems: "center",
    flex: 1,
    minWidth: 0
  },
  minutesInput: {
    flexGrow: 0,
    minWidth: 96
  },
  progressCard: {
    flexBasis: 150,
    flexGrow: 1,
    minWidth: 140
  },
  progressFill: {
    backgroundColor: colors.success,
    borderRadius: 999,
    height: "100%"
  },
  progressGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  progressTrack: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    height: 14,
    overflow: "hidden"
  },
  rewardCopy: {
    flex: 1,
    gap: spacing.xs
  },
  rewardCardTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  rewardCostRow: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: spacing.xs
  },
  rewardGem: {
    flexShrink: 0,
    alignItems: "center",
    backgroundColor: "#FFF4D8",
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  rewardGemBig: {
    backgroundColor: "#FFE8B8",
    height: 56,
    width: 56
  },
  rewardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  rewardHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  rewardIcon: {
    alignItems: "center",
    backgroundColor: "#FFF0D2",
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  rewardProgressFill: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    height: "100%"
  },
  rewardProgressTrack: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    height: 10,
    overflow: "hidden"
  },
  rewardStatusPill: {
    backgroundColor: "#E6FAF4",
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  rewardTier: {
    gap: spacing.md
  },
  routineBadge: {
    backgroundColor: "#DDF8EA",
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  routineHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  heroBalance: {
    alignItems: "flex-start",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 8,
    borderWidth: 1,
    flexGrow: 1,
    minWidth: 0,
    padding: spacing.lg
  },
  heroContent: {
    flexDirection: "column",
    flexWrap: "wrap",
    gap: spacing.lg,
    justifyContent: "space-between"
  },
  heroCopy: {
    gap: spacing.sm,
    minWidth: 0
  },
  heroGlow: {
    backgroundColor: "rgba(255, 184, 77, 0.34)",
    borderRadius: 999,
    height: 180,
    position: "absolute",
    right: -44,
    top: -70,
    width: 180
  },
  nextLevelBlock: {
    gap: spacing.sm
  },
  nextLevelText: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  shopHero: {
    backgroundColor: colors.primaryDark,
    borderRadius: 8,
    gap: spacing.lg,
    overflow: "hidden",
    padding: spacing.lg
  },
  shopPage: {
    gap: spacing.xl
  },
  shopProgressFill: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    height: "100%"
  },
  shopProgressTrack: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 999,
    height: 14,
    overflow: "hidden"
  },
  shopRewardCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: "100%",
    flexGrow: 1,
    gap: spacing.md,
    minWidth: 0,
    padding: spacing.lg
  },
  shopRewardCardBig: {
    backgroundColor: "#FFF8EA",
    borderColor: "#F5D18B"
  },
  shopRewardCardLocked: {
    opacity: 0.62
  },
  shopStat: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: 96,
    flexGrow: 1,
    padding: spacing.md
  },
  shopStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  shopTitle: {
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 40
  },
  statusButton: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  statusButtonActive: {
    backgroundColor: colors.primary
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  statusPill: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  statusPillGood: {
    backgroundColor: "#DDF8EA"
  },
  toggleButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  toggleButtonActive: {
    backgroundColor: colors.success,
    borderColor: colors.success
  },
  toggleButtonWarning: {
    backgroundColor: colors.danger,
    borderColor: colors.danger
  },
  toggleRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  weekDayButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.xs,
    width: 56,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm
  },
  weekDayButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
    borderWidth: 2
  },
  weekDayComplete: {
    backgroundColor: colors.success,
    borderColor: colors.success
  },
  weekDayInProgress: {
    backgroundColor: colors.accent,
    borderColor: colors.accent
  },
  weekDayIncomplete: {
    backgroundColor: colors.danger,
    borderColor: colors.danger
  },
  weekDayNeutral: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border
  },
  weekDayLabel: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
    textAlign: "center"
  },
  weekNavButton: {
    flexBasis: 0,
    flexGrow: 1,
    minWidth: 88,
    paddingHorizontal: spacing.sm
  },
  weekEvidenceSpacer: {
    height: 14
  },
  weekStrip: {
    flexDirection: "row",
    gap: spacing.sm
  },
  weekNavActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  smallIconButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  tabButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 44,
    minWidth: 104,
    paddingHorizontal: spacing.md
  },
  tabButtonActive: {
    backgroundColor: colors.primary
  },
  childTabButton: {
    minWidth: 116
  },
  tabRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingRight: spacing.md
  },
  taskBlock: {
    gap: spacing.sm
  },
  timelineItem: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md
  },
  undoActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  undoToast: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderRadius: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.md
  }
});
