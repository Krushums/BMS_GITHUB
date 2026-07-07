import { useMemo, useRef } from "react";
import { PanResponder, Pressable, StyleSheet, View } from "react-native";

import { CalendarItem } from "@/features/calendar/calendarTypes";
import { calendarCategoryTheme } from "@/features/calendar/calendarTheme";
import { formatDayNumber, formatWeekdayInitial, getEventsForDateFromGroups, getUniqueCategories, getWeekDates } from "@/features/calendar/calendarUtils";
import { AppText } from "@/shared/components/AppText";
import { colors, spacing } from "@/shared/theme";
import { isSameDay } from "@/shared/utils/date";

type WeekStripProps = {
  eventsByDate: Record<string, CalendarItem[]>;
  onSelectDate: (date: string) => void;
  onShiftWeek: (weeks: number) => void;
  selectedDate: string;
};

export function WeekStrip({ eventsByDate, onSelectDate, onShiftWeek, selectedDate }: WeekStripProps) {
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 24 && Math.abs(gesture.dy) < 18,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < -36) onShiftWeek(1);
        if (gesture.dx > 36) onShiftWeek(-1);
      }
    })
  ).current;

  return (
    <View style={styles.weekStrip} {...panResponder.panHandlers}>
      {weekDates.map((date) => {
        const selected = isSameDay(date, selectedDate);
        const categories = getUniqueCategories(getEventsForDateFromGroups(eventsByDate, date)).slice(0, 3);
        return (
          <Pressable accessibilityRole="button" key={date} onPress={() => onSelectDate(date)} style={styles.dayCell}>
            <AppText color={colors.inkMuted} style={styles.weekday} variant="caption">{formatWeekdayInitial(date)}</AppText>
            <View style={[styles.dateCircle, selected && styles.dateCircleSelected]}>
              <AppText color={selected ? "#FFF7E6" : colors.ink} style={styles.dateNumber} variant="caption">{formatDayNumber(date)}</AppText>
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
  );
}

const styles = StyleSheet.create({
  dateCircle: {
    alignItems: "center",
    borderRadius: 999,
    height: 30,
    justifyContent: "center",
    width: 30
  },
  dateCircleSelected: {
    backgroundColor: colors.primary
  },
  dateNumber: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 17
  },
  dayCell: {
    alignItems: "center",
    flex: 1,
    gap: 4,
    minWidth: 0
  },
  dot: {
    borderRadius: 999,
    height: 4,
    width: 4
  },
  dots: {
    flexDirection: "row",
    gap: 2,
    height: 5,
    justifyContent: "center"
  },
  weekday: {
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14
  },
  weekStrip: {
    flexDirection: "row",
    gap: spacing.xs,
    width: "100%"
  }
});
