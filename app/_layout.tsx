import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { MockAuthProvider } from "@/features/auth/MockAuthContext";
import { GameplayProvider } from "@/features/gameplay/GameplayContext";
import { PreviewModeProvider } from "@/shared/components/PreviewModeContext";
import { PreviewModeShell } from "@/shared/components/PreviewModeShell";
import { colors } from "@/shared/theme";

export default function RootLayout() {
  return (
    <MockAuthProvider>
      <GameplayProvider>
        <PreviewModeProvider>
          <PreviewModeShell>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                contentStyle: { backgroundColor: colors.background },
                headerShadowVisible: false,
                headerStyle: { backgroundColor: colors.background },
                headerTitleStyle: { color: colors.ink, fontWeight: "800" }
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="auth/index" options={{ headerShown: false }} />
              <Stack.Screen name="household/index" options={{ title: "Household" }} />
              <Stack.Screen name="parent/index" options={{ title: "Parent dashboard" }} />
              <Stack.Screen name="child/index" options={{ title: "My day" }} />
              <Stack.Screen name="tasks/index" options={{ title: "Tasks" }} />
              <Stack.Screen name="rewards/index" options={{ title: "Rewards" }} />
              <Stack.Screen name="review/index" options={{ title: "Review" }} />
              <Stack.Screen name="profile/index" options={{ title: "Profile" }} />
            </Stack>
          </PreviewModeShell>
        </PreviewModeProvider>
      </GameplayProvider>
    </MockAuthProvider>
  );
}
