// src/components/editor/SidebarItem.tsx
import React, { useState, useRef, useEffect } from "react";
import { Tweet, Thread } from "@/types/tweet";
import ConfirmDialog from "./ConfirmDialog";
import { tweetStorage } from "@/utils/localStorage";
import SharedDraftModal from "./SharedDraftModal";

interface SidebarItemProps {
  item: Tweet | Thread;
  isSelected: boolean;
  onClick: () => void;
  onDelete: (id: string) => void;
}

export function SidebarItem({
  item,
  isSelected,
  onClick,
  onDelete,
}: SidebarItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isThread = "tweetIds" in item;
  const [showShareModal, setShowShareModal] = useState(false);

  // Get preview content
  // - first tweet for threads, or the tweet content itself
  // console.log(" inside sidebar; is thread?", isThread);
  const preview = isThread
    ? tweetStorage.getThreadPreview(item.id)?.content || ""
    : (item as Tweet).content;

  const truncatedPreview =
    preview.slice(0, 80) + (preview.length > 80 ? "..." : "");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleConfirmDelete = () => {
    if (isThread) {
      tweetStorage.deleteThread(item.id);
    } else {
      tweetStorage.deleteTweet(item.id);
    }
    setShowMenu(false);
    onDelete(item.id);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    setShowShareModal(true);
  };

  return (
    <div
      className={`
      relative p-4 cursor-pointer transition-all duration-200 border-b border-gray-800
      ${
        isSelected
          ? "bg-gray-800 border-l-4 border-gray-50 border-b-0"
          : "hover:bg-gray-800"
      }
    `}
    >
      <div className="flex justify-between items-start group" onClick={onClick}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm text-gray-400">
              {isThread ? "🧵 Thread" : "💭 Tweet"}
            </span>
            <span className="text-xs text-gray-500">
              {item.status === "scheduled" && item.scheduledFor
                ? new Date(item.scheduledFor).toLocaleString("en-US", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })
                : new Date(item.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-gray-300 text-sm truncate">{truncatedPreview}</p>
        </div>

        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 hover:bg-gray-700 rounded-full"
          >
            <svg
              className="w-4 h-4 text-gray-400"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <circle cx="8" cy="2" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="8" cy="14" r="1.5" />
            </svg>
          </button>
        </div>

        {showMenu && (
          <div
            ref={menuRef}
            className="absolute right-4 top-8 z-50 w-48 bg-gray-900 rounded-lg shadow-lg border border-gray-700"
          >
            <div className="py-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare(e);
                }}
                className="w-full px-4 py-2 text-sm text-left text-gray-300 hover:bg-gray-800 flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                Share
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfirmDialog(true);
                }}
                className="w-full px-4 py-2 text-sm text-left text-red-400 hover:bg-gray-800 flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to delete this ${
          isThread ? "Thread" : "Tweet"
        }? This action cannot be undone.`}
      />
      <SharedDraftModal
        isOpen={showShareModal}
        draftId={item.id}
        draftType={isThread ? "thread" : "tweet"}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
}
