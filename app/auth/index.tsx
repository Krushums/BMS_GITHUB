import { useState } from "react";
import { Alert, StyleSheet, TextInput, View } from "react-native";
import { router } from "expo-router";

import { useMockAuth } from "@/features/auth/MockAuthContext";
import { AppText } from "@/shared/components/AppText";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { Screen } from "@/shared/components/Screen";
import { colors, spacing } from "@/shared/theme";

export default function AuthScreen() {
  const auth = useMockAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function validateParentCredentials() {
    if (!email.trim()) {
      setErrorMessage("Enter an email address.");
      Alert.alert("Email needed", "Enter an email address.");
      return false;
    }

    if (password.length < 4) {
      setErrorMessage("Password must be at least 4 characters for the mock MVP login.");
      Alert.alert("Password needed", "Use a password with at least 4 characters.");
      return false;
    }

    setErrorMessage(null);
    return true;
  }

  function handleLogin() {
    console.log("login pressed");
    if (!validateParentCredentials()) {
      return;
    }

    const submittedEmail = email.trim();
    console.log("submitted email", submittedEmail);
    console.log("selected role", "parent");
    const result = auth.loginParent(submittedEmail, password);

    if (!result.ok) {
      const message = result.error ?? "No mock parent account found. Sign up first or use demo parent.";
      setErrorMessage(message);
      Alert.alert("Account not found", message);
      return;
    }

    const destination = result.needsHousehold ? "/household" : "/parent";
    console.log("destination route", destination);
    router.replace(destination);
  }

  function handleSignUp() {
    try {
      console.log("signup pressed");
      if (!fullName.trim()) {
        setErrorMessage("Enter your full name.");
        Alert.alert("Name needed", "Enter your full name.");
        return;
      }

      if (!validateParentCredentials()) {
        return;
      }

      const submittedEmail = email.trim();
      console.log("submitted email", submittedEmail);
      console.log("selected role", "parent");
      const result = auth.signUpParent({
        email: submittedEmail,
        fullName,
        password
      });

      if (!result.ok) {
        const message = result.error ?? "Signup failed in the mock auth flow.";
        setErrorMessage(message);
        Alert.alert("Signup failed", message);
        return;
      }

      console.log("mock user created");
      const destination = "/household";
      console.log("destination route", destination);
      router.replace(destination);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong during mock signup.";
      console.error("mock signup failed", error);
      setErrorMessage(message);
      Alert.alert("Signup failed", message);
    }
  }

  function handleDemoParent() {
    setErrorMessage(null);
    auth.continueDemoParent();
    router.replace("/parent");
  }

  function handleDemoChild() {
    setErrorMessage(null);
    auth.continueDemoChild();
    router.replace("/child");
  }

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title">Create your family space</AppText>
        <AppText color={colors.inkMuted}>Parents sign up first, then create the household and child profiles.</AppText>
      </View>

      <Card>
        <TextInput
          autoCapitalize="words"
          onChangeText={setFullName}
          placeholder="Parent full name"
          placeholderTextColor={colors.inkMuted}
          style={styles.input}
          value={fullName}
        />
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

        {errorMessage ? (
          <View style={styles.errorBox}>
            <AppText color={colors.danger} variant="caption">
              {errorMessage}
            </AppText>
          </View>
        ) : null}

        <Button icon="person-add" label="Sign up as parent" onPress={handleSignUp} />
        <Button icon="log-in" label="Login as parent" onPress={handleLogin} variant="secondary" />
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
    borderColor: colors.danger,
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.md
  },
  header: {
    gap: spacing.sm
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
  }
});
