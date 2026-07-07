import { CalendarScreen } from "@/features/calendar/CalendarScreen";
import { CalendarAudience } from "@/features/calendar/calendarTypes";

type CalendarPanelProps = {
  audience: CalendarAudience;
};

export function CalendarPanel({ audience }: CalendarPanelProps) {
  return <CalendarScreen audience={audience} />;
}
