import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AppText } from "@/shared/components/AppText";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { colors, spacing } from "@/shared/theme";

export type OnboardingSlide = {
  examples?: Array<{
    label: string;
    value: string;
  }>;
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  title: string;
};

type OnboardingCarouselProps = {
  finalLabel?: string;
  onFinish?: () => void;
  onSkip?: () => void;
  slides: OnboardingSlide[];
  showSkip?: boolean;
};

export function OnboardingCarousel({ finalLabel = "Done", onFinish, onSkip, showSkip = false, slides }: OnboardingCarouselProps) {
  const [index, setIndex] = useState(0);
  const slide = slides[index] ?? slides[0];
  const isLast = index === slides.length - 1;

  if (!slide) {
    return null;
  }

  function goNext() {
    if (isLast) {
      onFinish?.();
      return;
    }

    setIndex((value) => Math.min(slides.length - 1, value + 1));
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <AppText color={colors.primaryDark} variant="caption">
          Step {index + 1} of {slides.length}
        </AppText>
        {showSkip ? (
          <Pressable accessibilityRole="button" onPress={onSkip ?? onFinish}>
            <AppText color={colors.inkMuted} variant="caption">
              Skip
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <Card tone="fresh">
        <View style={styles.visual}>
          <Ionicons color={colors.primary} name={slide.icon} size={56} />
        </View>
        <AppText variant="title">{slide.title}</AppText>
        <AppText color={colors.inkMuted}>{slide.text}</AppText>

        {slide.examples ? (
          <View style={styles.examples}>
            {slide.examples.map((example) => (
              <View key={example.label} style={styles.example}>
                <AppText numberOfLines={2} style={styles.exampleLabel} variant="caption">
                  {example.label}
                </AppText>
                <AppText color={colors.primaryDark} variant="caption">
                  {example.value}
                </AppText>
              </View>
            ))}
          </View>
        ) : null}
      </Card>

      <View style={styles.dots}>
        {slides.map((item, dotIndex) => (
          <View key={item.title} style={[styles.dot, dotIndex === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.actions}>
        <Button disabled={index === 0} label="Back" onPress={() => setIndex((value) => Math.max(0, value - 1))} variant="secondary" />
        <Button label={isLast ? finalLabel : "Next"} onPress={goNext} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  container: {
    gap: spacing.lg
  },
  dot: {
    backgroundColor: colors.border,
    borderRadius: 999,
    height: 8,
    width: 24
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 42
  },
  dots: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center"
  },
  example: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: 142,
    flexGrow: 1,
    gap: spacing.xs,
    minHeight: 82,
    padding: spacing.md
  },
  exampleLabel: {
    minHeight: 34,
    textAlign: "center"
  },
  examples: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  visual: {
    alignItems: "center",
    backgroundColor: "#EAFBF2",
    borderRadius: 20,
    height: 132,
    justifyContent: "center"
  }
});
