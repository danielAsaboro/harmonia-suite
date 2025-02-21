// /types/onboarding.ts

import { TwitterUserData } from "./tweet";

export interface TwitterAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: TwitterUserData;
}

export interface SignupState {
  step:
    | "initial"
    | "twitter-auth"
    | "profile-setup"
    | "preferences"
    | "complete";
  user?: TwitterUserData;
  error?: string;
}

export interface OnboardingPreferences {
  emailNotifications: boolean;
  contentTypes: ("tweets" | "threads" | "scheduled")[];
  timezone: string;
}

export interface UserProfile extends TwitterUserData {
  email?: string;
  preferences: OnboardingPreferences;
  createdAt: string;
  lastLoginAt: string;
}
