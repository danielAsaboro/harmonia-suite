// // /utils/dataTransformers.ts
// import { ThreadWithTweets } from "@/types/tweet";
// import {
//   ScheduledItem,
//   ScheduledTweet,
//   ScheduledThread,
// } from "@/components/purgatory/Columns";
// import { DraftTweet, DraftThread } from "collection_lib/schema";

// // Estimate reading time based on content length
// export function estimateReadingTime(content: string): string {
//   const wordsPerMinute = 200;
//   const words = content.trim().split(/\s+/).length;
//   const minutes = Math.ceil(words / wordsPerMinute);
//   return `${minutes} min`;
// }

// // Transform a draft tweet to a scheduled item
// export function tweetToScheduledItem(
//   tweet: DraftTweet,
//   authorData: any
// ): ScheduledTweet {
//   return {
//     id: tweet.id,
//     type: "tweet",
//     author: {
//       id: tweet.userId,
//       name: authorData?.name || "Unknown",
//       handle: authorData?.username || "unknown",
//       profileUrl: authorData?.profile_image_url,
//     },
//     // For pending approvals, we'll use submittedAt from approval or current date
//     scheduledFor: new Date(tweet.updatedAt),
//     tags: tweet.tags || [],
//     content: tweet.content,
//     readingTime: estimateReadingTime(tweet.content),
//     status: tweet.status,
//     createdAt: new Date(tweet.createdAt),
//     lastModified: new Date(tweet.updatedAt),
//     mediaIds: tweet.mediaIds || [],
//   };
// }

// // Transform a draft thread to a scheduled item
// export function threadToScheduledItem(
//   threadData: { thread: DraftThread; tweets: DraftTweet[] },
//   authorData: any
// ): ScheduledThread {
//   const thread = threadData.thread;
//   const tweets = threadData.tweets;

//   // Combine all tweet content for the preview
//   const combinedContent = tweets.map((t) => t.content).join(" ");
//   const firstTweetContent = tweets[0]?.content || "";

//   return {
//     id: thread.id,
//     type: "thread",
//     author: {
//       id: thread.userId,
//       name: authorData?.name || "Unknown",
//       handle: authorData?.username || "unknown",
//       profileUrl: authorData?.profile_image_url,
//     },
//     scheduledFor: new Date(thread.updatedAt),
//     tags: thread.tags || [],
//     content: firstTweetContent,
//     readingTime: estimateReadingTime(combinedContent),
//     status: thread.status,
//     createdAt: new Date(thread.createdAt),
//     lastModified: new Date(thread.updatedAt),
//     threadTweets: tweets,
//     totalTweets: tweets.length,
//   };
// }

// /utils/dataTransformers.ts
import { Tweet } from "@/types/tweet";
import {
  ScheduledItem,
  ScheduledTweet,
  ScheduledThread,
} from "@/components/purgatory/Columns";

// Estimate reading time based on content length
export function estimateReadingTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min`;
}

// Transform a draft tweet to a scheduled item
export function tweetToScheduledItem(
  tweet: any,
  authorData: any
): ScheduledTweet {
  return {
    id: tweet.id,
    type: "tweet",
    author: {
      id: tweet.userId,
      name: authorData?.name || "Unknown",
      handle: authorData?.username || "unknown",
      profileUrl: authorData?.profile_image_url,
    },
    // For pending approvals, we'll use submittedAt from approval or current date
    scheduledFor: new Date(tweet.updatedAt),
    tags: tweet.tags || [],
    content: tweet.content,
    readingTime: estimateReadingTime(tweet.content),
    status: tweet.status,
    createdAt: new Date(tweet.createdAt),
    lastModified: new Date(tweet.updatedAt),
    mediaIds: tweet.mediaIds || [],
    // These will be set separately after fetching the shared draft info
    shareLink: undefined,
    sharedDraftToken: undefined,
  };
}

// Transform a draft thread to a scheduled item
export function threadToScheduledItem(
  threadData: { thread: any; tweets: any[] },
  authorData: any
): ScheduledThread {
  const thread = threadData.thread;
  const tweets = threadData.tweets;

  // Combine all tweet content for the preview
  const combinedContent = tweets.map((t) => t.content).join(" ");
  const firstTweetContent = tweets[0]?.content || "";

  return {
    id: thread.id,
    type: "thread",
    author: {
      id: thread.userId,
      name: authorData?.name || "Unknown",
      handle: authorData?.username || "unknown",
      profileUrl: authorData?.profile_image_url,
    },
    scheduledFor: new Date(thread.updatedAt),
    tags: thread.tags || [],
    content: firstTweetContent,
    readingTime: estimateReadingTime(combinedContent),
    status: thread.status,
    createdAt: new Date(thread.createdAt),
    lastModified: new Date(thread.updatedAt),
    threadTweets: tweets,
    totalTweets: tweets.length,
    // These will be set separately after fetching the shared draft info
    shareLink: undefined,
    sharedDraftToken: undefined,
  };
}

// Function to add share link information to scheduled items
export function addShareLinkToItem(
  item: ScheduledItem,
  shareLink?: string,
  sharedDraftToken?: string
): ScheduledItem {
  return {
    ...item,
    shareLink,
    sharedDraftToken,
  };
}
