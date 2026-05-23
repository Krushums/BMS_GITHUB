import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AppText } from "@/shared/components/AppText";
import { colors, spacing } from "@/shared/theme";

export type SummaryCardItem = {
  accentColor?: string;
  caption?: string;
  details?: Array<{
    color?: string;
    label: string;
    value: string;
  }>;
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

type SummaryBarProps = {
  items: SummaryCardItem[];
  style?: StyleProp<ViewStyle>;
};

export function SummaryBar({ items, style }: SummaryBarProps) {
  return (
    <View style={[styles.container, style]}>
      {items.map((item) => (
        <View key={item.label} style={styles.card}>
          <View style={styles.labelRow}>
            {item.icon ? <Ionicons color={item.accentColor ?? colors.primary} name={item.icon} size={18} /> : null}
            <AppText color={colors.inkMuted} variant="caption">
              {item.label}
            </AppText>
          </View>
          <AppText color={item.accentColor ?? colors.ink} variant="heading">
            {item.value}
          </AppText>
          {item.details ? (
            <View style={styles.detailsRow}>
              {item.details.map((detail) => (
                <View key={detail.label} style={styles.detailItem}>
                  <AppText color={detail.color ?? colors.ink} variant="body">
                    {detail.value}
                  </AppText>
                  <AppText color={colors.inkMuted} variant="caption">
                    {detail.label}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}
          {item.caption ? (
            <AppText color={item.accentColor ?? colors.inkMuted} variant="caption">
              {item.caption}
            </AppText>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: 160,
    flexGrow: 1,
    gap: spacing.sm,
    minHeight: 118,
    padding: spacing.lg
  },
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  detailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  detailItem: {
    minWidth: 70
  },
  labelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  }
});
