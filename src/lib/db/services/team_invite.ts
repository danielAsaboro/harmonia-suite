// /lib/db/services/team_invite.ts
import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";

export class PrismaTeamInvitesService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  // Check if user is already a member of the team
  private async isExistingMember(
    teamId: string,
    userId: string
  ): Promise<boolean> {
    const membership = await this.prisma.team_members.findFirst({
      where: {
        teamId,
        userId,
      },
    });
    return !!membership;
  }

  // Create new invite
  async createInvite(invite: {
    teamId: string;
    email: string;
    role: string;
    token: string;
    createdBy: string;
    expiresAt: string;
  }): Promise<void> {
    await this.prisma.team_invites.create({
      data: {
        id: nanoid(),
        teamId: invite.teamId,
        email: invite.email,
        role: invite.role,
        token: invite.token,
        status: "pending",
        createdAt: new Date().toISOString(),
        expiresAt: invite.expiresAt,
        createdBy: invite.createdBy,
      },
    });
  }

  // Accept invite with multiple team membership handling
  async acceptInvite(token: string, userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const invite = await tx.team_invites.findUnique({
        where: { token },
      });

      if (!invite || invite.status !== "pending") {
        throw new Error("Invalid or expired invite");
      }

      // Even with multiple team membership allowed, we should check if they're
      // already a member to avoid duplicate memberships in the same team
      const isExisting = await this.isExistingMember(invite.teamId, userId);
      if (isExisting) {
        throw new Error("Already a member of this team");
      }

      // Update invite status
      await tx.team_invites.update({
        where: { token },
        data: {
          status: "accepted",
          acceptedAt: new Date().toISOString(),
          acceptedBy: userId,
        },
      });

      // Create new team membership
      await tx.team_members.create({
        data: {
          id: nanoid(),
          teamId: invite.teamId,
          userId: userId,
          role: invite.role,
          joinedAt: new Date().toISOString(),
        },
      });
    });
  }

  // Get all pending invites for a team
  async getTeamPendingInvites(teamId: string) {
    return this.prisma.team_invites.findMany({
      where: {
        teamId,
        status: "pending",
      },
      include: {
        creator: {
          select: {
            name: true,
            username: true,
            profileImageUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // Get pending invites by email
  async getPendingInvitesByEmail(email: string) {
    return this.prisma.team_invites.findMany({
      where: {
        email,
        status: "pending",
      },
      include: {
        team: true,
        creator: {
          select: {
            name: true,
            username: true,
          },
        },
      },
    });
  }

  // Get invite by token with team details
  async getInviteByToken(token: string) {
    return this.prisma.team_invites.findUnique({
      where: { token },
      include: {
        team: true,
        creator: {
          select: {
            name: true,
            username: true,
          },
        },
      },
    });
  }

  // Revoke an invite
  async revokeInvite(token: string): Promise<void> {
    await this.prisma.team_invites.update({
      where: { token },
      data: {
        status: "revoked",
      },
    });
  }

  // Cleanup expired invites
  async cleanupExpiredInvites(): Promise<void> {
    const now = new Date().toISOString();
    await this.prisma.team_invites.updateMany({
      where: {
        status: "pending",
        expiresAt: {
          lt: now,
        },
      },
      data: {
        status: "expired",
      },
    });
  }

  // Get all teams a user is a member of
  async getUserTeams(userId: string) {
    return this.prisma.team_members.findMany({
      where: { userId },
      include: {
        team: true,
      },
    });
  }

  // Get all members of a team
  async getTeamMembers(teamId: string) {
    return this.prisma.team_members.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            name: true,
            username: true,
            profileImageUrl: true,
          },
        },
      },
    });
  }

  // Check if user is a team admin
  async isTeamAdmin(teamId: string, userId: string): Promise<boolean> {
    const member = await this.prisma.team_members.findFirst({
      where: {
        teamId,
        userId,
        role: "admin",
      },
    });
    return !!member;
  }

  // Update member role
  async updateMemberRole(memberId: string, role: string): Promise<void> {
    await this.prisma.team_members.update({
      where: { id: memberId },
      data: { role },
    });
  }

  // Remove member from team
  async removeMember(memberId: string): Promise<void> {
    await this.prisma.team_members.delete({
      where: { id: memberId },
    });
  }

  // Get member by ID
  async getMemberById(memberId: string) {
    return this.prisma.team_members.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: {
            name: true,
            username: true,
            profileImageUrl: true,
          },
        },
      },
    });
  }
}

// Helper function to create the service
export function createTeamInvitesService(prismaClient?: PrismaClient) {
  const client = prismaClient || new PrismaClient();
  return new PrismaTeamInvitesService(client);
}
