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
            {item.icon ? (
              <View style={styles.iconSlot}>
                <Ionicons color={item.accentColor ?? colors.primary} name={item.icon} size={18} />
              </View>
            ) : null}
            <AppText color={colors.inkMuted} numberOfLines={1} style={styles.labelText} variant="caption">
              {item.label}
            </AppText>
          </View>
          <AppText color={item.accentColor ?? colors.ink} numberOfLines={1} style={styles.valueText} variant="heading">
            {item.value}
          </AppText>
          {item.details ? (
            <View style={styles.detailsRow}>
              {item.details.map((detail) => (
                <View key={detail.label} style={styles.detailItem}>
                  <AppText color={detail.color ?? colors.ink} numberOfLines={1} style={styles.detailValue} variant="body">
                    {detail.value}
                  </AppText>
                  <AppText color={colors.inkMuted} numberOfLines={1} style={styles.detailLabel} variant="caption">
                    {detail.label}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}
          {item.caption ? (
            <AppText color={item.accentColor ?? colors.inkMuted} numberOfLines={1} style={styles.captionText} variant="caption">
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
    flexBasis: 148,
    flexGrow: 1,
    flexShrink: 1,
    gap: spacing.sm,
    justifyContent: "space-between",
    minHeight: 112,
    minWidth: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md
  },
  captionText: {
    minHeight: 16
  },
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  detailLabel: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: "center"
  },
  detailsRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: spacing.xs
  },
  detailItem: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0
  },
  detailValue: {
    fontSize: 18,
    lineHeight: 22,
    textAlign: "center"
  },
  iconSlot: {
    alignItems: "center",
    flexShrink: 0,
    height: 22,
    justifyContent: "center",
    width: 22
  },
  labelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 22,
    minWidth: 0
  },
  labelText: {
    flex: 1,
    minWidth: 0
  },
  valueText: {
    lineHeight: 28,
    minHeight: 28
  }
});
