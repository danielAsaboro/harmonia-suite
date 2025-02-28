// /lib/cron/scheduler.ts
import cron from "node-cron";
import { publishTweet, publishThread } from "../twitter/publisher";
import { logToFile, logError } from "../../utils/logger";
import {
  scheduledThreadsService,
  scheduledTweetsService,
  teamInvitesService,
} from "../services";

export function startScheduler() {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      logToFile("Starting scheduled publication check");

      const pendingTweets =
        await scheduledTweetsService.getPendingScheduledTweets(now);
      const pendingThreads =
        await scheduledThreadsService.getPendingScheduledThreads(now);

      // Process standalone tweets
      for (const tweet of pendingTweets) {
        if (!tweet.threadId) {
          try {
            // Make sure tweet has userId
            if (!tweet.userId) {
              throw new Error(`Tweet ${tweet.id} has no userId`);
            }

            await publishTweet(tweet);
            await scheduledTweetsService.updateTweetStatus(
              tweet.id,
              "published"
            );
            logToFile(`Successfully published tweet ${tweet.id}`);
          } catch (error) {
            logError(error, `Failed to publish tweet ${tweet.id}`);
            await scheduledTweetsService.updateTweetStatus(
              tweet.id,
              "failed",
              error instanceof Error ? error.message : "Unknown error"
            );
          }
        }
      }

      // Process threads
      for (const thread of pendingThreads) {
        try {
          // Get all tweets for this thread
          const threadTweets = pendingTweets
            .filter((t) => t.threadId === thread.id)
            .sort((a, b) => (a.position || 0) - (b.position || 0));

          // Make sure thread has userId and each tweet has userId
          if (!thread.userId) {
            throw new Error(`Thread ${thread.id} has no userId`);
          }

          // Ensure all tweets have the userId field
          threadTweets.forEach((tweet) => {
            if (!tweet.userId) {
              tweet.userId = thread.userId;
            }
          });

          await publishThread(thread, threadTweets);
          await scheduledThreadsService.updateThreadStatus(
            thread.id,
            "published"
          );

          threadTweets.forEach(async (tweet) => {
            await scheduledTweetsService.updateTweetStatus(
              tweet.id,
              "published"
            );
          });

          logToFile(
            `Successfully published thread ${thread.id} with ${threadTweets.length} tweets`
          );
        } catch (error) {
          logError(error, `Failed to publish thread ${thread.id}`);
          await scheduledThreadsService.updateThreadStatus(
            thread.id,
            "failed",
            error instanceof Error ? error.message : "Unknown error"
          );
        }
      }

      if (pendingTweets.length === 0 && pendingThreads.length === 0) {
        logToFile("No pending publications found");
      }
    } catch (error) {
      logError(error, "Scheduler error");
    }
  });

  logToFile("Tweet scheduler started");
}

// export function startScheduler() {
//   cron.schedule("* * * * *", async () => {
//     try {
//       const now = new Date();
//       logToFile("Starting scheduled publication check");
//       scheduledThreadsService;
//       const pendingTweets =
//         await scheduledTweetsService.getPendingScheduledTweets(now);
//       const pendingThreads =
//         await scheduledThreadsService.getPendingScheduledThreads(now);

//       // Process standalone tweets
//       for (const tweet of pendingTweets) {
//         if (!tweet.threadId) {
//           try {
//             await publishTweet(tweet);
//             await scheduledTweetsService.updateTweetStatus(
//               tweet.id,
//               "published"
//             );
//             logToFile(`Successfully published tweet ${tweet.id}`);
//           } catch (error) {
//             logError(error, `Failed to publish tweet ${tweet.id}`);
//             await scheduledTweetsService.updateTweetStatus(
//               tweet.id,
//               "failed",
//               error instanceof Error ? error.message : "Unknown error"
//             );
//           }
//         }
//       }

//       // Process threads
//       for (const thread of pendingThreads) {
//         try {
//           const threadTweets = pendingTweets
//             .filter((t) => t.threadId === thread.id)
//             .sort((a, b) => (a.position || 0) - (b.position || 0));

//           await publishThread(thread, threadTweets);
//           await scheduledThreadsService.updateThreadStatus(
//             thread.id,
//             "published"
//           );

//           threadTweets.forEach(async (tweet) => {
//             await scheduledTweetsService.updateTweetStatus(
//               tweet.id,
//               "published"
//             );
//           });

//           logToFile(
//             `Successfully published thread ${thread.id} with ${threadTweets.length} tweets`
//           );
//         } catch (error) {
//           logError(error, `Failed to publish thread ${thread.id}`);
//           await scheduledThreadsService.updateThreadStatus(
//             thread.id,
//             "failed",
//             error instanceof Error ? error.message : "Unknown error"
//           );
//         }
//       }

//       if (pendingTweets.length === 0 && pendingThreads.length === 0) {
//         logToFile("No pending publications found");
//       }
//     } catch (error) {
//       logError(error, "Scheduler error");
//     }
//   });

//   logToFile("Tweet scheduler started");
// }

export function startCleanupJobs() {
  // Run every hour
  cron.schedule("0 * * * *", async () => {
    try {
      await teamInvitesService.cleanupExpiredInvites();
    } catch (error) {
      console.error("Error cleaning up invites:", error);
    }
  });
}
