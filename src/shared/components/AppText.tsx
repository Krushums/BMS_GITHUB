import { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, Text, TextStyle } from "react-native";

import { colors, typography } from "@/shared/theme";

type TextVariant = keyof typeof typography;

type AppTextProps = PropsWithChildren<{
  color?: string;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
  variant?: TextVariant;
}>;

export function AppText({ children, color = colors.ink, numberOfLines, style, variant = "body" }: AppTextProps) {
  return <Text numberOfLines={numberOfLines} style={[styles.base, typography[variant], { color }, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  base: {
    flexShrink: 1,
    letterSpacing: 0
  }
});
