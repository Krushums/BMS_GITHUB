import { View } from "react-native";
import { router } from "expo-router";

import { useGameplay } from "@/features/gameplay/GameplayContext";
import { AppText } from "@/shared/components/AppText";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { MetricPill } from "@/shared/components/MetricPill";
import { Screen } from "@/shared/components/Screen";
import { colors } from "@/shared/theme";

export default function ProfileScreen() {
  const { state } = useGameplay();

  return (
    <Screen>
      <AppText variant="title">{state.child.displayName}’s progress</AppText>
      <Card tone="fresh">
        <AppText variant="heading">{state.child.streak} day streak</AppText>
        <AppText color={colors.inkMuted}>A steady rhythm is forming. Keep today simple and winnable.</AppText>
      </Card>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <MetricPill icon="sparkles" label="Balance" value={`${state.child.points} pts`} />
        <MetricPill icon="trophy" label="Best streak" value={`${state.child.bestStreak} days`} />
      </View>
      <Card tone="focus">
        <AppText variant="heading">Help & Demo</AppText>
        <AppText color={colors.inkMuted}>Replay the introduction, learn each section, or open the demo household.</AppText>
        <Button icon="help-circle" label="Open Help & Demo" onPress={() => router.push("/help-demo")} variant="secondary" />
      </Card>
    </Screen>
  );
}
