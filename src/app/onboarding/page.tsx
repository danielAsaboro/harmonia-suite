// /app/onboarding/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingFlow from "./OnboardingFlow";
import { SignupState } from "@/types/onboarding";
import { useTwitterAccount } from "@/hooks/helm";
import { useUserAccount } from "@/components/editor/context/account";

export default function OnboardingPage() {
  const router = useRouter();
  const user = useUserAccount();
  const { isRegistered, isRegisteredValue } = useTwitterAccount(user?.id);
  const [signupState, setSignupState] = useState<SignupState>({
    step: "initial",
  });
  const [isLoading, setIsLoading] = useState(true);

  console.log("OnboardingPage: Current user ID:", user?.id);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        if (!user?.id) {
          console.log("OnboardingPage: No user ID available yet");
          return;
        }

        // Check if onboarding is already complete via cookie
        const onboardingComplete = document.cookie
          .split("; ")
          .find((row) => row.startsWith("onboarding_complete="));

        // Check registration status
        const accountRegistered = await isRegistered();
        console.log(
          "OnboardingPage: Account registration status:",
          accountRegistered
        );

        if (onboardingComplete && accountRegistered) {
          console.log(
            "OnboardingPage: Onboarding complete or account registered, redirecting to dashboard"
          );
          router.replace("/dashboard");
          return;
        }

        // If not complete, fetch Twitter user data
        console.log("OnboardingPage: Fetching Twitter user data");
        const response = await fetch("/api/auth/twitter/user");
        if (!response.ok) throw new Error("Not authenticated");

        const userData = await response.json();
        console.log("OnboardingPage: Twitter user data retrieved:", userData);
        setSignupState({ step: "profile-setup", user: userData });
      } catch (error) {
        if (
          (error as Error).message.includes(
            "Account does not exist or has no data"
          )
        ) {
          // If not complete, fetch Twitter user data
          console.log("OnboardingPage: Fetching Twitter user data");
          const response = await fetch("/api/auth/twitter/user");
          if (!response.ok) throw new Error("Not authenticated");

          const userData = await response.json();
          console.log("OnboardingPage: Twitter user data retrieved:", userData);
          setSignupState({ step: "profile-setup", user: userData });
          //
          console.log(" user has not registered with wallet yet");
          return;
        }
        console.error("OnboardingPage: Error during onboarding check:", error);
        router.push("/auth/twitter");
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [user?.id, isRegistered]);

  // Show loading state while checking registration
  if (isLoading) {
    console.log("OnboardingPage: Still loading");
    return null;
  }

  return signupState.user ? <OnboardingFlow user={signupState.user} /> : null;
}
