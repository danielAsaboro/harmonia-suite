// // // /utils/localStorage.ts

import { draftSync } from "@/lib/sync/draftSync";
import { Tweet, Thread, ThreadWithTweets } from "@/types/tweet";

interface TwitterUserDetails {
  id: string;
  name: string;
  handle: string;
  profileImageUrl: string;
  verified: boolean;
  verifiedType: string | null;
  email?: string;
  emailVerified?: boolean;
  walletAddress?: string;
  timezone?: string;
  contentPreferences?: any;
  teamMemberships?: any[];
  cachedAt?: number;
}

export class TweetStorageService {
  private static instance: TweetStorageService;
  private readonly BASE_KEY = "helm_app";
  private readonly USER_KEY = `${this.BASE_KEY}_current_user_id`;
  private lastSave: number = Date.now();

  private constructor() {}

  static getInstance(): TweetStorageService {
    if (!TweetStorageService.instance) {
      TweetStorageService.instance = new TweetStorageService();
    }
    return TweetStorageService.instance;
  }

  // Helper method to get the current user ID
  private getCurrentUserId(): string | null {
    return localStorage.getItem(this.USER_KEY);
  }

  // Helper method to set the current user ID
  public setCurrentUserId(userId: string): void {
    localStorage.setItem(this.USER_KEY, userId);
  }

  // Generate namespaced keys for user data
  private getNamespacedKey(key: string): string {
    const userId = this.getCurrentUserId();
    if (!userId) {
      throw new Error("No user ID found. User must be logged in.");
    }
    return `${this.BASE_KEY}_${userId}_${key}`;
  }

  getUserDetails(): TwitterUserDetails | null {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) return null;

      const details = localStorage.getItem(
        this.getNamespacedKey("user_details")
      );
      if (details) {
        const parsedDetails = JSON.parse(details);
        if (parsedDetails && Object.keys(parsedDetails).length > 0) {
          return parsedDetails;
        }
      }
      return null;
    } catch (error) {
      console.error("Error getting user details:", error);
      return null;
    }
  }

  saveUserDetails(details: TwitterUserDetails) {
    try {
      if (!details.id) {
        throw new Error("User ID is required");
      }

      // Set this user as the current user
      this.setCurrentUserId(details.id);

      const dataToStore = {
        ...details,
        cachedAt: Date.now(),
      };

      localStorage.setItem(
        this.getNamespacedKey("user_details"),
        JSON.stringify(dataToStore)
      );
    } catch (error) {
      console.error("Error saving user details:", error);
    }
  }

  getTweets(): Tweet[] {
    try {
      const tweets = localStorage.getItem(this.getNamespacedKey("tweets"));
      return tweets ? JSON.parse(tweets) : [];
    } catch (error) {
      console.error("Error getting tweets:", error);
      return [];
    }
  }

  getThreads(): Thread[] {
    try {
      const threads = localStorage.getItem(this.getNamespacedKey("threads"));
      return threads ? JSON.parse(threads) : [];
    } catch (error) {
      console.error("Error getting threads:", error);
      return [];
    }
  }

  getThreadWithTweets(threadId: string): ThreadWithTweets | null {
    const thread = this.getThreads().find((t) => t.id === threadId);
    if (!thread) return null;

    const tweets = this.getTweets()
      .filter((t) => t.threadId === threadId)
      .sort((a, b) => (a.position || 0) - (b.position || 0));

    return {
      ...thread,
      tweets,
    };
  }

  getThreadPreview(threadId: string): Tweet | null {
    const tweets = this.getTweets()
      .filter((t) => t.threadId === threadId)
      .sort((a, b) => (a.position || 0) - (b.position || 0));

    return tweets[0] || null;
  }

  public async saveTweet(tweet: Tweet, immediate: boolean = false) {
    try {
      const tweets = this.getTweets();
      const index = tweets.findIndex((t) => t.id === tweet.id);

      if (index >= 0) {
        tweets[index] = {
          ...tweets[index],
          ...tweet,
          // Make sure media is properly preserved and merged
          media: tweet.media || tweets[index].media,
        };
      } else {
        tweets.push(tweet);
      }

      // Always save to localStorage with namespace
      localStorage.setItem(
        this.getNamespacedKey("tweets"),
        JSON.stringify(tweets)
      );
      this.lastSave = Date.now();

      // Queue for backend sync if it's a draft
      if (tweet.status === "draft") {
        draftSync.queueForSync(tweet.id, "tweet");

        // Only force immediate sync if explicitly requested
        if (immediate) {
          draftSync.forceSyncNow();
        }
      }
    } catch (error) {
      console.error("Error saving tweet:", error);
    }
  }

  public async saveThread(
    thread: Thread,
    tweets: Tweet[],
    immediate: boolean = false
  ) {
    try {
      const threads = this.getThreads();
      const threadIndex = threads.findIndex((t) => t.id === thread.id);

      if (threadIndex >= 0) {
        threads[threadIndex] = {
          ...threads[threadIndex],
          ...thread,
          teamId: thread.teamId || threads[threadIndex].teamId,
        };
      } else {
        threads.push(thread);
      }

      // Save thread to localStorage with namespace
      localStorage.setItem(
        this.getNamespacedKey("threads"),
        JSON.stringify(threads)
      );
      this.lastSave = Date.now();

      // Save associated tweets to localStorage, preserving media metadata
      tweets.forEach((tweet) => {
        // Get existing tweet to preserve any media metadata
        const existingTweets = this.getTweets();
        const existingTweet = existingTweets.find((t) => t.id === tweet.id);

        this.saveTweet(
          {
            ...tweet,
            threadId: thread.id,
            status: tweet.status,
            teamId: thread.teamId,
            media: tweet.media || existingTweet?.media,
          },
          immediate
        );
      });

      // Queue thread for backend sync if it's a draft
      if (thread.status === "draft") {
        draftSync.queueForSync(thread.id, "thread");

        // Only force immediate sync if explicitly requested
        if (immediate) {
          console.log(" forcing sync right now");
          await draftSync.forceSyncNow();
        }
      }
    } catch (error) {
      console.error("Error saving thread:", error);
    }
  }

  // Add methods to filter by team
  getTweetsByTeam(teamId: string | null): Tweet[] {
    try {
      const tweets = this.getTweets();

      if (!teamId) return tweets; // Return all if no teamId specified

      return tweets.filter(
        (tweet) => teamId === "all" || tweet.teamId === teamId || !tweet.teamId
      );
    } catch (error) {
      console.error("Error getting tweets by team:", error);
      return [];
    }
  }

  getThreadsByTeam(teamId: string | null): Thread[] {
    try {
      const threads = this.getThreads();

      if (!teamId) return threads; // Return all if no teamId specified

      return threads.filter(
        (thread) =>
          teamId === "all" || thread.teamId === teamId || !thread.teamId
      );
    } catch (error) {
      console.error("Error getting threads by team:", error);
      return [];
    }
  }

  deleteTweet(tweetId: string) {
    try {
      const tweets = this.getTweets().filter((t) => t.id !== tweetId);
      localStorage.setItem(
        this.getNamespacedKey("tweets"),
        JSON.stringify(tweets)
      );

      // Send delete request to backend immediately
      fetch(`/api/drafts?type=tweet&id=${tweetId}&cleanup=true`, {
        method: "DELETE",
      }).catch((error) => {
        console.error("Error deleting tweet from backend:", error);
      });
    } catch (error) {
      console.error("Error deleting tweet:", error);
    }
  }

  deleteThread(threadId: string) {
    try {
      const threads = this.getThreads().filter((t) => t.id !== threadId);
      localStorage.setItem(
        this.getNamespacedKey("threads"),
        JSON.stringify(threads)
      );

      const tweets = this.getTweets().filter((t) => t.threadId !== threadId);
      localStorage.setItem(
        this.getNamespacedKey("tweets"),
        JSON.stringify(tweets)
      );

      // Send delete request to backend immediately
      fetch(`/api/drafts?type=thread&id=${threadId}&cleanup=true`, {
        method: "DELETE",
      }).catch((error) => {
        console.error("Error deleting thread from backend:", error);
      });
    } catch (error) {
      console.error("Error deleting thread:", error);
    }
  }

  // Clear all data for the current user
  clearUserData() {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) return;

      // Clear all namespaced data
      localStorage.removeItem(this.getNamespacedKey("user_details"));
      localStorage.removeItem(this.getNamespacedKey("tweets"));
      localStorage.removeItem(this.getNamespacedKey("threads"));

      // Clear current user reference
      localStorage.removeItem(this.USER_KEY);
    } catch (error) {
      console.error("Error clearing user data:", error);
    }
  }

  getLastSaveTime(): number {
    return this.lastSave;
  }
}

export const tweetStorage = TweetStorageService.getInstance();
