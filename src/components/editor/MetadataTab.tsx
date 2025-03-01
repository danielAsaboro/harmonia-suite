// // src/components/editor/MetadataTab.tsx

// import React, { useState, useEffect, useCallback } from "react";
// import { useEditor } from "./context/Editor";
// import { tweetStorage } from "@/utils/localStorage";
// import { FileCheck } from "lucide-react";
// import { DraftMetadata, Tag } from "@/types/tweet";
// import { UnifiedChecklist } from "./UnifiedChecklist";
// import { cn } from "@/utils/ts-merge";
// import TagsSection from "./TagsSection"; // Import our updated TagsSection
// import { useTeam } from "./context/TeamContext";
// import { useUserAccount } from "./context/account";

// const formatTimeAgo = (date: Date): string => {
//   const minutes = Math.floor((new Date().getTime() - date.getTime()) / 60000);
//   return `${minutes}m ago`;
// };

// interface MetadataTabProps {
//   className?: string;
// }

// const MetadataTab: React.FC<MetadataTabProps> = ({ className }) => {
//   const {
//     editorState,
//     loadDraft,
//     loadScheduledItem,
//     activeTab,
//     setSubmitModalOpen,
//     refreshCounter,
//     hideEditor,
//     refreshSidebar,
//   } = useEditor();
//   const { selectedTeamId, isTeamAdmin, teams } = useTeam();
//   const { id: userId } = useUserAccount();

//   const [draftData, setDraftData] = useState<DraftMetadata>({
//     title: "Draft title...",
//     createdAt: new Date(Date.now() - 13 * 60000),
//     lastEdited: new Date(Date.now() - tweetStorage.getLastSaveTime()),
//     tags: [], // We'll populate this from the actual content now
//     stats: {
//       wordCount: 50,
//       characterCount: 284,
//       readingTime: "16s",
//       threadLength: 0,
//     },
//   });

//   const calculateStats = useCallback(
//     (content: string): DraftMetadata["stats"] => {
//       const words = content.trim().split(/\s+/).length;
//       const chars = content.length;
//       const readingTime = `${Math.ceil(words / 200)}m`;

//       return {
//         wordCount: words,
//         characterCount: chars,
//         readingTime,
//         threadLength: 1,
//       };
//     },
//     [editorState.selectedDraftType]
//   );

//   useEffect(() => {
//     const getContentData = async () => {
//       const drafts =
//         activeTab === "scheduled" ? loadScheduledItem() : await loadDraft();

//       if (!drafts) return;

//       const content =
//         "tweets" in drafts
//           ? drafts.tweets.map((t) => t.content).join("\n")
//           : drafts.content;

//       const stats = calculateStats(content);

//       if ("tweets" in drafts) {
//         stats.threadLength = drafts.tweets.length;
//       }

//       // Process tags - convert string tags to Tag objects if needed
//       const tags =
//         "tweets" in drafts
//           ? drafts.tags?.map((tag, idx) => {
//               if (typeof tag === "string") {
//                 return { id: `tag-${idx}`, name: tag };
//               }
//               return tag as Tag;
//             }) || []
//           : drafts.tags?.map((tag, idx) => {
//               if (typeof tag === "string") {
//                 return { id: `tag-${idx}`, name: tag };
//               }
//               return tag as Tag;
//             }) || [];

//       setDraftData({
//         title: "Draft title...",
//         createdAt: new Date(drafts.createdAt),
//         lastEdited: new Date(),
//         tags: tags,
//         stats: stats,
//       });
//     };

//     getContentData();
//   }, [
//     activeTab,
//     loadDraft,
//     loadScheduledItem,
//     editorState.selectedDraftType,
//     editorState.selectedDraftId,
//     refreshCounter,
//     calculateStats,
//   ]);

//   return (
//     <div
//       className={cn(
//         "w-full bg-transparent",
//         "md:border-l md:border-gray-800",
//         className
//       )}
//     >
//       {/* Title Section */}
//       <div className="p-4 border-b border-gray-800">
//         <input
//           type="text"
//           placeholder={draftData.title}
//           className="text-xl font-medium bg-transparent border-0 outline-none w-full focus:outline-none focus:ring-0"
//         />
//         <div className="flex flex-col space-y-1 text-sm text-gray-500 mt-1">
//           <div className="flex justify-between w-full">
//             <span>Created</span>
//             <span>{formatTimeAgo(draftData.createdAt)}</span>
//           </div>
//           <div className="flex justify-between w-full">
//             <span>Last edited</span>
//             <span>{formatTimeAgo(draftData.lastEdited)}</span>
//           </div>
//         </div>
//       </div>

//       {/* Stats Section */}
//       <div className="p-4 border-b border-gray-800">
//         <div className="space-y-2">
//           <div className="flex justify-between items-center">
//             <span className="text-sm text-gray-500">Words</span>
//             <span className="font-medium text-gray-500">
//               {draftData.stats.wordCount}
//             </span>
//           </div>
//           <div className="flex justify-between items-center">
//             <span className="text-sm text-gray-500">Characters</span>
//             <span className="font-medium text-gray-500">
//               {draftData.stats.characterCount}
//             </span>
//           </div>
//           <div className="flex justify-between items-center">
//             <span className="text-sm text-gray-500">Reading time</span>
//             <span className="font-medium text-gray-500">
//               {draftData.stats.readingTime}
//             </span>
//           </div>
//           <div className="flex justify-between items-center">
//             <span className="text-sm text-gray-500">No. of Tweets</span>
//             <span className="font-medium text-gray-500">
//               {draftData.stats.threadLength}
//             </span>
//           </div>
//         </div>
//       </div>

//       {/* Tags Section - Now using our updated TagsSection component */}
//       <TagsSection />

//       {/* Team Information Section */}
//       <div className="p-4 border-b border-gray-800">
//         <h3 className="text-sm font-medium text-gray-400 mb-2">Team</h3>
//         <div className="space-y-2">
//           <div className="flex justify-between items-center">
//             <span className="text-sm text-gray-500">Selected Team</span>
//             <span className="font-medium text-gray-300">
//               {teams.find((t) => t.id === selectedTeamId)?.name || "Personal"}
//             </span>
//           </div>
//           {selectedTeamId && selectedTeamId !== userId && (
//             <div className="flex justify-between items-center">
//               <span className="text-sm text-gray-500">Role</span>
//               <span className="font-medium text-gray-300">
//                 {teams.find((t) => t.id === selectedTeamId)?.role || "Member"}
//               </span>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Checklist Section */}
//       <div className="p-4 border-b border-gray-800">
//         <UnifiedChecklist />
//       </div>

//       {/* Submit Button Section - Only show for team content (not personal) */}
//       {selectedTeamId && selectedTeamId !== userId && (
//         <div className="relative w-full p-4 border-b border-gray-800">
//           <h3 className="text-sm font-medium text-gray-400 mb-3">
//             Content Review
//           </h3>
//           {editorState.selectedItemStatus === "pending_approval" ? (
//             <div className="p-3 bg-yellow-900/30 rounded-md">
//               <div className="flex items-center gap-2">
//                 <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
//                 <span className="text-yellow-400 text-sm font-medium">
//                   Pending Review
//                 </span>
//               </div>
//               <p className="text-xs text-gray-400 mt-2">
//                 This content has been submitted for review and is awaiting
//                 approval.
//               </p>
//             </div>
//           ) : editorState.selectedItemStatus === "approved" ? (
//             <div className="p-3 bg-green-900/30 rounded-md">
//               <div className="flex items-center gap-2">
//                 <span className="w-2 h-2 bg-green-400 rounded-full"></span>
//                 <span className="text-green-400 text-sm font-medium">
//                   Approved
//                 </span>
//               </div>
//               <p className="text-xs text-gray-400 mt-2">
//                 This content has been approved for publishing.
//               </p>
//             </div>
//           ) : editorState.selectedItemStatus === "rejected" ? (
//             <div className="p-3 bg-red-900/30 rounded-md">
//               <div className="flex items-center gap-2">
//                 <span className="w-2 h-2 bg-red-400 rounded-full"></span>
//                 <span className="text-red-400 text-sm font-medium">
//                   Rejected
//                 </span>
//               </div>
//               <p className="text-xs text-gray-400 mt-2">
//                 This content was rejected. Please revise and resubmit.
//               </p>
//             </div>
//           ) : (
//             <button
//               onClick={() => setSubmitModalOpen(true)}
//               className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center justify-center gap-2 w-full"
//             >
//               <FileCheck size={18} />
//               Submit for review
//             </button>
//           )}
//         </div>
//       )}

//       {/* Approval Actions - Only shown for team admins on pending content */}
//       {isTeamAdmin(selectedTeamId!) &&
//         editorState.selectedItemStatus === "pending_approval" && (
//           <div className="p-4 border-t border-gray-800">
//             <h3 className="text-sm font-medium text-gray-400 mb-3">
//               Admin Actions
//             </h3>
//             <div className="flex gap-3">
//               <button
//                 className="px-3 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 flex-1"
//                 onClick={async () => {
//                   try {
//                     const contentId = editorState.selectedDraftId;
//                     const contentType = editorState.selectedDraftType;

//                     if (!contentId || !contentType || !selectedTeamId) return;

//                     const response = await fetch("/api/team/content/approval", {
//                       method: "PATCH",
//                       headers: {
//                         "Content-Type": "application/json",
//                       },
//                       body: JSON.stringify({
//                         action: "approve",
//                         contentId,
//                         contentType,
//                         teamId: selectedTeamId,
//                       }),
//                     });

//                     if (!response.ok) {
//                       throw new Error("Failed to approve content");
//                     }

//                     // Success - close editor and refresh sidebar
//                     alert("Content approved successfully");
//                     hideEditor();
//                     refreshSidebar();
//                   } catch (error) {
//                     console.error("Error approving content:", error);
//                     alert(
//                       "Failed to approve content: " +
//                         (error instanceof Error
//                           ? error.message
//                           : "Unknown error")
//                     );
//                   }
//                 }}
//               >
//                 Approve
//               </button>
//               <button
//                 className="px-3 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 flex-1"
//                 onClick={async () => {
//                   try {
//                     const reason = prompt(
//                       "Please provide a reason for rejection:"
//                     );
//                     if (reason === null) return; // User cancelled
//                     if (reason.trim() === "") {
//                       alert("A rejection reason is required");
//                       return;
//                     }

//                     const contentId = editorState.selectedDraftId;
//                     const contentType = editorState.selectedDraftType;

//                     if (!contentId || !contentType || !selectedTeamId) return;

//                     const response = await fetch("/api/team/content/approval", {
//                       method: "PATCH",
//                       headers: {
//                         "Content-Type": "application/json",
//                       },
//                       body: JSON.stringify({
//                         action: "reject",
//                         contentId,
//                         contentType,
//                         teamId: selectedTeamId,
//                         rejectionReason: reason,
//                       }),
//                     });

//                     if (!response.ok) {
//                       throw new Error("Failed to reject content");
//                     }

//                     // Success - close editor and refresh sidebar
//                     alert("Content rejected successfully");
//                     hideEditor();
//                     refreshSidebar();
//                   } catch (error) {
//                     console.error("Error rejecting content:", error);
//                     alert(
//                       "Failed to reject content: " +
//                         (error instanceof Error
//                           ? error.message
//                           : "Unknown error")
//                     );
//                   }
//                 }}
//               >
//                 Reject
//               </button>
//             </div>
//           </div>
//         )}
//     </div>
//   );
// };

// export default MetadataTab;

// /// //////
import React, { useState, useEffect, useCallback } from "react";
import { useEditor } from "./context/Editor";
import { tweetStorage } from "@/utils/localStorage";
import { FileCheck, ChevronDown, ChevronRight } from "lucide-react";
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

interface CollapsibleSectionProps {
  title: string;
  defaultExpanded?: boolean;
  className?: string;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  defaultExpanded = true,
  className,
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={cn("border-b border-gray-800", className)}>
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        {isExpanded ? (
          <ChevronDown size={16} className="text-gray-400" />
        ) : (
          <ChevronRight size={16} className="text-gray-400" />
        )}
      </div>
      {isExpanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
};

interface MetadataTabProps {
  className?: string;
}

const MetadataTab: React.FC<MetadataTabProps> = ({ className }) => {
  const {
    editorState,
    loadDraft,
    loadScheduledItem,
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
    tags: [],
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
        activeTab === "scheduled" ? loadScheduledItem() : await loadDraft();

      if (!drafts) return;

      const content =
        "tweets" in drafts
          ? drafts.tweets.map((t) => t.content).join("\n")
          : drafts.content;

      const stats = calculateStats(content);

      if ("tweets" in drafts) {
        stats.threadLength = drafts.tweets.length;
      }

      // Process tags - convert string tags to Tag objects if needed
      const tags =
        "tweets" in drafts
          ? drafts.tags?.map((tag, idx) => {
              if (typeof tag === "string") {
                return { id: `tag-${idx}`, name: tag };
              }
              return tag as Tag;
            }) || []
          : drafts.tags?.map((tag, idx) => {
              if (typeof tag === "string") {
                return { id: `tag-${idx}`, name: tag };
              }
              return tag as Tag;
            }) || [];

      setDraftData({
        title: "Draft title...",
        createdAt: new Date(drafts.createdAt),
        lastEdited: new Date(),
        tags: tags,
        stats: stats,
      });
    };

    getContentData();
  }, [
    activeTab,
    loadDraft,
    loadScheduledItem,
    editorState.selectedDraftType,
    editorState.selectedDraftId,
    refreshCounter,
    calculateStats,
  ]);

  return (
    <div
      className={cn(
        "w-full bg-transparent",
        "md:border-l md:border-gray-800",
        className
      )}
    >
      {/* Title Section */}
      <CollapsibleSection title="Draft Details" defaultExpanded={true}>
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
      </CollapsibleSection>

      {/* Stats Section */}
      <CollapsibleSection title="Statistics" defaultExpanded={true}>
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
      </CollapsibleSection>

      {/* Tags Section - Using the TagsSection component */}
      <TagsSection />

      {/* Team Information Section */}
      <CollapsibleSection title="Team" defaultExpanded={true}>
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
      </CollapsibleSection>

      {/* Checklist Section */}
      <div className="border-b border-gray-800">
        <div className="p-4">
          <UnifiedChecklist />
        </div>
      </div>

      {/* Submit Button Section - Only show for team content (not personal) */}
      {selectedTeamId && selectedTeamId !== userId && (
        <CollapsibleSection title="Content Review" defaultExpanded={true}>
          {editorState.selectedItemStatus === "pending_approval" ? (
            <div className="p-3 bg-yellow-900/30 rounded-md">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                <span className="text-yellow-400 text-sm font-medium">
                  Pending Review
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                This content has been submitted for review and is awaiting
                approval.
              </p>
            </div>
          ) : editorState.selectedItemStatus === "approved" ? (
            <div className="p-3 bg-green-900/30 rounded-md">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span className="text-green-400 text-sm font-medium">
                  Approved
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                This content has been approved for publishing.
              </p>
            </div>
          ) : editorState.selectedItemStatus === "rejected" ? (
            <div className="p-3 bg-red-900/30 rounded-md">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                <span className="text-red-400 text-sm font-medium">
                  Rejected
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                This content was rejected. Please revise and resubmit.
              </p>
            </div>
          ) : (
            <button
              onClick={() => setSubmitModalOpen(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center justify-center gap-2 w-full"
            >
              <FileCheck size={18} />
              Submit for review
            </button>
          )}
        </CollapsibleSection>
      )}

      {/* Approval Actions - Only shown for team admins on pending content */}
      {isTeamAdmin(selectedTeamId!) &&
        editorState.selectedItemStatus === "pending_approval" && (
          <CollapsibleSection title="Admin Actions" defaultExpanded={true}>
            <div className="flex gap-3">
              <button
                className="px-3 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 flex-1"
                onClick={async () => {
                  try {
                    const contentId = editorState.selectedDraftId;
                    const contentType = editorState.selectedDraftType;

                    if (!contentId || !contentType || !selectedTeamId) return;

                    const response = await fetch("/api/team/content/approval", {
                      method: "PATCH",
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
                        (error instanceof Error
                          ? error.message
                          : "Unknown error")
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
                    if (reason.trim() === "") {
                      alert("A rejection reason is required");
                      return;
                    }

                    const contentId = editorState.selectedDraftId;
                    const contentType = editorState.selectedDraftType;

                    if (!contentId || !contentType || !selectedTeamId) return;

                    const response = await fetch("/api/team/content/approval", {
                      method: "PATCH",
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
                        (error instanceof Error
                          ? error.message
                          : "Unknown error")
                    );
                  }
                }}
              >
                Reject
              </button>
            </div>
          </CollapsibleSection>
        )}
    </div>
  );
};

export default MetadataTab;
