import { StyleSheet, View } from "react-native";

import { AppText } from "@/shared/components/AppText";
import { MetricPill } from "@/shared/components/MetricPill";
import { colors, spacing } from "@/shared/theme";
import { formatPoints } from "@/shared/utils/format";

type DashboardHeaderProps = {
  greeting: string;
  points: number;
  streak: number;
};

export function DashboardHeader({ greeting, points, streak }: DashboardHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        <AppText color={colors.inkMuted} variant="caption">
          Today
        </AppText>
        <AppText variant="title">{greeting}</AppText>
      </View>

      <View style={styles.metrics}>
        <MetricPill icon="sparkles" label="Balance" value={formatPoints(points)} />
        <MetricPill icon="flame" label="Streak" value={`${streak} days`} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg
  },
  copy: {
    minWidth: 0
  },
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  }
});
