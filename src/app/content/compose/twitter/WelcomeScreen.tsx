// app/content/compose/twitter/WelcomeScreen.tsx

import { useEditor } from "@/components/editor/context/Editor";
import { useTeam } from "@/components/editor/context/TeamContext";
import { tweetStorage } from "@/utils/localStorage";
import { PenSquare, Users } from "lucide-react";
import { useEffect, useState } from "react";

export default function WelcomeScreen() {
  const { showEditor, selectedTeamId } = useEditor();
  const { teams } = useTeam();
  const [isClient, setIsClient] = useState(false);

  // Use useEffect to handle localStorage access only on client-side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get the current team's name
  const getCurrentTeamName = () => {
    if (!selectedTeamId || !teams) return "Personal";
    const team = teams.find(t => t.id === selectedTeamId);
    return team ? team.name : "Personal";
  };

  // Get all drafts (standalone tweets and threads)
  const getDraftsInfo = () => {
    if (!isClient) {
      return {
        standaloneTweets: [],
        threads: [],
        scheduledTweets: 0,
        scheduledThreads: 0,
        pendingApprovalTweets: 0,
        pendingApprovalThreads: 0,
      };
    }

    const allTweets = tweetStorage.getTweets();
    const allThreads = tweetStorage.getThreads();

    // Filter by team ID if selected
    const teamTweets = selectedTeamId 
      ? allTweets.filter(t => t.teamId === selectedTeamId || (!t.teamId && selectedTeamId === teams[0]?.id))
      : allTweets;
    
    const teamThreads = selectedTeamId
      ? allThreads.filter(t => t.teamId === selectedTeamId || (!t.teamId && selectedTeamId === teams[0]?.id))
      : allThreads;

    // Count standalone draft tweets (not part of any thread)
    const standaloneTweets = teamTweets.filter(
      (t) => t.status === "draft" && !t.threadId && !t.isSubmitted
    );

    // Get all draft threads
    const threads = teamThreads.filter((t) => t.status === "draft" && !t.isSubmitted);

    // Count scheduled items
    const scheduledTweets = teamTweets.filter(
      (t) => t.status === "scheduled" && !t.threadId
    ).length;

    const scheduledThreads = teamThreads.filter(
      (t) => t.status === "scheduled"
    ).length;

    // Count pending approval items
    const pendingApprovalTweets = teamTweets.filter(
      (t) => t.status === "pending_approval" && !t.threadId
    ).length;

    const pendingApprovalThreads = teamThreads.filter(
      (t) => t.status === "pending_approval"
    ).length;

    return { 
      standaloneTweets, 
      threads, 
      scheduledTweets, 
      scheduledThreads,
      pendingApprovalTweets,
      pendingApprovalThreads
    };
  };

  // Get the latest draft (can be a tweet or thread)
  const getLatestDraft = () => {
    if (!isClient) return null;

    const { standaloneTweets, threads } = getDraftsInfo();

    // Sort standalone tweets by creation date
    const sortedTweets = [...standaloneTweets].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Sort threads by creation date
    const sortedThreads = [...threads].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Get the latest of each type
    const latestTweet = sortedTweets[0];
    const latestThread = sortedThreads[0];

    // Compare and return the most recent one
    if (latestTweet && latestThread) {
      return new Date(latestTweet.createdAt).getTime() >
        new Date(latestThread.createdAt).getTime()
        ? { id: latestTweet.id, type: "tweet" }
        : { id: latestThread.id, type: "thread" };
    }

    // Return whichever exists
    if (latestTweet) return { id: latestTweet.id, type: "tweet" };
    if (latestThread) return { id: latestThread.id, type: "thread" };

    return null;
  };

  const {
    standaloneTweets,
    threads,
    scheduledTweets,
    scheduledThreads,
    pendingApprovalTweets,
    pendingApprovalThreads
  } = getDraftsInfo();
  
  const totalDrafts = standaloneTweets.length + threads.length;
  const totalScheduled = scheduledTweets + scheduledThreads;
  const totalPendingApproval = pendingApprovalTweets + pendingApprovalThreads;
  const latestDraft = getLatestDraft();
  const teamName = getCurrentTeamName();
  const isTeamContext = selectedTeamId && selectedTeamId !== teams[0]?.id;

  // Get welcome title based on team context and draft/scheduled count
  const getWelcomeTitle = () => {
    if (isTeamContext) {
      if (totalDrafts === 0 && totalScheduled === 0 && totalPendingApproval === 0) {
        return `Create Your First Draft for ${teamName}`;
      }

      if (totalPendingApproval > 0) {
        return totalPendingApproval === 1
          ? `${teamName} Has 1 Item Pending Approval`
          : `${teamName} Has ${totalPendingApproval} Items Pending Approval`;
      }

      if (totalDrafts > 0) {
        return totalDrafts === 1
          ? `Continue Working on Your ${teamName} Draft`
          : `You Have ${totalDrafts} ${teamName} Drafts Ready`;
      }

      if (totalScheduled > 0) {
        return totalScheduled === 1
          ? `${teamName} Has a Scheduled Post`
          : `${teamName} Has ${totalScheduled} Scheduled Posts`;
      }

      return `Compose Your Next Tweet for ${teamName}`;
    } else {
      // Original non-team-specific titles
      if (totalDrafts === 0 && totalScheduled === 0) {
        return "Create Your First Draft";
      }

      if (totalDrafts > 0) {
        return totalDrafts === 1
          ? "Continue Working on Your Draft"
          : `You Have ${totalDrafts} Drafts Ready`;
      }

      if (totalScheduled > 0) {
        return totalScheduled === 1
          ? "You Have a Scheduled Post"
          : `You Have ${totalScheduled} Scheduled Posts`;
      }

      return "Compose Your Next Tweet";
    }
  };

  // Get welcome description based on team context and draft/scheduled count
  const getWelcomeDescription = () => {
    if (isTeamContext) {
      if (totalDrafts === 0 && totalScheduled === 0 && totalPendingApproval === 0) {
        return `Start composing content for ${teamName}. Your drafts will be saved automatically.`;
      }

      if (totalPendingApproval > 0) {
        if (pendingApprovalTweets > 0 && pendingApprovalThreads > 0) {
          return `${teamName} has ${pendingApprovalTweets} tweet${pendingApprovalTweets > 1 ? "s" : ""} and ${pendingApprovalThreads} thread${pendingApprovalThreads > 1 ? "s" : ""} waiting for approval.`;
        } else if (pendingApprovalTweets > 0) {
          return pendingApprovalTweets === 1
            ? `${teamName} has a tweet waiting for approval.`
            : `${teamName} has ${pendingApprovalTweets} tweets waiting for approval.`;
        } else {
          return pendingApprovalThreads === 1
            ? `${teamName} has a thread waiting for approval.`
            : `${teamName} has ${pendingApprovalThreads} threads waiting for approval.`;
        }
      }

      if (totalDrafts > 0) {
        if (standaloneTweets.length > 0 && threads.length > 0) {
          return `You have ${standaloneTweets.length} tweet${standaloneTweets.length > 1 ? "s" : ""} and ${threads.length} thread${threads.length > 1 ? "s" : ""} in draft for ${teamName}.`;
        } else if (standaloneTweets.length > 0) {
          return standaloneTweets.length === 1
            ? `You have a tweet draft for ${teamName} waiting to be completed.`
            : `You have ${standaloneTweets.length} tweet drafts for ${teamName} in progress.`;
        } else {
          return threads.length === 1
            ? `You have a thread draft for ${teamName} waiting to be completed.`
            : `You have ${threads.length} thread drafts for ${teamName} in progress.`;
        }
      }

      if (totalScheduled > 0) {
        if (scheduledTweets > 0 && scheduledThreads > 0) {
          return `${teamName} has ${scheduledTweets} tweet${scheduledTweets > 1 ? "s" : ""} and ${scheduledThreads} thread${scheduledThreads > 1 ? "s" : ""} scheduled.`;
        } else if (scheduledTweets > 0) {
          return scheduledTweets === 1
            ? `${teamName} has a tweet scheduled for future publication.`
            : `${teamName} has ${scheduledTweets} tweets scheduled for future publication.`;
        } else {
          return scheduledThreads === 1
            ? `${teamName} has a thread scheduled for future publication.`
            : `${teamName} has ${scheduledThreads} threads scheduled for future publication.`;
        }
      }

      return `Create new content for the ${teamName} team to engage your audience.`;
    } else {
      // Original non-team-specific descriptions
      if (totalDrafts === 0 && totalScheduled === 0) {
        return "Start composing your tweet or thread. Your drafts will be saved automatically.";
      }

      if (totalDrafts > 0) {
        if (standaloneTweets.length > 0 && threads.length > 0) {
          return `You have ${standaloneTweets.length} tweet${standaloneTweets.length > 1 ? "s" : ""} and ${threads.length} thread${threads.length > 1 ? "s" : ""} in draft.`;
        } else if (standaloneTweets.length > 0) {
          return standaloneTweets.length === 1
            ? "You have a tweet draft waiting to be completed."
            : `You have ${standaloneTweets.length} tweet drafts in progress.`;
        } else {
          return threads.length === 1
            ? "You have a thread draft waiting to be completed."
            : `You have ${threads.length} thread drafts in progress.`;
        }
      }

      if (totalScheduled > 0) {
        if (scheduledTweets > 0 && scheduledThreads > 0) {
          return `You have ${scheduledTweets} tweet${scheduledTweets > 1 ? "s" : ""} and ${scheduledThreads} thread${scheduledThreads > 1 ? "s" : ""} scheduled.`;
        } else if (scheduledTweets > 0) {
          return scheduledTweets === 1
            ? "You have a tweet scheduled for future publication."
            : `You have ${scheduledTweets} tweets scheduled for future publication.`;
        } else {
          return scheduledThreads === 1
            ? "You have a thread scheduled for future publication."
            : `You have ${scheduledThreads} threads scheduled for future publication.`;
        }
      }

      return "Create a new tweet or start a thread to engage your audience.";
    }
  };

  const handleCreateOrContinue = () => {
    if (latestDraft) {
      showEditor(
        latestDraft.id,
        latestDraft.type as "tweet" | "thread" | undefined
      );
    } else {
      showEditor();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 sm:px-6 lg:px-8">
      <div className="text-center space-y-6 max-w-md w-full">
        {isTeamContext ? (
          <div className="flex justify-center items-center">
            <Users size={48} className="text-blue-400 mx-auto" />
          </div>
        ) : (
          <PenSquare size={48} className="text-blue-400 mx-auto" />
        )}
        
        <h1 className="text-2xl font-bold text-white">{getWelcomeTitle()}</h1>
        <p className="text-gray-400 text-sm sm:text-base">
          {getWelcomeDescription()}
        </p>
        
        {(totalDrafts > 0 || totalScheduled === 0) && (
          <button
            onClick={handleCreateOrContinue}
            className="w-full sm:w-auto px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors font-medium"
          >
            {totalDrafts === 0 && totalScheduled === 0
              ? isTeamContext ? `Create New ${teamName} Draft` : "Create New Draft"
              : "Continue Scribbling"}
          </button>
        )}
      </div>
    </div>
  );
}