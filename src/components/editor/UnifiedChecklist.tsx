// // src/components/editor/UnifiedChecklist.tsx

import React, { useState, useRef, KeyboardEvent } from "react";
import { Check, X, Plus } from "lucide-react";

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export const UnifiedChecklist: React.FC = () => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && currentInput.trim()) {
      addItem();
    }
  };

  const addItem = () => {
    if (!currentInput.trim()) return;

    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        text: currentInput.trim(),
        completed: false,
        createdAt: Date.now(),
      },
    ]);
    setCurrentInput("");
  };

  const toggleItem = (itemId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  return (
    <div className="w-full space-y-4 max-h-44 overflow-auto">
      {/* Input Section */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyUp={handleKeyPress}
          placeholder="Add checklist item..."
          className="w-full bg-transparent text-sm text-gray-300 placeholder-gray-500 border-0 border-b border-gray-700 focus:border-gray-500 focus:ring-0 transition-colors pb-2"
        />
        <button
          onClick={addItem}
          className="absolute right-0 p-1 text-gray-500 hover:text-gray-300 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Checklist Items */}
      <div className="space-y-2">
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
                item.completed ? "text-gray-500 line-through" : "text-gray-300"
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
  );
};

export default UnifiedChecklist;
