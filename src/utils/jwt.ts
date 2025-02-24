// /lib/utils/jwt.ts
import { TeamRole } from "@/types/team";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export interface InviteTokenPayload {
  email: string;
  role: TeamRole;
  teamId: string;
  inviteId: string;
}

export function generateInviteToken(payload: InviteTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "48h",
  });
}

export function verifyInviteToken(token: string): InviteTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as InviteTokenPayload;
  } catch (error) {
    return null;
  }
}
