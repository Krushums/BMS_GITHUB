import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useMockAuth } from "@/features/auth/MockAuthContext";
import { parentWalkthroughCards } from "@/features/help/guides";
import { AppText } from "@/shared/components/AppText";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { Screen } from "@/shared/components/Screen";
import { colors, spacing } from "@/shared/theme";

export default function HelpDemoScreen() {
  const auth = useMockAuth();
  const isParent = Boolean(auth.currentParent);

  function takeParentTour() {
    if (isParent) {
      router.replace({ pathname: "/parent", params: { tour: "parent" } });
      return;
    }

    auth.continueDemoParent();
    router.replace({ pathname: "/parent", params: { tour: "parent" } });
  }

  function takeChildTour() {
    if (!auth.currentChild) {
      auth.continueDemoChild();
    }

    router.replace({ pathname: "/child", params: { tour: "child" } });
  }

  return (
    <Screen>
      <View style={styles.header}>
        <AppText color={colors.primaryDark} variant="caption">
          Help & Demo
        </AppText>
        <AppText variant="title">{isParent ? "Parent Guide" : "Child Guide"}</AppText>
        <AppText color={colors.inkMuted}>
          Quick, friendly guidance you can revisit anytime.
        </AppText>
      </View>

      <View style={styles.actions}>
        {isParent ? (
          <Button icon="map" label="Take Parent Tour" onPress={takeParentTour} variant="secondary" />
        ) : (
          <Button icon="map" label="Take Child Tour" onPress={takeChildTour} variant="secondary" />
        )}
      </View>

      {isParent ? <ParentWalkthrough /> : <ChildTourPreview />}

      <Card tone="focus">
        <View style={styles.demoHeader}>
          <View style={styles.demoIcon}>
            <Ionicons color={colors.primary} name="map" size={22} />
          </View>
          <View style={styles.copy}>
            <AppText variant="heading">{isParent ? "Parent Tour" : "Child Tour"}</AppText>
            <AppText color={colors.inkMuted}>
              Learn the app on the real live screens with short tips, highlighted tabs and simple next steps.
            </AppText>
          </View>
        </View>
        <Button icon="map" label={isParent ? "Take Parent Tour" : "Take Child Tour"} onPress={isParent ? takeParentTour : takeChildTour} />
      </Card>
    </Screen>
  );
}

function ChildTourPreview() {
  const cards = [
    { icon: "sunny", text: "Complete quests to earn points.", title: "Today's Quests" },
    { icon: "book", text: "Log homework and keep your streak alive.", title: "Homework" },
    { icon: "gift", text: "Spend points in the rewards shop.", title: "Rewards Shop" },
    { icon: "trending-up", text: "Track points, level and achievements.", title: "Progress" },
    { icon: "sparkles", text: "See your points activity in one place.", title: "Activity" }
  ] as const;

  return (
    <View style={styles.walkthroughGrid}>
      {cards.map((card) => (
        <Card key={card.title} style={styles.walkthroughCard}>
          <View style={styles.walkthroughIcon}>
            <Ionicons color={colors.primary} name={card.icon} size={22} />
          </View>
          <AppText variant="heading">{card.title}</AppText>
          <AppText color={colors.inkMuted}>{card.text}</AppText>
        </Card>
      ))}
    </View>
  );
}

function ParentWalkthrough() {
  return (
    <View style={styles.walkthroughGrid}>
      {parentWalkthroughCards.map((card) => (
        <Card key={card.title} style={styles.walkthroughCard}>
          <View style={styles.walkthroughIcon}>
            <Ionicons color={colors.primary} name={card.icon} size={22} />
          </View>
          <AppText variant="heading">{card.title}</AppText>
          <AppText color={colors.inkMuted}>{card.text}</AppText>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0
  },
  demoHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md
  },
  demoIcon: {
    alignItems: "center",
    backgroundColor: "#EAFBF2",
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  header: {
    gap: spacing.sm,
    paddingTop: spacing.lg
  },
  walkthroughCard: {
    flexBasis: 250,
    flexGrow: 1,
    minWidth: 0
  },
  walkthroughGrid: {
    alignItems: "stretch",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  walkthroughIcon: {
    alignItems: "center",
    backgroundColor: "#EAFBF2",
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
    width: 44
  }
});
