// app/api/users/teams/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prismaDb } from "@/lib/db/prisma_service";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    const twitterSession = session.get("twitter_session");

    if (!twitterSession) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { userData } = JSON.parse(twitterSession);
    const userId = userData.id;

    // Get user's teams with member counts and recent activity
    const teams = await prismaDb.team_members.findMany({
      where: { userId },
      select: {
        team: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                members: true,
              },
            },
            members: {
              take: 5, // Get 5 most recent members
              orderBy: {
                joinedAt: "desc",
              },
              select: {
                role: true,
                user: {
                  select: {
                    name: true,
                    username: true,
                    profileImageUrl: true,
                  },
                },
              },
            },
            invites: {
              where: {
                status: "pending",
              },
              select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
              },
            },
          },
        },
        role: true,
      },
    });

    // Transform the data to include invites only for teams where user is admin
    const teamsWithFilteredData = teams.map((membership) => ({
      ...membership.team,
      role: membership.role,
      memberCount: membership.team._count.members,
      recentMembers: membership.team.members,
      pendingInvites:
        membership.role === "admin" ? membership.team.invites : [],
    }));

    return NextResponse.json(teamsWithFilteredData);
  } catch (error) {
    console.error("Error fetching user teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch user teams" },
      { status: 500 }
    );
  }
}

// Leave a team
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession(req);
    const twitterSession = session.get("twitter_session");

    if (!twitterSession) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { userData } = JSON.parse(twitterSession);
    const userId = userData.id;

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    // Check if user is the only admin
    const teamAdmins = await prismaDb.team_members.count({
      where: {
        teamId,
        role: "admin",
      },
    });

    const userRole = await prismaDb.team_members.findFirst({
      where: {
        teamId,
        userId,
      },
      select: {
        role: true,
      },
    });

    if (teamAdmins === 1 && userRole?.role === "admin") {
      return NextResponse.json(
        { error: "Cannot leave team: you are the only admin" },
        { status: 400 }
      );
    }

    // Find the member record first
    const memberRecord = await prismaDb.team_members.findFirst({
      where: {
        teamId,
        userId,
      },
    });

    if (!memberRecord) {
      return NextResponse.json(
        { error: "Team membership not found" },
        { status: 404 }
      );
    }

    // Remove user from team using the id
    await prismaDb.team_members.delete({
      where: {
        id: memberRecord.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error leaving team:", error);
    return NextResponse.json(
      { error: "Failed to leave team" },
      { status: 500 }
    );
  }
}
