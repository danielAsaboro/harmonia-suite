// /app/api/team/members/[memberId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserData } from "@/lib/session";
import { teamInvitesService } from "@/lib/services";
import { prismaDb } from "@/lib/db/prisma_service";

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

    // First, find the member record to get its teamId
    const memberRecord = await prismaDb.team_members.findUnique({
      where: { id: memberId },
      select: { teamId: true, userId: true },
    });

    if (!memberRecord) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    // Verify that the user making the request is an admin of this team
    const isAdmin = await prismaDb.team_members.findFirst({
      where: {
        teamId: memberRecord.teamId,
        userId: userData.userId,
        role: "admin",
      },
    });

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only team admins can remove members" },
        { status: 403 }
      );
    }

    // Prevent removing yourself (the last admin)
    if (memberRecord.userId === userData.userId) {
      // Check if you're the only admin
      const adminCount = await prismaDb.team_members.count({
        where: {
          teamId: memberRecord.teamId,
          role: "admin",
        },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot remove yourself as the last admin" },
          { status: 400 }
        );
      }
    }

    // Remove the member
    await prismaDb.team_members.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing team member:", error);
    return NextResponse.json(
      { error: "Failed to remove team member" },
      { status: 500 }
    );
  }
}
