import { View } from "react-native";

import { useGameplay } from "@/features/gameplay/GameplayContext";
import { AppText } from "@/shared/components/AppText";
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
    </Screen>
  );
}
