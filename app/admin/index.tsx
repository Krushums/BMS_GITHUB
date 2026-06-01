import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { router } from "expo-router";

import { useMockAuth } from "@/features/auth/MockAuthContext";
import { AppText } from "@/shared/components/AppText";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { Screen } from "@/shared/components/Screen";
import { colors, spacing } from "@/shared/theme";
import { formatDateTimeLabel } from "@/shared/utils/date";

export default function AdminScreen() {
  const auth = useMockAuth();
  const [email, setEmail] = useState("admin@bloom.local");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function handleAdminLogin() {
    const result = auth.adminLogin(email, password);

    if (!result.ok) {
      setMessage(result.error ?? "Admin login failed.");
      return;
    }

    setMessage(null);
  }

  function handleLogout() {
    auth.logout();
    router.replace("/admin");
  }

  if (!auth.currentAdmin) {
    return (
      <Screen>
        <View style={styles.header}>
          <AppText color={colors.primaryDark} variant="caption">
            Hidden development route
          </AppText>
          <AppText variant="title">Admin login</AppText>
          <AppText color={colors.inkMuted}>This local-only admin area is for testing mock accounts and family data.</AppText>
        </View>

        <Card>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="Admin email"
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
            value={email}
          />
          <TextInput
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.inkMuted}
            secureTextEntry
            style={styles.input}
            value={password}
          />
          {message ? (
            <View style={styles.errorBox}>
              <AppText color={colors.danger} variant="caption">
                {message}
              </AppText>
            </View>
          ) : null}
          <Button icon="shield-checkmark" label="Login as admin" onPress={handleAdminLogin} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <AppText color={colors.primaryDark} variant="caption">
          Development admin
        </AppText>
        <AppText variant="title">Mock product control room</AppText>
      </View>

      <Card>
        <AppText variant="heading">Registered families/accounts</AppText>
        <View style={styles.stack}>
          {auth.parents.map((parent) => {
            const household = auth.households.find((item) => item.createdBy === parent.id);
            const children = household ? auth.getChildrenForHousehold(household.id) : [];

            return (
              <View key={parent.id} style={styles.accountRow}>
                <View style={styles.rowCopy}>
                  <AppText variant="caption">{parent.fullName}</AppText>
                  <AppText color={colors.inkMuted} numberOfLines={1} variant="caption">
                    {parent.email}
                  </AppText>
                  <AppText color={colors.inkMuted} variant="caption">
                    {household?.name ?? "No household"} - {children.length} children
                  </AppText>
                  {parent.disabledAt ? (
                    <AppText color={colors.danger} variant="caption">
                      Disabled
                    </AppText>
                  ) : null}
                </View>
                <View style={styles.rowActions}>
                  <Button label="Disable" onPress={() => auth.disableAccount(parent.id)} variant="secondary" />
                  <Button label="Delete" onPress={() => auth.deleteAccount(parent.id)} variant="quiet" />
                </View>
              </View>
            );
          })}
        </View>
      </Card>

      <Card>
        <AppText variant="heading">Child profiles</AppText>
        <View style={styles.stack}>
          {auth.childProfiles.map((child) => (
            <View key={child.id} style={styles.simpleRow}>
              <AppText variant="caption">{child.displayName}</AppText>
              <AppText color={colors.inkMuted} variant="caption">
                @{child.username} - {child.starterAvatar ?? "No avatar"}
              </AppText>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <AppText variant="heading">Activity log</AppText>
        <View style={styles.stack}>
          {auth.activityLog.slice(0, 12).map((entry) => (
            <View key={entry.id} style={styles.simpleRow}>
              <AppText variant="caption">{entry.message}</AppText>
              <AppText color={colors.inkMuted} variant="caption">
                {formatDateTimeLabel(entry.createdAt)}
              </AppText>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <AppText variant="heading">Testing tools</AppText>
        <Button icon="refresh" label="Reset mock data" onPress={auth.resetMockData} variant="secondary" />
      </Card>

      <Button icon="log-out" label="Logout admin" onPress={handleLogout} style={styles.logoutButton} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  accountRow: {
    alignItems: "flex-start",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.md
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
  logoutButton: {
    backgroundColor: colors.danger,
    minHeight: 64
  },
  rowActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  rowCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 180
  },
  simpleRow: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    gap: spacing.xs,
    padding: spacing.md
  },
  stack: {
    gap: spacing.sm
  }
});
