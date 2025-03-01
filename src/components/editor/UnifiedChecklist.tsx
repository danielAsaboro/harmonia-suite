// src/components/editor/UnifiedChecklist.tsx

import React, { useState, useRef, KeyboardEvent, useEffect } from "react";
import { Check, X, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { useEditor } from "./context/Editor";
import { tweetStorage } from "@/utils/localStorage";
import { ChecklistItem } from "@/types/tweet";
import { v4 as uuidv4 } from "uuid";

export const UnifiedChecklist: React.FC = () => {
  const { editorState, loadDraft, activeTab, refreshSidebar } = useEditor();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load checklist items from the current content
  useEffect(() => {
    const loadChecklistItems = async () => {
      // Only attempt to load if we have a selected draft
      if (editorState.selectedDraftId) {
        try {
          const content = await loadDraft();

          if (!content) return;

          // Check if it's a thread or single tweet
          if ("tweets" in content) {
            // It's a thread
            const checklist = content.checklist || [];
            setItems(checklist);
          } else {
            // It's a single tweet
            const checklist = content.checklist || [];
            setItems(checklist);
          }
        } catch (error) {
          console.error("Error loading checklist items:", error);
        }
      }
    };

    loadChecklistItems();
  }, [editorState.selectedDraftId, loadDraft, activeTab]);

  // Save checklist items to the content
  const saveChecklistItems = async (updatedItems: ChecklistItem[]) => {
    if (editorState.selectedDraftId) {
      try {
        const content = loadDraft();

        if (!content) return;

        if ("tweets" in content) {
          // It's a thread - update thread checklist
          const thread = {
            ...content,
            checklist: updatedItems,
          };

          tweetStorage.saveThread(thread, content.tweets, true);
        } else {
          // It's a single tweet - update tweet checklist
          const tweet = {
            ...content,
            checklist: updatedItems,
          };

          tweetStorage.saveTweet(tweet, true);
        }

        // Refresh sidebar to show updated content
        refreshSidebar();
      } catch (error) {
        console.error("Error saving checklist items:", error);
      }
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && currentInput.trim()) {
      addItem();
    }
  };

  const addItem = () => {
    if (!currentInput.trim()) return;

    const newItems = [
      ...items,
      {
        id: `item-${uuidv4()}`,
        text: currentInput.trim(),
        completed: false,
        createdAt: Date.now(),
      },
    ];

    setItems(newItems);
    saveChecklistItems(newItems);
    setCurrentInput("");
  };

  const toggleItem = (itemId: string) => {
    const updatedItems = items.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    setItems(updatedItems);
    saveChecklistItems(updatedItems);
  };

  const removeItem = (itemId: string) => {
    const updatedItems = items.filter((item) => item.id !== itemId);

    setItems(updatedItems);
    saveChecklistItems(updatedItems);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Count completed items
  const completedCount = items.filter((item) => item.completed).length;

  return (
    <div className="w-full space-y-4">
      {/* Header with toggle */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={toggleExpand}
      >
        <h3 className="text-sm font-medium text-gray-400">
          Checklist {items.length > 0 && `(${completedCount}/${items.length})`}
        </h3>
        {isExpanded ? (
          <ChevronDown size={16} className="text-gray-400" />
        ) : (
          <ChevronRight size={16} className="text-gray-400" />
        )}
      </div>

      {/* Collapsible content */}
      {isExpanded && (
        <div className="max-h-60 overflow-auto">
          {/* Input Section */}
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyUp={handleKeyPress}
              placeholder="Type anything to make it a todo..."
              className="w-full rounded-none bg-transparent text-sm text-gray-300 placeholder-gray-500 border-0 border-b border-gray-700 focus:border-gray-500 focus:ring-0 transition-colors pb-2"
            />
            <button
              onClick={addItem}
              className="absolute right-0 p-1 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Checklist Items */}
          <div className="space-y-2 mt-4">
            {items.length === 0 && (
              <div className="text-sm text-gray-500 italic">No items yet</div>
            )}

            {items.map((item) => (
              <div
                key={item.id}
                className="group flex items-center space-x-3 py-2 px-1 hover:bg-gray-800/50 rounded-md transition-all"
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className={`flex-shrink-0 w-5 h-5 rounded border ${
                    item.completed
                      ? "bg-blue-500 border-blue-500"
                      : "border-gray-600 hover:border-gray-500"
                  } transition-colors`}
                >
                  {item.completed && (
                    <Check size={16} className="text-white m-auto" />
                  )}
                </button>

                <span
                  className={`flex-grow text-sm ${
                    item.completed
                      ? "text-gray-500 line-through"
                      : "text-gray-300"
                  }`}
                >
                  {item.text}
                </span>

                <button
                  onClick={() => removeItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-300 transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedChecklist;
