import { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, Text, TextStyle } from "react-native";

import { colors, typography } from "@/shared/theme";

type TextVariant = keyof typeof typography;

type AppTextProps = PropsWithChildren<{
  color?: string;
  style?: StyleProp<TextStyle>;
  variant?: TextVariant;
}>;

export function AppText({ children, color = colors.ink, style, variant = "body" }: AppTextProps) {
  return <Text style={[styles.base, typography[variant], { color }, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  base: {
    letterSpacing: 0
  }
});
