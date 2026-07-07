import { Pressable, StyleSheet, View } from "react-native";

import { CalendarItem } from "@/features/calendar/calendarTypes";
import { calendarCategoryTheme } from "@/features/calendar/calendarTheme";
import { formatDisplayTime, getDurationLabel } from "@/features/calendar/calendarUtils";
import { AppText } from "@/shared/components/AppText";
import { spacing } from "@/shared/theme";

type EventCardProps = {
  event: CalendarItem;
  onPress: () => void;
};

export function EventCard({ event, onPress }: EventCardProps) {
  const theme = calendarCategoryTheme[event.category];
  const subtitle = [event.location, getDurationLabel(event.startAt, event.endAt), event.notes, event.requiresEvidence ? "photo evidence" : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.card, { backgroundColor: theme.background }]}>
      <AppText color={theme.text} style={styles.time} variant="caption">{formatDisplayTime(event.startAt)}</AppText>
      <View style={styles.copy}>
        <AppText color={theme.text} numberOfLines={1} style={styles.title}>{event.title}</AppText>
        <AppText color={theme.text} numberOfLines={1} style={styles.subtitle} variant="caption">{subtitle || theme.label}</AppText>
      </View>
      {event.category === "revision" && event.pointsOnComplete ? (
        <AppText color="#B7791F" style={styles.points}>+{event.pointsOnComplete}</AppText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 68,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  copy: {
    flex: 1,
    gap: 3,
    minWidth: 0
  },
  points: {
    fontSize: 15,
    fontWeight: "800"
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.82
  },
  time: {
    fontSize: 12,
    fontWeight: "500",
    width: 52
  },
  title: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 18
  }
});
