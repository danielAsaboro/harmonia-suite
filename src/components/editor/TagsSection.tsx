// src/components/editor/TagsSection.tsx

import React, { useEffect, useRef, useState } from "react";
import Tagify from "@yaireo/tagify";
import "@yaireo/tagify/dist/tagify.css";
import { Tag } from "@/types/tweet";
import { useEditor } from "./context/Editor";
import { tweetStorage } from "@/utils/localStorage";
import { ChevronDown, ChevronRight } from "lucide-react";

// Define our custom tag data structure
interface CustomTagData extends Tagify.TagData {
  emoji?: string;
  color?: string;
  class?: string;
}

interface TagsInputProps {
  tags: Tag[];
  onChange?: (tags: Tag[]) => void;
}

// Type for our suggestions
interface TagSuggestion {
  value: string;
  emoji: string;
}

const TagsInput: React.FC<TagsInputProps> = ({ tags, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const tagifyRef = useRef<Tagify<CustomTagData> | null>(null);

  // Predefined suggestions with categories
  const tagSuggestions: TagSuggestion[] = [
    // Marketing related
    { value: "Marketing Strategy", emoji: "📈" },
    { value: "Content Marketing", emoji: "📝" },
    { value: "Social Media", emoji: "📱" },
    { value: "Email Marketing", emoji: "📧" },
    { value: "SEO", emoji: "🔍" },
    { value: "Analytics", emoji: "📊" },

    // Development relatedcallbacks:
    { value: "Web Development", emoji: "💻" },
    { value: "API Integration", emoji: "🔌" },
    { value: "Mobile App", emoji: "📱" },
    { value: "Database", emoji: "🗄️" },

    // Business related
    { value: "Startup", emoji: "🚀" },
    { value: "Business Strategy", emoji: "📊" },
    { value: "Product Launch", emoji: "🎯" },
    { value: "Customer Success", emoji: "🤝" },

    // Design related
    { value: "UI Design", emoji: "🎨" },
    { value: "UX Research", emoji: "🔍" },
    { value: "Branding", emoji: "✨" },
    { value: "Graphic Design", emoji: "🖼️" },
  ];

  // Generate a light, pleasant color
  const generatePastelColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 85%)`;
  };

  // Enhanced emoji mapping function
  const getTagEmoji = (tagName: string): string => {
    const emojiMap: Record<string, string> = {
      market: "📈",
      affiliate: "🤝",
      build: "🏗️",
      copy: "✍️",
      social: "📱",
      tech: "💻",
      design: "🎨",
      content: "📝",
      seo: "🔍",
      analytics: "📊",
      brand: "✨",
      startup: "🚀",
      email: "📧",
      web: "🌐",
      mobile: "📱",
      research: "🔬",
      strategy: "🎯",
      customer: "👥",
      product: "⚡",
      data: "📊",
      api: "🔌",
      dev: "👨‍💻",
    };

    const matchingKey = Object.keys(emojiMap).find((key) =>
      tagName.toLowerCase().includes(key.toLowerCase())
    );

    return matchingKey ? emojiMap[matchingKey] : "🏷️";
  };

  useEffect(() => {
    if (!inputRef.current) return;

    // Custom template for rendering tags
    const tagTemplate = (tagData: CustomTagData) => {
      return `
        <tag 
          title="${tagData.value}"
          contenteditable='false'
          spellcheck='false'
          class='tagify__tag ${tagData.class || ""}'
          style="--tag-bg: ${tagData.color}"
        >
          <x title='remove tag' class='tagify__tag__removeBtn'></x>
          <div>
            <span class='tagify__tag-text'>${tagData.emoji} ${tagData.value}</span>
          </div>
        </tag>
      `;
    };

    // Initialize Tagify with enhanced settings
    tagifyRef.current = new Tagify(inputRef.current, {
      maxTags: 5,
      enforceWhitelist: false,
      skipInvalid: true,
      dropdown: {
        enabled: 1,
        maxItems: 10,
        classname: "tags-dropdown",
        closeOnSelect: true,
        searchKeys: ["value", "emoji"],
        position: "text",
        highlightFirst: true,
      },
      whitelist: tagSuggestions,
      templates: {
        tag: tagTemplate,
        dropdownItem: function (tagData: CustomTagData) {
          return `
            <div class='tagify__dropdown__item ${tagData.class || ""}'>
              <span>${tagData.emoji} ${tagData.value}</span>
            </div>
          `;
        },
      },
      transformTag: function (tagData: CustomTagData) {
        const suggestion = tagSuggestions.find(
          (s) => s.value.toLowerCase() === tagData.value.toLowerCase()
        );
        tagData.color = generatePastelColor();
        tagData.emoji = suggestion?.emoji || getTagEmoji(tagData.value);
      },
      callbacks: {
        add: function (e) {
          const tagify = e.detail.tagify as Tagify<CustomTagData>;
          const newTags = tagify.value;
          onChange?.(
            newTags.map((tag) => ({
              id: tag.id || String(Math.random()),
              name: tag.value,
              color: tag.color,
              emoji: tag.emoji,
            }))
          );
        },
        remove: function (e) {
          const tagify = e.detail.tagify as Tagify<CustomTagData>;
          const newTags = tagify.value;
          onChange?.(
            newTags.map((tag) => ({
              id: tag.id || String(Math.random()),
              name: tag.value,
              color: tag.color,
              emoji: tag.emoji,
            }))
          );
        },
       
      },
    });

    // Set initial tags with colors and emojis
    const initialTags = tags.map((tag) => ({
      value: tag.name,
      id: tag.id,
      color: tag.color || generatePastelColor(),
      emoji: tag.emoji || getTagEmoji(tag.name),
    }));

    if (tagifyRef.current) {
      tagifyRef.current.addTags(initialTags);
    }

    return () => {
      tagifyRef.current?.destroy();
    };
  }, [tags]); // Added tags to dependency array so it refreshes when tags change

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        className="w-full bg-transparent border-none rounded-lg"
        placeholder="Type to add tags..."
      />
    </div>
  );
};

// Enhanced styles with focus/hover states and dropdown styling
const tagifyStyles = `
  .tagify {
    --tags-hover-border-color: rgb(55 65 81);
    --tags-focus-border-color: rgb(59 130 246);
    --tag-bg: transparent;
    --tag-text-color: inherit;
    --tag-text-color--edit: inherit;
    --tag-pad: 0.5em 0.75em;
    --tag-inset-shadow-size: 1.35em;
    --tag-border-radius: 9999px;
    background: transparent;
    transition: all 0.2s ease;
    border-radius: 0.5rem; /* Add this for rounded corners */
    border-color: rgba(75, 85, 99, 0.2); /* Make border very faint */
  }

  .tagify:hover {
  --tags-border-color: rgba(75, 85, 99, 0.3);
}

  .tagify.tagify--focus {
  --tags-border-color: rgba(59, 130, 246, 0.4);
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.4);
}

  .tagify__tag {
    margin: 2px 4px 2px 0;
    transition: transform 0.15s ease;
  }

  .tagify__tag:hover {
    transform: scale(1.05);
  }

  .tagify__tag>div {
    border-radius: 9999px;
    padding: 0.25em 0.75em;
  }

  .tagify__tag>div::before {
    box-shadow: 0 0 0 var(--tag-inset-shadow-size) var(--tag-bg) inset;
    opacity: 0.8;
    transition: opacity 0.2s ease;
  }

  .tagify__tag:hover>div::before {
    opacity: 1;
  }

  .tagify__tag__removeBtn {
    color: rgb(75 85 99);
    opacity: 0.75;
    transition: all 0.2s ease;
  }

  .tagify__tag__removeBtn:hover {
    color: rgb(156 163 175);
    opacity: 1;
    background: rgba(0,0,0,0.05);
  }

  .tagify__input {
    color: inherit;
  }

  .tagify__input::before {
    color: rgb(107 114 128);
    opacity: 0.7;
  }

  .tagify__dropdown {
    background: rgb(17 24 39);
    border: 1px solid rgb(55 65 81);
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .tagify__dropdown__wrapper {
    border: none;
    padding: 0.5rem 0;
  }

  .tagify__dropdown__item {
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    margin: 0 0.5rem;
    color: rgb(209 213 219);
    transition: all 0.2s ease;
  }

  .tagify__dropdown__item--active {
    background: rgba(59, 130, 246, 0.1);
    color: rgb(59 130 246);
  }

  .tagify__dropdown__item:hover {
    background: rgba(55, 65, 81, 0.5);
  }
`;

const TagsSection: React.FC = () => {
  const { editorState, loadDraft, activeTab, refreshSidebar } = useEditor();
  const [contentTags, setContentTags] = React.useState<Tag[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  // Load tags from the current content
  useEffect(() => {
    const loadContentTags = async () => {
      // Only attempt to load if we have a selected draft
      if (editorState.selectedDraftId) {
        try {
          const content = await loadDraft();

          if (!content) return;

          // Check if it's a thread or single tweet
          if ("tweets" in content) {
            // It's a thread
            const tags =
              (content.tags
                ?.map((tagName, idx) => {
                  // Convert string tag to Tag object if needed
                  if (typeof tagName === "string") {
                    return {
                      id: `tag-${idx}-${Date.now()}`,
                      name: tagName,
                    };
                  } else if (typeof tagName === "object") {
                    return tagName as Tag;
                  }
                  return null;
                })
                .filter(Boolean) as Tag[]) || [];

            setContentTags(tags);
          } else {
            // It's a single tweet
            const tags =
              (content.tags
                ?.map((tagName, idx) => {
                  // Convert string tag to Tag object if needed
                  if (typeof tagName === "string") {
                    return {
                      id: `tag-${idx}-${Date.now()}`,
                      name: tagName,
                    };
                  } else if (typeof tagName === "object") {
                    return tagName as Tag;
                  }
                  return null;
                })
                .filter(Boolean) as Tag[]) || [];

            setContentTags(tags);
          }
        } catch (error) {
          console.error("Error loading tags:", error);
        }
      }
    };

    loadContentTags();
  }, [editorState.selectedDraftId, loadDraft, activeTab]);

  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.innerHTML = tagifyStyles;
    document.head.appendChild(styleEl);

    return () => {
      styleEl.remove();
    };
  }, []);

  const handleTagsChange = async (newTags: Tag[]) => {
    setContentTags(newTags);

    // Save the updated tags to the content
    if (editorState.selectedDraftId) {
      try {
        const content = loadDraft();

        if (!content) return;

        if ("tweets" in content) {
          // It's a thread - update thread tags
          const thread = {
            ...content,
            tags: newTags,
          };

          tweetStorage.saveThread(thread, content.tweets, true);
        } else {
          // It's a single tweet - update tweet tags
          const tweet = {
            ...content,
            tags: newTags,
          };

          tweetStorage.saveTweet(tweet, true);
        }

        // Refresh sidebar to show updated tags
        refreshSidebar();
      } catch (error) {
        console.error("Error saving tags:", error);
      }
    }
  };

  return (
    <div className="border-b border-gray-800">
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-sm font-medium text-gray-400">Tags</h3>
        {isExpanded ? (
          <ChevronDown size={16} className="text-gray-400" />
        ) : (
          <ChevronRight size={16} className="text-gray-400" />
        )}
      </div>

      {isExpanded && (
        <div className="px-4 pb-4">
          <TagsInput tags={contentTags} onChange={handleTagsChange} />
        </div>
      )}
    </div>
  );
};

export default TagsSection;
