// app/content/compose/twitter/SubmissionModal.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { useTeam } from "@/components/editor/context/TeamContext";
import { useEditor } from "@/components/editor/context/Editor";
import { hashThread, hashTweet } from "@/components/editor/utils";
import { tweetStorage } from "@/utils/localStorage";
import { useUserAccount } from "@/components/editor/context/account";
import { TweetStatus, Thread, Tweet } from "@/types/tweet";

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
}

const SubmissionModal: React.FC<SubmissionModalProps> = ({
  isOpen,
  onClose,
  onProceed,
}) => {
  const { selectedTeamId } = useTeam();
  const { id: userId } = useUserAccount();
  const { editorState, hideEditor, refreshSidebar } = useEditor();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentContent, setCurrentContent] = useState<{
    id: string | null;
    type: "tweet" | "thread" | null;
    isThread: boolean;
  }>({
    id: null,
    type: null,
    isThread: false,
  });

  // Sync with editor state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Get the current content from localStorage to ensure we're working with the most up-to-date state
      // This resolves issues where editorState might be stale
      const allTweets = tweetStorage.getTweets();
      const allThreads = tweetStorage.getThreads();

      // First check if the selected draft is in a thread
      const selectedTweet = allTweets.find(
        (t) => t.id === editorState.selectedDraftId
      );

      if (selectedTweet?.threadId) {
        // This is part of a thread, so let's update our state to reflect that
        setCurrentContent({
          id: selectedTweet.threadId,
          type: "thread",
          isThread: true,
        });
      } else if (selectedTweet) {
        // This is a standalone tweet
        setCurrentContent({
          id: selectedTweet.id,
          type: "tweet",
          isThread: false,
        });
      } else {
        // Check if it's a thread
        const selectedThread = allThreads.find(
          (t) => t.id === editorState.selectedDraftId
        );
        if (selectedThread) {
          setCurrentContent({
            id: selectedThread.id,
            type: "thread",
            isThread: true,
          });
        } else {
          // Fall back to editor state
          setCurrentContent({
            id: editorState.selectedDraftId,
            type: editorState.selectedDraftType,
            isThread: editorState.selectedDraftType === "thread",
          });
        }
      }
    }
  }, [isOpen, editorState.selectedDraftId, editorState.selectedDraftType]);

  const handleSubmit = async () => {
    // Only allow submission if content is associated with a team
    if (!selectedTeamId || selectedTeamId === userId) {
      alert("Please select a team to submit this content for approval.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get content details from our synced state
      let contentId = currentContent.id;
      let contentType = currentContent.type;
      let contentHash: string | null = null;

      // Validate content exists
      if (!contentId || !contentType) {
        throw new Error("No content selected for submission");
      }

      // Get content for hashing
      if (contentType === "thread" || currentContent.isThread) {
        const threadData = tweetStorage.getThreadWithTweets(contentId);
        if (!threadData) {
          throw new Error("Thread not found");
        }

        contentHash = hashThread(threadData.tweets);

        // Prepare to update local state
        const thread = {
          ...threadData,
          id: contentId,
          tweetIds: threadData.tweets.map((t) => t.id),
          createdAt: threadData.createdAt || new Date(),
          status: "pending_approval" as TweetStatus,
          teamId: selectedTeamId,
          isSubmitted: true,
        };

        // Update tweets in thread
        const updatedTweets = threadData.tweets.map((tweet) => ({
          ...tweet,
          status: "pending_approval" as TweetStatus,
          teamId: selectedTeamId,
          isSubmitted: true,
        }));

        tweetStorage.saveThread(thread, updatedTweets, true);

        // Submit to approval endpoint
        const response = await fetch("/api/team/content/approval", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: contentType, // Force type to thread
            id: contentId,
            teamId: selectedTeamId,
            contentHash,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();

          // revert back to draft
          if (!threadData) {
            throw new Error("Thread not found");
          }

          const revertedThread = {
            ...threadData,
            id: contentId,
            tweetIds: threadData.tweets.map((t) => t.id),
            createdAt: threadData.createdAt || new Date(),
            status: "draft" as TweetStatus,
            teamId: selectedTeamId,
            isSubmitted: false,
          };

          const revertedThreadTweets = threadData.tweets.map((tweet) => ({
            ...tweet,
            status: "draft" as TweetStatus,
            teamId: selectedTeamId,
            isSubmitted: false,
          }));

          tweetStorage.saveThread(revertedThread, revertedThreadTweets, true);
          throw new Error(errorData.error || "Failed to submit for approval");
        }
      } else {
        // Handle single tweet
        const tweet = tweetStorage.getTweets().find((t) => t.id === contentId);
        if (!tweet) {
          throw new Error("Tweet not found");
        }

        contentHash = hashTweet(tweet);

        // Create an updated tweet object with teamId and isSubmitted
        const updatedTweet = {
          ...tweet,
          status: "pending_approval" as TweetStatus,
          teamId: selectedTeamId,
          isSubmitted: true,
        };
        tweetStorage.saveTweet(updatedTweet, true);

        // Submit to approval endpoint
        const response = await fetch("/api/team/content/approval", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "tweet",
            id: contentId,
            teamId: selectedTeamId,
            contentHash,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();

          const revertedTweet = {
            ...tweet,
            status: "draft" as TweetStatus,
            teamId: selectedTeamId,
            isSubmitted: false,
          };
          // Update tweet in local storage with explicit teamId and isSubmitted
          tweetStorage.saveTweet(revertedTweet, true);
          throw new Error(errorData.error || "Failed to submit for approval");
        }
      }

      // After successful submission, call the original onProceed function
      // which will close the modal, hide the editor, and refresh the sidebar
      onProceed();
    } catch (error) {
      console.error("Error submitting for review:", error);
      alert(
        "Failed to submit for review: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn duration-300 ease-out">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-gray-900 rounded-lg border border-gray-800 p-6 max-w-md w-full"
          >
            <div className="flex flex-col items-center text-center mb-6">
              <div className="bg-amber-500/20 p-3 rounded-full mb-4">
                <AlertTriangle size={28} className="text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Submit for Review
              </h3>
              <p className="text-gray-400">
                Once submitted, you won't be able to edit this content again
                until the reviewers are done. Are you sure you want to proceed?
              </p>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-700 text-white rounded-full hover:bg-gray-800 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className={`px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors flex items-center justify-center ${
                  isSubmitting ? "opacity-75 cursor-not-allowed" : ""
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  "Proceed"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SubmissionModal;
