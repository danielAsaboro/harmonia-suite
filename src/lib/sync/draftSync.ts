// /lib/sync/draftSync.ts

import { Tweet, ThreadWithTweets } from "@/types/tweet";
import { tweetStorage } from "@/utils/localStorage";

interface PendingSync {
  id: string;
  type: "tweet" | "thread";
  lastModified: Date;
  priority: number; // Higher number means higher priority
}

class DraftSyncService {
  private static instance: DraftSyncService;
  private pendingSyncs: Map<string, PendingSync> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;
  private SYNC_INTERVAL = 15 * 1000; // 15 secs in milliseconds
  private isSyncing = false;
  private syncQueue: Array<string> = []; // Queue of operation IDs

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

    try {
      // Sort syncs by priority (descending)
      const syncsArray = Array.from(this.pendingSyncs.values()).sort(
        (a, b) => b.priority - a.priority
      );

      // Process high priority items first
      for (const sync of syncsArray) {
        const syncKey = `${sync.type}_${sync.id}`;

        try {
          // Add to sync queue to track ongoing operations
          this.syncQueue.push(syncKey);

          // Process based on type
          if (sync.type === "tweet") {
            const tweet = tweetStorage
              .getTweets()
              .find((t) => t.id === sync.id);

            // Skip syncing if the tweet is submitted or pending approval
            if (
              tweet &&
              !tweet.threadId &&
              tweet.status !== "pending_approval" &&
              !tweet.isSubmitted
            ) {
              // Only sync standalone tweets that aren't submitted or pending approval
              await this.syncTweetToBackend(tweet);
            } else if (tweet && tweet.threadId) {
              // If it has a threadId, we should sync the entire thread instead
              const thread = tweetStorage.getThreadWithTweets(tweet.threadId);

              if (
                thread &&
                thread.status !== "pending_approval" &&
                !thread.isSubmitted
              ) {
                // Only sync if the thread isn't submitted or pending approval
                await this.syncThreadToBackend(thread);
                console.log("finished syncing thread to backend 1");
              }
            }
          } else {
            const thread = tweetStorage
              .getThreads()
              .find((t) => t.id === sync.id);

            // Skip syncing if the thread is submitted or pending approval
            if (
              thread &&
              thread.status !== "pending_approval" &&
              !thread.isSubmitted
            ) {
              const threadWithTweets = tweetStorage.getThreadWithTweets(
                thread.id
              );
              if (threadWithTweets) {
                await this.syncThreadToBackend(threadWithTweets);
                console.log("finished syncing thread to backend 2");
              }
            }
          }

          // Remove from pending syncs after successful processing
          this.pendingSyncs.delete(syncKey);
        } catch (error) {
          console.error(`Error syncing ${sync.type} ${sync.id}:`, error);
          // Do not remove from pending syncs - will retry next cycle
        } finally {
          // Always remove from sync queue
          const index = this.syncQueue.indexOf(syncKey);
          if (index !== -1) this.syncQueue.splice(index, 1);
        }
      }
    } catch (error) {
      console.error("Error in sync process:", error);
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

      return true;
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

      return true;
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

  queueForSync(id: string, type: "tweet" | "thread", priority: number = 0) {
    // Don't queue for sync if it's pending approval or submitted
    if (type === "tweet") {
      const tweet = tweetStorage.getTweets().find((t) => t.id === id);
      if (tweet && (tweet.status === "pending_approval" || tweet.isSubmitted)) {
        console.log("Skipping sync for submitted/pending tweet:", id);
        return;
      }
    } else if (type === "thread") {
      const thread = tweetStorage.getThreads().find((t) => t.id === id);
      if (
        thread &&
        (thread.status === "pending_approval" || thread.isSubmitted)
      ) {
        console.log("Skipping sync for submitted/pending thread:", id);
        return;
      }
    }

    const syncKey = `${type}_${id}`;

    // If already in queue, update the priority if the new one is higher
    const existingSync = this.pendingSyncs.get(syncKey);
    if (existingSync && existingSync.priority >= priority) {
      return;
    }

    this.pendingSyncs.set(syncKey, {
      id,
      type,
      lastModified: new Date(),
      priority,
    });
  }

  async forceSyncNow(): Promise<void> {
    // If already syncing, wait a bit for it to complete
    if (this.isSyncing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.forceSyncNow();
    }

    return this.syncPendingDrafts();
  }

  isCurrentlySyncing(id: string, type: "tweet" | "thread"): boolean {
    const syncKey = `${type}_${id}`;
    return this.syncQueue.includes(syncKey);
  }

  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

export const draftSync = DraftSyncService.getInstance();
