export function isToday(value: string | null) {
  if (!value) {
    return false;
  }

  return toDateKey(value) === toDateKey(new Date().toISOString());
}

export function formatTimeLabel(value: string | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function formatDateLabel(value: string | null) {
  if (!value) {
    return "No due date";
  }

  if (isToday(value)) {
    return "today";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium"
  }).format(new Date(value));
}

export function formatDateTimeLabel(value: string | null) {
  if (!value) {
    return "Not set";
  }

  if (isToday(value)) {
    return `today at ${formatTimeLabel(value)}`;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export const formatDate = formatDateLabel;
export const formatDateTime = formatDateTimeLabel;

export function getStartOfWeek(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = start.getUTCDay();
  const distanceFromMonday = day === 0 ? 6 : day - 1;
  start.setUTCDate(start.getUTCDate() - distanceFromMonday);
  return start.toISOString().slice(0, 10);
}

export function addWeeks(dateKey: string, weeks: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + weeks * 7);
  return date.toISOString().slice(0, 10);
}

export function isSameWeek(first: string | null, second: string | null) {
  if (!first || !second) {
    return false;
  }

  return getStartOfWeek(first) === getStartOfWeek(second);
}

export function isSameDay(first: string | null, second: string | null) {
  if (!first || !second) {
    return false;
  }

  return toDateKey(first) === toDateKey(second);
}

export function formatWeekRange(weekStart: string) {
  const weekEnd = addDays(weekStart, 6);
  const formatter = new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  return `${formatter.format(new Date(`${weekStart}T12:00:00.000Z`))} - ${formatter.format(new Date(`${weekEnd}T12:00:00.000Z`))}`;
}

export function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function toDateKey(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}
