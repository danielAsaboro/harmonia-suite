// /types/team.ts
export type TeamRole = "admin" | "creator";

export interface TeamInvite {
  id: string;
  email: string;
  role: TeamRole;
  teamId: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  createdAt: string;
  expiresAt: string;
  token: string;
}

export interface CreateTeamInviteRequest {
  email: string;
  role: TeamRole;
  teamId: string;
}

export interface SendInviteResponse {
  success: boolean;
  invite?: TeamInvite;
  error?: string;
}
