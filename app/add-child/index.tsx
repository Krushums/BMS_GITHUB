import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { StarterAvatar, useMockAuth } from "@/features/auth/MockAuthContext";
import { AppText } from "@/shared/components/AppText";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { Screen } from "@/shared/components/Screen";
import { colors, spacing } from "@/shared/theme";

const avatars: StarterAvatar[] = ["Bunny", "Fox", "Cat", "Owl"];

export default function AddChildScreen() {
  const auth = useMockAuth();
  const defaultHouseholdName = `${auth.currentParent?.fullName.split(" ")[0] || "Family"}'s Household`;
  const hasHousehold = auth.currentParent ? auth.households.some((household) => household.createdBy === auth.currentParent?.id) : false;
  const [displayName, setDisplayName] = useState("");
  const [householdName, setHouseholdName] = useState(defaultHouseholdName);
  const [age, setAge] = useState("");
  const [starterAvatar, setStarterAvatar] = useState<StarterAvatar>("Fox");
  const [message, setMessage] = useState<string | null>(null);

  if (!auth.currentParent) {
    router.replace("/auth");
    return null;
  }

  function createChild() {
    const result = auth.createChildProfile({ age, displayName, householdName, starterAvatar });

    if (!result.ok) {
      setMessage(result.error ?? "Could not create child profile.");
      return;
    }

    router.replace("/quick-start");
  }

  function useDemoChild() {
    const result = auth.useDemoChildForCurrentParent();

    if (!result.ok) {
      setMessage(result.error ?? "Could not load demo child.");
      return;
    }

    router.replace("/quick-start");
  }

  return (
    <Screen>
      <View style={styles.header}>
        <AppText color={colors.primaryDark} variant="caption">
          Child profile
        </AppText>
        <AppText variant="title">Add your first child</AppText>
        <AppText color={colors.inkMuted}>A simple household profile is enough for the MVP. No child email needed.</AppText>
      </View>

      <Card>
        {!hasHousehold ? (
          <View style={styles.step}>
            <AppText variant="heading">Name your household</AppText>
            <TextInput
              autoCapitalize="words"
              onChangeText={setHouseholdName}
              placeholder="Household name"
              placeholderTextColor={colors.inkMuted}
              style={styles.input}
              value={householdName}
            />
          </View>
        ) : null}

        <View style={styles.step}>
          <AppText variant="heading">What's your child's name?</AppText>
          <TextInput
            autoCapitalize="words"
            onChangeText={setDisplayName}
            placeholder="Display name"
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
            value={displayName}
          />
        </View>

        <View style={styles.step}>
          <AppText variant="heading">Age</AppText>
          <TextInput
            keyboardType="number-pad"
            onChangeText={setAge}
            placeholder="Optional"
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
            value={age}
          />
        </View>

        <View style={styles.step}>
          <AppText variant="heading">Choose starter avatar</AppText>
          <View style={styles.avatarGrid}>
            {avatars.map((avatar) => (
              <Pressable
                key={avatar}
                onPress={() => setStarterAvatar(avatar)}
                style={[styles.avatarOption, starterAvatar === avatar && styles.avatarSelected]}
              >
                <Ionicons color={starterAvatar === avatar ? colors.surface : colors.primary} name="sparkles" size={20} />
                <AppText color={starterAvatar === avatar ? colors.surface : colors.ink} variant="caption">
                  {avatar}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>

        {message ? (
          <View style={styles.errorBox}>
            <AppText color={colors.danger} variant="caption">
              {message}
            </AppText>
          </View>
        ) : null}

        <Button icon="person-add" label="Create child" onPress={createChild} />
      </Card>

      <Button icon="sparkles" label="Use Demo Child - Maya" onPress={useDemoChild} variant="secondary" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  avatarOption: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: 120,
    flexDirection: "row",
    flexGrow: 1,
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 52,
    padding: spacing.md
  },
  avatarSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark
  },
  errorBox: {
    backgroundColor: "#FFF1F1",
    borderColor: colors.danger,
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.md
  },
  header: {
    gap: spacing.sm,
    paddingTop: spacing.lg
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: spacing.md
  },
  step: {
    gap: spacing.sm
  }
});
