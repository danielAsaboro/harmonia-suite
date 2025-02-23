// /app/api/team/invite/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyInviteToken } from "@/lib/utils/jwt";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "No token provided" },
        { status: 400 }
      );
    }

    const payload = verifyInviteToken(token);

    if (!payload) {
      return NextResponse.json(
        { valid: false, error: "Invalid or expired invite" },
        { status: 400 }
      );
    }

    // Get team details from database
    // const team = await getTeamById(payload.teamId);

    return NextResponse.json({
      valid: true,
      teamName: "Team Name", // Replace with actual team name
      role: payload.role,
    });
  } catch (error) {
    console.error("Error verifying invite:", error);
    return NextResponse.json(
      { valid: false, error: "Failed to verify invite" },
      { status: 500 }
    );
  }
}
