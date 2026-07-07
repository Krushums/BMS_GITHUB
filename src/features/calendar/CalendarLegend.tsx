import { StyleSheet, View } from "react-native";

import { calendarCategories, calendarCategoryTheme } from "@/features/calendar/calendarTheme";
import { AppText } from "@/shared/components/AppText";
import { spacing } from "@/shared/theme";

export function CalendarLegend() {
  return (
    <View style={styles.legend}>
      {calendarCategories.map((category) => {
        const theme = calendarCategoryTheme[category];
        return (
          <View key={category} style={[styles.pill, { backgroundColor: theme.background }]}>
            <View style={[styles.dot, { backgroundColor: theme.text }]} />
            <AppText color={theme.text} style={styles.label} variant="caption">{theme.label}</AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    borderRadius: 999,
    height: 5,
    width: 5
  },
  label: {
    fontSize: 11,
    fontWeight: "700"
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    justifyContent: "center"
  },
  pill: {
    alignItems: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: 5,
    minHeight: 24,
    paddingHorizontal: spacing.sm
  }
});
