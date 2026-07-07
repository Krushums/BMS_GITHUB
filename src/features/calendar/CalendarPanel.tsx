import { useMemo, useState } from "react";
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { CalendarEvent, CalendarEventCategory, CalendarEventKind, CalendarEventType, HomeworkItem, RewardRequest } from "@/domain";
import { useGameplay } from "@/features/gameplay/GameplayContext";
import { AppText } from "@/shared/components/AppText";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { usePreviewMode } from "@/shared/components/PreviewModeContext";
import { colors, spacing } from "@/shared/theme";
import { addDays, formatDateLabel, getStartOfWeek, isSameDay } from "@/shared/utils/date";

type CalendarPanelProps = {
  audience: "child" | "parent";
};

type CalendarDisplayEvent = {
  id: string;
  title: string;
  type: CalendarEventType;
  kind: CalendarEventKind;
  category: CalendarEventCategory;
  color: string;
  date: string;
  time: string | null;
  startTime: string | null;
  endTime: string | null;
  allDay: boolean;
  location: string | null;
  alert: string | null;
  repeat: string | null;
  notes: string | null;
  subject: string | null;
  source: "calendar" | "homework" | "reward_goal";
  sourceId: string;
};

type DayTimelineStatus = "approved" | "pending" | "incomplete" | "upcoming";

type DayTimelineItem = {
  allDay?: boolean;
  category: CalendarEventCategory;
  color: string;
  detail: string;
  endTime?: string | null;
  id: string;
  pointsValue: number;
  source: "calendar" | "homework" | "reward_goal" | "revision" | "task";
  sourceId: string;
  status: DayTimelineStatus;
  time: string;
  title: string;
};

const eventCategories: Array<{
  category: CalendarEventCategory;
  color: string;
  label: string;
  type: CalendarEventType;
}> = [
  { category: "school", color: "#0A84FF", label: "School", type: "school_event" },
  { category: "homework", color: colors.primary, label: "Homework", type: "homework" },
  { category: "revision", color: "#FF9F0A", label: "Revision", type: "revision" },
  { category: "custom", color: "#8E8E93", label: "Custom", type: "custom" }
];
const defaultEventCategory = eventCategories[3] as {
  category: CalendarEventCategory;
  color: string;
  label: string;
  type: CalendarEventType;
};
const alertOptions = ["None", "At time of event", "10 minutes before", "1 hour before", "1 day before"];
const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dailyGoalTarget = 50;

export function CalendarPanel({ audience }: CalendarPanelProps) {
  const gameplay = useGameplay();
  const { mode } = usePreviewMode();
  const { width } = useWindowDimensions();
  const todayKey = new Date().toISOString().slice(0, 10);
  const [visibleMonth, setVisibleMonth] = useState(todayKey);
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<CalendarEventKind>("event");
  const [category, setCategory] = useState<CalendarEventCategory>("custom");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState(todayKey);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [allDay, setAllDay] = useState(true);
  const [location, setLocation] = useState("");
  const [alertText, setAlertText] = useState("");
  const [notes, setNotes] = useState("");
  const [detailItem, setDetailItem] = useState<DayTimelineItem | null>(null);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [phoneView, setPhoneView] = useState<"calendar" | "day">("calendar");
  const monthDays = getMonthDays(visibleMonth);
  const displayEvents = useMemo(() => getCalendarDisplayEvents(gameplay), [gameplay]);
  const dayTimelineItems = useMemo(() => getDayTimelineItems(gameplay, displayEvents, selectedDate), [displayEvents, gameplay, selectedDate]);
  const dayStats = getDayStats(gameplay, dayTimelineItems, selectedDate);
  const phoneModal = mode === "phone" || width < 768;
  const tabletModal = !phoneModal && width < 1024;
  const compact = phoneModal || width <= 520;

  function resetForm(nextDate = selectedDate) {
    setEditingEvent(null);
    setTitle("");
    setKind("event");
    setCategory("custom");
    setSubject("");
    setDate(nextDate);
    setStartTime("");
    setEndTime("");
    setAllDay(true);
    setLocation("");
    setAlertText("");
    setNotes("");
  }

  function saveEvent() {
    if (!title.trim()) {
      return;
    }

    const categoryConfig = getCategoryConfig(category);

    if (editingEvent) {
      gameplay.updateCalendarEvent({
        alert: alertText,
        allDay,
        category,
        color: categoryConfig.color,
        date,
        endTime,
        eventId: editingEvent.id,
        kind,
        location,
        notes,
        repeat: null,
        startTime,
        subject,
        time: startTime,
        title,
        type: categoryConfig.type
      });
    } else {
      gameplay.createCalendarEvent({
        alert: alertText,
        allDay,
        category,
        color: categoryConfig.color,
        date,
        endTime,
        kind,
        location,
        notes,
        repeat: null,
        startTime,
        subject,
        time: startTime,
        title,
        type: categoryConfig.type
      });
    }

    resetForm(date);
    setSelectedDate(date);
    setEventModalVisible(false);
  }

  function closeEventModal() {
    setEventModalVisible(false);
    resetForm(selectedDate);
  }

  function openEventModal(nextDate: string) {
    setSelectedDate(nextDate);
    resetForm(nextDate);
    setEventModalVisible(true);
  }

  function selectCalendarDate(nextDate: string) {
    setSelectedDate(nextDate);
    setDate(nextDate);
    if (phoneModal) {
      setPhoneView("day");
      return;
    }

    openEventModal(nextDate);
  }

  function openEventModalAtTime(nextDate: string, nextTime: string) {
    setSelectedDate(nextDate);
    resetForm(nextDate);
    setStartTime(nextTime);
    setAllDay(false);
    setEventModalVisible(true);
  }

  function startEdit(event: CalendarDisplayEvent) {
    if (event.source !== "calendar") {
      return;
    }

    const sourceEvent = gameplay.state.calendarEvents.find((item) => item.id === event.sourceId);
    if (!sourceEvent) {
      return;
    }

    setEditingEvent(sourceEvent);
    setTitle(sourceEvent.title);
    setKind(sourceEvent.kind ?? "event");
    setCategory(sourceEvent.category ?? getCategoryFromType(sourceEvent.type));
    setSubject(sourceEvent.subject ?? "");
    setDate(sourceEvent.date);
    setStartTime(sourceEvent.startTime ?? sourceEvent.time ?? "");
    setEndTime(sourceEvent.endTime ?? "");
    setAllDay(sourceEvent.allDay ?? false);
    setLocation(sourceEvent.location ?? "");
    setAlertText(sourceEvent.alert ?? "");
    setNotes(sourceEvent.notes ?? "");
    setEventModalVisible(true);
  }

  function startEditById(eventId: string) {
    const event = displayEvents.find((item) => item.source === "calendar" && item.sourceId === eventId);
    if (event) {
      startEdit(event);
    }
  }

  function shiftMonth(months: number) {
    const nextMonth = addMonths(visibleMonth, months);
    setVisibleMonth(nextMonth);
    setSelectedDate(nextMonth);
    setDate(nextMonth);
  }

  function renderEventForm(showDesktopHeader: boolean) {
    return (
      <>
        <View style={styles.segmentedControl}>
          {(["event", "reminder"] as CalendarEventKind[]).map((item) => (
            <Pressable key={item} onPress={() => setKind(item)} style={[styles.segmentButton, kind === item && styles.segmentButtonActive]}>
              <AppText color={kind === item ? colors.ink : colors.inkMuted} style={styles.segmentLabel} variant="caption">
                {item === "event" ? "Event" : "Reminder"}
              </AppText>
            </Pressable>
          ))}
        </View>

        {showDesktopHeader ? (
          <View style={styles.selectedHeader}>
            <View style={styles.copy}>
              <TextInput
                onChangeText={setTitle}
                placeholder="New Event"
                placeholderTextColor={colors.inkMuted}
                style={styles.titleInput}
                value={title}
              />
              <AppText color={colors.inkMuted} variant="caption">{formatDateLabel(date)}</AppText>
            </View>
            <Pressable accessibilityRole="button" onPress={closeEventModal} style={styles.closeButton}>
              <Ionicons color={colors.ink} name="close" size={20} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.mobileTitleBlock}>
            <TextInput
              onChangeText={setTitle}
              placeholder="New Event"
              placeholderTextColor={colors.inkMuted}
              style={styles.titleInput}
              value={title}
            />
            <AppText color={colors.inkMuted} variant="caption">{formatDateLabel(date)}</AppText>
          </View>
        )}

        <View style={styles.categoryTabs}>
          {eventCategories.map((item) => (
            <Pressable key={item.category} onPress={() => setCategory(item.category)} style={[styles.categoryTab, category === item.category && styles.categoryTabActive]}>
              <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
              <AppText color={category === item.category ? colors.ink : colors.inkMuted} variant="caption">
                {item.label}
              </AppText>
            </Pressable>
          ))}
        </View>

        <View style={styles.popoverRow}>
          <Ionicons color={colors.inkMuted} name="location-outline" size={18} />
          <TextInput
            onChangeText={setLocation}
            placeholder="Add Location or Video Call"
            placeholderTextColor={colors.inkMuted}
            style={styles.rowInput}
            value={location}
          />
        </View>

        <View style={styles.dateBlock}>
          <View style={styles.dateLine}>
            <Ionicons color={colors.inkMuted} name="calendar-outline" size={18} />
            <AppText variant="body">{formatDateLabel(date)}</AppText>
            <Pressable accessibilityRole="button" onPress={() => setAllDay((value) => !value)} style={[styles.allDayToggle, allDay && styles.allDayToggleActive]}>
              <AppText color={allDay ? colors.surface : colors.ink} variant="caption">All-day</AppText>
            </Pressable>
          </View>
          <View style={styles.timeRow}>
            <TextInput
              editable={!allDay}
              onChangeText={setStartTime}
              placeholder="Start time"
              placeholderTextColor={colors.inkMuted}
              style={[styles.timeInput, phoneModal && styles.timeInputPhone, allDay && styles.inputDisabled]}
              value={startTime}
            />
            <TextInput
              editable={!allDay}
              onChangeText={setEndTime}
              placeholder="End time"
              placeholderTextColor={colors.inkMuted}
              style={[styles.timeInput, phoneModal && styles.timeInputPhone, allDay && styles.inputDisabled]}
              value={endTime}
            />
          </View>
        </View>

        <View style={styles.alertBlock}>
          <Ionicons color={colors.inkMuted} name="notifications-outline" size={18} />
          <View style={styles.alertContent}>
            <AppText variant="caption">Notification / reminder</AppText>
            <View style={styles.alertOptions}>
              {alertOptions.map((option) => (
                <Pressable
                  accessibilityRole="button"
                  key={option}
                  onPress={() => setAlertText(option === "None" ? "" : option)}
                  style={[styles.alertChip, (alertText || "None") === option && styles.alertChipActive]}
                >
                  <AppText color={(alertText || "None") === option ? colors.surface : colors.ink} variant="caption">
                    {option}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
        <View style={styles.popoverRow}>
          <Ionicons color={colors.inkMuted} name="document-attach-outline" size={18} />
          <TextInput
            multiline
            onChangeText={setNotes}
            placeholder="Add Notes, URL or Attachments"
            placeholderTextColor={colors.inkMuted}
            style={[styles.rowInput, styles.notesRowInput]}
            value={notes}
          />
        </View>
      </>
    );
  }

  return (
    <View style={styles.shell}>
      {phoneModal ? (
        <View style={styles.phoneCalendarToggle}>
          <Pressable onPress={() => setPhoneView("calendar")} style={[styles.phoneCalendarToggleButton, phoneView === "calendar" && styles.phoneCalendarToggleButtonActive]}>
            <AppText color={phoneView === "calendar" ? colors.surface : colors.ink} variant="caption">Calendar</AppText>
          </Pressable>
          <Pressable onPress={() => setPhoneView("day")} style={[styles.phoneCalendarToggleButton, phoneView === "day" && styles.phoneCalendarToggleButtonActive]}>
            <AppText color={phoneView === "day" ? colors.surface : colors.ink} variant="caption">Day</AppText>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.calendarWorkspace}>
      {(!phoneModal || phoneView === "calendar") ? (
      <View style={styles.calendarMonthPane}>
      <Card>
        <View style={styles.calendarHeader}>
          <Pressable accessibilityRole="button" onPress={() => shiftMonth(-1)} style={styles.arrowButton}>
            <Ionicons color={colors.ink} name="chevron-back" size={20} />
          </Pressable>
          <View style={styles.copy}>
            <AppText style={styles.monthTitle} variant="heading">{formatMonthTitle(visibleMonth)}</AppText>
            <AppText color={colors.inkMuted} variant="caption">{audience === "parent" ? "Child calendar" : "Homework, school and rewards"}</AppText>
          </View>
          <Pressable accessibilityRole="button" onPress={() => shiftMonth(1)} style={styles.arrowButton}>
            <Ionicons color={colors.ink} name="chevron-forward" size={20} />
          </Pressable>
        </View>
        <View style={styles.todayRow}>
          <Button label="Today" onPress={() => {
              setVisibleMonth(todayKey);
              setSelectedDate(todayKey);
              setDate(todayKey);
            }} style={compact ? styles.todayButtonCompact : undefined} variant="secondary" />
          <Button icon="add" label="Add event" onPress={() => openEventModal(selectedDate)} style={compact ? styles.todayButtonCompact : undefined} />
        </View>

        <View style={styles.weekdayRow}>
          {weekDays.map((day) => (
            <AppText color={colors.inkMuted} key={day} style={styles.weekdayLabel} variant="caption">
              {day}
            </AppText>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {monthDays.map((day) => {
            const dayEvents = displayEvents.filter((event) => isSameDay(event.date, day));
            const selected = isSameDay(day, selectedDate);
            const today = isSameDay(day, todayKey);
            const currentMonth = isSameMonth(day, visibleMonth);

            return (
              <Pressable
                accessibilityRole="button"
                key={day}
                onPress={() => selectCalendarDate(day)}
                style={[
                  styles.dayCell,
                  compact && styles.dayCellCompact,
                  !currentMonth && styles.dayCellMuted,
                  today && styles.dayCellToday,
                  selected && styles.dayCellSelected
                ]}
              >
                <View style={[styles.dayNumberBubble, today && !selected && styles.dayNumberToday, selected && styles.dayNumberSelected]}>
                  <AppText color={selected ? colors.surface : today ? colors.primaryDark : currentMonth ? colors.ink : colors.inkMuted} style={styles.dayNumber} variant="caption">
                    {formatDayNumber(day)}
                  </AppText>
                </View>
                {dayEvents.length > 0 ? (
                  <View style={styles.eventPreviewStack}>
                    {!compact && dayEvents[0] ? (
                      <View style={[styles.eventMiniPill, { backgroundColor: `${dayEvents[0].color}20` }]}>
                        <View style={[styles.eventDot, { backgroundColor: dayEvents[0].color }]} />
                        <AppText color={colors.ink} style={styles.eventMiniText} variant="caption">{dayEvents[0].title}</AppText>
                      </View>
                    ) : null}
                    <View style={styles.eventDots}>
                      {dayEvents.slice(0, compact ? 3 : 4).map((event) => (
                        <View key={event.id} style={[styles.eventDot, { backgroundColor: event.color }]} />
                      ))}
                      {dayEvents.length > (compact ? 3 : 4) ? <View style={styles.moreDot} /> : null}
                    </View>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </Card>
      </View>
      ) : null}

      {(!phoneModal || phoneView === "day") ? (
      <View style={styles.calendarDayPane}>
      <Card>
        <View style={styles.dayHeader}>
          <View style={styles.copy}>
            <AppText variant="heading">{formatLongDayLabel(selectedDate)}</AppText>
            <AppText color={colors.inkMuted} variant="caption">
              {dayStats.totalItems} tasks • {dayStats.completeItems} complete
            </AppText>
          </View>
          <Button icon="add" label="Add" onPress={() => openEventModal(selectedDate)} style={compact ? styles.addButtonCompact : undefined} variant="secondary" />
        </View>

        <View style={styles.daySummaryGrid}>
          <DaySummaryCard label="Points" value={`${dayStats.pointsEarned}`} />
          <DaySummaryCard label="Done" value={`${dayStats.completeItems}/${dayStats.totalItems}`} />
          <DaySummaryCard label="Streak" value={`${gameplay.state.child.streak}`} />
        </View>

        <View style={styles.dailyGoalCard}>
          <View style={styles.dailyGoalHeader}>
            <AppText variant="body">Daily goal</AppText>
            <AppText color={colors.inkMuted} variant="caption">{dayStats.pointsEarned} / {dailyGoalTarget} pts</AppText>
          </View>
          <View style={styles.dayProgressTrack}>
            <View style={[styles.dayProgressFill, { width: `${Math.min(100, Math.round((dayStats.pointsEarned / dailyGoalTarget) * 100))}%` }]} />
          </View>
        </View>

        <DayTimelineGrid
          items={dayTimelineItems}
          onEmptyTimePress={(timeSlot) => openEventModalAtTime(selectedDate, timeSlot)}
          onItemPress={(item) => item.source === "calendar" ? startEditById(item.sourceId) : setDetailItem(item)}
          selectedDate={selectedDate}
        />
      </Card>
      </View>
      ) : null}
      </View>

      {phoneModal && eventModalVisible ? (
        <View style={styles.phoneFrameEditor}>
          <SafeAreaView style={styles.mobileModalSafeArea}>
            <View style={styles.mobileModalHeader}>
              <Pressable accessibilityRole="button" onPress={closeEventModal} style={styles.mobileHeaderAction}>
                <AppText color={colors.primaryDark} variant="caption">Cancel</AppText>
              </Pressable>
              <AppText style={styles.mobileModalTitle} variant="body">New Event</AppText>
              <Pressable accessibilityRole="button" disabled={!title.trim()} onPress={saveEvent} style={styles.mobileHeaderAction}>
                <AppText color={title.trim() ? colors.primaryDark : colors.inkMuted} variant="caption">Save</AppText>
              </Pressable>
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={styles.mobileModalScroll}
              contentContainerStyle={styles.mobileModalContent}
            >
              {renderEventForm(false)}
            </ScrollView>
            <View style={styles.mobileModalFooter}>
              <Button label="Cancel" onPress={closeEventModal} style={styles.mobileFooterButton} variant="secondary" />
              <Button disabled={!title.trim()} icon="calendar" label="Save" onPress={saveEvent} style={styles.mobileFooterButton} />
            </View>
          </SafeAreaView>
        </View>
      ) : null}

      {!phoneModal ? (
        <Modal animationType="fade" transparent visible={eventModalVisible} onRequestClose={closeEventModal}>
          <View style={[styles.modalBackdrop, tabletModal && styles.modalBackdropTablet]}>
            <View style={[styles.eventModal, tabletModal && styles.eventModalTablet]}>
              <View style={styles.modalHandle} />
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                style={styles.desktopModalScroll}
                contentContainerStyle={styles.desktopModalContent}
              >
                {renderEventForm(true)}
              </ScrollView>
              <View style={styles.formActions}>
                <Button label="Cancel" onPress={closeEventModal} variant="quiet" />
                <Button disabled={!title.trim()} icon="calendar" label="Save" onPress={saveEvent} />
              </View>
            </View>
          </View>
        </Modal>
      ) : null}

      <Modal animationType="fade" transparent visible={Boolean(detailItem)} onRequestClose={() => setDetailItem(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.detailModal}>
            <View style={styles.dayHeader}>
              <View style={styles.copy}>
                <AppText variant="heading">{detailItem?.title}</AppText>
                <AppText color={colors.inkMuted} variant="caption">{detailItem?.time} • {detailItem ? formatTimelineStatus(detailItem.status) : ""}</AppText>
              </View>
              <Pressable accessibilityRole="button" onPress={() => setDetailItem(null)} style={styles.closeButton}>
                <Ionicons color={colors.ink} name="close" size={20} />
              </Pressable>
            </View>
            <AppText color={colors.inkMuted}>{detailItem?.detail}</AppText>
            {detailItem?.pointsValue ? <AppText color={colors.primaryDark}>+{detailItem.pointsValue} points</AppText> : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DaySummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.daySummaryCard}>
      <AppText style={styles.daySummaryValue} variant="body">{value}</AppText>
      <AppText color={colors.inkMuted} style={styles.daySummaryLabel} variant="caption">{label}</AppText>
    </View>
  );
}

function DayTimelineGrid({
  items,
  onEmptyTimePress,
  onItemPress,
  selectedDate
}: {
  items: DayTimelineItem[];
  onEmptyTimePress: (timeSlot: string) => void;
  onItemPress: (item: DayTimelineItem) => void;
  selectedDate: string;
}) {
  const hours = Array.from({ length: 12 }, (_, index) => index + 7);
  const hourHeight = 72;
  const timedItems = items.filter((item) => !item.allDay && item.time !== "All day");
  const allDayItems = items.filter((item) => item.allDay || item.time === "All day");

  return (
    <View style={styles.dayTimelineCalendar}>
      <View style={styles.dayTimelineTopBar}>
        <View style={styles.dayTimelineDateBadge}>
          <AppText color={colors.surface} style={styles.dayTimelineDateWeekday} variant="caption">
            {formatTimelineWeekday(selectedDate)}
          </AppText>
          <View style={styles.dayTimelineDateCircle}>
            <AppText color={colors.surface} style={styles.dayTimelineDateNumber} variant="body">
              {formatDayNumber(selectedDate)}
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.allDayRow}>
        <AppText color="#C7C7CC" style={styles.allDayLabel} variant="caption">all-day</AppText>
        <View style={styles.allDayContent}>
          {allDayItems.length === 0 ? <View style={styles.allDayEmptyLine} /> : null}
          {allDayItems.map((item) => (
            <Pressable
              accessibilityRole="button"
              key={item.id}
              onPress={() => onItemPress(item)}
              style={[styles.allDayEventPill, { backgroundColor: `${item.color}33`, borderColor: item.color }]}
            >
              <AppText color={item.color} numberOfLines={1} style={styles.allDayEventText} variant="caption">{item.title}</AppText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.hourGrid, { height: hours.length * hourHeight }]}>
        {hours.map((hour) => {
          const timeSlot = `${String(hour).padStart(2, "0")}:00`;
          return (
            <Pressable
              accessibilityRole="button"
              key={timeSlot}
              onPress={() => onEmptyTimePress(timeSlot)}
              style={[styles.hourRow, { height: hourHeight }]}
            >
              <AppText color="#C7C7CC" style={styles.hourLabel} variant="caption">{timeSlot}</AppText>
              <View style={styles.hourRule} />
            </Pressable>
          );
        })}

        <View pointerEvents="box-none" style={styles.timelineEventLayer}>
          {timedItems.map((item, index) => {
            const layout = getTimelineBlockLayout(item, hourHeight, index);
            return (
              <Pressable
                accessibilityRole="button"
                key={item.id}
                onPress={() => onItemPress(item)}
                style={[
                  styles.timelineBlock,
                  {
                    backgroundColor: getTimelineBlockBackground(item),
                    borderLeftColor: item.color,
                    height: layout.height,
                    left: layout.left,
                    top: layout.top,
                    width: layout.width
                  }
                ]}
              >
                <AppText color={getTimelineBlockTextColor(item)} numberOfLines={1} style={styles.timelineBlockTitle} variant="body">
                  {item.title}
                </AppText>
                <View style={styles.timelineBlockMeta}>
                  <Ionicons color={getTimelineBlockTextColor(item)} name="time-outline" size={13} />
                  <AppText color={getTimelineBlockTextColor(item)} numberOfLines={1} style={styles.timelineBlockTime} variant="caption">
                    {formatTimelineTimeRange(item)}
                  </AppText>
                </View>
                <AppText color={getTimelineBlockTextColor(item)} numberOfLines={1} style={styles.timelineBlockDetail} variant="caption">
                  {item.pointsValue > 0 ? `+${item.pointsValue} pts • ${formatTimelineStatus(item.status)}` : formatTimelineStatus(item.status)}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function getDayTimelineItems(gameplay: ReturnType<typeof useGameplay>, displayEvents: CalendarDisplayEvent[], selectedDate: string): DayTimelineItem[] {
  const eventItems: DayTimelineItem[] = displayEvents
    .filter((event) => isSameDay(event.date, selectedDate))
    .map((event) => ({
      allDay: event.allDay,
      category: event.category,
      color: event.color,
      detail: event.notes || getCategoryConfig(event.category).label,
      endTime: event.endTime,
      id: event.id,
      pointsValue: event.type === "homework" ? 5 : event.type === "revision" ? 10 : 0,
      source: event.source,
      sourceId: event.sourceId,
      status: getEventTimelineStatus(event, selectedDate),
      time: formatDisplayTime(event.startTime || event.time),
      title: event.title
    }));
  const taskItems: DayTimelineItem[] = gameplay.childTasks
    .filter(({ assignment }) => assignment.dueDate === selectedDate || assignment.completedAt?.slice(0, 10) === selectedDate)
    .map(({ assignment, submission, task }, index) => ({
      allDay: false,
      category: task.category === "school" ? "school" : "custom",
      color: task.category === "school" ? "#0A84FF" : "#8E8E93",
      detail: task.description || "Task",
      endTime: null,
      id: `task-${assignment.id}`,
      pointsValue: task.pointValue,
      source: "task" as const,
      sourceId: assignment.id,
      status: getTaskTimelineStatus(assignment.status, submission?.status ?? null),
      time: assignment.completedAt ? formatShortTime(assignment.completedAt) : `${String(9 + index).padStart(2, "0")}:00`,
      title: task.title
    }));
  const homeworkCompletedItems: DayTimelineItem[] = gameplay.state.homeworkItems
    .filter((item) => !item.deletedAt && item.completedDate?.slice(0, 10) === selectedDate)
    .map((item) => ({
      allDay: false,
      category: "homework" as const,
      color: getCategoryConfig("homework").color,
      detail: "Completed homework",
      endTime: null,
      id: `homework-completed-${item.id}`,
      pointsValue: 5,
      source: "homework" as const,
      sourceId: item.id,
      status: "approved" as const,
      time: item.completedAt ? formatShortTime(item.completedAt) : "17:00",
      title: item.description || item.title || "Homework completed"
    }));
  const revisionItems: DayTimelineItem[] = gameplay.state.homeworkSessions
    .filter((session) => !session.deletedAt && session.startedAt.slice(0, 10) === selectedDate)
    .map((session) => ({
      allDay: false,
      category: "revision" as const,
      color: getCategoryConfig("revision").color,
      detail: session.notes || `${session.durationMinutes} mins revision`,
      endTime: addMinutesToTime(formatShortTime(session.startedAt), session.durationMinutes),
      id: `revision-${session.id}`,
      pointsValue: Math.max(5, Math.round(session.durationMinutes / 3)),
      source: "revision" as const,
      sourceId: session.id,
      status: "approved" as const,
      time: formatShortTime(session.startedAt),
      title: `Revision session ${session.durationMinutes} mins`
    }));

  return dedupeTimelineItems([...eventItems, ...taskItems, ...homeworkCompletedItems, ...revisionItems]).sort(
    (first, second) => getSortTime(first.time) - getSortTime(second.time)
  );
}

function getDayStats(gameplay: ReturnType<typeof useGameplay>, items: DayTimelineItem[], selectedDate: string) {
  const pointsEarned = gameplay.state.pointsTransactions
    .filter((transaction) => transaction.amount > 0 && isSameDay(transaction.createdAt, selectedDate))
    .reduce((total, transaction) => total + transaction.amount, 0);

  return {
    completeItems: items.filter((item) => item.status === "approved").length,
    pointsEarned,
    totalItems: items.length
  };
}

function dedupeTimelineItems(items: DayTimelineItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.source}-${item.sourceId}-${item.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getCalendarDisplayEvents(gameplay: ReturnType<typeof useGameplay>): CalendarDisplayEvent[] {
  const calendarEvents = gameplay.state.calendarEvents
    .filter((event) => !event.deletedAt)
    .map((event) => ({
      alert: event.alert,
      allDay: event.allDay,
      category: event.category ?? getCategoryFromType(event.type),
      color: event.color || getCategoryConfig(event.category ?? getCategoryFromType(event.type)).color,
      date: event.date,
      endTime: event.endTime,
      id: `calendar-${event.id}`,
      kind: event.kind ?? "event",
      location: event.location,
      notes: event.notes,
      repeat: event.repeat,
      source: "calendar" as const,
      sourceId: event.id,
      startTime: event.startTime ?? event.time,
      subject: event.subject,
      time: event.time,
      title: event.title,
      type: event.type
    }));

  const homeworkEvents = gameplay.state.homeworkItems
    .filter((item) => !item.deletedAt && item.dueDate)
    .map((item: HomeworkItem) => ({
      alert: null,
      allDay: true,
      category: "homework" as const,
      color: getCategoryConfig("homework").color,
      date: item.dueDate.slice(0, 10),
      endTime: null,
      id: `homework-${item.id}`,
      kind: "event" as const,
      location: null,
      notes: item.description,
      repeat: null,
      source: "homework" as const,
      sourceId: item.id,
      startTime: null,
      subject: item.subject || null,
      time: null,
      title: item.title || item.description || "Homework due",
      type: "homework" as const
    }));

  const rewardGoalEvents = gameplay.state.rewardRequests
    .filter((request) => request.status === "approved_goal" && (request.deadlineDate || request.eventDate))
    .map((request: RewardRequest) => ({
      alert: null,
      allDay: true,
      category: "reward_goal" as const,
      color: getCategoryConfig("reward_goal").color,
      date: (request.deadlineDate ?? request.eventDate ?? "").slice(0, 10),
      endTime: null,
      id: `reward-goal-${request.id}`,
      kind: "event" as const,
      location: null,
      notes: request.conditions,
      repeat: null,
      source: "reward_goal" as const,
      sourceId: request.id,
      startTime: null,
      subject: null,
      time: null,
      title: request.title,
      type: "reward_goal" as const
    }));

  return [...calendarEvents, ...homeworkEvents, ...rewardGoalEvents].sort((first, second) => first.date.localeCompare(second.date));
}

function getMonthDays(anchorDate: string) {
  const date = new Date(`${anchorDate.slice(0, 10)}T12:00:00.000Z`);
  const first = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 12));
  const start = getStartOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

function addMonths(dateKey: string, months: number) {
  const date = new Date(`${dateKey.slice(0, 10)}T12:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() + months, 1);
  return date.toISOString().slice(0, 10);
}

function formatMonthTitle(dateKey: string) {
  return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date(`${dateKey.slice(0, 10)}T12:00:00.000Z`));
}

function formatDayLabel(dateKey: string) {
  const date = new Date(`${dateKey.slice(0, 10)}T12:00:00.000Z`);
  return new Intl.DateTimeFormat(undefined, { day: "numeric", weekday: "short" }).format(date);
}

function formatDayNumber(dateKey: string) {
  const date = new Date(`${dateKey.slice(0, 10)}T12:00:00.000Z`);
  return new Intl.DateTimeFormat(undefined, { day: "numeric" }).format(date);
}

function isSameMonth(dateKey: string, monthKey: string) {
  return dateKey.slice(0, 7) === monthKey.slice(0, 7);
}

function formatHomeworkStatus(status: HomeworkItem["status"]) {
  if (status === "completed") return "Complete";
  if (status === "in_progress") return "In progress";
  if (status === "incomplete") return "Incomplete";
  if (status === "not_applicable") return "N/A";
  return "Not started";
}

function getEventIcon(type: CalendarEventType): keyof typeof Ionicons.glyphMap {
  if (type === "homework") return "book";
  if (type === "revision") return "timer";
  if (type === "reward_goal") return "gift";
  if (type === "school_event") return "school";
  if (type === "subject") return "library";
  return "calendar";
}

function getCategoryConfig(category: CalendarEventCategory) {
  if (category === "reward_goal") {
    return { category, color: "#AF52DE", label: "Reward goal", type: "reward_goal" as const };
  }

  return eventCategories.find((item) => item.category === category) ?? defaultEventCategory;
}

function getCategoryFromType(type: CalendarEventType): CalendarEventCategory {
  if (type === "homework") return "homework";
  if (type === "revision") return "revision";
  if (type === "reward_goal") return "reward_goal";
  if (type === "school_event" || type === "subject") return "school";
  return "custom";
}

function getEventTimelineStatus(event: CalendarDisplayEvent, selectedDate: string): DayTimelineStatus {
  const todayKey = new Date().toISOString().slice(0, 10);
  if (event.source === "homework" && event.date < todayKey) return "incomplete";
  if (event.date > todayKey || selectedDate > todayKey) return "upcoming";
  if (event.source === "homework") return "pending";
  return "upcoming";
}

function getTaskTimelineStatus(status: string, submissionStatus: string | null): DayTimelineStatus {
  if (status === "approved" || submissionStatus === "approved") return "approved";
  if (status === "submitted" || submissionStatus === "pending") return "pending";
  if (status === "rejected") return "incomplete";
  return "upcoming";
}

function formatTimelineStatus(status: DayTimelineStatus) {
  if (status === "approved") return "approved";
  if (status === "pending") return "pending approval";
  if (status === "incomplete") return "incomplete";
  return "upcoming";
}

function formatTimelineWeekday(dateKey: string) {
  return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(new Date(`${dateKey}T12:00:00.000Z`));
}

function getTimelineBlockLayout(item: DayTimelineItem, hourHeight: number, index: number) {
  const startMinute = parseTimeToMinutes(item.time) ?? 7 * 60;
  const endMinute = parseTimeToMinutes(item.endTime ?? "") ?? startMinute + 60;
  const startOffset = Math.max(0, startMinute - 7 * 60);
  const duration = Math.max(30, endMinute - startMinute);
  const laneOffset = index % 2 === 0 ? 0 : 10;
  const width = laneOffset ? "68%" as const : "72%" as const;

  return {
    height: Math.max(56, (duration / 60) * hourHeight - 6),
    left: 92 + laneOffset,
    top: (startOffset / 60) * hourHeight + 4,
    width
  };
}

function getTimelineBlockBackground(item: DayTimelineItem) {
  if (item.status === "approved") return `${colors.primary}2E`;
  if (item.status === "pending") return `${item.color}26`;
  if (item.status === "incomplete") return "rgba(148, 163, 184, 0.26)";
  return `${item.color}20`;
}

function getTimelineBlockTextColor(item: DayTimelineItem) {
  if (item.status === "incomplete") return "#CBD5E1";
  if (item.status === "approved") return colors.primary;
  return item.color;
}

function formatTimelineTimeRange(item: DayTimelineItem) {
  const start = item.time === "All day" ? "All day" : item.time;
  const end = item.endTime ? formatDisplayTime(item.endTime) : null;
  return end && start !== "All day" ? `${start} – ${end}` : start;
}

function getTimelineStatusColor(status: DayTimelineStatus) {
  if (status === "approved") return "#16A34A";
  if (status === "pending") return "#94A3B8";
  if (status === "incomplete") return "#DC2626";
  return "#64748B";
}

function getTimelineStatusIcon(status: DayTimelineStatus): keyof typeof Ionicons.glyphMap {
  if (status === "approved") return "checkmark";
  if (status === "pending") return "hourglass";
  if (status === "incomplete") return "close";
  return "ellipse";
}

function getTimelineRowStyle(status: DayTimelineStatus) {
  if (status === "approved") return styles.approvedTimelineRow;
  if (status === "pending") return styles.pendingTimelineRow;
  if (status === "incomplete") return styles.incompleteTimelineRow;
  return styles.upcomingTimelineRow;
}

function formatLongDayLabel(dateKey: string) {
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "long", weekday: "long" }).format(new Date(`${dateKey}T12:00:00.000Z`));
}

function formatShortTime(dateTime: string) {
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", hour12: false, minute: "2-digit" }).format(new Date(dateTime));
}

function formatDisplayTime(time: string | null | undefined) {
  if (!time) return "All day";
  const match = time.trim().match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (!match) return time;

  let hour = Number(match[1]);
  const minute = Number(match[2] ?? 0);

  if (hour > 0 && hour < 7) {
    hour += 12;
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function addMinutesToTime(time: string, minutesToAdd: number) {
  const minutes = parseTimeToMinutes(time);
  if (minutes === null) return null;
  const nextMinutes = minutes + minutesToAdd;
  const hour = Math.floor(nextMinutes / 60);
  const minute = nextMinutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function parseTimeToMinutes(time: string | null | undefined) {
  if (!time || time === "All day" || time === "Completed") return null;
  const match = time.trim().match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2] ?? 0);

  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  if (hour > 0 && hour < 7) hour += 12;

  return hour * 60 + minute;
}

function getSortTime(time: string) {
  return parseTimeToMinutes(time) ?? 0;
}

const styles = StyleSheet.create({
  addButtonCompact: {
    minWidth: 72,
    paddingHorizontal: spacing.sm
  },
  alertBlock: {
    alignItems: "flex-start",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 48,
    padding: spacing.md
  },
  alertChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  alertChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark
  },
  alertContent: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 0
  },
  alertOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  arrowButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  calendarHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  calendarDayPane: {
    flexBasis: 340,
    flexGrow: 1,
    minWidth: 0
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  calendarMonthPane: {
    flexBasis: 420,
    flexGrow: 1.25,
    minWidth: 0
  },
  calendarWorkspace: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
    width: "100%"
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0
  },
  dayCell: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: 48,
    flexGrow: 1,
    gap: spacing.xs,
    minHeight: 72,
    minWidth: 44,
    padding: spacing.xs
  },
  dayCellCompact: {
    flexBasis: "13.5%",
    flexGrow: 0,
    minWidth: 0,
    paddingHorizontal: 2
  },
  dayCellSelected: {
    backgroundColor: "#F3FBF7",
    borderColor: colors.primary
  },
  dayCellMuted: {
    backgroundColor: "#FAFAFB"
  },
  dayCellToday: {
    borderColor: colors.primaryDark
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 16,
    textAlign: "center"
  },
  dayNumberBubble: {
    alignItems: "center",
    borderRadius: 999,
    height: 26,
    justifyContent: "center",
    width: 26
  },
  dayNumberSelected: {
    backgroundColor: colors.primary
  },
  dayNumberToday: {
    backgroundColor: "#EAFBF2"
  },
  dayLabel: {
    fontSize: 12,
    lineHeight: 15,
    textAlign: "center"
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  allDayToggle: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  allDayToggleActive: {
    backgroundColor: colors.primary
  },
  allDayContent: {
    flex: 1,
    gap: 6,
    minHeight: 38,
    minWidth: 0,
    paddingRight: spacing.sm
  },
  allDayEmptyLine: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 999,
    height: 2,
    marginTop: 18
  },
  allDayEventPill: {
    borderLeftWidth: 4,
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: spacing.sm
  },
  allDayEventText: {
    fontSize: 12,
    fontWeight: "800"
  },
  allDayLabel: {
    fontSize: 14,
    fontWeight: "800",
    paddingTop: 7,
    width: 82
  },
  allDayRow: {
    borderBottomColor: "rgba(255, 255, 255, 0.16)",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  categoryDot: {
    borderRadius: 999,
    height: 9,
    width: 9
  },
  categoryTab: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  categoryTabActive: {
    backgroundColor: colors.surface,
    borderColor: colors.primary
  },
  categoryTabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  dateBlock: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  dateLine: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  dailyGoalCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  dailyGoalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  dayHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  dayProgressFill: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: "100%"
  },
  dayProgressTrack: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    height: 12,
    overflow: "hidden"
  },
  daySummaryCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    minWidth: 86,
    padding: spacing.sm
  },
  daySummaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  daySummaryLabel: {
    fontSize: 12
  },
  daySummaryValue: {
    fontSize: 18,
    fontWeight: "800"
  },
  dayTimelineCalendar: {
    backgroundColor: "#1F1F1F",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden"
  },
  dayTimelineDateBadge: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center"
  },
  dayTimelineDateCircle: {
    alignItems: "center",
    backgroundColor: "#FF5A66",
    borderRadius: 999,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  dayTimelineDateNumber: {
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 28
  },
  dayTimelineDateWeekday: {
    fontSize: 24,
    lineHeight: 30
  },
  dayTimelineTopBar: {
    alignItems: "center",
    borderBottomColor: "rgba(255, 255, 255, 0.16)",
    borderBottomWidth: 1,
    justifyContent: "center",
    minHeight: 66,
    paddingHorizontal: spacing.md
  },
  detailModal: {
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: spacing.md,
    maxWidth: 420,
    padding: spacing.lg,
    width: "90%"
  },
  emptySlot: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 10,
    borderStyle: "dashed",
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.sm
  },
  emptySlotList: {
    gap: spacing.sm
  },
  eventActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    width: "100%"
  },
  eventActionButtonCompact: {
    flexBasis: 0,
    flexGrow: 1,
    minWidth: 0,
    paddingHorizontal: spacing.sm
  },
  eventDot: {
    borderRadius: 999,
    height: 6,
    width: 6
  },
  eventDetailsButton: {
    alignItems: "flex-start",
    flex: 1,
    flexDirection: "row",
    gap: spacing.md,
    minWidth: 0
  },
  eventDots: {
    flexDirection: "row",
    gap: 3
  },
  eventMiniPill: {
    alignItems: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: 4,
    maxWidth: "100%",
    paddingHorizontal: 5,
    paddingVertical: 2
  },
  eventMiniText: {
    flexShrink: 1,
    fontSize: 10,
    lineHeight: 12
  },
  eventModal: {
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    elevation: 18,
    gap: spacing.md,
    maxHeight: "88%",
    maxWidth: 680,
    padding: spacing.lg,
    shadowColor: colors.ink,
    shadowOffset: { height: 18, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    width: "72%"
  },
  eventModalPhone: {
    alignSelf: "stretch",
    borderColor: "transparent",
    borderRadius: 0,
    borderWidth: 0,
    elevation: 0,
    flex: 1,
    gap: 0,
    height: "100%",
    maxHeight: "100%",
    maxWidth: "100%",
    padding: 0,
    shadowOpacity: 0,
    width: "100%"
  },
  eventModalTablet: {
    maxWidth: 680,
    width: "90%"
  },
  eventPreviewStack: {
    alignItems: "center",
    gap: 3,
    width: "100%"
  },
  eventIcon: {
    alignItems: "center",
    borderRadius: 8,
    height: 38,
    justifyContent: "center",
    width: 38
  },
  eventRow: {
    alignItems: "flex-start",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    padding: spacing.md
  },
  eventRowCompact: {
    gap: spacing.sm,
    padding: spacing.sm
  },
  formActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "flex-end"
  },
  desktopModalContent: {
    gap: spacing.md,
    paddingBottom: spacing.sm
  },
  desktopModalScroll: {
    maxHeight: 620
  },
  formField: {
    flexBasis: 150,
    flexGrow: 1
  },
  formFieldCompact: {
    flexBasis: "100%"
  },
  formRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  hourGrid: {
    position: "relative"
  },
  hourLabel: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 18,
    width: 72
  },
  hourRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm
  },
  hourRule: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    flex: 1,
    height: 1,
    marginTop: 9
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
  inputDisabled: {
    opacity: 0.42
  },
  linkedDetail: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.xs,
    marginTop: spacing.sm,
    padding: spacing.sm
  },
  modalBackdrop: {
    backgroundColor: "rgba(15, 23, 42, 0.16)",
    flex: 1,
    justifyContent: "center",
    padding: spacing.md
  },
  modalBackdropPhone: {
    backgroundColor: colors.surface,
    justifyContent: "flex-start",
    padding: 0
  },
  modalBackdropTablet: {
    padding: spacing.lg
  },
  modalHandle: {
    alignSelf: "center",
    backgroundColor: colors.border,
    borderRadius: 999,
    height: 4,
    width: 44
  },
  mobileFooterButton: {
    flexBasis: 0,
    flexGrow: 1,
    minWidth: 0
  },
  mobileHeaderAction: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    minWidth: 68,
    paddingHorizontal: spacing.sm
  },
  mobileModalContent: {
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: spacing.xl
  },
  mobileModalFooter: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md
  },
  mobileModalHeader: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 56,
    paddingHorizontal: spacing.sm
  },
  mobileModalSafeArea: {
    backgroundColor: colors.surface,
    flex: 1,
    width: "100%"
  },
  mobileModalScroll: {
    flex: 1,
    minHeight: 0
  },
  mobileModalTitle: {
    flex: 1,
    fontWeight: "800",
    textAlign: "center"
  },
  mobileTitleBlock: {
    gap: spacing.xs,
    minWidth: 0
  },
  monthTitle: {
    textAlign: "center"
  },
  monthActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  monthButtonCompact: {
    flexBasis: 0,
    flexGrow: 1,
    minWidth: 0,
    paddingHorizontal: spacing.sm
  },
  moreDot: {
    backgroundColor: colors.inkMuted,
    borderRadius: 999,
    height: 4,
    width: 4
  },
  notesInput: {
    minHeight: 88,
    paddingTop: spacing.md,
    textAlignVertical: "top"
  },
  notesRowInput: {
    minHeight: 62,
    paddingTop: 0,
    textAlignVertical: "top"
  },
  popoverRow: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md
  },
  phoneCalendarToggle: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    padding: 4
  },
  phoneCalendarToggleButton: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    justifyContent: "center",
    minHeight: 42
  },
  phoneCalendarToggleButtonActive: {
    backgroundColor: colors.primary
  },
  phoneFrameEditor: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    bottom: 0,
    elevation: 18,
    left: 0,
    maxHeight: 820,
    minHeight: 640,
    overflow: "hidden",
    position: "absolute",
    right: 0,
    shadowColor: colors.ink,
    shadowOffset: { height: 18, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    top: 0,
    zIndex: 80
  },
  rowInput: {
    color: colors.ink,
    flex: 1,
    fontSize: 15,
    minHeight: 44,
    minWidth: 0
  },
  segmentButton: {
    alignItems: "center",
    borderRadius: 8,
    flex: 1,
    minHeight: 36,
    justifyContent: "center"
  },
  segmentButtonActive: {
    backgroundColor: colors.surface
  },
  segmentLabel: {
    fontWeight: "800"
  },
  segmentedControl: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    flexDirection: "row",
    gap: 2,
    padding: 3
  },
  shell: {
    gap: spacing.lg,
    position: "relative"
  },
  approvedTimelineRow: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0"
  },
  incompleteTimelineRow: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA"
  },
  pendingTimelineRow: {
    backgroundColor: colors.surfaceMuted
  },
  selectedHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4
  },
  timeInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.ink,
    flexBasis: 120,
    flexGrow: 1,
    fontSize: 15,
    minHeight: 44,
    paddingHorizontal: spacing.md
  },
  timeInputPhone: {
    flexBasis: "100%",
    width: "100%"
  },
  timeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  timelineBlock: {
    borderLeftWidth: 4,
    borderRadius: 8,
    justifyContent: "center",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    position: "absolute"
  },
  timelineBlockDetail: {
    fontSize: 11,
    opacity: 0.72
  },
  timelineBlockMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  },
  timelineBlockTime: {
    fontSize: 12,
    fontWeight: "800"
  },
  timelineBlockTitle: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  timelineEventLayer: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  timelineList: {
    gap: spacing.sm
  },
  timelineRow: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm
  },
  timelineStatusIcon: {
    alignItems: "center",
    borderRadius: 999,
    height: 24,
    justifyContent: "center",
    width: 24
  },
  timelineTime: {
    width: 52
  },
  titleInput: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "800",
    minHeight: 36,
    minWidth: 0
  },
  todayButtonCompact: {
    flexBasis: 0,
    flexGrow: 1,
    minWidth: 0,
    paddingHorizontal: spacing.sm
  },
  todayRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between",
    marginTop: spacing.md
  },
  upcomingTimelineRow: {
    backgroundColor: colors.surface
  },
  typeChip: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  typeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  weekdayLabel: {
    flexBasis: "14.285%",
    flexGrow: 0,
    fontWeight: "800",
    textAlign: "center"
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: spacing.sm,
    marginTop: spacing.lg
  }
});
