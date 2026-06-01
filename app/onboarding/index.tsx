import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useMockAuth } from "@/features/auth/MockAuthContext";
import { AppText } from "@/shared/components/AppText";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { Screen } from "@/shared/components/Screen";
import { colors, spacing } from "@/shared/theme";

const slides = [
  {
    icon: "heart",
    text: "Rewards, routines and responsibility - all in one place.",
    title: "Build habits that last."
  },
  {
    icon: "flash",
    text: "Create responsibilities and rewards that fit your household.",
    title: "Create tasks in seconds"
  },
  {
    icon: "sparkles",
    text: "Children earn points, build streaks and unlock rewards through consistency.",
    title: "Kids stay motivated"
  },
  {
    icon: "shield-checkmark",
    text: "Review homework, approve rewards, and track progress with complete transparency.",
    title: "Stay in control"
  }
] as const;

export default function OnboardingScreen() {
  const auth = useMockAuth();
  const [index, setIndex] = useState(0);
  const slide = slides[index] ?? slides[0];
  const isLast = index === slides.length - 1;

  function finish() {
    auth.completeOnboarding();
    router.replace("/add-child");
  }

  if (!auth.currentParent) {
    router.replace("/auth");
    return null;
  }

  return (
    <Screen>
      <View style={styles.topRow}>
        <AppText color={colors.primaryDark} variant="caption">
          Step {index + 1} of {slides.length}
        </AppText>
        <Pressable onPress={finish}>
          <AppText color={colors.inkMuted} variant="caption">
            Skip
          </AppText>
        </Pressable>
      </View>

      <Card tone="fresh">
        <View style={styles.visual}>
          <Ionicons color={colors.primary} name={slide.icon} size={56} />
        </View>
        <AppText variant="title">{slide.title}</AppText>
        <AppText color={colors.inkMuted}>{slide.text}</AppText>

        {index === 1 ? (
          <View style={styles.examples}>
            <Example label="Unload dishwasher" points="+10" />
            <Example label="Complete homework" points="+15" />
            <Example label="Morning routine" points="+5" />
          </View>
        ) : null}

        {index === 2 ? (
          <View style={styles.examples}>
            <Example label="Balance" points="120 pts" />
            <Example label="Streak" points="3 days" />
            <Example label="Rewards shop" points="Gold" />
          </View>
        ) : null}

        {index === 3 ? (
          <View style={styles.examples}>
            <Example label="Reward request" points="Approve" />
            <Example label="Homework review" points="Ready" />
            <Example label="Progress" points="Clear" />
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
        <Button label={isLast ? "Get started - add your first child" : "Next"} onPress={isLast ? finish : () => setIndex(index + 1)} />
      </View>
    </Screen>
  );
}

function Example({ label, points }: { label: string; points: string }) {
  return (
    <View style={styles.example}>
      <AppText variant="caption">{label}</AppText>
      <AppText color={colors.primaryDark} variant="caption">
        {points}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
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
    flexBasis: 160,
    flexGrow: 1,
    gap: spacing.xs,
    padding: spacing.md
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
