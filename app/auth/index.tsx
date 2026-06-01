import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { router } from "expo-router";

import { useMockAuth } from "@/features/auth/MockAuthContext";
import { AppText } from "@/shared/components/AppText";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { Screen } from "@/shared/components/Screen";
import { colors, spacing } from "@/shared/theme";

type AuthMode = "login" | "signup";

export default function AuthScreen() {
  const auth = useMockAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  function validateBase() {
    if (!email.trim()) {
      setMessage({ text: "Enter an email address.", tone: "error" });
      return false;
    }

    if (password.length < 4) {
      setMessage({ text: "Password must be at least 4 characters for this MVP.", tone: "error" });
      return false;
    }

    return true;
  }

  function handleLogin() {
    console.log("login pressed");
    if (!validateBase()) {
      return;
    }

    const result = auth.loginParent(email, password);

    if (!result.ok) {
      setMessage({ text: result.error ?? "Login failed.", tone: "error" });
      return;
    }

    setMessage({ text: "Logged in.", tone: "success" });
    router.replace(result.needsChild ? "/add-child" : "/parent");
  }

  function handleSignUp() {
    if (!fullName.trim()) {
      setMessage({ text: "Enter your full name.", tone: "error" });
      return;
    }

    if (!validateBase()) {
      return;
    }

    const result = auth.signUpParent({ email, fullName, password });

    if (!result.ok) {
      setMessage({ text: result.error ?? "Signup failed.", tone: "error" });
      return;
    }

    setMessage({ text: "Account created. Let's get your family set up.", tone: "success" });
    console.log("destination route", "/onboarding");
    router.replace("/onboarding");
  }

  function handleDemoParent() {
    auth.continueDemoParent();
    router.replace("/parent");
  }

  function handleDemoChild() {
    auth.continueDemoChild();
    router.replace("/child");
  }

  return (
    <Screen>
      <View style={styles.header}>
        <AppText color={colors.primaryDark} variant="caption">
          Bloom Family
        </AppText>
        <AppText variant="title">{mode === "login" ? "Welcome back" : "Create your parent account"}</AppText>
        <AppText color={colors.inkMuted}>
          Parents sign up first. Children are added as household profiles, so younger kids do not need email accounts.
        </AppText>
      </View>

      <View style={styles.modeRow}>
        <Button label="Login" onPress={() => setMode("login")} variant={mode === "login" ? "primary" : "secondary"} />
        <Button label="Sign up" onPress={() => setMode("signup")} variant={mode === "signup" ? "primary" : "secondary"} />
      </View>

      <Card>
        {mode === "signup" ? (
          <TextInput
            autoCapitalize="words"
            onChangeText={setFullName}
            placeholder="Parent full name"
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
            value={fullName}
          />
        ) : null}
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="Email"
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
          <View style={[styles.messageBox, message.tone === "success" ? styles.successBox : styles.errorBox]}>
            <AppText color={message.tone === "success" ? colors.success : colors.danger} variant="caption">
              {message.text}
            </AppText>
          </View>
        ) : null}

        {mode === "signup" ? (
          <Button icon="person-add" label="Sign up" onPress={handleSignUp} />
        ) : (
          <Button icon="log-in" label="Login" onPress={handleLogin} />
        )}
      </Card>

      <View style={styles.demoActions}>
        <Button icon="home" label="Continue as demo parent" onPress={handleDemoParent} variant="quiet" />
        <Button icon="sparkles" label="Continue as demo child" onPress={handleDemoChild} variant="quiet" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  demoActions: {
    gap: spacing.sm
  },
  errorBox: {
    backgroundColor: "#FFF1F1",
    borderColor: colors.danger
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
  messageBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.md
  },
  modeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  successBox: {
    backgroundColor: "#EAFBF2",
    borderColor: colors.success
  }
});
