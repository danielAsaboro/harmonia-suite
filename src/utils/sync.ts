import { Tweet } from "@/types/tweet";
import { tweetStorage } from "./localStorage";

export async function syncAllDraftsFromServer() {
  try {
    const response = await fetch("/api/drafts");

    if (!response.ok) {
      throw new Error("Failed to fetch drafts from server");
    }

    const data = await response.json();

    console.dir(data, { depth: null });
    // Process tweets
    if (data.tweets && Array.isArray(data.tweets)) {
      data.tweets.forEach((tweet: Tweet) => {
        tweetStorage.saveTweet(tweet, false);
      });
    }

    // Process threads
    if (data.threads && Array.isArray(data.threads)) {
      data.threads.forEach((threadData) => {
        console.log(" checking thread data", threadData);
        tweetStorage.saveThread(threadData.thread, threadData.tweets, false);
      });
    }

    console.log("Successfully synced all drafts from server");
    return true;
  } catch (error) {
    console.error("Error syncing drafts from server:", error);
    return false;
  }
}
