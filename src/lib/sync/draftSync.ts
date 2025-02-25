// // src/lib/sync/draftSync.ts

import { Tweet, ThreadWithTweets } from "@/types/tweet";
import { tweetStorage } from "@/utils/localStorage";

interface PendingSync {
  id: string;
  type: "tweet" | "thread";
  lastModified: Date;
}

class DraftSyncService {
  private static instance: DraftSyncService;
  private pendingSyncs: Map<string, PendingSync> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;
  private SYNC_INTERVAL = 15 * 1000; // 30 secs in milliseconds
  private isSyncing = false;

  private constructor() {
    this.startSyncInterval();
  }

  static getInstance(): DraftSyncService {
    if (!DraftSyncService.instance) {
      DraftSyncService.instance = new DraftSyncService();
    }
    return DraftSyncService.instance;
  }

  private startSyncInterval() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.syncPendingDrafts();
    }, this.SYNC_INTERVAL);
  }

  private async syncPendingDrafts() {
    if (this.isSyncing || this.pendingSyncs.size === 0) return;

    this.isSyncing = true;
    const syncsArray = Array.from(this.pendingSyncs.values());
    this.pendingSyncs.clear();

    try {
      for (const sync of syncsArray) {
        if (sync.type === "tweet") {
          const tweet = tweetStorage.getTweets().find((t) => t.id === sync.id);
          if (tweet && !tweet.threadId) {
            // Only sync standalone tweets
            await this.syncTweetToBackend(tweet);
          } else if (tweet && tweet.threadId) {
            // If it has a threadId, we should sync the entire thread instead
            const thread = tweetStorage.getThreadWithTweets(tweet.threadId);

            if (thread) {
              await this.syncThreadToBackend(thread);
              console.log("finished syncing thread to backend 1");
            }
          }
        } else {
          const tweet = tweetStorage.getTweets().find((t) => t.id === sync.id);
          if (tweet) {
            const thread = tweetStorage.getThreadWithTweets(tweet.threadId!);
            if (thread) {
              await this.syncThreadToBackend(thread);
              console.log("finished syncing thread to backend 2");
            }
          }
        }
      }
    } catch (error) {
      console.error("Error syncing drafts:", error);
      // Re-add failed syncs to the queue
      syncsArray.forEach((sync) => this.pendingSyncs.set(sync.id, sync));
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncTweetToBackend(tweet: Tweet) {
    try {
      const response = await fetch("/api/drafts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "tweet",
          data: tweet,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to sync tweet: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error syncing tweet to backend:", error);
      throw error;
    }
  }

  private async syncThreadToBackend(threadWithTweets: ThreadWithTweets) {
    try {
      const response = await fetch("/api/drafts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "thread",
          data: {
            id: threadWithTweets.id,
            tweetIds: threadWithTweets.tweetIds,
            createdAt: threadWithTweets.createdAt,
            status: threadWithTweets.status,
            scheduledFor: threadWithTweets.scheduledFor,
            tags: threadWithTweets.tags,
            tweets: threadWithTweets.tweets,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to sync thread: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error syncing thread to backend:", error);
      throw error;
    }
  }

  // Add this new method to your DraftSyncService class
  async fetchLatestDraft(
    id: string,
    type: "tweet" | "thread"
  ): Promise<boolean> {
    try {
      // Fetch the latest version from the backend
      const response = await fetch(`/api/drafts?type=${type}&id=${id}`);

      if (!response.ok) {
        console.error(`Failed to fetch latest ${type}: ${response.statusText}`);
        return false;
      }

      const serverData = await response.json();

      // For tweets, compare timestamps directly
      if (type === "tweet") {
        const localTweet = tweetStorage.getTweets().find((t) => t.id === id);

        if (!localTweet) {
          // If not in local storage, save the server version
          tweetStorage.saveTweet(serverData, false);
          return true;
        }

        // Compare timestamps - server data has updatedAt, local has lastModified
        const serverTime = new Date(serverData.updatedAt).getTime();
        const localTime = localTweet.lastSaved
          ? new Date(localTweet.lastSaved).getTime()
          : new Date(localTweet.createdAt).getTime();

        // If server is newer, update local
        if (serverTime > localTime) {
          tweetStorage.saveTweet(serverData, false);
          return true;
        }
      }
      // For threads, handle the thread and its tweets
      else if (type === "thread") {
        const localThread = tweetStorage.getThreadWithTweets(id);

        if (!localThread) {
          // If not in local storage, save the server version
          tweetStorage.saveThread(serverData.thread, serverData.tweets, false);
          return true;
        }

        // Compare timestamps
        const serverTime = new Date(serverData.thread.updatedAt).getTime();
        const localTime = new Date(
          localThread.lastModified || localThread.createdAt
        ).getTime();

        // If server is newer, update local
        if (serverTime > localTime) {
          tweetStorage.saveThread(serverData.thread, serverData.tweets, false);
          return true;
        }
      }

      return false; // No updates needed
    } catch (error) {
      console.error(`Error fetching latest ${type}:`, error);
      return false;
    }
  }

  queueForSync(id: string, type: "tweet" | "thread") {
    this.pendingSyncs.set(id, {
      id,
      type,
      lastModified: new Date(),
    });
  }

  async forceSyncNow() {
    await this.syncPendingDrafts();
  }

  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

export const draftSync = DraftSyncService.getInstance();
