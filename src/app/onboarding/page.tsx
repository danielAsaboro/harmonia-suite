// // /app/onboarding/page.tsx

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingFlow from "./OnboardingFlow";
import { SignupState } from "@/types/onboarding";
import { useUserAccount } from "@/components/editor/context/account";
import toast from "react-hot-toast";

export interface OnboardingData {
  email: string | null;
  emailVerified: boolean;
  walletAddress: string | null;
  timezone: string | null;
  contentPreferences: any; // Defined as 'any' in the current implementation
  onboardingCompleted: boolean;
}

export default function OnboardingPage() {
  const router = useRouter();
  const user = useUserAccount();
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
        const onboardingData =
          (await onboardingResponse.json()) as OnboardingData;

        if (onboardingData.onboardingCompleted) {
          console.log("User has completed onboarding 🥰");
          const encodedReturnUrl = document.cookie
            .split("; ")
            .find((row) => row.startsWith("returnUrl="))
            ?.split("=")[1];
          if (encodedReturnUrl) {
            const returnUrl = decodeURIComponent(encodedReturnUrl);
            console.log(" and the returned url is: ", returnUrl);
            document.cookie = "onboarding_complete=true; path=/; SameSite=Lax";
            router.replace(returnUrl);
            return;
          }
        } else {
          console.log(
            "OnboardingPage: Account registration status:",
            onboardingData,
            "Onboarding completed:",
            onboardingData.onboardingCompleted
          );

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
        }
      } catch (error) {
        router.push("/auth/twitter");
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [user?.id, router]);

  // Show loading state while checking registration
  if (isLoading) {
    console.log("OnboardingPage: Still loading");
    return null;
  }

  return signupState.user ? <OnboardingFlow user={signupState.user} /> : null;
}
