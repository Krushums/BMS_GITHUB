import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { CalendarItem } from "@/features/calendar/calendarTypes";
import { EventCard } from "@/features/calendar/EventCard";
import { formatAgendaDayLabel } from "@/features/calendar/calendarUtils";
import { AppText } from "@/shared/components/AppText";
import { colors, spacing } from "@/shared/theme";

type CalendarDayAgendaProps = {
  dailyGoal?: number;
  onAddEvent: () => void;
  onAddTime: (time: string) => void;
  onEventPress: (event: CalendarItem) => void;
  pointsEarned: number;
  selectedDate: string;
  streak: number;
  events: CalendarItem[];
};

const emptySlots = ["08:00", "12:00", "16:00", "18:00"];

export function CalendarDayAgenda({
  dailyGoal = 50,
  events,
  onAddEvent,
  onAddTime,
  onEventPress,
  pointsEarned,
  selectedDate,
  streak
}: CalendarDayAgendaProps) {
  const completeCount = 0;
  const progress = Math.min(100, Math.round((pointsEarned / dailyGoal) * 100));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <AppText style={styles.title}>{formatDisplayTitle(selectedDate)}</AppText>
          <AppText color={colors.inkMuted} variant="caption">{events.length} events • {completeCount} complete</AppText>
        </View>
        <Pressable accessibilityRole="button" onPress={onAddEvent} style={styles.addButton}>
          <Ionicons color={colors.surface} name="add" size={20} />
        </Pressable>
      </View>

      <View style={styles.summaryGrid}>
        <SummaryCard label="Points" value={String(pointsEarned)} />
        <SummaryCard label="Done" value={`${completeCount}/${events.length}`} />
        <SummaryCard label="Streak" value={String(streak)} />
      </View>

      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <AppText variant="body">Daily goal</AppText>
          <AppText color={colors.inkMuted} variant="caption">{pointsEarned} / {dailyGoal} pts</AppText>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      <View style={styles.section}>
        <AppText color={colors.inkMuted} style={styles.sectionLabel} variant="caption">{formatAgendaDayLabel(selectedDate)}</AppText>
        {events.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons color={colors.inkMuted} name="calendar-clear-outline" size={18} />
            <AppText color={colors.inkMuted} style={styles.emptyText}>Nothing planned — enjoy the free time</AppText>
          </View>
        ) : null}
        {events.map((event) => (
          <EventCard event={event} key={event.id} onPress={() => onEventPress(event)} />
        ))}
      </View>

      <View style={styles.slotList}>
        {emptySlots.map((time) => (
          <Pressable accessibilityRole="button" key={time} onPress={() => onAddTime(time)} style={styles.emptySlot}>
            <AppText color={colors.inkMuted} variant="caption">{time}</AppText>
            <AppText color={colors.primaryDark} variant="caption">Add event</AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryCard}>
      <AppText style={styles.summaryValue} variant="body">{value}</AppText>
      <AppText color={colors.inkMuted} style={styles.summaryLabel} variant="caption">{label}</AppText>
    </View>
  );
}

function formatDisplayTitle(dateKey: string) {
  const formatted = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", weekday: "long" }).format(new Date(`${dateKey}T12:00:00.000Z`));
  return formatted.replace(",", "");
}

const styles = StyleSheet.create({
  addButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg,
    width: "100%"
  },
  empty: {
    alignItems: "center",
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 92,
    padding: spacing.lg
  },
  emptySlot: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 10,
    borderStyle: "dashed",
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 44,
    paddingHorizontal: spacing.md
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center"
  },
  goalCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  goalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  headerCopy: {
    flex: 1,
    minWidth: 0
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: "100%"
  },
  progressTrack: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    height: 12,
    overflow: "hidden"
  },
  section: {
    gap: spacing.sm
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase"
  },
  slotList: {
    gap: spacing.sm
  },
  summaryCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    minWidth: 0,
    padding: spacing.sm
  },
  summaryGrid: {
    flexDirection: "row",
    gap: spacing.sm
  },
  summaryLabel: {
    fontSize: 12
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "800"
  },
  title: {
    fontSize: 22,
    fontWeight: "800"
  }
});
