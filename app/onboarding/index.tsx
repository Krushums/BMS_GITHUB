import { router } from "expo-router";

import { useMockAuth } from "@/features/auth/MockAuthContext";
import { OnboardingCarousel } from "@/features/help/OnboardingCarousel";
import { parentGuideSlides } from "@/features/help/guides";
import { Screen } from "@/shared/components/Screen";

export default function OnboardingScreen() {
  const auth = useMockAuth();

  function finish() {
    auth.completeOnboarding();
    router.replace("/add-child");
  }

  if (!auth.currentParent) {
    router.replace("/auth");
    return null;
  }

  return (
    <Screen>
      <OnboardingCarousel finalLabel="Get started - add your first child" onFinish={finish} onSkip={finish} showSkip slides={parentGuideSlides} />
    </Screen>
  );
}
