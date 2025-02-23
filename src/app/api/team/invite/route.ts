// /app/api/team/invite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateInviteToken } from "@/lib/utils/jwt";
import { teamInvitesService } from "@/lib/services";
import { nanoid } from "nanoid";
import { EmailService } from "@/lib/email/emailService";
import { getUserData } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const userData = await getUserData(req);
    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, role, teamId } = await req.json();

    // Generate token for the invite
    const token = generateInviteToken({
      email,
      role,
      teamId,
      inviteId: nanoid(),
    });

    // Calculate expiry date (48 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    // Create invite record
    await teamInvitesService.createInvite({
      teamId,
      email,
      role,
      token,
      createdBy: userData.userId,
      expiresAt: expiresAt.toISOString(),
    });

    // Generate invite URL
    const inviteUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/team/join?token=${token}`;

    // Send invite email
    await EmailService.sendTeamInvite({
      email,
      inviterName: userData.userData.name,
      teamName: "Your Team", // You should fetch this from your team service
      role,
      inviteUrl,
      expiresIn: "48 hours",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating team invite:", error);
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 }
    );
  }
}

// Get pending invites for a team
export async function GET(req: NextRequest) {
  try {
    const userData = await getUserData(req);
    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    const invites = await teamInvitesService.getTeamPendingInvites(teamId);
    return NextResponse.json({ invites });
  } catch (error) {
    console.error("Error fetching invites:", error);
    return NextResponse.json(
      { error: "Failed to fetch invites" },
      { status: 500 }
    );
  }
}
