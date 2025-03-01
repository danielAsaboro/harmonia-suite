// /app/api/shared-draft/[token]/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  draftTweetsService,
  draftThreadsService,
  userTokensService,
  sharedDraftsService,
  sharedDraftCommentsService,
} from "@/lib/services";
import { getMediaUrls } from "@/utils/mediaUrl";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    console.log(" extracted token ", token);
    // First, get the shared draft info using the access token
    const sharedDraft = await sharedDraftsService.getSharedDraftByToken(token);

    if (!sharedDraft) {
      return NextResponse.json(
        { error: "Shared draft not found or expired" },
        { status: 404 }
      );
    }

    // Get the author's information from user_tokens
    const authorTokens = await userTokensService.getUserTokens(
      sharedDraft.creatorId
    );
    if (!authorTokens) {
      return NextResponse.json(
        { error: "Author information not found" },
        { status: 404 }
      );
    }

    // Then get the actual draft content based on type
    let draft;
    if (sharedDraft.draftType === "tweet") {
      draft = await draftTweetsService.getDraftTweet(
        sharedDraft.draftId,
        sharedDraft.creatorId
      );

      if (draft) {
        // Add signed URLs for media if present
        if (draft.media && draft.media.mediaIds.length > 0) {
          const mediaUrls = await getMediaUrls(
            draft.media.mediaIds,
            sharedDraft.creatorId
          );

          // Replace mediaIds with signed URLs directly
          draft = {
            ...draft,
            authorName: authorTokens.name,
            authorHandle: `@${authorTokens.username}`,
            authorProfileUrl: authorTokens.profileImageUrl,
            media: {
              ...draft.media,
              mediaIds: mediaUrls, // Replace mediaIds with signed URLs
            },
          };
        } else {
          draft = {
            ...draft,
            authorName: authorTokens.name,
            authorHandle: `@${authorTokens.username}`,
            authorProfileUrl: authorTokens.profileImageUrl,
          };
        }
      }
    } else {
      const threadData = await draftThreadsService.getDraftThread(
        sharedDraft.draftId,
        sharedDraft.creatorId
      );

      if (threadData) {
        // Process media URLs for each tweet in the thread
        const tweetsWithAuthor = await Promise.all(
          threadData.tweets
            .sort((a, b) => {
              // Handle null or undefined positions
              const posA =
                a.position === null || a.position === undefined
                  ? 0
                  : a.position;
              const posB =
                b.position === null || b.position === undefined
                  ? 0
                  : b.position;
              return posA - posB;
            })
            .map(async (tweet) => {
              if (tweet.media && tweet.media.mediaIds.length > 0) {
                const mediaUrls = await getMediaUrls(
                  tweet.media.mediaIds,
                  sharedDraft.creatorId
                );

                return {
                  ...tweet,
                  authorName: authorTokens.name,
                  authorHandle: `@${authorTokens.username}`,
                  authorProfileUrl: authorTokens.profileImageUrl,
                  media: {
                    ...tweet.media,
                    mediaIds: mediaUrls, // Replace mediaIds with signed URLs
                  },
                };
              } else {
                return {
                  ...tweet,
                  authorName: authorTokens.name,
                  authorHandle: `@${authorTokens.username}`,
                  authorProfileUrl: authorTokens.profileImageUrl,
                };
              }
            })
        );

        draft = {
          ...threadData.thread,
          tweets: tweetsWithAuthor,
          authorName: authorTokens.name,
          authorHandle: `@${authorTokens.username}`,
          authorProfileUrl: authorTokens.profileImageUrl,
        };
      }
    }

    if (!draft) {
      return NextResponse.json(
        { error: "Original draft not found or has been deleted" },
        { status: 404 }
      );
    }

    // Get comments if enabled
    const comments = sharedDraft.canComment
      ? await sharedDraftCommentsService.getComments(sharedDraft.id)
      : [];

    return NextResponse.json({
      draft,
      comments,
      canComment: sharedDraft.canComment,
      expiresAt: sharedDraft.expiresAt,
    });
  } catch (error) {
    console.error("Error fetching shared draft:", error);
    return NextResponse.json(
      { error: "Failed to fetch shared draft" },
      { status: 500 }
    );
  }
}
