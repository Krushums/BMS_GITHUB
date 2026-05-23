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

function toDateKey(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}
