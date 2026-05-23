import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/shared/components/AppText";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { Screen } from "@/shared/components/Screen";
import { colors, spacing } from "@/shared/theme";

export default function WelcomeScreen() {
  return (
    <Screen>
      <View style={styles.hero}>
        <AppText color={colors.primaryDark} variant="caption">
          Bloom Family
        </AppText>
        <AppText variant="title">A calmer way to grow good habits.</AppText>
        <AppText color={colors.inkMuted}>
          Tasks, rewards, streaks, and proof flows designed to feel fair, motivating, and transparent.
        </AppText>
      </View>

      <Card tone="fresh">
        <AppText variant="heading">Today can feel lighter</AppText>
        <AppText color={colors.inkMuted}>
          Parents guide the rhythm. Kids see progress, earn rewards, and build momentum.
        </AppText>
      </Card>

      <View style={styles.actions}>
        <Button icon="mail" label="Log in or sign up" onPress={() => router.push("/auth")} />
        <Button icon="home" label="View parent demo" onPress={() => router.push("/parent")} variant="secondary" />
        <Button icon="sparkles" label="View child demo" onPress={() => router.push("/child")} variant="secondary" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm
  },
  hero: {
    gap: spacing.md,
    paddingTop: spacing.xl
  }
});
