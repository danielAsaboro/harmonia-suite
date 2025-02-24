// /types/onboarding.ts
import { TwitterUserData } from "./tweet";

export type ContentType = "tweets" | "threads" | "scheduled";

// Auth and API response types
export interface TwitterAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: TwitterUserData;
}

// Core onboarding step types
export type OnboardingStep =
  | "welcome"
  | "email"
  | "email-verification"
  | "wallet-connect"
  | "preferences";

// Initial signup/auth state
export interface SignupState {
  step: "initial" | "twitter-auth" | "profile-setup" | "complete";
  user?: TwitterUserData;
  error?: string;
}

// Main onboarding state
export interface OnboardingState {
  currentStep: OnboardingStep;
  email?: string;
  isEmailVerified: boolean;
  walletAddress?: string;
  preferences: OnboardingPreferences;
}

// Preferences structure
export interface OnboardingPreferences {
  emailNotifications: boolean;
  contentTypes: ContentType[];
  timezone: string;
}

// Email verification states
export type VerificationStatus =
  | "idle"
  | "sending"
  | "sent"
  | "verifying"
  | "verified"
  | "error";

// Email verification data structure
export interface EmailVerificationData {
  email: string;
  code?: string;
  expiresAt?: number;
  attempts?: number;
}

// Step configuration
export const steps = [
  {
    id: "welcome",
    title: "Welcome to Helm",
    description: "Let's get your account set up for success",
  },
  {
    id: "email",
    title: "Email Setup",
    description: "Add and verify your email address",
  },
  {
    id: "email-verification",
    title: "Email Verification",
    description: "Enter the verification code sent to your email",
  },
  {
    id: "wallet-connect",
    title: "Connect Wallet",
    description: "Connect your Solana wallet to protect your account",
  },
  {
    id: "preferences",
    title: "Content Preferences",
    description: "Choose what you want to manage with Helm",
  },
];
