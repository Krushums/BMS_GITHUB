import { Pressable, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AppText } from "@/shared/components/AppText";
import { colors, spacing } from "@/shared/theme";

type ButtonVariant = "primary" | "secondary" | "quiet";

type ButtonProps = {
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  variant?: ButtonVariant;
};

export function Button({ disabled = false, icon, label, onPress, style, variant = "primary" }: ButtonProps) {
  const isPrimary = variant === "primary";
  const isQuiet = variant === "quiet";
  const foreground = disabled ? colors.inkMuted : isPrimary ? colors.surface : colors.ink;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isPrimary && styles.primary,
        variant === "secondary" && styles.secondary,
        isQuiet && styles.quiet,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style
      ]}
    >
      {icon ? <Ionicons color={foreground} name={icon} size={18} /> : null}
      <AppText color={foreground} style={styles.label} variant="caption">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: 8,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.lg
  },
  disabled: {
    backgroundColor: colors.surfaceMuted,
    opacity: 0.62
  },
  label: {
    textAlign: "center"
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }]
  },
  primary: {
    backgroundColor: colors.primary
  },
  quiet: {
    backgroundColor: "transparent"
  },
  secondary: {
    backgroundColor: colors.surfaceMuted
  }
});
