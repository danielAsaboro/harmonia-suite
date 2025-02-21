// /app/signup/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import OnboardingFlow from "./OnboardingFlow";
import { OnboardingPreferences, SignupState } from "@/types/onboarding";
import TwitterAuthPage from "./TwitterSignup";

export default function SignupPage({}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [signUpState, setSignUpState] = useState<SignupState>({
    step: "initial",
  });
  const returnUrl = searchParams.get("returnUrl") || "/content/compose/twitter";
  const stage = searchParams.get("stage") || "/content/compose/twitter";

  // check if nigga is signed up already or not

  useEffect(() => {
    if (stage == "profile-setup") {
      setSignUpState({
        step: "profile-setup",
        user: {
          id: "1234567896",
          username: "dAsaboro8",
          name: "Daniel Asaboro",
          profile_image_url:
            "https://pbs.twimg.com/profile_images/1876697305820082176/EHRpaWvj_normal.jpg",
          verified: true,
          verified_type: "string",
          fetchedAt: Date.now(),
        },
      });
    }
  }, []);

  useEffect(() => {
    // Check for OAuth callback
    const token = searchParams.get("oauth_token");
    const verifier = searchParams.get("oauth_verifier");

    if (token && verifier) {
      handleTwitterCallback(token, verifier);
    }
  }, [searchParams]);

  const handleTwitterCallback = async (token: string, verifier: string) => {
    try {
      const response = await fetch("/api/auth/twitter/callback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, verifier }),
      });

      if (!response.ok) {
        throw new Error("Authentication failed");
      }

      const data = await response.json();
      setSignUpState({
        step: "profile-setup",
        user: data.user,
      });
    } catch (error) {
      setSignUpState((prev) => ({
        ...prev,
        error: "Failed to authenticate with Twitter",
      }));
    }
  };

  const handleOnboardingComplete = async (
    preferences: OnboardingPreferences
  ) => {
    try {
      const response = await fetch("/api/auth/complete-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          preferences,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to complete signup");
      }

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      setSignUpState((prev) => ({
        ...prev,
        error: "Failed to complete signup",
      }));
    }
  };

  if (signUpState.error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-500/10 text-red-500 p-4 rounded-lg max-w-md text-center">
          {signUpState.error}
          <button
            onClick={() => setSignUpState({ step: "initial" })}
            className="mt-4 text-sm text-red-400 hover:text-red-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (signUpState.step === "initial") {
    return <TwitterAuthPage />;
  }

  if (signUpState.step === "profile-setup" && signUpState.user) {
    return <OnboardingFlow user={signUpState.user} />;
  }

  return null;
}
