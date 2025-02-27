// components/editor/MentionInput.tsx
import React, { useState, useEffect, forwardRef, JSX } from "react";

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  onFocus?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  maxLength?: number;
  // New props for navigation and content splitting
  onSplitContent?: (beforeCursor: string, afterCursor: string) => void;
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
  onMergeWithPrevious?: () => void;
}

const DEFAULT_TEXTAREA_HEIGHT = "60px";
const MAX_TWEET_LENGTH = 280;
const TWITTER_BLUE = "text-[#1d9bf0]"; // Twitter's blue color

const MentionInput = forwardRef<HTMLTextAreaElement, MentionInputProps>(
  (
    {
      value,
      onChange,
      placeholder,
      className = "",
      readOnly = false,
      onFocus,
      onKeyDown,
      maxLength = MAX_TWEET_LENGTH,
      onSplitContent,
      onNavigateUp,
      onNavigateDown,
      onMergeWithPrevious,
    },
    ref
  ) => {
    const [formattedContent, setFormattedContent] = useState<
      (string | JSX.Element)[]
    >([]);

    const isValidUsername = (username: string): boolean => {
      const name = username.startsWith("@") ? username.substring(1) : username;
      const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{3,14}$/;
      return usernameRegex.test(name);
    };

    const isValidHashtag = (hashtag: string): boolean => {
      const tag = hashtag.startsWith("#") ? hashtag.substring(1) : hashtag;
      const hashtagRegex = /^[a-zA-Z0-9_]+$/;
      return hashtagRegex.test(tag);
    };

    const formatContent = (text: string) => {
      let currentLength = 0;
      const retLines = text.split("\n");
      const formattedText: (string | JSX.Element)[] = [];

      retLines.forEach((retLine, lineIndex) => {
        const words = retLine.split(" ");
        const contentLength = words.length;

        words.forEach((word, index) => {
          let element: string | JSX.Element = word;
          const wordLength = word.length;
          const spaceLength = index !== contentLength - 1 ? 1 : 0;
          const newLineLength = lineIndex !== retLines.length - 1 ? 1 : 0;
          const willExceedLimit = currentLength + wordLength > maxLength;

          if (willExceedLimit) {
            const remainingChars = maxLength - currentLength;
            if (remainingChars > 0) {
              // Split the word at the limit
              const normalPart = word.slice(0, remainingChars);
              const exceededPart = word.slice(remainingChars);
              element = (
                <span key={`${word}-${lineIndex}-${index}`}>
                  {normalPart}
                  <span className="bg-red-500/80">{exceededPart}</span>
                </span>
              );
            } else {
              // Whole word is over the limit
              element = (
                <span
                  key={`${word}-${lineIndex}-${index}`}
                  className="bg-red-500/80"
                >
                  {word}
                </span>
              );
            }
          } else if (word.startsWith("@")) {
            element = (
              <span
                key={`${word}-${lineIndex}-${index}`}
                className={
                  isValidUsername(word) ? TWITTER_BLUE : "text-red-300"
                }
              >
                {word}
              </span>
            );
          } else if (word.startsWith("#")) {
            element = (
              <span
                key={`${word}-${lineIndex}-${index}`}
                className={TWITTER_BLUE}
              >
                {word}
              </span>
            );
          }

          formattedText.push(element);
          currentLength += wordLength;

          if (index !== contentLength - 1) {
            formattedText.push(" ");
            currentLength += spaceLength;
          }
        });

        if (lineIndex !== retLines.length - 1) {
          formattedText.push("\n");
          currentLength += 1;
        }
      });

      setFormattedContent(formattedText);
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      onChange(newValue);
      formatContent(newValue);

      e.target.style.height = "auto";
      e.target.style.height = !newValue.trim()
        ? DEFAULT_TEXTAREA_HEIGHT
        : `${e.target.scrollHeight}px`;
    };

    // New handler for keyboard navigation and content splitting
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Call the original onKeyDown if provided
      if (onKeyDown) {
        onKeyDown(e);
      }

      // Get textarea and selection info
      const textarea = e.currentTarget;
      const { selectionStart, selectionEnd, value: text } = textarea;

      // Handle Shift+Enter for content splitting
      if (e.key === "Enter" && e.shiftKey && onSplitContent && !readOnly) {
        e.preventDefault();

        // Split content at cursor position
        const beforeCursor = text.substring(0, selectionStart);
        const afterCursor = text.substring(selectionStart);

        // Call handler with both parts
        onSplitContent(beforeCursor, afterCursor);
        return;
      }

      // Handle arrow key navigation between inputs
      // Up arrow at beginning moves to previous input
      if (e.key === "ArrowUp" && selectionStart === 0 && onNavigateUp) {
        e.preventDefault();
        onNavigateUp();
        return;
      }

      // Down arrow at end moves to next input
      if (
        e.key === "ArrowDown" &&
        selectionStart === text.length &&
        onNavigateDown
      ) {
        e.preventDefault();
        onNavigateDown();
        return;
      }

      // Add new handler for backspace at beginning to merge with previous tweet
      if (
        e.key === "Backspace" &&
        selectionStart === 0 &&
        selectionEnd === 0 &&
        onNavigateUp
      ) {
        // We need a new prop for this functionality
        if (typeof onMergeWithPrevious === "function") {
          e.preventDefault();
          onMergeWithPrevious();
          return;
        }
      }
    };

    useEffect(() => {
      formatContent(value);
    }, [value]);

    return (
      <div className="relative w-full">
        <textarea
          ref={ref}
          value={value}
          onChange={handleChange}
          onFocus={onFocus}
          onKeyDown={handleKeyDown} // Use our enhanced handler
          placeholder={placeholder}
          className={`w-full bg-transparent border-none resize-none focus:ring-0 focus:outline-none text-transparent caret-white ${className}`}
          readOnly={readOnly}
          spellCheck={false}
          style={{
            height: value.trim() ? "auto" : DEFAULT_TEXTAREA_HEIGHT,
            minHeight: DEFAULT_TEXTAREA_HEIGHT,
          }}
        />
        <div
          className={`absolute inset-0 pointer-events-none whitespace-pre-wrap break-words ${className}`}
          style={{ minHeight: DEFAULT_TEXTAREA_HEIGHT }}
        >
          {formattedContent.length > 0 ? (
            formattedContent
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
      </div>
    );
  }
);

MentionInput.displayName = "MentionInput";

export default MentionInput;
