// app/api/auth/twitter/oauth2/callback/route.ts
export const dynamic = "force-dynamic";
import { handleOAuth2Callback } from "@/lib/auth/twitter";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return handleOAuth2Callback(request);
}
