import { PropsWithChildren } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";

import { usePreviewMode } from "@/shared/components/PreviewModeContext";
import { spacing } from "@/shared/theme";

export function CalendarShell({ children }: PropsWithChildren) {
  const { mode } = usePreviewMode();
  const { width } = useWindowDimensions();
  const maxWidth = mode === "phone" || width < 768 ? 420 : width < 1024 ? 520 : 460;

  return <View style={[styles.shell, { maxWidth }]}>{children}</View>;
}

const styles = StyleSheet.create({
  shell: {
    alignSelf: "center",
    gap: spacing.lg,
    width: "100%"
  }
});
