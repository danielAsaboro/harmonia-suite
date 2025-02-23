// /app/api/team/invite/accept/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyInviteToken } from "@/lib/utils/jwt";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 400 });
    }

    const payload = verifyInviteToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired invite" },
        { status: 400 }
      );
    }

    // TODO: Add member to team in database
    // TODO: Mark invite as accepted
    // TODO: Create user account if needed

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error accepting invite:", error);
    return NextResponse.json(
      { error: "Failed to accept invite" },
      { status: 500 }
    );
  }
}
