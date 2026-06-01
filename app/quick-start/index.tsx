import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useMockAuth } from "@/features/auth/MockAuthContext";
import { useGameplay } from "@/features/gameplay/GameplayContext";
import { AppText } from "@/shared/components/AppText";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { Screen } from "@/shared/components/Screen";
import { colors, spacing } from "@/shared/theme";

const templates = [
  { description: "Wake up, wash, breakfast, ready on time.", points: 5, title: "Morning Routine" },
  { description: "Daily academic check-in.", points: 15, title: "Homework" },
  { description: "Bed made and floor clear.", points: 10, title: "Bedroom Tidy" },
  { description: "Read for a focused block of time.", points: 10, title: "Reading" },
  { description: "Revision, flashcards, or practice questions.", points: 15, title: "Revision" }
];

export default function QuickStartScreen() {
  const auth = useMockAuth();
  const gameplay = useGameplay();
  const [selected, setSelected] = useState(() => new Set(templates.map((template) => template.title)));

  if (!auth.currentParent) {
    router.replace("/auth");
    return null;
  }

  function toggle(title: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  }

  function finish() {
    templates
      .filter((template) => selected.has(template.title))
      .forEach((template) => {
        gameplay.createTask({
          description: template.description,
          pointValue: template.points,
          title: template.title
        });
      });
    router.replace("/parent");
  }

  return (
    <Screen>
      <Card tone="fresh">
        <Ionicons color={colors.primary} name="checkmark-circle" size={40} />
        <AppText variant="title">Child created</AppText>
        <AppText color={colors.inkMuted}>Let's create your first tasks. You can turn any starter off before setup.</AppText>
      </Card>

      <Card>
        <AppText variant="heading">Starter templates</AppText>
        <View style={styles.templateList}>
          {templates.map((template) => {
            const isSelected = selected.has(template.title);

            return (
              <Pressable key={template.title} onPress={() => toggle(template.title)} style={styles.templateRow}>
                <Ionicons color={isSelected ? colors.primary : colors.inkMuted} name={isSelected ? "checkbox" : "square-outline"} size={22} />
                <View style={styles.templateCopy}>
                  <AppText variant="caption">{template.title}</AppText>
                  <AppText color={colors.inkMuted} numberOfLines={2} variant="caption">
                    {template.description}
                  </AppText>
                </View>
                <AppText color={colors.primaryDark} variant="caption">
                  +{template.points}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Button icon="flash" label="Set up selected tasks" onPress={finish} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  templateCopy: {
    flex: 1,
    minWidth: 0
  },
  templateList: {
    gap: spacing.sm
  },
  templateRow: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 58,
    padding: spacing.md
  }
});
