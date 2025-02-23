// /app/api/team/members/[memberId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserData } from "@/lib/session";
import { teamInvitesService } from "@/lib/services";

// Update member role
export async function PATCH(
  req: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const userData = await getUserData(req);
    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberId } = params;
    const { role, teamId } = await req.json();

    // Verify that the user making the request is an admin
    const isAdmin = await teamInvitesService.isTeamAdmin(
      teamId,
      userData.userId
    );
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only team admins can update member roles" },
        { status: 403 }
      );
    }

    await teamInvitesService.updateMemberRole(memberId, role);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating member role:", error);
    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 }
    );
  }
}

// Remove member from team
export async function DELETE(
  req: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const userData = await getUserData(req);
    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberId } = params;
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    // Verify that the user making the request is an admin
    const isAdmin = await teamInvitesService.isTeamAdmin(
      teamId,
      userData.userId
    );
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only team admins can remove members" },
        { status: 403 }
      );
    }

    await teamInvitesService.removeMember(memberId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing team member:", error);
    return NextResponse.json(
      { error: "Failed to remove team member" },
      { status: 500 }
    );
  }
}
