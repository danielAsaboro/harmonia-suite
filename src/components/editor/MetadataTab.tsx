// src/components/editor/MetadataTab.tsx

import { Badge } from "@/components/ui/badge";
import React, { useState, useEffect, useCallback } from "react";
import { useEditor } from "./context/Editor";
import { tweetStorage } from "@/utils/localStorage";
import { FileCheck } from "lucide-react";
import { DraftMetadata, Tag } from "@/types/tweet";
import { UnifiedChecklist } from "./UnifiedChecklist";
import { cn } from "@/utils/ts-merge";
import TagsSection from "./TagsSection";
import { useTeam } from "./context/TeamContext";
import { useUserAccount } from "./context/account";

const formatTimeAgo = (date: Date): string => {
  const minutes = Math.floor((new Date().getTime() - date.getTime()) / 60000);
  return `${minutes}m ago`;
};

const TagBadge: React.FC<{ tag: Tag }> = ({ tag }) => {
  const getTagIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "affiliate marketing":
        return "💰";
      case "build in public":
        return "🏗️";
      case "copywriting":
        return "✍️";
      default:
        return "🏷️";
    }
  };

  return (
    <Badge variant="secondary" className="mr-2 mb-2">
      {getTagIcon(tag.name)} {tag.name}
    </Badge>
  );
};

interface MetadataTabProps {
  className?: string;
}

const MetadataTab: React.FC<MetadataTabProps> = ({ className }) => {
  const {
    editorState,
    loadDraft: loadDrafts,
    loadScheduledItem: loadScheduledItems,
    activeTab,
    setSubmitModalOpen,
    refreshCounter,
    hideEditor,
    refreshSidebar,
  } = useEditor();
  const { selectedTeamId, isTeamAdmin, teams } = useTeam();
  const { id: userId } = useUserAccount();

  const [draftData, setDraftData] = useState<DraftMetadata>({
    title: "Draft title...",
    createdAt: new Date(Date.now() - 13 * 60000),
    lastEdited: new Date(Date.now() - tweetStorage.getLastSaveTime()),
    tags: [
      { id: "1", name: "Affiliate Marketing" },
      { id: "2", name: "Build In Public" },
      { id: "3", name: "Copywriting" },
    ],
    stats: {
      wordCount: 50,
      characterCount: 284,
      readingTime: "16s",
      threadLength: 0,
    },
  });

  const calculateStats = useCallback(
    (content: string): DraftMetadata["stats"] => {
      const words = content.trim().split(/\s+/).length;
      const chars = content.length;
      const readingTime = `${Math.ceil(words / 200)}m`;

      return {
        wordCount: words,
        characterCount: chars,
        readingTime,
        threadLength: 1,
      };
    },
    [editorState.selectedDraftType]
  );

  useEffect(() => {
    const getContentData = async () => {
      const drafts =
        activeTab === "scheduled" ? loadScheduledItems() : await loadDrafts();

      if (!drafts) return;

      const content =
        "tweets" in drafts
          ? drafts.tweets.map((t) => t.content).join("\n")
          : drafts.content;

      const stats = calculateStats(content);

      if ("tweets" in drafts) {
        stats.threadLength = drafts.tweets.length;
      }

      setDraftData({
        title: "Draft title...",
        createdAt: new Date(drafts.createdAt),
        lastEdited: new Date(),
        tags: [
          { id: "1", name: "Affiliate Marketing" },
          { id: "2", name: "Build In Public" },
          { id: "3", name: "Copywriting" },
        ],
        stats: stats,
      });
    };

    getContentData();
  }, [
    activeTab,
    loadDrafts,
    loadScheduledItems,
    editorState.selectedDraftType,
    editorState.selectedDraftId,
    refreshCounter,
  ]);

  return (
    <div
      className={cn(
        "w-full  bg-transparent",
        "md:border-l md:border-gray-800",
        className
      )}
    >
      {/* Title Section */}
      <div className="p-4 border-b border-gray-800">
        <input
          type="text"
          placeholder={draftData.title}
          className="text-xl font-medium bg-transparent border-0 outline-none w-full focus:outline-none focus:ring-0"
        />
        <div className="flex flex-col space-y-1 text-sm text-gray-500 mt-1">
          <div className="flex justify-between w-full">
            <span>Created</span>
            <span>{formatTimeAgo(draftData.createdAt)}</span>
          </div>
          <div className="flex justify-between w-full">
            <span>Last edited</span>
            <span>{formatTimeAgo(draftData.lastEdited)}</span>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="p-4 border-b border-gray-800">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Words</span>
            <span className="font-medium text-gray-500">
              {draftData.stats.wordCount}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Characters</span>
            <span className="font-medium text-gray-500">
              {draftData.stats.characterCount}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Reading time</span>
            <span className="font-medium text-gray-500">
              {draftData.stats.readingTime}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">No. of Tweets</span>
            <span className="font-medium text-gray-500">
              {draftData.stats.threadLength}
            </span>
          </div>
        </div>
      </div>

      {/* Tags Section */}
      <TagsSection />

      {/* Team Information Section */}
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-sm font-medium text-gray-400 mb-2">Team</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Selected Team</span>
            <span className="font-medium text-gray-300">
              {teams.find((t) => t.id === selectedTeamId)?.name || "Personal"}
            </span>
          </div>
          {selectedTeamId && selectedTeamId !== userId && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Role</span>
              <span className="font-medium text-gray-300">
                {teams.find((t) => t.id === selectedTeamId)?.role || "Member"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Checklist Section */}
      <div className="p-4 border-b border-gray-800">
        <UnifiedChecklist />
      </div>

      {/* Submit Button Section */}
      {/* <div className="relative w-full h-40">
        <div className="w-full h-full flex items-center justify-center">
          <div className="p-4">
            <button
              onClick={() => setSubmitModalOpen(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center justify-center gap-2"
            >
              <FileCheck size={18} />
              Submit for review
            </button>
          </div>
        </div>
      </div> */}
      {/* Submit Button Section - Only show for team content (not personal) */}
      {selectedTeamId && selectedTeamId !== userId && (
        <div className="relative w-full h-40">
          <div className="w-full h-full flex items-center justify-center">
            <div className="p-4">
              <button
                onClick={() => setSubmitModalOpen(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center justify-center gap-2"
                disabled={editorState.selectedItemStatus === "pending_approval"}
              >
                <FileCheck size={18} />
                {editorState.selectedItemStatus === "pending_approval"
                  ? "Pending Approval"
                  : "Submit for review"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Actions - Only shown for team admins on pending content */}
      {isTeamAdmin(selectedTeamId!) && editorState.selectedItemStatus === "pending_approval" && (
        <div className="p-4 border-t border-gray-800">
          <h3 className="text-sm font-medium text-gray-400 mb-3">
            Admin Actions
          </h3>
          <div className="flex gap-3">
            <button
              className="px-3 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 flex-1"
              onClick={async () => {
                try {
                  const contentId = editorState.selectedDraftId;
                  const contentType = editorState.selectedDraftType;

                  if (!contentId || !contentType || !selectedTeamId) return;

                  const response = await fetch("/api/team/content", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      action: "approve",
                      contentId,
                      contentType,
                      teamId: selectedTeamId,
                    }),
                  });

                  if (!response.ok) {
                    throw new Error("Failed to approve content");
                  }

                  // Success - close editor and refresh sidebar
                  alert("Content approved successfully");
                  hideEditor();
                  refreshSidebar();
                } catch (error) {
                  console.error("Error approving content:", error);
                  alert(
                    "Failed to approve content: " +
                      (error instanceof Error ? error.message : "Unknown error")
                  );
                }
              }}
            >
              Approve
            </button>
            <button
              className="px-3 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 flex-1"
              onClick={async () => {
                try {
                  const reason = prompt(
                    "Please provide a reason for rejection:"
                  );
                  if (reason === null) return; // User cancelled

                  const contentId = editorState.selectedDraftId;
                  const contentType = editorState.selectedDraftType;

                  if (!contentId || !contentType || !selectedTeamId) return;

                  const response = await fetch("/api/team/content", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      action: "reject",
                      contentId,
                      contentType,
                      teamId: selectedTeamId,
                      rejectionReason: reason,
                    }),
                  });

                  if (!response.ok) {
                    throw new Error("Failed to reject content");
                  }

                  // Success - close editor and refresh sidebar
                  alert("Content rejected successfully");
                  hideEditor();
                  refreshSidebar();
                } catch (error) {
                  console.error("Error rejecting content:", error);
                  alert(
                    "Failed to reject content: " +
                      (error instanceof Error ? error.message : "Unknown error")
                  );
                }
              }}
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetadataTab;
