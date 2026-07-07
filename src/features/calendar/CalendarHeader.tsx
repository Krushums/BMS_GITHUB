import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AppText } from "@/shared/components/AppText";
import { colors, spacing } from "@/shared/theme";

type CalendarHeaderProps = {
  monthTitle: string;
  onAdd: () => void;
  onNextWeek: () => void;
  onPreviousWeek: () => void;
};

export function CalendarHeader({ monthTitle, onAdd, onNextWeek, onPreviousWeek }: CalendarHeaderProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.titleRow}>
        <AppText style={styles.title}>Calendar</AppText>
        <Pressable accessibilityRole="button" onPress={onAdd} style={styles.addButton}>
          <Ionicons color={colors.surface} name="add" size={22} />
        </Pressable>
      </View>

      <View style={styles.monthRow}>
        <Pressable accessibilityRole="button" onPress={onPreviousWeek} style={styles.chevronButton}>
          <Ionicons color={colors.ink} name="chevron-back" size={18} />
        </Pressable>
        <AppText style={styles.monthTitle}>{monthTitle}</AppText>
        <Pressable accessibilityRole="button" onPress={onNextWeek} style={styles.chevronButton}>
          <Ionicons color={colors.ink} name="chevron-forward" size={18} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  chevronButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  monthRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  monthTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center"
  },
  title: {
    fontSize: 18,
    fontWeight: "500",
    lineHeight: 24
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  wrapper: {
    gap: spacing.md
  }
});
