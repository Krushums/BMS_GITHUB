import { CalendarCategory } from "@/features/calendar/calendarTypes";

export const calendarCategoryTheme: Record<CalendarCategory, { background: string; label: string; text: string }> = {
  event: {
    background: "#FBF3DF",
    label: "Event",
    text: "#96701C"
  },
  exam: {
    background: "#F9DCDE",
    label: "Exam",
    text: "#A32530"
  },
  lesson: {
    background: "#DFF0ED",
    label: "Lesson",
    text: "#0A5F55"
  },
  revision: {
    background: "#FBE4EB",
    label: "Revision",
    text: "#99354F"
  }
};

export const calendarCategories = ["lesson", "revision", "event", "exam"] as const;

export const repeatOptions = ["none", "daily", "weekly", "weekdays"] as const;
