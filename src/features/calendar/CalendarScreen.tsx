import { useMemo, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";

import { AgendaList } from "@/features/calendar/AgendaList";
import { CalendarDayAgenda } from "@/features/calendar/CalendarDayAgenda";
import { CalendarHeader } from "@/features/calendar/CalendarHeader";
import { CalendarLegend } from "@/features/calendar/CalendarLegend";
import { CalendarMonthGrid } from "@/features/calendar/CalendarMonthGrid";
import { CalendarShell } from "@/features/calendar/CalendarShell";
import { EventFormModal } from "@/features/calendar/EventFormModal";
import { WeekStrip } from "@/features/calendar/WeekStrip";
import { CalendarAudience, CalendarFormState, CalendarItem } from "@/features/calendar/calendarTypes";
import { calendarCategoryTheme } from "@/features/calendar/calendarTheme";
import {
  combineLocalDateTime,
  createDefaultFormState,
  createFormStateFromEvent,
  formatMonthTitle,
  getDateKey,
  getEventsForDateFromGroups,
  groupEventsByDate,
  shiftMonth,
  shiftWeek,
  sortEvents,
  todayKey,
  toCalendarItems
} from "@/features/calendar/calendarUtils";
import { useGameplay } from "@/features/gameplay/GameplayContext";
import { usePreviewMode } from "@/shared/components/PreviewModeContext";
import { spacing } from "@/shared/theme";
import { addDays } from "@/shared/utils/date";

type CalendarScreenProps = {
  audience: CalendarAudience;
};

export function CalendarScreen({ audience }: CalendarScreenProps) {
  const gameplay = useGameplay();
  const { mode } = usePreviewMode();
  const { width } = useWindowDimensions();
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarItem | null>(null);
  const [form, setForm] = useState<CalendarFormState>(() => createDefaultFormState(todayKey()));

  const events = useMemo(
    () =>
      toCalendarItems({
        calendarEvents: gameplay.state.calendarEvents,
        homeworkItems: gameplay.state.homeworkItems,
        rewardRequests: gameplay.state.rewardRequests,
        taskItems: gameplay.childTasks
      }),
    [gameplay.childTasks, gameplay.state.calendarEvents, gameplay.state.homeworkItems, gameplay.state.rewardRequests]
  );

  const eventsByDate = useMemo(() => groupEventsByDate(events), [events]);
  const selectedEvents = useMemo(() => sortEvents(getEventsForDateFromGroups(eventsByDate, selectedDate)), [eventsByDate, selectedDate]);
  const nextDate = useMemo(() => addDays(selectedDate, 1), [selectedDate]);
  const nextEvents = useMemo(() => sortEvents(getEventsForDateFromGroups(eventsByDate, nextDate)), [eventsByDate, nextDate]);
  const monthTitle = useMemo(() => formatMonthTitle(selectedDate), [selectedDate]);
  const pointsEarned = useMemo(
    () => selectedEvents.reduce((total, event) => total + (event.category === "revision" ? event.pointsOnComplete ?? 0 : 0), 0),
    [selectedEvents]
  );
  const layoutMode = mode === "phone" || width < 768 ? "mobile" : width >= 1024 ? "desktop" : "tablet";

  function openNewEvent(date = selectedDate) {
    setEditingEvent(null);
    setForm(createDefaultFormState(date));
    setModalVisible(true);
  }

  function openNewEventAtTime(time: string) {
    setEditingEvent(null);
    setForm({ ...createDefaultFormState(selectedDate), startTime: time });
    setModalVisible(true);
  }

  function openExistingEvent(event: CalendarItem) {
    if (!event.editable) {
      return;
    }

    setEditingEvent(event);
    setForm(createFormStateFromEvent(event));
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    setEditingEvent(null);
    setForm(createDefaultFormState(selectedDate));
  }

  function saveEvent() {
    const title = form.title.trim();
    if (!title) {
      return;
    }

    const date = form.date.trim().slice(0, 10) || selectedDate;
    const startAt = combineLocalDateTime(date, form.startTime);
    const endAt = combineLocalDateTime(date, form.endTime);
    const theme = calendarCategoryTheme[form.category];
    const pointsValue = form.category === "revision" ? Math.max(0, Number(form.pointsOnComplete) || 0) : 0;

    if (editingEvent) {
      gameplay.updateCalendarEvent({
        allDay: false,
        category: form.category,
        color: theme.text,
        date,
        endTime: getDateTimeTime(endAt),
        eventId: editingEvent.sourceId,
        kind: "event",
        location: null,
        notes: form.notes,
        pointsValue,
        repeat: form.repeat === "none" ? null : form.repeat,
        requiresEvidence: form.category === "revision" ? form.requiresEvidence : false,
        startTime: getDateTimeTime(startAt),
        subject: null,
        time: getDateTimeTime(startAt),
        title,
        type: form.category
      });
    } else {
      gameplay.createCalendarEvent({
        allDay: false,
        category: form.category,
        color: theme.text,
        date,
        endTime: getDateTimeTime(endAt),
        kind: "event",
        location: null,
        notes: form.notes,
        pointsValue,
        repeat: form.repeat === "none" ? null : form.repeat,
        requiresEvidence: form.category === "revision" ? form.requiresEvidence : false,
        startTime: getDateTimeTime(startAt),
        subject: null,
        time: getDateTimeTime(startAt),
        title,
        type: form.category
      });
    }

    setSelectedDate(date);
    closeModal();
  }

  function deleteEvent() {
    if (!editingEvent?.editable) {
      return;
    }

    gameplay.deleteCalendarEvent(editingEvent.sourceId);
    closeModal();
  }

  function selectDate(date: string) {
    setSelectedDate(getDateKey(date));
  }

  function moveWeek(weeks: number) {
    setSelectedDate((current) => shiftWeek(current, weeks));
  }

  function moveMonth(months: number) {
    setSelectedDate((current) => shiftMonth(current, months));
  }

  function goToday() {
    setSelectedDate(todayKey());
  }

  const modal = (
    <EventFormModal
      canDelete={Boolean(editingEvent?.editable)}
      form={form}
      onChange={setForm}
      onClose={closeModal}
      onDelete={deleteEvent}
      onSave={saveEvent}
      visible={modalVisible}
    />
  );

  if (layoutMode === "desktop") {
    return (
      <View style={styles.desktopShell}>
        <View style={styles.desktopGrid}>
          <View style={styles.monthColumn}>
            <CalendarMonthGrid
              eventsByDate={eventsByDate}
              onAddEvent={() => openNewEvent(selectedDate)}
              onNextMonth={() => moveMonth(1)}
              onPreviousMonth={() => moveMonth(-1)}
              onSelectDate={selectDate}
              onToday={goToday}
              selectedDate={selectedDate}
            />
          </View>
          <View style={styles.dayColumn}>
            <CalendarDayAgenda
              events={selectedEvents}
              onAddEvent={() => openNewEvent(selectedDate)}
              onAddTime={openNewEventAtTime}
              onEventPress={openExistingEvent}
              pointsEarned={pointsEarned}
              selectedDate={selectedDate}
              streak={gameplay.state.child.streak}
            />
          </View>
        </View>
        {modal}
      </View>
    );
  }

  return (
    <CalendarShell>
      <CalendarHeader
        monthTitle={monthTitle}
        onAdd={() => openNewEvent(selectedDate)}
        onNextWeek={() => moveWeek(1)}
        onPreviousWeek={() => moveWeek(-1)}
      />
      <WeekStrip eventsByDate={eventsByDate} onSelectDate={selectDate} onShiftWeek={moveWeek} selectedDate={selectedDate} />
      <AgendaList
        nextDate={nextDate}
        nextEvents={nextEvents}
        onEventPress={openExistingEvent}
        selectedDate={selectedDate}
        selectedEvents={selectedEvents}
      />
      <CalendarLegend />
      <EventFormModal
        canDelete={Boolean(editingEvent?.editable)}
        form={form}
        onChange={setForm}
        onClose={closeModal}
        onDelete={deleteEvent}
        onSave={saveEvent}
        visible={modalVisible}
      />
    </CalendarShell>
  );
}

function getDateTimeTime(value: string) {
  return value.slice(11, 16);
}

const styles = StyleSheet.create({
  dayColumn: {
    flexBasis: 420,
    flexGrow: 0.9,
    minWidth: 0
  },
  desktopGrid: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.xl,
    width: "100%"
  },
  desktopShell: {
    alignSelf: "center",
    maxWidth: 1120,
    width: "100%"
  },
  monthColumn: {
    flexBasis: 460,
    flexGrow: 1,
    minWidth: 0
  }
});
