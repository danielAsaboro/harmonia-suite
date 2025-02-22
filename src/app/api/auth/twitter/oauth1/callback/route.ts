// app/api/auth/twitter/oauth1/callback/route.ts
export const dynamic = "force-dynamic";
import { handleOAuth1Callback } from "@/lib/auth/twitter";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return handleOAuth1Callback(request);
}
