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
      <Ionicons color={colors.primaryDark} name={icon} size={18} />
      <View>
        <AppText variant="caption">{value}</AppText>
        <AppText color={colors.inkMuted} style={styles.label} variant="caption">
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
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  label: {
    fontSize: 12
  }
});
