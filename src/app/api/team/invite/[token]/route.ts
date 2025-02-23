// /app/api/team/invite/[token]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { teamInvitesService } from "@/lib/services";
import { verifyInviteToken } from "@/lib/utils/jwt";
import { getUserData } from "@/lib/session";

// Verify invite token
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const payload = verifyInviteToken(token);

    if (!payload) {
      return NextResponse.json(
        { valid: false, error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    const invite = await teamInvitesService.getInviteByToken(token);
    if (!invite) {
      return NextResponse.json(
        { valid: false, error: "Invite not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      teamName: invite.team.name,
      role: invite.role,
    });
  } catch (error) {
    console.error("Error verifying invite:", error);
    return NextResponse.json(
      { valid: false, error: "Failed to verify invite" },
      { status: 500 }
    );
  }
}

// Accept invite
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const userData = await getUserData(req);
    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = params;

    await teamInvitesService.acceptInvite(token, userData.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error accepting invite:", error);
    const message =
      error instanceof Error ? error.message : "Failed to accept invite";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Revoke invite
export async function DELETE(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const userData = await getUserData(req);
    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = params;

    await teamInvitesService.revokeInvite(token);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revoking invite:", error);
    return NextResponse.json(
      { error: "Failed to revoke invite" },
      { status: 500 }
    );
  }
}
