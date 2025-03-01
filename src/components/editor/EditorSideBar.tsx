// src/components/editor/EditorSideBar.tsx

import { useKeyboard } from "@/contexts/keyboard-context";
import { Tweet, Thread } from "@/types/tweet";
import { tweetStorage } from "@/utils/localStorage";
import {
  ChevronDown,
  Plus,
  Search,
  ChevronLeft,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useUserAccount } from "./context/account";
import { useEditor } from "./context/Editor";
import { SidebarItem } from "./SidebarItem";
import Image from "next/image";
import EditorSideBarBottomOverlay from "./EditorSideBarBottomOverlay";
import Link from "next/link";
import { useTeam } from "./context/TeamContext";

export default function EditorSidebar() {
  const {
    activeTab,
    setActiveTab,
    editorState,
    showEditor,
    hideEditor,
    refreshCounter,
    isSidebarVisible,
    toggleSidebar,
  } = useEditor();
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [items, setItems] = useState<(Tweet | Thread)[]>([]);
  const [currentDraft, setCurrentDraft] = useState<Tweet | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { name, handle, profileImageUrl, id: userId } = useUserAccount();
  const { showSearch, setShowSearch } = useKeyboard();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { teams, selectedTeamId, setSelectedTeamId, isTeamAdmin } = useTeam();

  // Filter items based on search query
  const filteredItems = items.filter((item) => {
    const content =
      "content" in item
        ? item.content.toLowerCase()
        : tweetStorage.getThreadPreview(item.id)?.content.toLowerCase() || "";
    return content.includes(searchQuery.toLowerCase());
  });

  useEffect(() => {
    // Initialize the selected team
    // to the user's account by default
    if (!selectedTeamId) {
      setSelectedTeamId(userId);
    }
  }, [userId]);

  useEffect(() => {
    if (editorState.selectedDraftId) {
      const draft = tweetStorage
        .getTweets()
        .find((t) => t.id === editorState.selectedDraftId);
      setCurrentDraft(draft || null);
    } else {
      setCurrentDraft(null);
    }
  }, [editorState.selectedDraftId, refreshCounter]);

  useEffect(() => {
    const loadItems = () => {
      let filtered: (Tweet | Thread)[] = [];

      // Get tweets and threads filtered by team
      const tweets = selectedTeamId
        ? tweetStorage.getTweetsByTeam(selectedTeamId)
        : tweetStorage.getTweets();

      const threads = selectedTeamId
        ? tweetStorage.getThreadsByTeam(selectedTeamId)
        : tweetStorage.getThreads();

      // Also filter by status
      switch (activeTab) {
        case "drafts":
          // For drafts, only show user's own unsubmitted content
          filtered = [
            ...tweets.filter(
              (t) => t.status === "draft" && !t.threadId && !t.isSubmitted
            ),
            ...threads.filter((t) => t.status === "draft" && !t.isSubmitted),
          ];
          break;
        case "scheduled":
          // For scheduled content, show all scheduled content for the team
          filtered = [
            ...tweets.filter((t) => t.status === "scheduled" && !t.threadId),
            ...threads.filter((t) => t.status === "scheduled"),
          ];
          break;
        case "published":
          // For published content, show all published content for the team
          filtered = [
            ...tweets.filter((t) => t.status === "published" && !t.threadId),
            ...threads.filter((t) => t.status === "published"),
          ];
          break;
      }

      // If user is admin of selected team, also show pending approval content
      if (isTeamAdmin(selectedTeamId!) && selectedTeamId) {
        const pendingApproval = [
          ...tweets.filter(
            (t) =>
              t.status === "pending_approval" &&
              !t.threadId &&
              t.teamId === selectedTeamId &&
              t.isSubmitted
          ),
          ...threads.filter(
            (t) =>
              t.status === "pending_approval" &&
              t.teamId === selectedTeamId &&
              t.isSubmitted
          ),
        ];

        filtered = [...filtered, ...pendingApproval];
      }

      setItems(
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    };

    loadItems();
  }, [activeTab, refreshCounter, selectedTeamId, isTeamAdmin]);

  const createNewDraft = () => {
    const emptyDraft = items.find(
      (item) =>
        !("tweetIds" in item) &&
        !item.content?.trim() &&
        (!item.media?.mediaIds || item.media?.mediaIds.length === 0)
    );

    if (emptyDraft) {
      showEditor(emptyDraft.id, "tweet");
    } else {
      showEditor();
    }
    setIsCreatingNew(false);
  };

  const handleItemClick = async (item: Tweet | Thread) => {
    const type = "tweetIds" in item ? "thread" : "tweet";

    // Prevent duplicate selections
    if (editorState.selectedDraftId === item.id) {
      return;
    }

    // Clear current selection first
    hideEditor();

    // Small delay to ensure state is cleared
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Then show new selection
    showEditor(item.id, type);
  };

  const handleDropdownToggle = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleDropdownMouseEnter = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
    setIsDropdownOpen(true);
  };

  const handleDropdownMouseLeave = () => {
    // Set a delay before closing the dropdown
    dropdownTimeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 300); // 300ms delay before closing
  };

  // Add useEffect for handling clicks outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`transition-all duration-300 bg-black max-h-full ${
        isSidebarVisible ? "w-72 border-r border-gray-800" : "w-0"
      }`}
    >
      {isSidebarVisible && (
        <>
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-full">
                {profileImageUrl ? (
                  <Image
                    src={profileImageUrl}
                    alt={name}
                    className="w-full h-full rounded-full cursor-pointer hover:ring-2 hover:ring-blue-500"
                    title={`${name} (${handle})`}
                    width={24}
                    height={24}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 rounded-full" />
                )}
              </div>

              {/* Account dropdown with improved UX */}
              <div
                className="relative"
                ref={dropdownRef}
                onMouseEnter={handleDropdownMouseEnter}
                onMouseLeave={handleDropdownMouseLeave}
              >
                <button
                  className="flex items-center gap-1 text-white hover:text-blue-400 transition-colors"
                  onClick={handleDropdownToggle}
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                >
                  <span
                    className="text-sm font-medium truncate max-w-28"
                    title={
                      teams.find((t) => t.id === selectedTeamId)?.name ||
                      "Your Account"
                    }
                  >
                    {selectedTeamId !== userId && (
                      <span className="text-blue-400 text-xs mr-1">•</span>
                    )}
                    {(
                      teams.find((t) => t.id === selectedTeamId)?.name ||
                      "Your Account"
                    ).length > 10
                      ? `${(teams.find((t) => t.id === selectedTeamId)?.name || "Your Account").substring(0, 10)}...`
                      : teams.find((t) => t.id === selectedTeamId)?.name ||
                        "Your Account"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isDropdownOpen && (
                  <div
                    className="absolute left-0 top-full mt-2 w-48 bg-gray-900 border border-gray-800 rounded-md shadow-lg z-10"
                    role="menu"
                    aria-orientation="vertical"
                  >
                    <div className="py-1">
                      {teams.length > 0 ? (
                        teams.map((team) => {
                          // Determine if this team is selected
                          const isSelected = selectedTeamId === team.id;
                          return (
                            <div
                              className={`px-4 py-2 text-sm ${
                                isSelected
                                  ? "text-blue-400 bg-gray-800"
                                  : "text-gray-300 hover:bg-gray-800"
                              } flex items-center gap-2 cursor-pointer`}
                              role="menuitem"
                              tabIndex={0}
                              key={team.id}
                              onClick={() => {
                                setSelectedTeamId(team.id);
                                hideEditor();
                                setIsDropdownOpen(false);
                              }}
                              title={team.name}
                            >
                              {isSelected && (
                                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                              )}
                              {team.id !== userId && !isSelected && (
                                <span className="w-2 h-2 border border-gray-500 rounded-full opacity-50"></span>
                              )}
                              {team.name}
                              {team.role === "admin" && (
                                <span className="ml-auto text-xs text-gray-500">
                                  Admin
                                </span>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div
                          className="px-4 py-2 text-sm text-gray-400 cursor-default"
                          role="menuitem"
                        >
                          No teams available
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSearch(true)}
                  className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
                  title="Search (⌘/Ctrl + F)"
                >
                  <Search size={20} />
                </button>
                <button
                  onClick={toggleSidebar}
                  className="p-2 hover:bg-gray-800 rounded-full text-gray-400"
                  title="Toggle sidebar"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex border-b border-gray-800">
            {(["drafts", "scheduled", "published"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 font-medium text-center justify-evenly overflow-x-hidden  ${
                  activeTab === tab
                    ? "text-blue-400 border-b-2 border-blue-400 rounded-none"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>

          {/* Content Area: Two parts - scrollable content and fixed bottom nav */}
          <div className="flex flex-col h-screen">
            {/* Top section with New Draft button when on drafts tab */}
            {activeTab === "drafts" && (
              <section
                className={`
                  flex-shrink-0
                  flex justify-between items-center
                  p-4 cursor-pointer hover:bg-gray-900
                  transition-all duration-200 border-b border-gray-800
                `}
                onClick={() => {
                  if (
                    currentDraft &&
                    !currentDraft.threadId &&
                    !currentDraft.content.trim() &&
                    (!currentDraft.media?.mediaIds ||
                      currentDraft.media?.mediaIds.length === 0)
                  ) {
                    showEditor(currentDraft?.id, "tweet");
                    return;
                  }
                  createNewDraft();
                }}
                onMouseEnter={() => setIsCreatingNew(true)}
                onMouseLeave={() => setIsCreatingNew(false)}
              >
                <div className="flex items-center space-x-2">
                  <div
                    className={`
                      flex items-center justify-center
                      w-6 h-6 rounded-full
                      ${isCreatingNew ? "bg-blue-500" : "bg-gray-700"}
                      transition-all duration-200
                    `}
                  >
                    <span className="text-white text-lg">+</span>
                  </div>
                  <span
                    className={`
                      font-medium
                      ${isCreatingNew ? "text-blue-500" : "text-gray-300"}
                      transition-all duration-200
                    `}
                  >
                    New Draft
                  </span>
                </div>
                <div
                  className={`
                    transform transition-transform duration-200
                    ${isCreatingNew ? "rotate-180" : "rotate-0"}
                  `}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`
                      ${isCreatingNew ? "text-blue-500" : "text-gray-500"}
                      transition-all duration-200
                    `}
                  >
                    <path
                      d="M8 3L14 9L12.5 10.5L8 6L3.5 10.5L2 9L8 3Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
              </section>
            )}

            {/* Middle scrollable content area */}
            <div className="flex-1 overflow-y-auto pb-96">
              {activeTab === "scheduled" && (
                <Link
                  href="/content/calendar"
                  className="group flex justify-between items-center p-4 hover:bg-gray-900 transition-all duration-200 border-b border-gray-800"
                >
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-300">View Calendar</span>
                  </div>
                  <span className="text-gray-500 group-hover:translate-x-1 transition-transform duration-200">
                    →
                  </span>
                </Link>
              )}
              {items.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No {activeTab === "drafts" ? activeTab : `${activeTab} post`}{" "}
                  available
                </div>
              ) : (
                items.map((item) => (
                  <SidebarItem
                    key={item.id}
                    item={item}
                    isSelected={editorState.selectedDraftId === item.id}
                    onClick={async () => await handleItemClick(item)}
                    onDelete={(id) => {
                      if (editorState.selectedDraftId === id) {
                        hideEditor();
                      }
                      setItems((prevItems) =>
                        prevItems.filter((item) => item.id !== id)
                      );
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}

      <EditorSideBarBottomOverlay isVisible={isSidebarVisible} />

      {!isSidebarVisible && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 p-2 bg-gray-800 rounded-full text-gray-400 hover:bg-gray-700"
          title="Show sidebar"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
