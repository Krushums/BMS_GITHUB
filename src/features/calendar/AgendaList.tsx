import { ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { CalendarItem } from "@/features/calendar/calendarTypes";
import { EventCard } from "@/features/calendar/EventCard";
import { formatAgendaDayLabel } from "@/features/calendar/calendarUtils";
import { AppText } from "@/shared/components/AppText";
import { colors, spacing } from "@/shared/theme";
import { addDays, isSameDay } from "@/shared/utils/date";

type AgendaListProps = {
  nextDate: string;
  nextEvents: CalendarItem[];
  onEventPress: (event: CalendarItem) => void;
  selectedDate: string;
  selectedEvents: CalendarItem[];
};

export function AgendaList({ nextDate, nextEvents, onEventPress, selectedDate, selectedEvents }: AgendaListProps) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.content}>
      <AgendaSection
        emptyMessage
        events={selectedEvents}
        label={`${isSameDay(selectedDate, today) ? "TODAY" : "SELECTED"} · ${formatAgendaDayLabel(selectedDate)}`}
        onEventPress={onEventPress}
      />
      <AgendaSection
        events={nextEvents}
        label={`${isSameDay(nextDate, addDays(today, 1)) ? "TOMORROW" : "NEXT DAY"} · ${formatAgendaDayLabel(nextDate)}`}
        onEventPress={onEventPress}
      />
    </ScrollView>
  );
}

function AgendaSection({
  emptyMessage,
  events,
  label,
  onEventPress
}: {
  emptyMessage?: boolean;
  events: CalendarItem[];
  label: string;
  onEventPress: (event: CalendarItem) => void;
}) {
  return (
    <View style={styles.section}>
      <AppText color={colors.inkMuted} style={styles.sectionLabel} variant="caption">{label}</AppText>
      {events.length === 0 && emptyMessage ? (
        <View style={styles.empty}>
          <Ionicons color={colors.inkMuted} name="calendar-clear-outline" size={18} />
          <AppText color={colors.inkMuted} style={styles.emptyText}>Nothing planned — enjoy the free time</AppText>
        </View>
      ) : null}
      {events.map((event) => (
        <EventCard event={event} key={event.id} onPress={() => onEventPress(event)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.md
  },
  empty: {
    alignItems: "center",
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 92,
    padding: spacing.lg
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center"
  },
  scroll: {
    maxHeight: 440,
    width: "100%"
  },
  section: {
    gap: spacing.sm
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase"
  }
});
