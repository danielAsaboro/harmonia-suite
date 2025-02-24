// /app/api/team/invite/accept/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyInviteToken } from "@/utils/jwt";
import { teamInvitesService } from "@/lib/services";
import { getUserData } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const userData = await getUserData(req);
    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 400 });
    }

    const payload = verifyInviteToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired invite" },
        { status: 400 }
      );
    }

    try {
      // Accept invite using the service method
      await teamInvitesService.acceptInvite(token, userData.userId);

      return NextResponse.json({
        success: true,
        message: "Invite accepted successfully",
      });
    } catch (error) {
      console.error("Error accepting invite:", error);
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to accept invite",
          details: error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in invite acceptance:", error);
    return NextResponse.json(
      {
        error: "Unexpected error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
