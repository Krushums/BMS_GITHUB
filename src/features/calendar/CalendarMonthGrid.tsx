import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { CalendarItem } from "@/features/calendar/calendarTypes";
import { calendarCategoryTheme } from "@/features/calendar/calendarTheme";
import { formatDayNumber, formatMonthTitle, getEventsForDateFromGroups, getMonthGridDates, getUniqueCategories } from "@/features/calendar/calendarUtils";
import { AppText } from "@/shared/components/AppText";
import { Button } from "@/shared/components/Button";
import { colors, spacing } from "@/shared/theme";
import { isSameDay } from "@/shared/utils/date";

type CalendarMonthGridProps = {
  eventsByDate: Record<string, CalendarItem[]>;
  onAddEvent: () => void;
  onNextMonth: () => void;
  onPreviousMonth: () => void;
  onSelectDate: (date: string) => void;
  onToday: () => void;
  selectedDate: string;
};

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarMonthGrid({
  eventsByDate,
  onAddEvent,
  onNextMonth,
  onPreviousMonth,
  onSelectDate,
  onToday,
  selectedDate
}: CalendarMonthGridProps) {
  const monthDates = useMemo(() => getMonthGridDates(selectedDate), [selectedDate]);
  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = selectedDate.slice(0, 7);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={onPreviousMonth} style={styles.arrowButton}>
          <Ionicons color={colors.ink} name="chevron-back" size={18} />
        </Pressable>
        <View style={styles.headerCopy}>
          <AppText style={styles.monthTitle}>{formatMonthTitle(selectedDate)}</AppText>
          <AppText color={colors.inkMuted} variant="caption">Family calendar</AppText>
        </View>
        <Pressable accessibilityRole="button" onPress={onNextMonth} style={styles.arrowButton}>
          <Ionicons color={colors.ink} name="chevron-forward" size={18} />
        </Pressable>
      </View>

      <View style={styles.actions}>
        <Button label="Today" onPress={onToday} style={styles.actionButton} variant="secondary" />
        <Button icon="add" label="Add event" onPress={onAddEvent} style={styles.actionButton} />
      </View>

      <View style={styles.weekdayRow}>
        {weekdayLabels.map((label) => (
          <AppText color={colors.inkMuted} key={label} style={styles.weekdayLabel} variant="caption">{label}</AppText>
        ))}
      </View>

      <View style={styles.grid}>
        {monthDates.map((date) => {
          const selected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, today);
          const inMonth = date.slice(0, 7) === currentMonth;
          const categories = getUniqueCategories(getEventsForDateFromGroups(eventsByDate, date)).slice(0, 3);

          return (
            <Pressable
              accessibilityRole="button"
              key={date}
              onPress={() => onSelectDate(date)}
              style={[styles.dayCell, !inMonth && styles.dayCellMuted, isToday && styles.dayCellToday, selected && styles.dayCellSelected]}
            >
              <View style={[styles.dayNumberBubble, selected && styles.dayNumberSelected]}>
                <AppText color={selected ? "#FFF7E6" : inMonth ? colors.ink : colors.inkMuted} style={styles.dayNumber} variant="caption">
                  {formatDayNumber(date)}
                </AppText>
              </View>
              <View style={styles.dots}>
                {categories.map((category) => (
                  <View key={category} style={[styles.dot, { backgroundColor: calendarCategoryTheme[category].text }]} />
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    flexBasis: 0,
    flexGrow: 1,
    minWidth: 0
  },
  actions: {
    flexDirection: "row",
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
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg,
    width: "100%"
  },
  dayCell: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flexBasis: "13.4%",
    flexGrow: 1,
    gap: spacing.xs,
    minHeight: 72,
    minWidth: 0,
    padding: spacing.xs
  },
  dayCellMuted: {
    backgroundColor: "#FAFAFB"
  },
  dayCellSelected: {
    backgroundColor: "#F3FBF7",
    borderColor: colors.primary
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
    height: 28,
    justifyContent: "center",
    width: 28
  },
  dayNumberSelected: {
    backgroundColor: colors.primary
  },
  dot: {
    borderRadius: 999,
    height: 5,
    width: 5
  },
  dots: {
    flexDirection: "row",
    gap: 3,
    height: 6
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  headerCopy: {
    flex: 1,
    minWidth: 0
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center"
  },
  weekdayLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center"
  },
  weekdayRow: {
    flexDirection: "row",
    gap: spacing.xs
  }
});
