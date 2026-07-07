import { CalendarEvent, HomeworkItem, RewardRequest, Task, TaskAssignment } from "@/domain";
import { CalendarCategory, CalendarFormState, CalendarItem, CalendarRepeat } from "@/features/calendar/calendarTypes";
import { addDays, getStartOfWeek } from "@/shared/utils/date";

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function getWeekDates(dateKey: string) {
  const weekStart = getStartOfWeek(`${dateKey.slice(0, 10)}T12:00:00.000Z`);
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

export function shiftWeek(dateKey: string, weeks: number) {
  return addDays(dateKey, weeks * 7);
}

export function shiftMonth(dateKey: string, months: number) {
  const date = new Date(`${dateKey.slice(0, 10)}T12:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() + months, 1);
  return date.toISOString().slice(0, 10);
}

export function getMonthGridDates(dateKey: string) {
  const date = new Date(`${dateKey.slice(0, 10)}T12:00:00.000Z`);
  const firstOfMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 12));
  const start = getStartOfWeek(firstOfMonth);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

export function getDateKey(value: string) {
  return value.slice(0, 10);
}

export function getTimeKey(value: string | null | undefined, fallback = "09:00") {
  if (!value) return fallback;
  const timeMatch = value.match(/^(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    return `${timeMatch[1]?.padStart(2, "0")}:${timeMatch[2]}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit"
  }).format(date);
}

export function combineLocalDateTime(dateKey: string, timeKey: string) {
  const safeDate = dateKey.trim().slice(0, 10) || todayKey();
  const safeTime = normaliseTime(timeKey) || "09:00";
  return `${safeDate}T${safeTime}:00.000`;
}

export function normaliseTime(value: string) {
  const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (!match) return "";
  const hour = Math.min(23, Math.max(0, Number(match[1])));
  const minute = Math.min(59, Math.max(0, Number(match[2] ?? 0)));
  if (Number.isNaN(hour) || Number.isNaN(minute)) return "";
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function formatMonthTitle(dateKey: string) {
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(new Date(`${dateKey.slice(0, 10)}T12:00:00.000Z`));
}

export function formatWeekdayInitial(dateKey: string) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(new Date(`${dateKey.slice(0, 10)}T12:00:00.000Z`)).slice(0, 1);
}

export function formatDayNumber(dateKey: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric" }).format(new Date(`${dateKey.slice(0, 10)}T12:00:00.000Z`));
}

export function formatAgendaDayLabel(dateKey: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", weekday: "long" }).format(new Date(`${dateKey.slice(0, 10)}T12:00:00.000Z`)).toUpperCase();
}

export function formatDisplayTime(value: string) {
  return getTimeKey(value);
}

export function getDurationLabel(startAt: string, endAt: string) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  if (!minutes) return null;
  if (minutes === 60) return "1 hour";
  if (minutes % 60 === 0) return `${minutes / 60} hours`;
  return `${minutes} minutes`;
}

export function groupEventsByDate(events: CalendarItem[]) {
  return events.reduce<Record<string, CalendarItem[]>>((groups, event) => {
    const date = getDateKey(event.startAt);
    groups[date] = [...(groups[date] ?? []), event];
    return groups;
  }, {});
}

export function sortEvents(events: CalendarItem[]) {
  return [...events].sort((first, second) => first.startAt.localeCompare(second.startAt));
}

export function getEventsForDateFromGroups(groups: Record<string, CalendarItem[]>, dateKey: string) {
  return groups[dateKey.slice(0, 10)] ?? [];
}

export function getUniqueCategories(events: CalendarItem[]) {
  const categories: CalendarCategory[] = [];
  events.forEach((event) => {
    if (!categories.includes(event.category)) categories.push(event.category);
  });
  return categories;
}

export function createDefaultFormState(dateKey: string): CalendarFormState {
  return {
    category: "event",
    date: dateKey,
    endTime: "17:00",
    notes: "",
    pointsOnComplete: "",
    repeat: "none",
    requiresEvidence: false,
    startTime: "16:00",
    title: ""
  };
}

export function createFormStateFromEvent(event: CalendarItem): CalendarFormState {
  return {
    category: event.category,
    date: getDateKey(event.startAt),
    endTime: getTimeKey(event.endAt, "17:00"),
    notes: event.notes ?? "",
    pointsOnComplete: event.pointsOnComplete ? String(event.pointsOnComplete) : "",
    repeat: event.repeat,
    requiresEvidence: event.requiresEvidence,
    startTime: getTimeKey(event.startAt, "16:00"),
    title: event.title
  };
}

export function toCalendarItems(input: {
  calendarEvents: CalendarEvent[];
  homeworkItems: HomeworkItem[];
  rewardRequests: RewardRequest[];
  taskItems?: Array<{ assignment: TaskAssignment; task: Task }>;
}) {
  const calendarItems = input.calendarEvents
    .filter((event) => !event.deletedAt)
    .flatMap((event): CalendarItem[] => {
      const date = event.date.slice(0, 10);
      const startTime = event.startTime ?? event.time ?? "09:00";
      const endTime = event.endTime ?? addOneHour(startTime);
      const baseEvent: CalendarItem = {
        category: toCalendarCategory(event.category, event.type),
        childId: event.childId,
        createdAt: event.createdAt,
        createdByParentId: null,
        editable: true,
        endAt: combineLocalDateTime(date, endTime),
        id: `calendar-${event.id}`,
        location: event.location,
        notes: event.notes,
        pointsOnComplete: event.pointsValue || null,
        repeat: toCalendarRepeat(event.repeat),
        requiresEvidence: event.requiresEvidence,
        source: "calendar",
        sourceId: event.id,
        startAt: combineLocalDateTime(date, startTime),
        title: event.title
      };

      return expandRecurringEvent(baseEvent);
    });

  const homeworkItems = input.homeworkItems
    .filter((item) => !item.deletedAt && item.dueDate && !isPlaceholderHomework(item))
    .map((item): CalendarItem => ({
      category: "event",
      childId: item.childId,
      createdAt: item.createdAt,
      createdByParentId: item.createdBy,
      editable: false,
      endAt: combineLocalDateTime(item.dueDate, "17:00"),
      id: `homework-${item.id}`,
      location: null,
      notes: item.description,
      pointsOnComplete: null,
      repeat: "none",
      requiresEvidence: false,
      source: "homework",
      sourceId: item.id,
      startAt: combineLocalDateTime(item.dueDate, "16:00"),
      title: item.title || item.description || "Homework due"
    }));

  const rewardItems = input.rewardRequests
    .filter((request) => request.status === "approved_goal" && (request.deadlineDate || request.eventDate))
    .map((request): CalendarItem => {
      const date = (request.deadlineDate ?? request.eventDate ?? todayKey()).slice(0, 10);
      return {
        category: "event",
        childId: request.childId,
        createdAt: request.createdAt,
        createdByParentId: null,
        editable: false,
        endAt: combineLocalDateTime(date, "18:00"),
        id: `reward-goal-${request.id}`,
        location: null,
        notes: request.conditions,
        pointsOnComplete: null,
        repeat: "none",
        requiresEvidence: false,
        source: "reward_goal",
        sourceId: request.id,
        startAt: combineLocalDateTime(date, "17:00"),
        title: request.title
      };
    });

  const taskItems = (input.taskItems ?? [])
    .filter(({ assignment, task }) => assignment.status !== "cancelled" && Boolean(assignment.dueDate) && !isPlaceholderTask(task))
    .map(({ assignment, task }): CalendarItem => {
      const date = (assignment.dueDate ?? todayKey()).slice(0, 10);
      return {
        category: "event",
        childId: assignment.childId,
        createdAt: assignment.createdAt,
        createdByParentId: task.createdBy,
        editable: false,
        endAt: combineLocalDateTime(date, "10:00"),
        id: `task-${assignment.id}`,
        location: null,
        notes: task.description,
        pointsOnComplete: task.pointValue,
        repeat: "none",
        requiresEvidence: false,
        source: "task",
        sourceId: assignment.id,
        startAt: combineLocalDateTime(date, "09:00"),
        title: task.title
      };
    });

  return sortEvents([...calendarItems, ...homeworkItems, ...rewardItems, ...taskItems]);
}

function toCalendarCategory(category: CalendarEvent["category"], type: CalendarEvent["type"]): CalendarCategory {
  if (category === "lesson" || type === "lesson") return "lesson";
  if (category === "revision" || type === "revision") return "revision";
  if (category === "exam" || type === "exam") return "exam";
  return "event";
}

function toCalendarRepeat(value: string | null): CalendarRepeat {
  if (value === "daily" || value === "weekly" || value === "weekdays") return value;
  return "none";
}

function expandRecurringEvent(event: CalendarItem) {
  if (event.repeat === "none") {
    return [event];
  }

  const startDate = getDateKey(event.startAt);
  const startTime = getTimeKey(event.startAt);
  const endTime = getTimeKey(event.endAt);
  const occurrences: CalendarItem[] = [];
  const maxDays = 90;

  for (let offset = 0; offset <= maxDays; offset += 1) {
    const date = addDays(startDate, offset);
    if (!shouldIncludeRecurringDate(event.repeat, startDate, date, offset)) {
      continue;
    }

    occurrences.push({
      ...event,
      endAt: combineLocalDateTime(date, endTime),
      id: offset === 0 ? event.id : `${event.id}-repeat-${date}`,
      startAt: combineLocalDateTime(date, startTime)
    });
  }

  return occurrences;
}

function shouldIncludeRecurringDate(repeat: CalendarRepeat, startDate: string, date: string, offset: number) {
  if (repeat === "daily") return true;
  if (repeat === "weekly") return offset % 7 === 0;
  if (repeat === "weekdays") {
    const day = new Date(`${date}T12:00:00.000Z`).getUTCDay();
    return day >= 1 && day <= 5;
  }

  return date === startDate;
}

function isPlaceholderHomework(item: HomeworkItem) {
  return item.id.startsWith("homework-") && item.status === "not_applicable" && !item.subject && !item.description;
}

function isPlaceholderTask(task: Task) {
  return task.id === "task-reset-room";
}

function addOneHour(time: string) {
  const normalised = normaliseTime(time) || "09:00";
  const [hourPart, minutePart] = normalised.split(":");
  const hour = Number(hourPart ?? 9);
  const minute = Number(minutePart ?? 0);
  return `${String(Math.min(23, hour + 1)).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
