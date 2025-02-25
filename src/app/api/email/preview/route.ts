// /app/api/email/preview/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { TeamInviteEmail } from "@/lib/email/templates/teamInvite";
import { render } from "@react-email/render";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    // Get preview parameters from query
    const templateData = {
      inviterName: searchParams.get("inviterName") || "John Doe",
      teamName: searchParams.get("teamName") || "Demo Team",
      role: searchParams.get("role") || "admin",
      inviteUrl: searchParams.get("inviteUrl") || "http://example.com/invite",
      expiresIn: searchParams.get("expiresIn") || "48 hours",
    };

    // Render the email template to HTML
    const html = await render(TeamInviteEmail(templateData));

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Error previewing email:", error);
    return NextResponse.json(
      { error: "Failed to generate preview" },
      { status: 500 }
    );
  }
}
