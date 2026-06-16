import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AppText } from "@/shared/components/AppText";
import { colors, spacing } from "@/shared/theme";

type MetricPillProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

export function MetricPill({ icon, label, value }: MetricPillProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconSlot}>
        <Ionicons color={colors.primaryDark} name={icon} size={18} />
      </View>
      <View style={styles.copy}>
        <AppText numberOfLines={1} style={styles.value} variant="caption">
          {value}
        </AppText>
        <AppText color={colors.inkMuted} numberOfLines={1} style={styles.label} variant="caption">
          {label}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    flexBasis: 128,
    flexGrow: 1,
    flexShrink: 1,
    gap: spacing.sm,
    minHeight: 52,
    minWidth: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  copy: {
    flexShrink: 1,
    minWidth: 0
  },
  iconSlot: {
    alignItems: "center",
    flexShrink: 0,
    height: 24,
    justifyContent: "center",
    width: 24
  },
  label: {
    fontSize: 12,
    lineHeight: 15
  },
  value: {
    lineHeight: 17,
    minHeight: 17
  }
});
