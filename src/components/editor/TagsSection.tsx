import React, { useEffect, useRef, useState } from "react";
import Tagify from "@yaireo/tagify";
import "@yaireo/tagify/dist/tagify.css";

// Define our custom tag data structure
interface CustomTagData extends Tagify.TagData {
  emoji?: string;
  color?: string;
  class?: string;
}

interface Tag {
  id: string;
  name: string;
  color?: string;
  emoji?: string;
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

    // Development related
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
            <span class='tagify__tag-text'>${tagData.emoji} ${
        tagData.value
      }</span>
          </div>
        </tag>
      `;
    };

    // Initialize Tagify with enhanced settings
    tagifyRef.current = new Tagify(inputRef.current, {
      maxTags: 10,
      enforceWhitelist: false,
      skipInvalid: true,
      dropdown: {
        enabled: 1,
        maxItems: 10,
        classname: "tags-dropdown",
        closeOnSelect: false,
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
  }, []);

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-500">Tags</p>
      <input
        ref={inputRef}
        className="w-full bg-transparent"
        placeholder="Type to add tags..."
      />
    </div>
  );
};

// Enhanced styles with focus/hover states and dropdown styling
const tagifyStyles = `
  .tagify {
    --tags-border-color: transparent;
    --tags-hover-border-color: rgb(55 65 81);
    --tags-focus-border-color: rgb(59 130 246);
    --tag-bg: transparent;
    --tag-hover: transparent;
    --tag-text-color: inherit;
    --tag-text-color--edit: inherit;
    --tag-pad: 0.5em 0.75em;
    --tag-inset-shadow-size: 1.35em;
    --tag-border-radius: 9999px;
    background: transparent;
    transition: all 0.2s ease;
  }

  .tagify:hover {
    --tags-border-color: rgb(55 65 81);
  }

  .tagify.tagify--focus {
    --tags-border-color: rgb(59 130 246);
    box-shadow: 0 0 0 1px rgb(59 130 246);
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
  const [localTags, setLocalTags] = useState<Tag[]>([
    { id: "1", name: "Affiliate Marketing" },
    { id: "2", name: "Build In Public" },
    { id: "3", name: "Copywriting" },
  ]);

  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.innerHTML = tagifyStyles;
    document.head.appendChild(styleEl);

    return () => {
      styleEl.remove();
    };
  }, []);

  const handleTagsChange = (newTags: Tag[]) => {
    setLocalTags(newTags);
    // Add any additional logic for saving tags
  };

  return (
    <div className="p-4 border-b border-gray-800">
      <TagsInput tags={localTags} onChange={handleTagsChange} />
    </div>
  );
};

export default TagsSection;
