// // /app/api/scheduler/schedule/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  draftTweetsService,
  draftThreadsService,
  scheduledThreadsService,
  scheduledTweetsService,
  userTokensService,
} from "@/lib/services";
import { cookies } from "next/headers";
import { prismaDb } from "@/lib/db/prisma_service";

// /app/api/scheduler/schedule/route.ts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, teamId } = body; // Extract teamId from request body

    // Get user tokens from cookie
    const cookieStore = cookies();
    const sessionData = cookieStore.get("twitter_session");

    if (!sessionData?.value) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const { tokens, userData } = JSON.parse(sessionData.value);

    // First, ensure user tokens exist in database
    try {
      await userTokensService.saveUserTokens({
        userId: userData.id,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(tokens.expiresAt).toISOString(),
        username: userData.username,
        name: userData.name,
        profileImageUrl: userData.profile_image_url,
      });
    } catch (error) {
      console.error("Error saving user tokens:", error);
      return NextResponse.json(
        { error: "Failed to save user authentication data" },
        { status: 500 }
      );
    }

    // If teamId is provided, verify that the user belongs to the team
    if (teamId) {
      const isTeamMember = await prismaDb.team_members.findFirst({
        where: {
          teamId: teamId,
          userId: userData.id,
        },
      });

      if (!isTeamMember) {
        return NextResponse.json(
          { error: "User is not a member of the specified team" },
          { status: 403 }
        );
      }
    }

    // After ensuring user tokens exist, proceed with content scheduling
    if (type === "thread") {
      const { thread, tweets } = body;

      // Add userId and teamId to thread and tweets
      const threadWithUser = {
        ...thread,
        userId: userData.id,
        teamId: teamId || null, // Include teamId if provided
      };

      const tweetsWithUser = tweets.map((tweet: any) => ({
        ...tweet,
        userId: userData.id,
        teamId: teamId || null, // Include teamId if provided
      }));

      try {
        // Save thread to SQLite
        await scheduledThreadsService.saveScheduledThread(threadWithUser);

        // Save all tweets from thread
        for (const tweet of tweetsWithUser) {
          await scheduledTweetsService.saveScheduledTweet(tweet);
        }
      } catch (error) {
        console.error("Error saving thread:", error);
        return NextResponse.json(
          { error: "Failed to save scheduled thread" },
          { status: 500 }
        );
      }
    } else {
      // Save single tweet with userId and teamId
      const { tweet } = body;
      const tweetWithUser = {
        ...tweet,
        userId: userData.id,
        teamId: teamId || null, // Include teamId if provided
      };

      try {
        await scheduledTweetsService.saveScheduledTweet(tweetWithUser);
      } catch (error) {
        console.error("Error saving tweet:", error);
        return NextResponse.json(
          { error: "Failed to save scheduled tweet" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error scheduling content:", error);
    return NextResponse.json(
      { error: "Failed to schedule content" },
      { status: 500 }
    );
  }
}

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();
//     const { type } = body;

//     // Get user tokens from cookie
//     const cookieStore =  cookies();
//     const sessionData = cookieStore.get("twitter_session");

//     if (!sessionData?.value) {
//       return NextResponse.json(
//         { error: "User not authenticated" },
//         { status: 401 }
//       );
//     }

//     const { tokens, userData } = JSON.parse(sessionData.value);

//     // First, ensure user tokens exist in database
//     try {
//       await userTokensService.saveUserTokens({
//         userId: userData.id,
//         accessToken: tokens.accessToken,
//         refreshToken: tokens.refreshToken,
//         expiresAt: new Date(tokens.expiresAt).toISOString(),
//         username: userData.username,
//         name: userData.name,
//         profileImageUrl: userData.profile_image_url,
//       });
//     } catch (error) {
//       console.error("Error saving user tokens:", error);
//       return NextResponse.json(
//         { error: "Failed to save user authentication data" },
//         { status: 500 }
//       );
//     }

//     // After ensuring user tokens exist, proceed with content scheduling
//     if (type === "thread") {
//       const { thread, tweets } = body;

//       // Add userId to thread and tweets
//       const threadWithUser = {
//         ...thread,
//         userId: userData.id,
//       };

//       const tweetsWithUser = tweets.map((tweet: any) => ({
//         ...tweet,
//         userId: userData.id,
//       }));

//       try {
//         // Save thread to SQLite
//         await scheduledThreadsService.saveScheduledThread(threadWithUser);

//         // Save all tweets from thread
//         for (const tweet of tweetsWithUser) {
//           await scheduledTweetsService.saveScheduledTweet(tweet);
//         }
//       } catch (error) {
//         console.error("Error saving thread:", error);
//         return NextResponse.json(
//           { error: "Failed to save scheduled thread" },
//           { status: 500 }
//         );
//       }
//     } else {
//       // Save single tweet with userId
//       const { tweet } = body;
//       const tweetWithUser = {
//         ...tweet,
//         userId: userData.id,
//       };

//       try {
//         await scheduledTweetsService.saveScheduledTweet(tweetWithUser);
//       } catch (error) {
//         console.error("Error saving tweet:", error);
//         return NextResponse.json(
//           { error: "Failed to save scheduled tweet" },
//           { status: 500 }
//         );
//       }
//     }

//     return NextResponse.json({ success: true });
//   } catch (error) {
//     console.error("Error scheduling content:", error);
//     return NextResponse.json(
//       { error: "Failed to schedule content" },
//       { status: 500 }
//     );
//   }
// }
