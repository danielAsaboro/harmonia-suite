// src/components/editor/UnifiedChecklist.tsx

import { ChecklistItem } from "@/types/tweet";
import { Checkbox } from "@radix-ui/react-checkbox";
import { useState, useRef, KeyboardEvent } from "react";
import { Card, CardContent } from "../ui/card";

export const UnifiedChecklist: React.FC = () => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && currentInput.trim()) {
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
    }
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
    <Card className="w-full max-w-md">
      <div className="p-2 rounded-none">
        <input
          ref={inputRef}
          type="text"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyUp={handleKeyPress}
          placeholder="Add a Tip or Todo and press enter..."
          className="w-full p-2 text-base bg-transparent border-b border-gray-200 focus:outline-none focus:border-gray-400 transition-colors rounded-none"
        />
      </div>
      <CardContent>
        <div className="pt-2 space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="group flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-md transition-colors"
            >
              <Checkbox
                id={item.id}
                checked={item.completed}
                onCheckedChange={() => toggleItem(item.id)}
              />
              <label
                htmlFor={item.id}
                className={`flex-grow text-sm ${
                  item.completed ? "line-through text-gray-500" : ""
                }`}
              >
                {item.text}
              </label>
              <button
                onClick={() => removeItem(item.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
