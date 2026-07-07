import { useState } from "react";
import { router } from "expo-router";
import { Alert, StyleSheet, TextInput, View } from "react-native";

import { useMockAuth } from "@/features/auth/MockAuthContext";
import { AppText } from "@/shared/components/AppText";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { Screen } from "@/shared/components/Screen";
import { colors, spacing } from "@/shared/theme";

export default function HouseholdSetupScreen() {
  const auth = useMockAuth();
  const [householdName, setHouseholdName] = useState("");
  const [childDisplayName, setChildDisplayName] = useState("");
  const [childUsername, setChildUsername] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleCreateHousehold() {
    const result = auth.createHousehold({
      childDisplayName,
      childUsername,
      householdName
    });

    if (!result.ok) {
      const message = result.error ?? "Household setup failed.";
      setErrorMessage(message);
      Alert.alert("Household setup", message);
      return;
    }

    setErrorMessage(null);
    router.replace("/parent");
  }

  if (!auth.currentParent) {
    return (
      <Screen>
        <AppText variant="title">Set up your household</AppText>
        <Card>
          <AppText color={colors.inkMuted}>Create or log into a parent account before setting up a household.</AppText>
          <Button icon="arrow-back" label="Back to signup" onPress={() => router.replace("/auth")} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppText variant="title">Set up your household</AppText>
      <AppText color={colors.inkMuted}>Hi {auth.currentParent.fullName}. Create the family space, then add the first child profile.</AppText>
      <Card>
        <TextInput
          onChangeText={setHouseholdName}
          placeholder="Household name"
          placeholderTextColor={colors.inkMuted}
          style={styles.input}
          value={householdName}
        />
        <TextInput
          autoCapitalize="words"
          onChangeText={setChildDisplayName}
          placeholder="Child display name"
          placeholderTextColor={colors.inkMuted}
          style={styles.input}
          value={childDisplayName}
        />
        <TextInput
          autoCapitalize="none"
          onChangeText={setChildUsername}
          placeholder="Child username / nickname"
          placeholderTextColor={colors.inkMuted}
          style={styles.input}
          value={childUsername}
        />

        {errorMessage ? (
          <View style={styles.errorBox}>
            <AppText color={colors.danger} variant="caption">
              {errorMessage}
            </AppText>
          </View>
        ) : null}

        <Button icon="add" label="Create household" onPress={handleCreateHousehold} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  errorBox: {
    backgroundColor: "#FFF1F1",
    borderColor: colors.danger,
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.md
  }
});
