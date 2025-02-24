// /app/api/team/invite/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyInviteToken } from "@/utils/jwt";
import { prismaDb } from "@/lib/db/prisma_service";

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

    // Get team details from database using the teamId from the payload
    const team = await prismaDb.teams.findUnique({
      where: { id: payload.teamId },
    });

    if (!team) {
      return NextResponse.json(
        { valid: false, error: "Team not found" },
        { status: 404 }
      );
    }

    // Get invite details to verify it's still valid
    const invite = await prismaDb.team_invites.findFirst({
      where: {
        token,
        status: "pending",
      },
    });

    if (!invite) {
      return NextResponse.json(
        { valid: false, error: "Invite not found or already used" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      teamName: team.name,
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
