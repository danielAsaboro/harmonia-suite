// // /app/onboarding/OnboardingFlow.tsx

"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OnboardingState, OnboardingStep, steps } from "@/types/onboarding";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { ArrowRight } from "lucide-react";
import { useTransactionToast } from "@/components/ui/ui-layout";
import { useTwitterAccount } from "@/hooks/helm";
import toast from "react-hot-toast";
import EmailVerification from "./EmailVerification";
import PreferencesStep from "./PreferencesStep";

const OnboardingFlow = ({ user }: { user: TwitterUserData }) => {
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  const transactionToast = useTransactionToast();
  const { registerAccount } = useTwitterAccount(user.id);

  // Initialize state with default values
  const [state, setState] = useState<OnboardingState>({
    currentStep: "welcome",
    isEmailVerified: false,
    preferences: {
      emailNotifications: true,
      contentTypes: ["tweets", "threads", "scheduled"],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  // Load saved onboarding state on mount
  useEffect(() => {
    const loadOnboardingState = async () => {
      try {
        const response = await fetch("/api/users/onboarding");
        if (response.ok) {
          const data = await response.json();
          if (data.onboardingCompleted) {
            router.push("/dashboard");
            return;
          }

          // Determine the correct step based on the data
          let currentStep: OnboardingStep = "welcome";
          if (data.walletAddress) {
            currentStep = "preferences";
          } else if (data.emailVerified) {
            currentStep = "wallet-connect";
          } else if (data.email) {
            currentStep = "email-verification";
          }

          // Update state with saved data
          setState((prev) => ({
            ...prev,
            currentStep,
            email: data.email,
            isEmailVerified: data.emailVerified || false,
            walletAddress: data.walletAddress || undefined,
            preferences: {
              emailNotifications:
                data.contentPreferences?.emailNotifications ??
                prev.preferences.emailNotifications,
              contentTypes:
                data.contentPreferences?.contentTypes ??
                prev.preferences.contentTypes,
              timezone: data.timezone || prev.preferences.timezone,
            },
          }));

          console.log("Loaded onboarding state, current step:", currentStep);
        }
      } catch (error) {
        console.error("Error loading onboarding state:", error);
      }
    };
    loadOnboardingState();
  }, [router]);

  const currentStep = steps.find((s) => s.id === state.currentStep)!;

  const updateOnboardingData = async (
    data: Partial<OnboardingState>,
    complete = false
  ) => {
    try {
      console.log("Updating onboarding data:", {
        ...data,
        completeOnboarding: complete,
      });
      const response = await fetch("/api/users/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          completeOnboarding: complete,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update onboarding data");
      }

      // Log success for debugging
      console.log("Successfully updated onboarding data");

      // If we're marking as complete, also update local state
      if (complete) {
        setState((prev) => ({
          ...prev,
          // Any additional state updates needed
        }));
      }
    } catch (error) {
      console.error("Error updating onboarding:", error);
      toast.error("Failed to save your preferences");
    }
  };

  const handleNext = async () => {
    const stepIndex = steps.findIndex((s) => s.id === state.currentStep);

    if (stepIndex === steps.length - 1) {
      try {
        // Register account on the blockchain
        const signature = await registerAccount(user.id, user.username);
        transactionToast(signature);

        // Save final onboarding data - explicitly set the complete flag
        await updateOnboardingData(
          {
            preferences: state.preferences,
            walletAddress: publicKey?.toBase58(),
          },
          true // This explicitly marks onboarding as complete
        );

        toast.success(`@${user.username} is now being protected by helm`);
        router.push("/dashboard");
      } catch (error: any) {
        if (error.message === "User rejected the request.") {
          toast.error(
            "It seems you cancelled the request; Please feel free to skip this process till you are ready"
          );
        } else if (
          error.message === "Error: One-time Operation already occurred"
        ) {
          // User is already registered, just mark onboarding as complete and proceed
          await updateOnboardingData({}, true);
          router.push("/dashboard");
        } else {
          console.error("Complete setup error:", error);
          toast.error(error.message || "Something went wrong during setup");
        }
      }
      return;
    }

    const nextStep = steps[stepIndex + 1].id as OnboardingStep;
    setState((prev) => ({ ...prev, currentStep: nextStep }));

    // Save progress after each step
    if (state.currentStep === "email") {
      await updateOnboardingData({ email: state.email });
    } else if (state.currentStep === "wallet-connect" && publicKey) {
      await updateOnboardingData({ walletAddress: publicKey.toBase58() });
    }
  };

  const updateEmail = (email: string) => {
    setState((prev) => ({ ...prev, email }));
  };

  const updatePreferences = (
    contentTypes: ("tweets" | "threads" | "scheduled")[]
  ) => {
    setState((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, contentTypes },
    }));
    // Save preferences immediately
    updateOnboardingData({
      preferences: {
        ...state.preferences,
        contentTypes,
      },
    });
  };

  const handleEmailVerified = async () => {
    try {
      // Call email verification endpoint
      const response = await fetch("/api/users/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verifyEmail: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to verify email");
      }

      setState((prev) => ({
        ...prev,
        isEmailVerified: true,
        currentStep: "wallet-connect" as OnboardingStep,
      }));
    } catch (error) {
      console.error("Error verifying email:", error);
      toast.error("Failed to verify your email");
    }
  };

  const renderContent = () => {
    switch (state.currentStep) {
      case "welcome":
        return (
          <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg">
            <img
              src={user.profile_image_url}
              alt={user.name}
              className="w-12 h-12 rounded-full"
            />
            <div>
              <p className="font-medium text-gray-100">{user.name}</p>
              <p className="text-sm text-gray-400">@{user.username}</p>
            </div>
          </div>
        );

      case "email":
        return (
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="Enter your email"
              value={state.email || ""}
              onChange={(e) => updateEmail(e.target.value)}
              className="w-full bg-gray-800"
            />
          </div>
        );

      case "email-verification":
        return (
          <EmailVerification
            email={state.email || ""}
            onVerified={handleEmailVerified}
            onBack={() =>
              setState((prev) => ({ ...prev, currentStep: "email" }))
            }
          />
        );

      case "wallet-connect":
        return (
          <div className="space-y-4">
            <WalletMultiButton className="w-full !bg-blue-600 hover:!bg-blue-700" />
          </div>
        );

      case "preferences":
        return (
          <PreferencesStep
            contentTypes={state.preferences.contentTypes}
            onPreferencesChange={updatePreferences}
          />
        );
    }
  };

  const canProceed = () => {
    switch (state.currentStep) {
      case "email":
        return !!state.email;
      case "email-verification":
        return state.isEmailVerified;
      case "wallet-connect":
        return connected;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border border-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-100">
            {currentStep.title}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {currentStep.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderContent()}

          {state.currentStep !== "email-verification" && (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {state.currentStep === "preferences"
                ? "Complete Setup"
                : "Continue"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingFlow;
