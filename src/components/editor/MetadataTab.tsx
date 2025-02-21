import { Badge } from "@/components/ui/badge";
import React, {
  useState,
  useRef,
  KeyboardEvent,
  useEffect,
  useCallback,
} from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { useEditor } from "./context/Editor";
import { tweetStorage } from "@/utils/localStorage";
import { FileCheck } from "lucide-react";

interface Tag {
  id: string;
  name: string;
  color?: string;
}

interface DraftStats {
  wordCount: number;
  characterCount: number;
  readingTime: string;
  threadLength: number;
}

interface DraftMetadata {
  title: string;
  createdAt: Date;
  lastEdited: Date;
  tags: Tag[];
  stats: DraftStats;
}

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

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

const UnifiedChecklist: React.FC = () => {
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

const MetadataTab: React.FC = () => {
  const {
    editorState,
    loadDraft: loadDrafts,
    loadScheduledItem: loadScheduledItems,
    activeTab,
    setSubmitModalOpen,
  } = useEditor();
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

  // Calculate stats based on draft content
  const calculateStats = useCallback(
    (content: string): DraftMetadata["stats"] => {
      const words = content.trim().split(/\s+/).length;
      const chars = content.length;
      const readingTime = `${Math.ceil(words / 200)}m`; // Assuming 200 words per minute

      return {
        wordCount: words,
        characterCount: chars,
        readingTime,
        threadLength: 1,
      };
    },
    []
  );

  useEffect(() => {
    const getContentData = () => {
      const drafts =
        activeTab === "scheduled" ? loadScheduledItems() : loadDrafts();

      tweetStorage.getLastSaveTime();

      if (!drafts) return;

      // Handle both single tweets and threads
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
  }, [tweetStorage.getLastSaveTime()]);

  return (
    <div className="w-full h-full max-w-xs rounded-none bg-transparent border-l border-gray-800">
      <div className="p-4 pb-4 border-b border-gray-800 ">
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
      <div className="p-4 py-2 border-b border-gray-800 ">
        <div className="space-y-1">
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

      <div className="p-4 py-2 border-b border-gray-800 ">
        <div className="space-y-2">
          <p className="text-sm text-gray-500">Tags</p>
          <div className="flex flex-wrap">
            {draftData.tags.map((tag) => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 py-4">
        <UnifiedChecklist />
      </div>
      <div className="flex p-4 justify-center">
        <button
          onClick={() => setSubmitModalOpen(true)}
          className={
            "px-4 py-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center gap-2"
          }
        >
          <FileCheck size={18} />
          Submit for review
        </button>
      </div>
    </div>
  );
};

export default MetadataTab;
