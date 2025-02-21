// app/content/compose/twitter/page.tsx
"use client";

import {
  UserAccountProvider,
  useUserAccount,
} from "@/components/editor/context/account";
import { useEditor } from "@/components/editor/context/Editor";
import LoadingState from "@/components/editor/LoadingState";
import PlayGround from "@/components/editor/Main";
import MetadataTab from "@/components/editor/MetadataTab";
import ActionsMenu from "@/components/editor/PowerTab";
import { tweetStorage } from "@/utils/localStorage";
import { PenSquare } from "lucide-react";

function WelcomeScreen() {
  const { showEditor } = useEditor();

  // Check for existing tweets across different statuses
  const existingDrafts = tweetStorage
    .getTweets()
    .filter(
      (t) =>
        t.status === "draft" ||
        t.status === "scheduled" ||
        t.status === "published"
    );

  // Determine the appropriate welcome message
  const getWelcomeTitle = () => {
    if (existingDrafts.length === 0) {
      return "Create Your First Draft";
    }

    const draftsCount = tweetStorage
      .getTweets()
      .filter((t) => t.status === "draft")
      .filter((t) => !t.position || t.position == 0).length;
    const scheduledCount = tweetStorage
      .getTweets()
      .filter((t) => t.status === "scheduled").length;

    if (draftsCount > 0) {
      return draftsCount === 1
        ? "Continue Working on Your Draft"
        : `You Have ${draftsCount} Drafts Ready`;
    }

    if (scheduledCount > 0) {
      return scheduledCount === 1
        ? "You Have a Scheduled Tweet"
        : `You Have ${scheduledCount} Scheduled Tweets`;
    }

    return "Compose Your Next Tweet";
  };

  const getWelcomeDescription = () => {
    if (existingDrafts.length === 0) {
      return "Start composing your tweet or thread. Your drafts will be saved automatically.";
    }

    const draftsCount = tweetStorage
      .getTweets()
      .filter((t) => t.status === "draft").length;
    const scheduledCount = tweetStorage
      .getTweets()
      .filter((t) => t.status === "scheduled").length;

    if (draftsCount > 0) {
      return draftsCount === 1
        ? "You have an existing draft waiting to be completed."
        : `You have multiple drafts in progress. Pick up where you left off.`;
    }

    if (scheduledCount > 0) {
      return scheduledCount === 1
        ? "You have a tweet scheduled for future publication."
        : `You have multiple tweets scheduled for future publication.`;
    }

    return "Create a new tweet or start a thread to engage your audience.";
  };

  // Find the latest draft
  const latestDraft = tweetStorage
    .getTweets()
    .filter((t) => t.status === "draft")
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="text-center space-y-6">
        <PenSquare size={48} className="text-blue-400 mx-auto" />
        <h1 className="text-2xl font-bold text-white">{getWelcomeTitle()}</h1>
        <p className="text-gray-400 max-w-md">{getWelcomeDescription()}</p>
        <button
          onClick={() => showEditor(latestDraft?.id)}
          className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors font-medium"
        >
          {existingDrafts.length === 0
            ? "Create New Draft"
            : "Continue Drafting"}
        </button>
      </div>
    </div>
  );
}

function TwitterEditorContent() {
  const { editorState, isMetadataTabVisible } = useEditor();
  const { isLoading } = useUserAccount();

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="flex min-h-screen bg-black text-white">
      <div
        className={`relative transition-all duration-300 ease-in-out ${
          isMetadataTabVisible && editorState.isVisible
            ? "w-[calc(100%-320px)]" // Width adjusted to make room for metadata panel
            : "w-full" // Full width when metadata is hidden
        }`}
      >
        {editorState.isVisible ? (
          <div className="flex flex-col h-screen relative">
            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto pb-24">
              <div className="max-w-4xl mx-auto pt-5 p-4">
                <PlayGround
                  draftId={editorState.selectedDraftId}
                  draftType={editorState.selectedDraftType}
                />
              </div>
            </div>

            {/* Sticky Actions Menu that maintains responsive width */}
            <div className="absolute bottom-14 w-full flex justify-center">
              <ActionsMenu />
            </div>
          </div>
        ) : (
          <WelcomeScreen />
        )}
      </div>

      <div
        className={`right-0 top-0 h-screen transition-all duration-300 ease-in-out ${
          isMetadataTabVisible && editorState.isVisible
            ? "translate-x-0 w-[320px]"
            : "translate-x-full w-0"
        }`}
      >
        <MetadataTab />
      </div>
    </div>
  );
}

export default function TwitterEditor() {
  return (
    <UserAccountProvider>
      <TwitterEditorContent />
    </UserAccountProvider>
  );
}
