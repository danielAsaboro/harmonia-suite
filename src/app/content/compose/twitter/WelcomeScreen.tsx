import { useEditor } from "@/components/editor/context/Editor";
import { tweetStorage } from "@/utils/localStorage";
import { PenSquare } from "lucide-react";

export default function WelcomeScreen() {
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
            : "Continue Scribbling"}
        </button>
      </div>
    </div>
  );
}
