// /components/editor/context/account.tsx
"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  JSX,
  useCallback,
} from "react";
import { User, UserSquare2, Loader2 } from "lucide-react";
import { tweetStorage } from "@/utils/localStorage";
import Image from "next/image";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

interface TeamMembership {
  team: {
    id: string;
    name: string;
    members: {
      role: string;
      userId: string;
      user: {
        name: string;
        username: string;
        profileImageUrl: string | null;
      };
    }[];
  };
  role: string;
}

interface UserAccountType {
  id: string;
  name: string;
  handle: string;
  profileImageUrl: string;
  verified: boolean;
  verifiedType: string | null;
  email?: string;
  emailVerified?: boolean;
  walletAddress?: string;
  timezone?: string;
  contentPreferences?: any;
  teamMemberships: TeamMembership[];
  isLoading: boolean;
  error?: string;
  reloadUserData?: () => void;
  getAvatar: () => JSX.Element;
}

// Define a separate type for state without the getAvatar function
type UserAccountState = Omit<UserAccountType, "getAvatar">;

const UserAccountContext = createContext<UserAccountType | undefined>(
  undefined
);

export function UserAccountProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [count, setCount] = useState(0);
  // Loading avatar component
  const LoadingAvatar = () => (
    <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center animate-pulse">
      <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
    </div>
  );

  // Error avatar component
  const ErrorAvatar = () => (
    <div className="w-12 h-12 rounded-full bg-red-900/20 border-2 border-red-500/20 flex items-center justify-center">
      <UserSquare2 className="w-6 h-6 text-red-500/50" />
    </div>
  );

  // Default avatar component
  const DefaultAvatar = () => (
    <div className="w-12 h-12 rounded-full bg-gray-800/50 border-2 border-gray-700 flex items-center justify-center">
      <User className="w-6 h-6 text-gray-600" />
    </div>
  );

  // Use the state type in useState
  const [userAccount, setUserAccount] = useState<UserAccountState>({
    id: "",
    name: "",
    handle: "",
    profileImageUrl: "",
    verified: false,
    verifiedType: null,
    isLoading: true,
    teamMemberships: [],
  });

  const fetchUserData = useCallback(async () => {
    try {
      // First check localStorage
      const cachedDetails = tweetStorage.getUserDetails();

      if (
        cachedDetails &&
        cachedDetails.cachedAt &&
        Date.now() - cachedDetails.cachedAt < ONE_DAY_MS
      ) {
        setUserAccount({
          id: cachedDetails.id,
          name: cachedDetails.name,
          handle: `@${cachedDetails.handle}`,
          profileImageUrl: cachedDetails.profileImageUrl,
          verified: cachedDetails.verified,
          verifiedType: cachedDetails.verifiedType,
          email: cachedDetails.email,
          emailVerified: cachedDetails.emailVerified,
          walletAddress: cachedDetails.walletAddress,
          timezone: cachedDetails.timezone,
          contentPreferences: cachedDetails.contentPreferences,
          teamMemberships: cachedDetails.teamMemberships!,
          isLoading: false,
        });
        return;
      } else {
        console.log("Cache expired or not found, making request");
        const response = await fetch("/api/users/profile");
        setCount((prev) => prev + 1);
        if (!response.ok) {
          throw new Error("Failed to get user profile data");
        }

        const profileData = await response.json();

        console.log("profile data received:", profileData);

        const userDetails = {
          id: profileData.userId,
          name: profileData.name,
          handle: profileData.username,
          profileImageUrl: profileData.profileImageUrl,
          verified: profileData.verified || false,
          verifiedType: profileData.verifiedType || null,
          email: profileData.email,
          emailVerified: profileData.emailVerified,
          walletAddress: profileData.walletAddress,
          timezone: profileData.timezone || "UTC",
          contentPreferences: profileData.contentPreferences,
          teamMemberships: profileData.teamMemberships,
        };

        // Save to localStorage
        tweetStorage.saveUserDetails(userDetails);

        setUserAccount({
          ...userDetails,
          handle: `@${userDetails.handle}`,
          isLoading: false,
        });
      }
    } catch (error) {
      setUserAccount((prevState) => ({
        ...prevState,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load user profile data",
      }));
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    const checkAndRefreshToken = async () => {
      const tokens = localStorage.getItem("twitter_tokens");
      if (!tokens) return;

      const parsedTokens = JSON.parse(tokens);
      const expiresAt = parsedTokens.expiresAt;

      // If token expires in less than 5 minutes, refresh it
      if (Date.now() >= expiresAt - 5 * 60 * 1000) {
        try {
          const response = await fetch("/api/auth/twitter/refresh", {
            method: "POST",
          });

          if (response.ok) {
            const newTokens = await response.json();
            localStorage.setItem("twitter_tokens", JSON.stringify(newTokens));
          }
        } catch (error) {
          console.error("Error refreshing token:", error);
        }
      }
    };

    checkAndRefreshToken();
    const interval = setInterval(checkAndRefreshToken, 4 * 60 * 1000); // Check every 4 minutes

    return () => clearInterval(interval);
  }, []);

  const getAvatar = () => {
    if (userAccount.isLoading) return <LoadingAvatar />;
    if (userAccount.error) return <ErrorAvatar />;
    if (!userAccount.profileImageUrl) return <DefaultAvatar />;

    return (
      <Image
        src={userAccount.profileImageUrl}
        alt={userAccount.name}
        width={48}
        height={48}
        className="w-12 h-12 rounded-full border-2 border-gray-700 hover:border-blue-500 transition-colors duration-200"
      />
    );
  };

  const contextValue: UserAccountType = {
    ...userAccount,
    reloadUserData: fetchUserData,
    getAvatar,
  };

  return (
    <UserAccountContext.Provider value={contextValue}>
      {children}
    </UserAccountContext.Provider>
  );
}

export function useUserAccount() {
  const context = useContext(UserAccountContext);
  if (context === undefined) {
    throw new Error("useUserAccount must be used within a UserAccountProvider");
  }
  return context;
}
