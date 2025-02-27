// components/Editor/Editor.tsx
"use client";
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { Tweet, Thread, ThreadWithTweets, TweetStatus } from "@/types/tweet";
import { v4 as uuidv4 } from "uuid";
import { tweetStorage } from "@/utils/localStorage";
import {
  getMediaFile,
  removeMediaFile,
  storeMediaFile,
} from "@/lib/storage/indexedDB";
import { useTeam } from "./TeamContext";
import { mapTabToTweetStatus, Tab } from "@/utils/tweetUtils";

type EditorState = {
  isVisible: boolean;
  selectedDraftId: string | null;
  selectedDraftType: "tweet" | "thread" | null;
  selectedItemStatus?: TweetStatus;
};

type EditorContextType = {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  editorState: EditorState;
  showEditor: (draftId?: string, type?: "tweet" | "thread") => void;
  hideEditor: () => void;
  loadDraft: () => Tweet | ThreadWithTweets | null | undefined;
  loadScheduledItem: () => Tweet | ThreadWithTweets | null;
  refreshSidebar: () => void;
  refreshCounter: number;
  isSidebarVisible: boolean;
  toggleSidebar: () => void;
  isMetadataTabVisible: boolean;
  toggleMetadataTab: () => void;
  handleNewDraft: () => void;
  handleScheduleDraft: () => void;
  handlePublishDraft: () => void;
  isSubmitModalOpen: boolean;
  setSubmitModalOpen: (open: boolean) => void;
  selectedTeamId: string | null;
  setSelectedTeamId: (teamId: string | null) => void;
  isTeamAdmin: boolean;
};

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<Tab>("drafts");
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [editorState, setEditorState] = useState<EditorState>({
    isVisible: false,
    selectedDraftId: null,
    selectedDraftType: null,
  });
  const [isMetadataTabVisible, setIsMetadataTabVisible] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const {
    selectedTeamId,
    setSelectedTeamId,
    isTeamAdmin: checkIsTeamAdmin,
  } = useTeam();

  const toggleSidebar = useCallback(() => {
    setIsSidebarVisible((prev) => !prev);
  }, []);

  const toggleMetadataTab = useCallback(() => {
    setIsMetadataTabVisible((prev) => !prev);
  }, []);

  const showEditor = useCallback(
    (draftId?: string, type?: "tweet" | "thread") => {
      if (activeTab === "scheduled" || activeTab === "published") {
        // For scheduled items, just show the preview
        if (draftId) {
          setEditorState({
            isVisible: true,
            selectedDraftId: draftId,
            selectedDraftType: type || "tweet",
            selectedItemStatus: activeTab,
          });
        }
        return;
      }

      // Handle draft creation/editing
      if (activeTab == "drafts") {
        if (!draftId) {
          console.log("No draft id - creating new tweet");
          const newId = `tweet-${uuidv4()}`;
          const newTweet: Tweet = {
            id: newId,
            content: "",
            mediaIds: [],
            tags: [],
            createdAt: new Date(),
            status: "draft",
            teamId: selectedTeamId || undefined,
          };

          tweetStorage.saveTweet(newTweet, true);

          setEditorState({
            isVisible: true,
            selectedDraftId: newId,
            selectedDraftType: "tweet",
            selectedItemStatus: mapTabToTweetStatus(activeTab),
          });

          setRefreshCounter((prev) => prev + 1);
        } else {
          // Load existing draft

          let draftType = type;
          if (!draftType) {
            const thread = tweetStorage
              .getThreads()
              .find((t) => t.id === draftId);
            draftType = thread ? "thread" : "tweet";
          }

          setEditorState({
            isVisible: true,
            selectedDraftId: draftId,
            selectedDraftType: draftType || "tweet",
            selectedItemStatus: mapTabToTweetStatus(activeTab),
          });

          setRefreshCounter((prev) => prev + 1);
        }
      }
    },
    [activeTab]
  );

  const hideEditor = useCallback(() => {
    setEditorState({
      isVisible: false,
      selectedDraftId: null,
      selectedDraftType: null,
    });
    setRefreshCounter((prev) => prev + 1);
  }, []);

  const loadScheduledItem = useCallback(() => {
    if (!editorState.selectedDraftId || !editorState.selectedDraftType) {
      return null;
    }

    if (editorState.selectedDraftType === "tweet") {
      const tweets = tweetStorage.getTweets();
      return (
        tweets.find(
          (t) =>
            t.id === editorState.selectedDraftId &&
            (t.status === "scheduled" || t.status === "published")
        ) || null
      );
    }

    const threads = tweetStorage.getThreads();
    const thread = threads.find((t) => t.id === editorState.selectedDraftId);

    if (
      thread &&
      (thread.status === "scheduled" || thread.status === "published")
    ) {
      const tweets = tweetStorage
        .getTweets()
        .filter((t) => t.threadId === thread.id)
        .sort((a, b) => (a.position || 0) - (b.position || 0))
        .map((tweet) => ({
          ...tweet,
          status: "scheduled" as const,
          scheduledFor: thread.scheduledFor,
        }));

      return {
        ...thread,
        tweets,
      };
    }

    return null;
  }, [editorState.selectedDraftId, editorState.selectedDraftType]);

  const refreshSidebar = useCallback(() => {
    setRefreshCounter((prev) => prev + 1);
  }, []);

  const loadDraft = useCallback(() => {
    if (!editorState.selectedDraftId || !editorState.selectedDraftType) {
      return null;
    }

    // First load the local draft immediately to prevent UI errors
    let localDraft = null;

    if (editorState.selectedDraftType === "tweet") {
      const tweets = tweetStorage.getTweets();
      localDraft = tweets.find(
        (t) => t.id === editorState.selectedDraftId && t.status === "draft"
      );
    } else {
      const threads = tweetStorage.getThreads();
      const thread = threads.find((t) => t.id === editorState.selectedDraftId);

      if (thread && thread.status === "draft") {
        const tweets = tweetStorage
          .getTweets()
          .filter((t) => t.threadId === thread.id)
          .sort((a, b) => (a.position || 0) - (b.position || 0));

        localDraft = {
          ...thread,
          tweets: tweets.map((t) => ({
            ...t,
            status: thread.status,
          })),
        } as ThreadWithTweets;
      }
    }

    // After returning the local draft, check for newer versions on the server
    // const checkForNewerVersion = async () => {
    //   try {
    //     const response = await fetch(
    //       `/api/drafts?type=${editorState.selectedDraftType}&id=${editorState.selectedDraftId}`
    //     );

    //     if (!response.ok) return;

    //     const serverData = await response.json();

    //     if (!serverData) return;

    //     let shouldUpdate = false;

    //     // For tweets, compare timestamps
    //     if (editorState.selectedDraftType === "tweet" && localDraft) {
    //       const serverTime = new Date(serverData.updatedAt).getTime();
    //       const localTime = new Date(
    //         localDraft.lastModified || localDraft.createdAt
    //       ).getTime();

    //       if (serverTime > localTime) {
    //         shouldUpdate = true;

    //         // Sync media files before saving the tweet
    //         await syncMediaFiles(serverData.mediaIds || []);

    //         tweetStorage.saveTweet(serverData, false);
    //       }
    //     }
    //     // For threads, handle the thread and its tweets
    //     else if (editorState.selectedDraftType === "thread" && localDraft) {
    //       const serverTime = new Date(serverData.thread.updatedAt).getTime();
    //       const localTime = new Date(
    //         localDraft.lastModified || localDraft.createdAt
    //       ).getTime();

    //       if (serverTime > localTime) {
    //         shouldUpdate = true;

    //         // Collect all media IDs from all tweets in the thread
    //         const allMediaIds = serverData.tweets.reduce(
    //           (ids: string[], tweet: Tweet) => {
    //             return ids.concat(tweet.mediaIds || []);
    //           },
    //           []
    //         );

    //         // Sync all media files before saving the thread
    //         await syncMediaFiles(allMediaIds);

    //         tweetStorage.saveThread(
    //           serverData.thread,
    //           serverData.tweets,
    //           false
    //         );
    //       }
    //     }

    //     // If we updated local storage, refresh the sidebar
    //     if (shouldUpdate) {
    //       refreshSidebar();
    //     }
    //   } catch (error) {
    //     console.error("Error checking for newer draft version:", error);
    //   }
    // };

    // // Function to sync media files from server to IndexedDB
    // const syncMediaFiles = async (mediaIds: string[]) => {
    //   if (!mediaIds.length) return;

    //   // For each media ID, check if it exists in IndexedDB
    //   // If not, fetch it from the server and store it
    //   const syncPromises = mediaIds.map(async (mediaId) => {
    //     try {
    //       // First check if media already exists in IndexedDB
    //       const existingMedia = await getMediaFile(mediaId);

    //       // Only fetch from server if we don't have it locally
    //       if (!existingMedia) {
    //         // Use a proper media fetch endpoint - NOT the upload endpoint
    //         const response = await fetch(`/api/media/get?id=${mediaId}`);

    //         if (!response.ok) {
    //           throw new Error(`Failed to fetch media ${mediaId}`);
    //         }

    //         // Get the media as a blob
    //         const blob = await response.blob();

    //         // Create a proper File object with the media's MIME type
    //         const file = new File([blob], mediaId, { type: blob.type });

    //         try {
    //           // First try to remove any existing entry to avoid constraint errors
    //           await removeMediaFile(mediaId).catch(() => {
    //             // Ignore errors here - it might not exist yet
    //           });

    //           // Then store the new file
    //           await storeMediaFile(mediaId, file);
    //           console.log(`Media ${mediaId} synced from server to IndexedDB`);
    //         } catch (storageError) {
    //           // If there's a constraint error, the file is already there
    //           if ((storageError as Error).name === "ConstraintError") {
    //             console.log(`Media ${mediaId} already exists in IndexedDB`);
    //           } else {
    //             throw storageError;
    //           }
    //         }
    //       }
    //     } catch (error) {
    //       console.error(`Error syncing media ${mediaId}:`, error);
    //       // Continue with other media files even if this one fails
    //     }
    //   });

    //   // Wait for all media sync operations to complete
    //   await Promise.allSettled(syncPromises);
    // };

    // Start the check but don't wait for it

    // lol
    // checkForNewerVersion();

    // Return the local draft immediately
    return localDraft;
  }, [
    editorState.selectedDraftId,
    editorState.selectedDraftType,
    refreshSidebar,
  ]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleTabSwitch = (e: CustomEvent<Tab>) => {
      setActiveTab(e.detail);
    };

    const handleNewDraft = () => {
      showEditor();
    };

    const handleScheduleDraft = () => {
      // We'll implement this when we add scheduling functionality
      window.dispatchEvent(new CustomEvent("openScheduler"));
    };

    const handlePublishDraft = () => {
      // We'll implement this when we add publishing functionality
      window.dispatchEvent(new CustomEvent("publishCurrent"));
    };

    window.addEventListener("switchTab", handleTabSwitch as EventListener);
    window.addEventListener("newDraft", handleNewDraft);
    window.addEventListener("scheduleDraft", handleScheduleDraft);
    window.addEventListener("publishDraft", handlePublishDraft);

    return () => {
      window.removeEventListener("switchTab", handleTabSwitch as EventListener);
      window.removeEventListener("newDraft", handleNewDraft);
      window.removeEventListener("scheduleDraft", handleScheduleDraft);
      window.removeEventListener("publishDraft", handlePublishDraft);
    };
  }, [showEditor]);

  useEffect(() => {
    setEditorState({
      isVisible: false,
      selectedDraftId: null,
      selectedDraftType: null,
    });
  }, [activeTab]);

  // toggleSidebar to listen for keyboard event
  useEffect(() => {
    const handleToggleSidebar = () => {
      setIsSidebarVisible((prev) => !prev);
    };

    window.addEventListener("toggleSidebar", handleToggleSidebar);
    return () =>
      window.removeEventListener("toggleSidebar", handleToggleSidebar);
  }, []);

  return (
    <EditorContext.Provider
      value={{
        activeTab,
        setActiveTab,
        editorState,
        showEditor,
        hideEditor,
        loadDraft,
        loadScheduledItem,
        refreshSidebar,
        refreshCounter,
        isSidebarVisible,
        toggleSidebar,
        isMetadataTabVisible,
        toggleMetadataTab,
        handleNewDraft: () => window.dispatchEvent(new CustomEvent("newDraft")),
        handleScheduleDraft: () =>
          window.dispatchEvent(new CustomEvent("scheduleDraft")),
        handlePublishDraft: () =>
          window.dispatchEvent(new CustomEvent("publishDraft")),
        isSubmitModalOpen,
        setSubmitModalOpen: (open: boolean) => setIsSubmitModalOpen(open),
        selectedTeamId,
        setSelectedTeamId,
        isTeamAdmin: selectedTeamId ? checkIsTeamAdmin(selectedTeamId) : false,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error("useEditor must be used within a EditorProvider");
  }
  return context;
}
