import { PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";

import { usePreviewMode } from "@/shared/components/PreviewModeContext";
import { colors, spacing } from "@/shared/theme";

export function PreviewModeShell({ children }: PropsWithChildren) {
  const { mode, toggleMode } = usePreviewMode();
  const pathname = usePathname();
  const isPhone = mode === "phone";
  const showBackButton = pathname !== "/";

  function goBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/");
  }

  return (
    <View style={[styles.root, isPhone && styles.rootPhone]}>
      <View style={[styles.appFrame, isPhone && styles.phoneFrame]}>{children}</View>
      {showBackButton ? (
        <Pressable accessibilityRole="button" onPress={goBack} style={styles.backButton}>
          <Ionicons color={colors.ink} name="chevron-back" size={18} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      ) : null}
      <Pressable accessibilityRole="button" onPress={toggleMode} style={styles.toggle}>
        <Ionicons color={colors.surface} name={isPhone ? "phone-portrait" : "laptop"} size={16} />
        <Text style={styles.toggleText}>{isPhone ? "Phone view" : "Laptop view"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  appFrame: {
    flex: 1,
    minHeight: 0,
    width: "100%"
  },
  backButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    elevation: 10,
    flexDirection: "row",
    gap: spacing.xs,
    left: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    position: "absolute",
    shadowColor: colors.ink,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    top: spacing.lg,
    zIndex: 30
  },
  backText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800"
  },
  phoneFrame: {
    alignSelf: "center",
    backgroundColor: colors.background,
    borderColor: "#CBD5E1",
    borderRadius: 28,
    borderWidth: 1,
    elevation: 12,
    flex: 1,
    marginVertical: spacing.md,
    maxHeight: 860,
    maxWidth: 430,
    shadowColor: colors.ink,
    shadowOffset: { height: 24, width: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 40,
    overflow: "hidden",
    width: "100%"
  },
  root: {
    backgroundColor: colors.background,
    flex: 1,
    minHeight: "100%"
  },
  rootPhone: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: spacing.md
  },
  toggle: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderRadius: 999,
    bottom: spacing.lg,
    elevation: 10,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    position: "absolute",
    right: spacing.lg,
    shadowColor: colors.ink,
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    zIndex: 20
  },
  toggleText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: "800"
  }
});
