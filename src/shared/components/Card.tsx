import { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { colors, spacing } from "@/shared/theme";

type CardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  tone?: "default" | "warm" | "fresh" | "focus";
}>;

export function Card({ children, style, tone = "default" }: CardProps) {
  return <View style={[styles.card, styles[tone], style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    elevation: 2,
    gap: spacing.md,
    minWidth: 0,
    padding: spacing.lg,
    shadowColor: colors.ink,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 18
  },
  default: {
    backgroundColor: colors.surface
  },
  focus: {
    backgroundColor: "#F1F4FF"
  },
  fresh: {
    backgroundColor: "#ECFBF8"
  },
  warm: {
    backgroundColor: "#FFF6E8"
  }
});
