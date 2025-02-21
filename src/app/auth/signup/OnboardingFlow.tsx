"use client";
import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, ArrowLeft } from "lucide-react";
import WelcomeStep from "./WelcomeStep";
import EmailVerification from "./EmailVerification";
import PreferencesStep from "./PreferencesStep";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useTransactionToast } from "@/components/ui/ui-layout";
import { useTwitterAccount } from "@/hooks/helm";
import toast from "react-hot-toast";

interface Preferences {
  emailNotifications: boolean;
  contentTypes: string[];
  timezone: string;
}

const OnboardingFlow: React.FC<{ user: TwitterUserData }> = ({ user }) => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<Preferences>({
    emailNotifications: true,
    contentTypes: ["tweets", "threads", "scheduled"],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [email, setEmail] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const transactionToast = useTransactionToast();
  const { registerAccount } = useTwitterAccount();

  const mutation = useMutation({
    mutationFn: async ({
      twitterId,
      twitterHandle,
    }: {
      twitterId: string;
      twitterHandle: string;
    }) => {
      //
      const result = await registerAccount(twitterId, twitterHandle);
      return result;
    },
    onSuccess: (signature) => {
      // Only show toast for successful transactions
      transactionToast(signature);
      toast.success(`@${user.username} is now being protected by helm`);
    },
    onError: (error) => {
      if (error.message === "User rejected the request.") {
        toast.error(
          "It seems you cancelled the request; Please feel free to skip this process till you are ready"
        );
      }
      if (error.message === "Error: One-time Operation already occurred") {
        router.push("/dashboard");
      }
      console.log(" in main program", error);
      toast.error(error.message || "Somthing terrible happened");
    },
  });

  const steps = [
    {
      title: "Welcome to Helm",
      description: "Let's get your account set up for success",
    },
    {
      title: "Email Setup",
      description: "Add and verify your email address",
    },
    {
      title: "Email Verification",
      description: "Enter the verification code sent to your email",
    },
    {
      title: "Content Preferences",
      description: "Choose what you want to manage with Helm",
    },
  ];

  const handleNavigation = (direction: "next" | "back") => {
    if (direction === "next") {
      // Don't allow proceeding to verification without email
      if (currentStep === 1 && !email) {
        return;
      }
      // Don't allow proceeding past verification until verified
      if (currentStep === 2 && !isEmailVerified) {
        return;
      }

      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    } else {
      setCurrentStep((prev) => Math.max(prev - 1, 0));
    }
  };

  const renderNavigationButtons = () => {
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === steps.length - 1;
    const isVerificationStep = currentStep === 2;

    // Don't show navigation buttons during verification
    if (isVerificationStep) return null;

    return (
      <div className="flex flex-col gap-3 w-full mt-6">
        <div className="flex gap-3 w-full">
          {!isFirstStep && (
            <Button
              onClick={() => handleNavigation("back")}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white"
            >
              <span className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </span>
            </Button>
          )}
          <Button
            onClick={() =>
              isLastStep
                ? (async () => {
                    console.log("Complete setup:", { ...preferences, email });

                    try {
                      await mutation.mutateAsync({
                        twitterId: user.id,
                        twitterHandle: user.username,
                      });
                      router.push("/dashboard");
                    } catch (error) {
                      //
                      console.log(" when does this get triggered?");
                    }
                  })()
                : handleNavigation("next")
            }
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            disabled={
              (currentStep === 1 && !email) ||
              (currentStep === 2 && !isEmailVerified)
            }
          >
            <span className="flex items-center gap-2">
              {isLastStep ? "Complete Setup" : "Continue"}
              <ArrowRight className="w-4 h-4" />
            </span>
          </Button>
        </div>
        {isLastStep && (
          <Button
            onClick={() => {
              console.log("Complete setup:", { ...preferences, email });
              // Redirect to dashboard
              router.push("/dashboard");
            }}
            variant="ghost"
            className="w-full text-gray-400 hover:text-gray-300"
          >
            Skip for now
          </Button>
        )}
      </div>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <WelcomeStep user={user} />
            {renderNavigationButtons()}
          </>
        );

      case 1:
        return (
          <>
            <div className="space-y-4">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-800"
              />
            </div>
            {renderNavigationButtons()}
          </>
        );

      case 2:
        return (
          <EmailVerification
            email={email}
            onVerified={() => {
              setIsEmailVerified(true);
              handleNavigation("next");
            }}
            onBack={() => handleNavigation("back")}
          />
        );

      case 3:
        return (
          <>
            <PreferencesStep
              contentTypes={preferences.contentTypes}
              onPreferencesChange={(types) =>
                setPreferences((prev) => ({ ...prev, contentTypes: types }))
              }
            />
            {renderNavigationButtons()}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border border-gray-800">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-gray-100">
            {steps[currentStep].title}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {steps[currentStep].description}
          </CardDescription>
        </CardHeader>
        <CardContent>{renderStep()}</CardContent>
      </Card>
    </div>
  );
};

export default OnboardingFlow;
