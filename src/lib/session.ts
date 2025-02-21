// lib/session.ts
import { cookies } from "next/headers";
import { type NextRequest } from "next/server";

export async function getSession(request: NextRequest) {
  const cookieStore = await cookies();

  return {
    get: (key: string) => {
      return cookieStore.get(key)?.value;
    },
    set: (key: string, value: string) => {
      cookieStore.set(key, value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    },
    update: async (key: string, value: string) => {
      // Remove existing cookie first
      cookieStore.delete(key);

      // Set new value
      cookieStore.set(key, value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    },
  };
}

export async function getUserFromSession(): Promise<TwitterUserData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("twitter_session");

  if (!sessionCookie?.value) return null;

  try {
    const sessionData = JSON.parse(sessionCookie.value) as TwitterSessionData;
    return sessionData.userData;
  } catch {
    return null;
  }
}

export async function getUserData(request: NextRequest): Promise<{
  userId: string;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
  };
  userData: {
    id: string;
    name: string;
    username: string;
    profile_image_url: string;
    verified: boolean;
    verified_type: string;
  };
} | null> {
  const session = await getSession(request);
  const twitterSession = session.get("twitter_session");

  if (!twitterSession) return null;

  try {
    const sessionData = JSON.parse(twitterSession);

    if (!sessionData.userData?.id || !sessionData.tokens) return null;

    return {
      userId: sessionData.userData.id,
      tokens: sessionData.tokens,
      userData: sessionData.userData,
    };
  } catch (error) {
    console.error("Error parsing session:", error);
    return null;
  }
}
