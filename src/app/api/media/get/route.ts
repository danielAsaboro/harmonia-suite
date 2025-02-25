// In /app/api/media/get/route.ts
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { fileStorage } from "@/lib/storage";
import { FileStorageError } from "@/lib/storage/errors";

async function getUserId(request: NextRequest): Promise<string | null> {
  const session = await getSession(request);
  const twitterSession = session.get("twitter_session");

  if (!twitterSession) return null;

  try {
    const sessionData = JSON.parse(twitterSession);
    return sessionData.userData?.id || null;
  } catch (error) {
    console.error("Error parsing session:", error);
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("id");

    if (!fileId) {
      return NextResponse.json(
        { error: "No file ID provided" },
        { status: 400 }
      );
    }

    const fileData = await fileStorage.getFile(userId, fileId);

    // Create response with appropriate Content-Type based on file extension
    // This is crucial for proper display of images
    const contentType = getContentTypeFromFileName(fileId);

    return new NextResponse(fileData, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000", // Cache for a year
      },
    });
  } catch (error) {
    console.error("Error retrieving file:", error);

    if (error instanceof FileStorageError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to determine content type from filename
function getContentTypeFromFileName(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "mp3":
      return "audio/mpeg";
    default:
      return "application/octet-stream";
  }
}
