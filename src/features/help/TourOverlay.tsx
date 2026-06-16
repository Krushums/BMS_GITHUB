import { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AppText } from "@/shared/components/AppText";
import { Button } from "@/shared/components/Button";
import { colors, spacing } from "@/shared/theme";

export type TourStep<TTarget extends string = string> = {
  target: TTarget;
  text: string;
  title: string;
};

type TourOverlayProps<TTarget extends string = string> = {
  currentIndex: number;
  onBack: () => void;
  onFinish: () => void;
  onNext: () => void;
  onSkip: () => void;
  steps: Array<TourStep<TTarget>>;
  visible: boolean;
};

type HighlightTargetProps = {
  active?: boolean;
  children: ReactNode;
};

export function HighlightTarget({ active = false, children }: HighlightTargetProps) {
  return <View style={[styles.highlightTarget, active && styles.highlightTargetActive]}>{children}</View>;
}

export function TourOverlay<TTarget extends string = string>({
  currentIndex,
  onBack,
  onFinish,
  onNext,
  onSkip,
  steps,
  visible
}: TourOverlayProps<TTarget>) {
  const step = steps[currentIndex] ?? steps[0];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === steps.length - 1;

  if (!step) {
    return null;
  }

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.root}>
        <Pressable accessibilityRole="button" onPress={onSkip} style={styles.dimLayer} />
        <View style={styles.card}>
          <View style={styles.arrow}>
            <Ionicons color={colors.primary} name="arrow-up" size={22} />
          </View>
          <AppText color={colors.primaryDark} variant="caption">
            Step {currentIndex + 1} of {steps.length}
          </AppText>
          <AppText variant="heading">{step.title}</AppText>
          <AppText color={colors.inkMuted}>{step.text}</AppText>
          <View style={styles.actions}>
            <Button label="Skip" onPress={onSkip} variant="quiet" />
            <Button disabled={isFirst} label="Back" onPress={onBack} variant="secondary" />
            <Button label={isLast ? "Finish" : "Next"} onPress={isLast ? onFinish : onNext} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "flex-end"
  },
  arrow: {
    alignItems: "center",
    backgroundColor: "#EAFBF2",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  card: {
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderRadius: 12,
    borderWidth: 2,
    bottom: spacing.xl,
    elevation: 20,
    gap: spacing.md,
    left: spacing.md,
    maxWidth: 520,
    padding: spacing.lg,
    position: "absolute",
    right: spacing.md,
    shadowColor: colors.ink,
    shadowOffset: { height: 24, width: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 36
  },
  dimLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.42)"
  },
  highlightTarget: {
    borderRadius: 10
  },
  highlightTargetActive: {
    borderColor: colors.primary,
    borderWidth: 2,
    padding: 2
  },
  root: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end"
  }
});
