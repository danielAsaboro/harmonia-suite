// // /app/onboarding/page.tsx

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingFlow from "./OnboardingFlow";
import { SignupState } from "@/types/onboarding";
import { useTwitterAccount } from "@/hooks/helm";
import { useUserAccount } from "@/components/editor/context/account";
import toast from "react-hot-toast";

export default function OnboardingPage() {
  const router = useRouter();
  const user = useUserAccount();
  const { isRegistered } = useTwitterAccount(user?.id);
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

        // Check if onboarding is already complete via API instead of just cookie
        const onboardingResponse = await fetch("/api/users/onboarding");
        const onboardingData = await onboardingResponse.json();

        const accountRegistered = await isRegistered();
        console.log(
          "OnboardingPage: Account registration status:",
          accountRegistered,
          "Onboarding completed:",
          onboardingData.onboardingCompleted
        );

        if (onboardingData.onboardingCompleted && accountRegistered) {
          console.log(
            "OnboardingPage: Onboarding complete and account registered, redirecting to dashboard"
          );
          router.replace("/dashboard");
          return;
        }

        // If not complete, fetch user profile data from the new endpoint
        console.log("OnboardingPage: Fetching user profile data");
        const response = await fetch("/api/users/profile");
        if (!response.ok) throw new Error("Not authenticated");

        const userData = await response.json();
        console.log("OnboardingPage: User profile data retrieved:", userData);
        setSignupState({
          step: "profile-setup",
          user: {
            id: userData.userId,
            name: userData.name,
            username: userData.username,
            profile_image_url: userData.profileImageUrl,
            verified: userData.verified,
            verified_type: userData.verifiedType,
            fetchedAt: Date.now(),
          },
        });
      } catch (error) {
        if (
          (error as Error).message.includes(
            "Account does not exist or has no data"
          )
        ) {
          // If not registered, fetch user profile data
          try {
            const response = await fetch("/api/users/profile");
            if (!response.ok) throw new Error("Not authenticated");

            const userData = await response.json();
            console.log(
              "OnboardingPage: User profile data retrieved:",
              userData
            );
            console.log(userData.username);
            setSignupState({
              step: "profile-setup",
              user: {
                id: userData.userId,
                name: userData.name,
                username: userData.username,
                profile_image_url: userData.profileImageUrl,
                verified: userData.verified,
                verified_type: userData.verifiedType,
                fetchedAt: Date.now(),
              },
            });
            console.log("User has not registered with wallet yet");
          } catch (profileError) {
            console.error("Error fetching profile:", profileError);
            router.push("/auth/twitter");
          }
          return;
        }
        console.error("OnboardingPage: Error during onboarding check:", error);

        if ((error as Error).message.includes("Failed to fetch")) {
          toast.error(
            "There's a problem connecting with the Solana network at the moment"
          );
          return;
        }
        router.push("/auth/twitter");
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [user?.id, isRegistered, router]);

  // Show loading state while checking registration
  if (isLoading) {
    console.log("OnboardingPage: Still loading");
    return null;
  }

  return signupState.user ? <OnboardingFlow user={signupState.user} /> : null;
}
