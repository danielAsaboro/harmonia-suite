// File: /app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    const tokens = session.get("twitter_session");
    const cookieStore = cookies();

    // Clear authentication cookies
    cookieStore.delete("twitter_session");
    cookieStore.delete("twitter_tokens");
    cookieStore.delete("twitter_auth_state");
    cookieStore.delete("codeVerifier");
    cookieStore.delete("state");
    cookieStore.delete("returnUrl");
    cookieStore.delete("onboarding_complete");

    // Clear session data
    session.set("twitter_session", "");
    session.set("twitter_tokens", "");
    session.set("codeVerifier", "");
    session.set("state", "");

    // Don't delete onboarding_complete or other non-auth cookies

    return NextResponse.json(
      {
        success: true,
        message: "Successfully logged out",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error during logout:", {
      error,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      errorStack: error instanceof Error ? error.stack : "No stack trace",
    });

    return NextResponse.json(
      {
        error: "Failed to logout",
        details:
          error instanceof Error ? error.message : "Unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
