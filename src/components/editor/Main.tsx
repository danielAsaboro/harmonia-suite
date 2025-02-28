// components/editor/Main.tsx
"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Tweet,
  Thread,
  UnifiedTweetComposerProps,
  TweetStatus,
  TaggedUser,
} from "@/types/tweet";
import MediaUpload from "./media/MediaUpload";
import MediaPreview from "./media/MediaPreview";
import ThreadPreview from "./ThreadPreview";
import { useEditor } from "./context/Editor";
import {
  PenSquare,
  Eye,
  Save,
  Clock,
  Send,
  X,
  Search,
  Info,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { SaveStatus } from "./storage/SaveStatus";
import { useUserAccount } from "./context/account";
import CharacterCount, { AddTweetButton, ThreadPosition } from "./extras";
import { SaveState } from "./storage";
import { tweetStorage } from "@/utils/localStorage";
import {
  getMediaFile,
  removeMediaFile,
  storeMediaFile,
} from "../../lib/storage/indexedDB";
import SchedulePicker from "../purgatory/SchedulePicker";
import { cn } from "@/utils/ts-merge";
import PublishingModal from "./PublishingModal";
import MentionInput from "./MentionInput";
import SubmissionModal from "@/app/content/compose/twitter/SubmissionModal";
import VerificationBadge, { BadgeVariant } from "./VerificationBadge";
import { useTeam } from "./context/TeamContext";

const DEFAULT_TEXTAREA_HEIGHT = "60px";

//  helper function
const repurposeTweet = (tweet: Tweet): Tweet => {
  return {
    ...tweet,
    isSubmitted: false,
    scheduledFor: undefined,
    id: `tweet-${uuidv4()}`,
    createdAt: new Date(),
    status: "draft",
  };
};

const repurposeThread = (
  thread: Thread,
  tweets: Tweet[]
): [Thread, Tweet[]] => {
  const newThreadId = `thread-${uuidv4()}`;
  const newThread: Thread = {
    id: newThreadId,
    tweetIds: [],
    createdAt: new Date(),
    status: "draft",
  };

  const newTweets = tweets.map((tweet, index) => ({
    ...tweet,
    isSubmitted: false,
    scheduledFor: undefined,
    id: `tweet-${uuidv4()}`,
    createdAt: new Date(),
    status: "draft" as const,
    threadId: newThreadId,
  }));

  newThread.tweetIds = newTweets.map((t) => t.id);
  return [newThread, newTweets];
};

const cleanupMediaAndDeleteTweet = async (
  tweetId: string,
  mediaIds: string[]
) => {
  try {
    // Delete from backend API
    const response = await fetch(
      `/api/drafts?type=tweet&id=${tweetId}&cleanup=true`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete tweet from backend");
    }

    // Clean up media files from IndexedDB
    await Promise.allSettled(
      mediaIds.map((mediaId) => removeMediaFile(mediaId))
    );

    // Delete from localStorage
    tweetStorage.deleteTweet(tweetId);
  } catch (error) {
    console.error("Error cleaning up tweet:", error);
    throw error;
  }
};

// For cleanupMediaAndDeleteThread
const cleanupMediaAndDeleteThread = async (threadId: string) => {
  try {
    // Delete from backend API
    const response = await fetch(
      `/api/drafts?type=thread&id=${threadId}&cleanup=true`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete thread from backend");
    }

    // Clean up all media from the thread's tweets from IndexedDB
    const thread = tweetStorage.getThreadWithTweets(threadId);
    if (thread) {
      await Promise.allSettled(
        thread.tweets
          .flatMap((tweet) => tweet.media?.mediaIds || [])
          .map((mediaId) => removeMediaFile(mediaId))
      );
    }

    // Delete from localStorage
    tweetStorage.deleteThread(threadId);
  } catch (error) {
    console.error("Error cleaning up thread:", error);
    throw error;
  }
};

interface PageContent {
  threadId?: string;
  isThread: boolean;
  tweets: Tweet[];
}

export default function PlayGround({
  draftId,
  draftType,
}: UnifiedTweetComposerProps) {
  const {
    name: userName,
    id: userId,
    handle: userTwitterHandle,
    isLoading: isUserAccountDetailsLoading,
    getAvatar,
    verifiedType,
  } = useUserAccount();
  const {
    hideEditor,
    loadDraft,
    refreshSidebar,
    activeTab,
    setActiveTab,
    loadScheduledItem,
    editorState,
    toggleMetadataTab,
    isSubmitModalOpen,
    setSubmitModalOpen,
  } = useEditor();
  const [isLoading, setIsLoading] = useState(true);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>({
    lastSaveAttempt: null,
    lastSuccessfulSave: null,
    pendingOperations: 0,
    errorCount: 0,
    isProcessing: false,
  });
  const { selectedTeamId, isTeamAdmin } = useTeam();

  const [mediaTaggedUsers, setMediaTaggedUsers] = useState<{
    [mediaId: string]: TaggedUser[];
  }>({});
  const [mediaDescriptions, setMediaDescriptions] = useState<{
    [mediaId: string]: string;
  }>({});

  const [pageContent, setPageContent] = useState<PageContent>({
    isThread: false,
    tweets: [],
    threadId: undefined,
  });

  const textareaRefs = useRef<HTMLTextAreaElement[]>([]);
  const [currentlyEditedTweet, setCurrentlyEditedTweet] = useState<number>(0);
  const [contentChanged, setContentChanged] = useState(false);
  const [publishingStatus, setPublishingStatus] = useState<
    "publishing" | "success" | "error" | null
  >(null);
  const [publishingError, setPublishingError] = useState<string | null>(null);

  const validateTweets = (): boolean => {
    const MAX_CHARS = 280;
    const invalidTweets = pageContent.tweets.filter(
      (tweet) => tweet.content.length > MAX_CHARS
    );

    if (invalidTweets.length > 0) {
      // Find first invalid tweet position
      const position =
        pageContent.tweets.findIndex(
          (tweet) => tweet.content.length > MAX_CHARS
        ) + 1;
      const message =
        pageContent.tweets.length > 1
          ? `Tweet ${position} exceeds ${MAX_CHARS} characters`
          : `Tweet exceeds ${MAX_CHARS} characters`;

      alert(message);
      return false;
    }
    return true;
  };

  const validateTweetsLength = (): boolean => {
    const MAX_CHARS = 280;
    return !pageContent.tweets.some(
      (tweet) => tweet.content.length > MAX_CHARS
    );
  };

  const ensureUniqueIds = (tweetsArray: Tweet[]): Tweet[] => {
    const seenIds = new Set<string>();
    return tweetsArray.map((tweet, index) => {
      if (!tweet.id || seenIds.has(tweet.id)) {
        // Generate new ID if missing or duplicate
        const newId = `${uuidv4()}-${index}`;
        seenIds.add(newId);
        return { ...tweet, id: newId };
      }
      seenIds.add(tweet.id);
      return tweet;
    });
  };

  const handleTweetChange = (index: number, newContent: string) => {
    if (activeTab != "drafts") return;

    // Don't allow editing submitted content
    if (pageContent.tweets[index].isSubmitted) {
      alert(
        "This content has been submitted for approval and cannot be edited."
      );
      return;
    }

    const newTweets = [...pageContent.tweets];
    newTweets[index] = {
      ...newTweets[index],
      content: newContent,
      teamId: selectedTeamId || newTweets[index].teamId,
    };

    // Adjust height of changed textarea
    const textarea = textareaRefs.current[index];
    if (textarea) {
      adjustTextareaHeight(textarea);
    }

    if (pageContent.isThread && pageContent.threadId) {
      const thread: Thread = {
        id: pageContent.threadId,
        tweetIds: newTweets.map((t) => t.id),
        createdAt: new Date(),
        status: "draft",
        teamId: selectedTeamId || undefined,
      };
      tweetStorage.saveThread(thread, newTweets, false);
    } else {
      tweetStorage.saveTweet(newTweets[0], false);
    }

    setContentChanged(true);
    setPageContent((prev) => ({
      isThread: prev.isThread,
      threadId: prev.threadId,
      tweets: ensureUniqueIds(newTweets),
    }));
    refreshSidebar();
  };

  const handleDeleteTweet = async (index: number) => {
    try {
      const newTweets = [...pageContent.tweets];
      const tweetToDelete = newTweets[index];

      // Track all media to delete
      const mediaToDelete = tweetToDelete.media?.mediaIds || [];

      if (pageContent.tweets.length === 1) {
        // For the last tweet in any context (thread or standalone)
        const currentId = newTweets[0].id;
        const resetTweet = {
          ...newTweets[0],
          id: currentId,
          content: "",
          mediaIds: [],
          createdAt: new Date(),
          status: "draft" as const,
          threadId: undefined,
          position: undefined,
        };

        // If it was part of a thread, clean up thread
        if (pageContent.threadId) {
          await cleanupMediaAndDeleteThread(pageContent.threadId);
        } else {
          // Delete single tweet and its media
          await cleanupMediaAndDeleteTweet(tweetToDelete.id, mediaToDelete);
        }

        // Update local state and save
        setPageContent((prev) => ({
          isThread: false,
          threadId: undefined,
          tweets: [resetTweet],
        }));

        tweetStorage.saveTweet(resetTweet, true);
      } else if (
        pageContent.tweets.length === 2 &&
        pageContent.isThread &&
        pageContent.threadId
      ) {
        // When we're about to delete one tweet from a two-tweet thread
        newTweets.splice(index, 1);

        // Convert remaining tweet to standalone
        const remainingTweet = {
          ...newTweets[0],
          threadId: undefined,
          position: undefined,
        };

        // Clean up the thread and media
        await cleanupMediaAndDeleteThread(pageContent.threadId);

        // Save the remaining tweet as standalone
        tweetStorage.saveTweet(remainingTweet, true);

        // Update state
        setPageContent((prev) => ({
          isThread: false,
          threadId: undefined,
          tweets: [remainingTweet],
        }));
      } else if (pageContent.isThread && pageContent.threadId) {
        // For threads with more than 2 tweets
        // Remove the tweet from array
        newTweets.splice(index, 1);

        // Update positions for remaining tweets
        const updatedTweets = newTweets.map((tweet, i) => ({
          ...tweet,
          position: i,
        }));

        // Delete tweet and its media from backend
        await cleanupMediaAndDeleteTweet(tweetToDelete.id, mediaToDelete);

        // Update thread in storage with new tweet arrangement
        const thread = {
          id: pageContent.threadId,
          tweetIds: updatedTweets.map((t) => t.id),
          createdAt: new Date(),
          status: "draft" as const,
        };

        // Update local state
        setPageContent((prev) => ({
          isThread: prev.isThread,
          threadId: prev.threadId,
          tweets: updatedTweets,
        }));

        // Save updated thread and tweets
        tweetStorage.saveThread(thread, updatedTweets, true);
      } else {
        // For standalone tweets
        await cleanupMediaAndDeleteTweet(tweetToDelete.id, mediaToDelete);
        newTweets.splice(index, 1);
        setPageContent((prev) => ({
          isThread: prev.isThread,
          threadId: prev.threadId,
          tweets: newTweets,
        }));
      }

      refreshSidebar();
    } catch (error) {
      console.error("Error deleting tweet:", error);
      alert("Failed to delete tweet. Please try again.");
    }
  };

  const handleMediaUpload = async (tweetIndex: number, files: File[]) => {
    if (pageContent.tweets[tweetIndex].isSubmitted) {
      alert(
        "This content has been submitted for approval and cannot be edited."
      );
      return;
    }

    const newTweets = [...pageContent.tweets];
    const tweet = newTweets[tweetIndex];

    // Get current mediaIds from the media object or create empty array
    const currentMedia = tweet.media?.mediaIds || [];
    const totalFiles = currentMedia.length + files.length;

    if (totalFiles > 4) {
      alert("Maximum 4 media files per tweet");
      return;
    }

    try {
      // Upload files to the backend and get their IDs
      const mediaIds = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch("/api/media/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error("Failed to upload media");
          }

          const data = await response.json();
          await storeMediaFile(data.id, file);

          return data.id;
        })
      );

      // Update the tweet's media object
      newTweets[tweetIndex] = {
        ...newTweets[tweetIndex],
        media: {
          mediaIds: [...currentMedia, ...mediaIds],
          taggedUsers: tweet.media?.taggedUsers || {},
          descriptions: tweet.media?.descriptions || {},
        },
      };

      // Save the updated tweets
      setPageContent((prev) => ({
        isThread: prev.isThread,
        threadId: prev.threadId,
        tweets: newTweets,
      }));
      setContentChanged(true);

      // If it's a thread, save with thread context
      if (pageContent.isThread && pageContent.threadId) {
        const thread: Thread = {
          id: pageContent.threadId,
          tweetIds: newTweets.map((t) => t.id),
          createdAt: new Date(),
          status: "draft",
        };
        tweetStorage.saveThread(thread, newTweets, true);
      } else {
        // For single tweet
        tweetStorage.saveTweet(newTweets[0], true);
      }
    } catch (error) {
      console.error("Error uploading media:", error);
      alert("Failed to upload media");
    }
  };

  const handleRemoveMedia = async (tweetIndex: number, mediaIndex: number) => {
    if (pageContent.tweets[tweetIndex].isSubmitted) {
      alert(
        "This content has been submitted for approval and cannot be edited."
      );
      return;
    }

    const newTweets = [...pageContent.tweets];
    const tweet = newTweets[tweetIndex];

    if (!tweet.media || !tweet.media.mediaIds.length) return;

    const mediaIdToRemove = tweet.media.mediaIds[mediaIndex];

    if (mediaIdToRemove) {
      try {
        // Remove from backend
        const response = await fetch(
          `/api/media/upload?id=${mediaIdToRemove}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete media from server");
        }

        // Remove from IndexedDB
        await removeMediaFile(mediaIdToRemove);

        // Create a new media object with the removed ID filtered out
        const updatedMediaIds = tweet.media.mediaIds.filter(
          (_, i) => i !== mediaIndex
        );

        // Clean up associated metadata
        const { [mediaIdToRemove]: _, ...remainingTaggedUsers } =
          tweet.media.taggedUsers || {};
        const { [mediaIdToRemove]: __, ...remainingDescriptions } =
          tweet.media.descriptions || {};

        newTweets[tweetIndex] = {
          ...newTweets[tweetIndex],
          media: {
            mediaIds: updatedMediaIds,
            taggedUsers: remainingTaggedUsers,
            descriptions: remainingDescriptions,
          },
        };

        setPageContent((prev) => ({
          isThread: prev.isThread,
          threadId: prev.threadId,
          tweets: newTweets,
        }));
        setContentChanged(true);

        // Save updates
        if (pageContent.isThread && pageContent.threadId) {
          const thread: Thread = {
            id: pageContent.threadId,
            tweetIds: newTweets.map((t) => t.id),
            createdAt: new Date(),
            status: "draft",
          };
          tweetStorage.saveThread(thread, newTweets, true);
        } else {
          tweetStorage.saveTweet(newTweets[0], true);
        }
      } catch (error) {
        console.error("Error removing media:", error);
        alert("Failed to remove media");
      }
    }
  };

  const addTweetToThread = (index: number) => {
    if (activeTab !== "drafts") return;

    // Check if thread is submitted
    if (pageContent.isThread && pageContent.threadId) {
      const thread = tweetStorage
        .getThreads()
        .find((t) => t.id === pageContent.threadId);
      if (thread?.isSubmitted) {
        alert(
          "This thread has been submitted for approval and cannot be modified."
        );
        return;
      }
    }

    try {
      if (!pageContent.isThread) {
        // Generate a new threadId when converting to a thread
        const newThreadId = `thread-${uuidv4()}`;

        // Create initial thread structure with first tweet properly threaded
        const updatedFirstTweet = {
          ...pageContent.tweets[0],
          threadId: newThreadId,
          position: 0,
          teamId: selectedTeamId || pageContent.tweets[0].teamId,
        };

        // Create new tweet
        const newTweet = {
          id: `tweet-${uuidv4()}`,
          content: "",
          mediaIds: [],
          tags: [],
          createdAt: new Date(),
          status: "draft" as const,
          threadId: newThreadId,
          position: 1,
          teamId: selectedTeamId || undefined,
        };

        // Update state with both tweets
        setPageContent({
          isThread: true,
          threadId: newThreadId,
          tweets: [updatedFirstTweet, newTweet],
        });

        // Save thread
        const thread: Thread = {
          id: newThreadId,
          tweetIds: [updatedFirstTweet.id, newTweet.id],
          createdAt: new Date(),
          status: "draft",
          teamId: selectedTeamId || undefined,
        };
        tweetStorage.saveThread(thread, [updatedFirstTweet, newTweet], true);
      } else {
        // For existing threads, add new tweet and reindex positions
        const newTweet = {
          id: `tweet-${uuidv4()}`,
          content: "",
          mediaIds: [],
          createdAt: new Date(),
          status: "draft" as const,
          threadId: pageContent.threadId,
          position: index + 1,
          teamId: selectedTeamId || undefined,
        };

        const newTweets = [...pageContent.tweets];

        // Insert the new tweet at the specified position
        newTweets.splice(index + 1, 0, newTweet);

        // Reindex all positions to ensure consistency
        const reindexedTweets = newTweets.map((tweet, idx) => ({
          ...tweet,
          position: idx,
          teamId: tweet.teamId || selectedTeamId || undefined,
        }));

        // Update state with reindexed tweets
        setPageContent({
          isThread: true,
          threadId: pageContent.threadId,
          tweets: reindexedTweets,
        });

        // Save updated thread
        const thread: Thread = {
          id: pageContent.threadId!,
          tweetIds: reindexedTweets.map((t) => t.id),
          createdAt: new Date(),
          status: "draft",
          teamId: selectedTeamId || undefined,
        };
        tweetStorage.saveThread(thread, reindexedTweets, true);
      }

      refreshSidebar();

      // Focus the new textarea after state update
      setTimeout(() => {
        const nextTextarea = textareaRefs.current[index + 1];
        if (nextTextarea) {
          nextTextarea.focus();
        }
      }, 0);
    } catch (error) {
      console.error("Error adding tweet to thread:", error);
      alert("Failed to add tweet to thread. Please try again.");
    }
  };

  const handleSchedulePost = async (scheduledDate: Date) => {
    if (!validateTweets()) return;
    try {
      // Get user session data first
      const response = await fetch("/api/auth/twitter/user");
      if (!response.ok) {
        throw new Error("Failed to get user data");
      }
      const userData = await response.json();
      const userId = userData.id;

      // Save scheduled tweets to both localStorage and Server
      if (pageContent.isThread && pageContent.threadId) {
        // Prepare thread data for Server
        const threadData = {
          id: pageContent.threadId,
          tweetIds: pageContent.tweets.map((t) => t.id),
          scheduledFor: scheduledDate.toISOString(),
          status: "scheduled" as const,
          createdAt: new Date().toISOString(),
          userId,
        };

        const tweetsData = pageContent.tweets.map((tweet) => ({
          id: tweet.id,
          content: tweet.content,
          media: {
            mediaIds: [...(tweet.media?.mediaIds || [])],
          },
          scheduledFor: scheduledDate.toISOString(),
          threadId: pageContent.threadId,
          position: tweet.position,
          status: "scheduled" as const,
          createdAt: new Date().toISOString(),
          userId,
        }));

        // Save to SQLite via API
        const scheduleResponse = await fetch("/api/scheduler/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "thread",
            thread: threadData,
            tweets: tweetsData,
          }),
        });

        if (!scheduleResponse.ok) {
          throw new Error("Failed to schedule thread");
        }

        // Save to localStorage for UI
        const thread: Thread = {
          id: pageContent.threadId,
          tweetIds: pageContent.tweets.map((t) => t.id),
          createdAt: new Date(),
          status: "scheduled",
          scheduledFor: scheduledDate,
        };

        tweetStorage.saveThread(
          thread,
          pageContent.tweets.map((t) => ({
            ...t,
            status: "scheduled" as const,
            scheduledFor: scheduledDate,
          })),
          true
        );
      } else {
        // Prepare single tweet data for SQLite
        const tweetData = {
          id: pageContent.tweets[0].id,
          content: pageContent.tweets[0].content,
          mediaIds: pageContent.tweets[0].media?.mediaIds || [],
          scheduledFor: scheduledDate.toISOString(),
          status: "scheduled" as const,
          createdAt: new Date().toISOString(),
          userId,
        };

        // Save to SQLite via API
        const scheduleResponse = await fetch("/api/scheduler/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "tweet",
            tweet: tweetData,
          }),
        });

        if (!scheduleResponse.ok) {
          throw new Error("Failed to schedule tweet");
        }

        // Save to localStorage for UI
        tweetStorage.saveTweet(
          {
            ...pageContent.tweets[0],
            status: "scheduled",
            scheduledFor: scheduledDate,
          },
          true
        );
      }

      // Close the scheduler and editor
      setShowScheduler(false);
      hideEditor();

      // Refresh the sidebar to show the new scheduled post
      refreshSidebar();
    } catch (error) {
      console.error("Error scheduling post:", error);
      alert("Failed to schedule post. Please try again.");
    }
  };

  const isValidToPublish = validateTweetsLength();

  const handlePublish = async () => {
    if (!validateTweets()) return;

    setPublishingStatus("publishing");
    setPublishingError(null);

    try {
      // Get media data for each tweet
      const tweetsWithMedia = await Promise.all(
        pageContent.tweets.map(async (tweet) => {
          let mediaContent: string[] = [];
          if (tweet.media?.mediaIds && tweet.media?.mediaIds.length > 0) {
            mediaContent = await Promise.all(
              tweet.media?.mediaIds.map(async (mediaId) => {
                const mediaData = await getMediaFile(mediaId);
                return mediaData || "";
              })
            );
          }
          return {
            content: tweet.content,
            mediaContent,
            media: tweet.media,
          };
        })
      );

      // Post to Twitter API - handles both single tweets and threads
      const response = await fetch("/api/twitter/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          pageContent.isThread ? tweetsWithMedia : tweetsWithMedia[0]
        ),
      });

      if (!response.ok) {
        console.log(response.body);
        throw new Error("Failed to post to Twitter");
      }

      // await new Promise((resolve) => setTimeout(resolve, 5000));

      // Update local storage
      if (pageContent.isThread && pageContent.threadId) {
        const thread: Thread = {
          id: pageContent.threadId,
          tweetIds: pageContent.tweets.map((t) => t.id),
          createdAt: new Date(),
          status: "published",
        };
        tweetStorage.saveThread(
          thread,
          pageContent.tweets.map((t) => ({
            ...t,
            status: "published" as const,
          })),
          true
        );
      } else {
        tweetStorage.saveTweet(
          { ...pageContent.tweets[0], status: "published" as const },
          true
        );
      }

      setPublishingStatus("success");
      setTimeout(() => {
        setPublishingStatus(null);
        hideEditor();
        refreshSidebar();
      }, 2000); // Auto-close after success
    } catch (error) {
      console.error("Error publishing:", error);
      setPublishingError(
        error instanceof Error
          ? error.message
          : "Failed to publish. Please try again."
      );
      setPublishingStatus("error");
    }
  };

  const handleSaveAsDraft = () => {
    if (pageContent.isThread && pageContent.threadId) {
      const thread: Thread = {
        id: pageContent.threadId,
        tweetIds: pageContent.tweets.map((t) => t.id),
        createdAt: new Date(),
        status: "draft",
      };
      tweetStorage.saveThread(thread, pageContent.tweets, true); // true for immediate sync
    } else {
      tweetStorage.saveTweet(pageContent.tweets[0], true); // true for immediate sync
    }

    hideEditor();
    refreshSidebar();
  };

  const setTextAreaRef = (el: HTMLTextAreaElement | null, index: number) => {
    if (el) {
      textareaRefs.current[index] = el;
    }
  };

  const adjustTextareaHeight = (element: HTMLTextAreaElement) => {
    if (!element) return;

    // Reset height to auto first
    // to get the correct scrollHeight
    element.style.height = "auto";

    // If the textarea is empty, set to default height
    if (!element.value.trim()) {
      element.style.height = DEFAULT_TEXTAREA_HEIGHT;
    } else {
      // Set to scrollHeight to accommodate content
      element.style.height = `${element.scrollHeight}px`;
    }
  };

  // Function to adjust all textareas in the thread
  const adjustAllTextareas = () => {
    textareaRefs.current.forEach((textarea) => {
      if (textarea) {
        adjustTextareaHeight(textarea);
      }
    });
  };

  const handleRepurpose = () => {
    if (pageContent.isThread && pageContent.threadId) {
      const [newThread, newTweets] = repurposeThread(
        {
          id: pageContent.threadId,
          tweetIds: pageContent.tweets.map((t) => t.id),
          createdAt: new Date(),
          status: "draft",
        },
        pageContent.tweets
      );
      tweetStorage.saveThread(newThread, newTweets, true);
    } else {
      const newTweet = repurposeTweet(pageContent.tweets[0]);
      tweetStorage.saveTweet(newTweet, true);
    }

    hideEditor();
    setActiveTab("drafts");
    refreshSidebar();
  };

  // Ensure unique IDs before rendering
  const tweetsWithUniqueIds = pageContent.tweets.map((tweet, index) => ({
    ...tweet,
    id: tweet.id || `${uuidv4()}-${index}`, // Fallback ID includes index for uniqueness
  }));

  // Adjust text areas;
  useEffect(() => {
    // console.log(" adjusting text area called");

    adjustAllTextareas();
  }, [pageContent.tweets]);

  // // Initialize editor with proper state
  useEffect(() => {
    const initializeEditor = async () => {
      try {
        setIsLoading(true);

        if (draftId) {
          const isScheduled =
            editorState.selectedItemStatus === "scheduled" ||
            editorState.selectedItemStatus === "published";
          const content = isScheduled ? loadScheduledItem() : await loadDraft();

          // Wait a tick to ensure state is synchronized
          await new Promise((resolve) => setTimeout(resolve, 0));

          if (content) {
            if ("tweets" in content && Array.isArray(content.tweets)) {
              setPageContent({
                isThread: true,
                threadId: content.id,
                tweets: content.tweets.map((tweet) => ({
                  ...tweet,
                  status: content.status,
                  scheduledFor: content.scheduledFor,
                })),
              });
            } else {
              setPageContent({
                isThread: false,
                threadId: undefined,
                tweets: [content as Tweet],
              });
            }
          }
        } else if (activeTab === "drafts" && !editorState.selectedDraftId) {
          // Only create new tweet if we're in drafts tab AND no draft is selected
          const newTweet: Tweet = {
            id: `tweet-${uuidv4()}`,
            content: "",
            media: {
              mediaIds: [],
            },
            tags: [],
            createdAt: new Date(),
            status: "draft",
            teamId: selectedTeamId || undefined,
          };
          setPageContent({
            isThread: false,
            threadId: undefined,
            tweets: [newTweet],
          });
          tweetStorage.saveTweet(newTweet, true);
          refreshSidebar();
        }
      } catch (error) {
        console.error("Error initializing editor:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeEditor();
  }, [
    draftId,
    draftType,
    loadDraft,
    activeTab,
    loadScheduledItem,
    editorState.selectedDraftId,
    editorState.selectedItemStatus,
    refreshSidebar,
  ]);

  useEffect(() => {
    if (!isLoading && pageContent.tweets.length > 0 && contentChanged) {
      // Only run if content changed
      setSaveState((prev) => ({
        ...prev,
        isProcessing: true,
        pendingOperations: prev.pendingOperations + 1,
        lastSaveAttempt: new Date(),
      }));

      try {
        if (pageContent.isThread && pageContent.threadId) {
          const firstTweet = pageContent.tweets[0];
          const thread: Thread = {
            id: pageContent.threadId,
            tweetIds: pageContent.tweets.map((t) => t.id),
            createdAt: firstTweet.createdAt,
            status: firstTweet.status,
            scheduledFor: firstTweet.scheduledFor,
          };
          // Save to localStorage and queue for backend sync
          tweetStorage.saveThread(thread, pageContent.tweets);
        } else {
          // Save to localStorage and queue for backend sync
          tweetStorage.saveTweet(pageContent.tweets[0]);
        }

        setSaveState((prev) => ({
          ...prev,
          isProcessing: false,
          pendingOperations: Math.max(0, prev.pendingOperations - 1),
          lastSuccessfulSave: new Date(),
          errorCount: 0,
        }));
        refreshSidebar();
        setContentChanged(false);
      } catch (error) {
        setSaveState((prev) => ({
          ...prev,
          isProcessing: false,
          errorCount: prev.errorCount + 1,
          pendingOperations: Math.max(0, prev.pendingOperations - 1),
        }));
        console.error("Error saving tweets:", error);
      }
    }
  }, [
    pageContent.tweets,
    pageContent.isThread,
    pageContent.threadId,
    isLoading,
    contentChanged,
    refreshSidebar,
  ]);

  // Effect to Switch between Tabs
  useEffect(() => {
    const handleSwitchDraft = (e: CustomEvent) => {
      const direction = e.detail as "prev" | "next";
      if (!pageContent.tweets.length) return;

      const currentIndex = currentlyEditedTweet;
      let newIndex;

      if (direction === "prev") {
        newIndex =
          currentIndex > 0 ? currentIndex - 1 : pageContent.tweets.length - 1;
      } else {
        newIndex =
          currentIndex < pageContent.tweets.length - 1 ? currentIndex + 1 : 0;
      }

      setCurrentlyEditedTweet(newIndex);
      textareaRefs.current[newIndex]?.focus();
    };

    window.addEventListener("switchDraft", handleSwitchDraft as EventListener);

    return () => {
      window.removeEventListener(
        "switchDraft",
        handleSwitchDraft as EventListener
      );
    };
  }, [currentlyEditedTweet, pageContent.tweets.length]);

  // Clean up when component unmounts
  useEffect(() => {
    console.log("clean up when component unmounts");
    return () =>
      setPageContent((prev) => ({
        isThread: prev.isThread,
        threadId: prev.threadId,
        tweets: [],
      }));
  }, []);

  // keyboard shortcuts
  // useEffect for publishing and scheduling
  useEffect(() => {
    const handlePublish = () => {
      if (isValidToPublish) {
        handlePublish();
      }
    };

    const handleSchedule = () => {
      if (isValidToPublish) {
        setShowScheduler(true);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
        switch (e.key) {
          case "s":
            e.preventDefault();
            handleSchedule();
            break;
          case "p":
            e.preventDefault();
            handlePublish();
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("publishDraft", handlePublish);
    window.addEventListener("scheduleDraft", handleSchedule);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("publishDraft", handlePublish);
      window.removeEventListener("scheduleDraft", handleSchedule);
    };
  }, [isValidToPublish, handlePublish]);

  // useEffect for draft switching in thread
  useEffect(() => {
    const handleDraftSwitch = (e: KeyboardEvent) => {
      if (e.metaKey && e.altKey) {
        switch (e.key) {
          case "ArrowUp":
            e.preventDefault();
            // Move to previous draft
            if (currentlyEditedTweet > 0) {
              setCurrentlyEditedTweet((prev) => prev - 1);
              textareaRefs.current[currentlyEditedTweet - 1]?.focus();
            }
            break;
          case "ArrowDown":
            e.preventDefault();
            // Move to next draft
            if (currentlyEditedTweet < pageContent.tweets.length - 1) {
              setCurrentlyEditedTweet((prev) => prev + 1);
              textareaRefs.current[currentlyEditedTweet + 1]?.focus();
            }
            break;
        }
      }
    };

    window.addEventListener("keydown", handleDraftSwitch);
    return () => window.removeEventListener("keydown", handleDraftSwitch);
  }, [currentlyEditedTweet, pageContent.tweets.length]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Check if any of our textareas is currently focused
      const activeElement = document.activeElement;
      const textareaIndex = textareaRefs.current.findIndex(
        (ref) => ref === activeElement
      );

      // Skip if no textarea is focused or if not in drafts mode
      if (textareaIndex === -1 || activeTab !== "drafts") {
        return;
      }

      // Skip if the tweet is submitted
      if (pageContent.tweets[textareaIndex].isSubmitted) {
        return;
      }

      // Check for images in clipboard
      if (e.clipboardData && e.clipboardData.items) {
        const items = e.clipboardData.items;
        const imageFiles: File[] = [];

        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              imageFiles.push(file);
            }
          }
        }

        // If we found images, handle them
        if (imageFiles.length > 0) {
          // Prevent default to avoid pasting the image as text/html content
          e.preventDefault();

          // Check media limit
          const currentMedia =
            pageContent.tweets[textareaIndex].media?.mediaIds || [];
          const totalFiles = currentMedia.length + imageFiles.length;

          if (totalFiles > 4) {
            alert("Maximum 4 media files per tweet");
            return;
          }

          // Upload the images
          handleMediaUploadCallback(textareaIndex, imageFiles);
          // handleMediaUpload(textareaIndex, imageFiles);
        }
      }
    };

    // Add the global paste event listener
    document.addEventListener("paste", handlePaste);

    // Clean up
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [activeTab, pageContent.tweets, handleMediaUpload]);

  const handleMediaUploadCallback = useCallback(
    (tweetIndex: number, files: File[]) => {
      // Don't allow editing submitted content
      if (pageContent.tweets[tweetIndex].isSubmitted) {
        alert(
          "This content has been submitted for approval and cannot be edited."
        );
        return;
      }

      const newTweets = [...pageContent.tweets];
      const currentMedia = newTweets[tweetIndex].media?.mediaIds || [];
      const totalFiles = currentMedia.length + files.length;

      if (totalFiles > 4) {
        alert("Maximum 4 media files per tweet");
        return;
      }

      // Your existing upload logic
      (async () => {
        try {
          // Upload files to the backend and get their IDs
          const mediaIds = await Promise.all(
            files.map(async (file) => {
              // Create form data for the file
              const formData = new FormData();
              formData.append("file", file);

              // Upload to backend
              const response = await fetch("/api/media/upload", {
                method: "POST",
                body: formData,
              });

              if (!response.ok) {
                throw new Error("Failed to upload media");
              }

              const data = await response.json();

              // Store in IndexedDB for local caching
              await storeMediaFile(data.id, file);

              return data.id;
            })
          );

          // Update the tweet's media array
          newTweets[tweetIndex] = {
            ...newTweets[tweetIndex],
            media: {
              mediaIds: [...currentMedia, ...mediaIds],
            },
          };

          // Save the updated tweets
          setPageContent((prev) => ({
            isThread: prev.isThread,
            threadId: prev.threadId,
            tweets: newTweets,
          }));
          setContentChanged(true);

          // If it's a thread, save with thread context
          if (pageContent.isThread && pageContent.threadId) {
            const thread: Thread = {
              id: pageContent.threadId,
              tweetIds: newTweets.map((t) => t.id),
              createdAt: new Date(),
              status: "draft",
            };
            tweetStorage.saveThread(thread, newTweets, true);
          } else {
            // For single tweet
            tweetStorage.saveTweet(newTweets[0], true);
          }
        } catch (error) {
          console.error("Error uploading media:", error);
          alert("Failed to upload media");
        }
      })();
    },
    [
      pageContent.tweets,
      pageContent.isThread,
      pageContent.threadId,
      setContentChanged,
    ]
  );

  // Handle splitting content on Shift+Enter
  const handleSplitContent = (
    index: number,
    beforeCursor: string,
    afterCursor: string
  ) => {
    // Don't allow splitting if content is submitted
    if (pageContent.tweets[index].isSubmitted) {
      return;
    }

    const newTweets = [...pageContent.tweets];

    // Update the current tweet with content before cursor
    newTweets[index] = {
      ...newTweets[index],
      content: beforeCursor,
      teamId: selectedTeamId || newTweets[index].teamId,
    };

    // Create a new tweet with content after cursor
    const newTweetId = `tweet-${uuidv4()}`;
    const newTweet: Tweet = {
      id: newTweetId,
      content: afterCursor,
      media: {
        mediaIds: [],
      },
      createdAt: new Date(),
      status: "draft" as TweetStatus,
      threadId: pageContent.threadId,
      position: index + 1,
      teamId: selectedTeamId || undefined,
    };

    // Insert new tweet after the current one
    newTweets.splice(index + 1, 0, newTweet);

    // Update positions for all tweets after this one
    for (let i = index + 1; i < newTweets.length; i++) {
      newTweets[i] = {
        ...newTweets[i],
        position: i,
      };
    }

    // Handle thread state updates
    if (pageContent.isThread && pageContent.threadId) {
      // Update existing thread
      const thread: Thread = {
        id: pageContent.threadId,
        tweetIds: newTweets.map((t) => t.id),
        createdAt: new Date(),
        status: "draft",
        teamId: selectedTeamId || undefined,
      };

      setPageContent({
        isThread: true,
        threadId: pageContent.threadId,
        tweets: newTweets,
      });

      tweetStorage.saveThread(thread, newTweets, true);
    } else {
      // Convert single tweet to thread
      const newThreadId = `thread-${uuidv4()}`;

      // Update all tweets to have the new threadId
      for (let i = 0; i < newTweets.length; i++) {
        newTweets[i] = {
          ...newTweets[i],
          threadId: newThreadId,
          position: i,
        };
      }

      const thread: Thread = {
        id: newThreadId,
        tweetIds: newTweets.map((t) => t.id),
        createdAt: new Date(),
        status: "draft",
        teamId: selectedTeamId || undefined,
      };

      setPageContent({
        isThread: true,
        threadId: newThreadId,
        tweets: newTweets,
      });

      tweetStorage.saveThread(thread, newTweets, true);
    }

    // Focus the new input field and place cursor at beginning
    setTimeout(() => {
      const nextTextarea = textareaRefs.current[index + 1];
      if (nextTextarea) {
        nextTextarea.focus();
        nextTextarea.setSelectionRange(0, 0);
      }
    }, 0);

    refreshSidebar();
  };

  // Handle navigating up with arrow keys
  const handleNavigateUp = (index: number) => {
    if (index > 0) {
      const prevTextarea = textareaRefs.current[index - 1];
      if (prevTextarea) {
        prevTextarea.focus();
        // Place cursor at the end of previous content
        const contentLength = pageContent.tweets[index - 1].content.length;
        prevTextarea.setSelectionRange(contentLength, contentLength);
        setCurrentlyEditedTweet(index - 1);
      }
    }
  };

  // Handle navigating down with arrow keys
  const handleNavigateDown = (index: number) => {
    if (index < pageContent.tweets.length - 1) {
      const nextTextarea = textareaRefs.current[index + 1];
      if (nextTextarea) {
        nextTextarea.focus();
        // Place cursor at beginning of next content
        nextTextarea.setSelectionRange(0, 0);
        setCurrentlyEditedTweet(index + 1);
      }
    }
  };

  const handleMergeWithPrevious = (index: number) => {
    // Can't merge the first tweet or submitted tweets
    if (
      index === 0 ||
      pageContent.tweets[index].isSubmitted ||
      pageContent.tweets[index - 1].isSubmitted
    ) {
      return;
    }

    const newTweets = [...pageContent.tweets];

    // Get content from both tweets
    const previousContent = newTweets[index - 1].content;
    const currentContent = newTweets[index].content;

    // Merge content into the previous tweet
    newTweets[index - 1] = {
      ...newTweets[index - 1],
      content: previousContent + currentContent,
    };

    // Remove the current tweet
    newTweets.splice(index, 1);

    // Update positions for all tweets after this one
    for (let i = index - 1; i < newTweets.length; i++) {
      newTweets[i] = {
        ...newTweets[i],
        position: i,
      };
    }

    // Handle special case where merging would leave only one tweet
    if (newTweets.length === 1 && pageContent.isThread) {
      // Convert thread to single tweet
      const singleTweet: Tweet = {
        ...newTweets[0],
        threadId: undefined,
        position: undefined,
      };

      setPageContent({
        isThread: false,
        threadId: undefined,
        tweets: [singleTweet],
      });

      // Remove the thread and save as single tweet
      if (pageContent.threadId) {
        cleanupMediaAndDeleteThread(pageContent.threadId).then(() => {
          tweetStorage.saveTweet(singleTweet, true);
        });
      }
    } else if (pageContent.isThread && pageContent.threadId) {
      // Update thread with new arrangement
      const thread: Thread = {
        id: pageContent.threadId,
        tweetIds: newTweets.map((t) => t.id),
        createdAt: new Date(),
        status: "draft",
        teamId: selectedTeamId || undefined,
      };

      setPageContent({
        isThread: true,
        threadId: pageContent.threadId,
        tweets: newTweets,
      });

      tweetStorage.saveThread(thread, newTweets, true);
    }

    // Focus the previous input and set cursor at the join point
    setTimeout(() => {
      const prevTextarea = textareaRefs.current[index - 1];
      if (prevTextarea) {
        prevTextarea.focus();
        // Set cursor at the point where the texts were merged
        prevTextarea.setSelectionRange(
          previousContent.length,
          previousContent.length
        );
        setCurrentlyEditedTweet(index - 1);
      }
    }, 0);

    refreshSidebar();
  };

  const handleUpdateTaggedUsers = (mediaId: string, users: TaggedUser[]) => {
    setMediaTaggedUsers((prev) => ({
      ...prev,
      [mediaId]: users,
    }));

    // Update the tweet with the new tagged users
    const newTweets = [...pageContent.tweets];
    const tweetIndex = currentlyEditedTweet;

    newTweets[tweetIndex] = {
      ...newTweets[tweetIndex],
      media: {
        mediaIds: newTweets[tweetIndex].media?.mediaIds || [],
        taggedUsers: {
          ...(newTweets[tweetIndex].media?.taggedUsers || {}),
          [mediaId]: users,
        },
        descriptions: newTweets[tweetIndex].media?.descriptions || {},
      },
    };

    setPageContent((prev) => ({
      ...prev,
      tweets: newTweets,
    }));

    // Save to storage
    if (pageContent.isThread && pageContent.threadId) {
      const thread: Thread = {
        id: pageContent.threadId,
        tweetIds: newTweets.map((t) => t.id),
        createdAt: new Date(),
        status: "draft",
      };
      tweetStorage.saveThread(thread, newTweets, false);
    } else {
      tweetStorage.saveTweet(newTweets[0], false);
    }
  };

  const handleUpdateDescriptions = (descriptions: {
    [mediaId: string]: string;
  }) => {
    setMediaDescriptions((prev) => ({
      ...prev,
      ...descriptions,
    }));

    // Update the tweet with the new descriptions
    const newTweets = [...pageContent.tweets];
    const tweetIndex = currentlyEditedTweet;

    newTweets[tweetIndex] = {
      ...newTweets[tweetIndex],
      media: {
        mediaIds: newTweets[tweetIndex].media?.mediaIds || [],
        taggedUsers: newTweets[tweetIndex].media?.taggedUsers || {},
        descriptions: {
          ...(newTweets[tweetIndex].media?.descriptions || {}),
          ...descriptions,
        },
      },
    };

    setPageContent((prev) => ({
      ...prev,
      tweets: newTweets,
    }));

    // Save to storage
    if (pageContent.isThread && pageContent.threadId) {
      const thread: Thread = {
        id: pageContent.threadId,
        tweetIds: newTweets.map((t) => t.id),
        createdAt: new Date(),
        status: "draft",
      };
      tweetStorage.saveThread(thread, newTweets, false);
    } else {
      tweetStorage.saveTweet(newTweets[0], false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto ">
      {/* Header Controls */}
      {/* Header Controls - Responsive Version */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2 sm:gap-0">
        <div className="flex items-center gap-2">
          <button
            onClick={hideEditor}
            className="p-2 hover:bg-gray-800 rounded-full"
          >
            <X size={20} className="text-gray-400 hover:text-red-500" />
          </button>
        </div>

        {/* Show different controls based on tab */}
        <div className="flex flex-wrap justify-center sm:justify-end items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {activeTab === "drafts" && (
            <>
              <SaveStatus saveState={saveState} />

              <button
                className={cn(
                  "px-3 sm:px-4 py-1.5 rounded-full flex items-center gap-1 sm:gap-2",
                  "text-gray-400 hover:bg-gray-800 text-sm sm:text-base",
                  !isValidToPublish &&
                    "opacity-50 cursor-not-allowed hover:bg-transparent"
                )}
                onClick={() => isValidToPublish && setShowScheduler(true)}
                disabled={!isValidToPublish}
                title={
                  !isValidToPublish
                    ? "Tweet content exceeds character limit"
                    : undefined
                }
              >
                <Clock size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span>Schedule</span>
              </button>

              <button
                onClick={handlePublish}
                className={cn(
                  "px-3 sm:px-4 py-1.5 bg-blue-500 text-white rounded-full",
                  "hover:bg-blue-600 flex items-center gap-1 sm:gap-2 text-sm sm:text-base",
                  !isValidToPublish &&
                    "opacity-50 cursor-not-allowed hover:bg-blue-500"
                )}
                disabled={!isValidToPublish}
                title={
                  !isValidToPublish
                    ? "Tweet content exceeds character limit"
                    : undefined
                }
              >
                <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span>Publish</span>
              </button>
              <button
                className="transition-all duration-200 p-1.5 sm:p-2 hover:bg-gray-800 rounded-full"
                onClick={toggleMetadataTab}
                aria-label="Show metadata"
              >
                <Info size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            </>
          )}

          {activeTab === "scheduled" && (
            <button
              onClick={handlePublish}
              className={cn(
                "px-3 sm:px-4 py-1.5 bg-blue-500 text-white rounded-full",
                "hover:bg-blue-600 flex items-center gap-1 sm:gap-2 text-sm sm:text-base",
                !isValidToPublish &&
                  "opacity-50 cursor-not-allowed hover:bg-blue-500"
              )}
              disabled={!isValidToPublish}
              title={
                !isValidToPublish
                  ? "Tweet content exceeds character limit"
                  : undefined
              }
            >
              <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span>Publish</span>
            </button>
          )}
        </div>
      </div>

      {/* content */}
      <div className="bg-gray-900 rounded-lg">
        {tweetsWithUniqueIds.map((tweet, index) => (
          <div
            key={tweet.id}
            className={`relative p-2 sm:p-4 ${
              tweet.isSubmitted ? "opacity-80" : ""
            }`}
          >
            {/* Thread line - made responsive with proper spacing */}
            {index < pageContent.tweets.length - 1 && (
              <div
                className="absolute left-8 sm:left-10 w-0.5 bg-gray-800"
                style={{
                  top: "4rem",
                  bottom: "-1rem",
                }}
              />
            )}

            <div className="flex gap-2 sm:gap-3">
              {/* Avatar with responsive sizing */}
              <div className="flex-shrink-0">{getAvatar()}</div>

              <div className="flex-1 min-w-0">
                {/* User info header with improved responsive behavior */}
                <div className="flex items-start sm:items-center justify-between">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 text-gray-400">
                    <div className="flex items-center">
                      <span
                        className={cn(
                          "font-bold text-sm sm:text-base",
                          isUserAccountDetailsLoading
                            ? "text-gray-600 animate-pulse"
                            : "text-white"
                        )}
                      >
                        {userName}
                      </span>
                      <VerificationBadge
                        variant={verifiedType as BadgeVariant}
                      />
                    </div>

                    <span
                      className={cn(
                        "text-xs sm:text-sm sm:ml-2",
                        isUserAccountDetailsLoading
                          ? "text-gray-700 animate-pulse"
                          : "text-gray-400"
                      )}
                    >
                      {userTwitterHandle}
                    </span>
                  </div>

                  {/* Delete button with responsive touch target */}
                  {(pageContent.tweets.length === 1 || index > 0) &&
                    activeTab === "drafts" && (
                      <button
                        onClick={() => handleDeleteTweet(index)}
                        className="p-1.5 sm:p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-red-500"
                        aria-label="Delete tweet"
                      >
                        <X size={16} className="sm:w-[18px] sm:h-[18px]" />
                      </button>
                    )}
                </div>

                {/* Add submission status indicator if submitted */}
                {tweet.isSubmitted && (
                  <div className="mt-1 px-2 py-0.5 bg-yellow-900/30 text-yellow-500 text-xs rounded-full inline-block">
                    Pending Approval
                  </div>
                )}

                {/* Mention input with responsive text size */}
                <MentionInput
                  value={tweet.content}
                  onFocus={() => setCurrentlyEditedTweet(index)}
                  onChange={(value) => {
                    if (activeTab === "drafts") {
                      handleTweetChange(index, value);
                    }
                  }}
                  placeholder={
                    index === 0 ? "What's happening?" : "Add to thread..."
                  }
                  className={`text-white text-sm sm:text-base min-h-[60px] mt-2 w-full ${
                    tweet.isSubmitted ? "cursor-not-allowed" : ""
                  }`}
                  // Add new handlers
                  onSplitContent={(beforeCursor, afterCursor) =>
                    activeTab === "drafts" &&
                    !tweet.isSubmitted &&
                    handleSplitContent(index, beforeCursor, afterCursor)
                  }
                  onNavigateUp={() => handleNavigateUp(index)}
                  onNavigateDown={() => handleNavigateDown(index)}
                  onMergeWithPrevious={() =>
                    activeTab === "drafts" &&
                    !tweet.isSubmitted &&
                    handleMergeWithPrevious(index)
                  }
                  // Keep original handlers
                  readOnly={activeTab !== "drafts" || tweet.isSubmitted}
                  ref={(el) => {
                    setTextAreaRef(el, index);
                    if (el) {
                      adjustTextareaHeight(el);
                    }
                  }}
                />

                {/* Media Preview with responsive grid */}
                {tweet.media && tweet.media.mediaIds.length > 0 && (
                  <div className="mt-2 w-full">
                    <MediaPreview
                      mediaIds={tweet.media.mediaIds}
                      onRemove={(mediaIndex) => {
                        activeTab === "scheduled"
                          ? undefined
                          : handleRemoveMedia(index, mediaIndex);
                      }}
                      getMediaUrl={getMediaFile}
                      isDraft={activeTab === "drafts" && !tweet.isSubmitted}
                      onUpdateTaggedUsers={(mediaId, users) => {
                        if (activeTab !== "drafts" || tweet.isSubmitted) return;
                        handleUpdateTaggedUsers(mediaId, users);
                      }}
                      onUpdateDescriptions={(descriptions) => {
                        if (activeTab !== "drafts" || tweet.isSubmitted) return;
                        handleUpdateDescriptions(descriptions);
                      }}
                      taggedUsers={tweet.media.taggedUsers || {}}
                      descriptions={tweet.media.descriptions || {}}
                    />
                  </div>
                )}

                {/* Extra Options - made responsive */}
                <div className="mt-3 sm:mt-4 flex items-center justify-between">
                  {/* Media upload button - responsive sizing */}
                  <MediaUpload
                    onUpload={(files) => handleMediaUpload(index, files)}
                    maxFiles={4 - (tweet.media?.mediaIds?.length || 0)}
                    disabled={activeTab != "drafts" || tweet.isSubmitted}
                  />

                  {/* Right side controls - responsively shown/hidden */}
                  <div
                    className={
                      currentlyEditedTweet === index
                        ? "flex justify-end items-center gap-1 sm:gap-3"
                        : "hidden"
                    }
                  >
                    <CharacterCount content={tweet.content} />
                    <ThreadPosition
                      position={index + 1}
                      totalTweets={pageContent.tweets.length}
                    />
                    {activeTab === "drafts" && (
                      <div
                        className={
                          currentlyEditedTweet === index ? "" : "hidden"
                        }
                      >
                        <AddTweetButton
                          onClick={() => addTweetToThread(index)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom controls - Responsive version */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-3 sm:gap-0">
        <button
          onClick={() => setShowPreview(true)}
          className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-blue-400 
    hover:bg-gray-800 rounded-full text-sm sm:text-base w-full sm:w-auto"
        >
          <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />
          <span>Preview</span>
        </button>

        {activeTab === "drafts" ? (
          <button
            onClick={handleSaveAsDraft}
            className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 
      bg-blue-500 rounded-full hover:bg-blue-600 text-white text-sm sm:text-base w-full sm:w-auto"
          >
            <Save size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span>
              Save {pageContent.isThread ? "Thread" : "Tweet"} as draft
            </span>
          </button>
        ) : activeTab === "scheduled" ? (
          activeTab === "scheduled" && (
            <button
              onClick={() => {
                // Convert to draft
                const updatedTweets = pageContent.tweets.map((tweet) => ({
                  ...tweet,
                  status: "draft" as const,
                  scheduledFor: undefined,
                }));

                if (pageContent.isThread && pageContent.threadId) {
                  const thread: Thread = {
                    id: pageContent.threadId,
                    tweetIds: updatedTweets.map((t) => t.id),
                    createdAt: new Date(),
                    status: "draft",
                  };
                  tweetStorage.saveThread(thread, updatedTweets, true);
                } else {
                  tweetStorage.saveTweet(updatedTweets[0], true);
                }

                hideEditor();
                setActiveTab("drafts");
                refreshSidebar();
              }}
              className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 
        bg-blue-500 rounded-full hover:bg-blue-600 text-white text-sm sm:text-base w-full sm:w-auto"
            >
              <PenSquare size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span>Switch to Draft</span>
            </button>
          )
        ) : (
          activeTab === "published" && (
            <button
              onClick={handleRepurpose}
              className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 
        bg-blue-500 rounded-full hover:bg-blue-600 text-white text-sm sm:text-base w-full sm:w-auto"
            >
              <PenSquare size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span>Repurpose {pageContent.isThread ? "Thread" : "Tweet"}</span>
            </button>
          )
        )}
      </div>

      {showPreview && (
        <ThreadPreview
          tweets={pageContent.tweets}
          onClose={() => setShowPreview(false)}
          getMediaUrl={getMediaFile}
        />
      )}
      {showScheduler && (
        <div
          className="fixed inset-0 
      bg-black/50 
      backdrop-blur-sm 
      flex items-center justify-center 
      z-50 
      p-4 
      animate-fadeIn   // More standard Tailwind animation
      duration-300 
      ease-out"
          onClick={(e) => {
            // Only close if clicking outside the picker
            if (e.target === e.currentTarget) {
              setShowScheduler(false);
            }
          }}
        >
          <div
            className="transform transition-all duration-300 scale-100 opacity-100"
            // Prevent clicks inside from closing
            onClick={(e) => e.stopPropagation()}
          >
            <SchedulePicker
              onSchedule={handleSchedulePost}
              onCancel={() => setShowScheduler(false)}
            />
          </div>
        </div>
      )}
      <PublishingModal
        isOpen={publishingStatus !== null}
        // isOpen={true}
        onClose={() => {
          setPublishingStatus(null);
          setPublishingError(null);
        }}
        status={publishingStatus || "publishing"}
        error={publishingError || undefined}
        isThread={pageContent.isThread}
      />
      <SubmissionModal
        isOpen={isSubmitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        onProceed={() => {
          // Close the modal
          setSubmitModalOpen(false);
          // Hide the editor
          hideEditor();
          // Refresh the sidebar to show updated content
          refreshSidebar();
        }}
      />
    </div>
  );
}
