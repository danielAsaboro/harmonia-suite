// // components/editor/MentionInput.tsx
import React, {
  useState,
  useEffect,
  forwardRef,
  JSX,
  useRef,
  useCallback,
} from "react";
import debounce from "lodash/debounce";

// Mock user data to simulate API responses
interface User {
  id: string;
  username: string;
  name: string;
  profileImageUrl?: string;
}

// Mock users for demonstration
const MOCK_USERS: User[] = [
  {
    id: "1",
    username: "elonmusk",
    name: "Elon Musk",
    profileImageUrl: "https://placehold.co/40x40",
  },
  {
    id: "2",
    username: "jack",
    name: "Jack Dorsey",
    profileImageUrl: "https://placehold.co/40x40",
  },
  {
    id: "3",
    username: "naval",
    name: "Naval Ravikant",
    profileImageUrl: "https://placehold.co/40x40",
  },
  {
    id: "4",
    username: "TaylorLorenz",
    name: "Taylor Lorenz",
    profileImageUrl: "https://placehold.co/40x40",
  },
  {
    id: "5",
    username: "lexfridman",
    name: "Lex Fridman",
    profileImageUrl: "https://placehold.co/40x40",
  },
  {
    id: "6",
    username: "tim_cook",
    name: "Tim Cook",
    profileImageUrl: "https://placehold.co/40x40",
  },
  {
    id: "7",
    username: "sundarpichai",
    name: "Sundar Pichai",
    profileImageUrl: "https://placehold.co/40x40",
  },
  {
    id: "8",
    username: "balajis",
    name: "Balaji Srinivasan",
    profileImageUrl: "https://placehold.co/40x40",
  },
];

// Simulate API call to search users
const searchUsers = async (query: string): Promise<User[]> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Filter users based on query (case insensitive)
  return MOCK_USERS.filter(
    (user) =>
      user.username.toLowerCase().includes(query.toLowerCase()) ||
      user.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5); // Limit to 5 results
};

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

interface MentionPopup {
  isVisible: boolean;
  query: string;
  position: { top: number; left: number };
  users: User[];
  selectedIndex: number;
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
    const [mentionPopup, setMentionPopup] = useState<MentionPopup>({
      isVisible: false,
      query: "",
      position: { top: 0, left: 0 },
      users: [],
      selectedIndex: 0,
    });

    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    // Combine forwarded ref with local ref
    const setRefs = (element: HTMLTextAreaElement) => {
      textareaRef.current = element;
      if (typeof ref === "function") {
        ref(element);
      } else if (ref) {
        ref.current = element;
      }
    };

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

    // Create a debounced search function
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSearch = useCallback(
      debounce(async (query: string) => {
        if (query.length > 0) {
          const results = await searchUsers(query);
          setMentionPopup((prev) => ({ ...prev, users: results }));
        }
      }, 300),
      []
    );

    // Function to find the current mention query at cursor position
    const getCurrentMentionQuery = (
      text: string,
      cursorPos: number
    ): { query: string; startPos: number } | null => {
      // Look backwards from cursor position to find @ symbol
      let startPos = cursorPos - 1;
      while (startPos >= 0) {
        // If we hit a space or new line before finding @, there's no mention
        if (text[startPos] === " " || text[startPos] === "\n") {
          return null;
        }

        // If we find @, extract the query
        if (text[startPos] === "@") {
          const query = text.substring(startPos + 1, cursorPos);
          return { query, startPos };
        }

        startPos--;
      }

      return null;
    };

    // Simple function that just returns fixed values for positioning
    const getCursorPosition = (): { top: number; left: number } => {
      return {
        top: 30, // Fixed position that appears below the text
        left: 0, // Align with the left edge of the textarea
      };
    };

    // Function to insert mention at cursor
    const insertMention = (username: string) => {
      if (!textareaRef.current) return;

      const textarea = textareaRef.current;
      const cursorPos = textarea.selectionStart;
      const mentionData = getCurrentMentionQuery(value, cursorPos);

      if (!mentionData) return;

      const { startPos } = mentionData;

      // Replace the @query with @username
      const newValue =
        value.substring(0, startPos) +
        `@${username}` +
        value.substring(cursorPos);

      // Update value and cursor position
      onChange(newValue);

      // Close popup
      setMentionPopup((prev) => ({
        ...prev,
        isVisible: false,
        query: "",
      }));

      // Set cursor position after the inserted mention
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = startPos + username.length + 1;
          textareaRef.current.selectionStart = newCursorPos;
          textareaRef.current.selectionEnd = newCursorPos;
        }
      }, 0);
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      onChange(newValue);
      formatContent(newValue);

      e.target.style.height = "auto";
      e.target.style.height = !newValue.trim()
        ? DEFAULT_TEXTAREA_HEIGHT
        : `${e.target.scrollHeight}px`;

      // Check for mention popup
      const cursorPos = e.target.selectionStart;
      const mentionData = getCurrentMentionQuery(newValue, cursorPos);

      if (mentionData) {
        const { query } = mentionData;
        // Update popup state
        setMentionPopup((prev) => ({
          ...prev,
          isVisible: true,
          query,
          position: getCursorPosition(),
          selectedIndex: 0,
        }));

        // Search for matching users (debounced)
        debouncedSearch(query);
      } else {
        // Hide popup if no mention query found
        setMentionPopup((prev) => ({
          ...prev,
          isVisible: false,
          query: "",
        }));
      }
    };

    // New handler for keyboard navigation and content splitting
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Handle mention popup navigation
      if (mentionPopup.isVisible && mentionPopup.users.length > 0) {
        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            setMentionPopup((prev) => ({
              ...prev,
              selectedIndex: (prev.selectedIndex + 1) % prev.users.length,
            }));
            return;

          case "ArrowUp":
            e.preventDefault();
            setMentionPopup((prev) => ({
              ...prev,
              selectedIndex:
                (prev.selectedIndex - 1 + prev.users.length) %
                prev.users.length,
            }));
            return;

          case "Enter":
          case "Tab":
            e.preventDefault();
            insertMention(
              mentionPopup.users[mentionPopup.selectedIndex].username
            );
            return;

          case "Escape":
            e.preventDefault();
            setMentionPopup((prev) => ({
              ...prev,
              isVisible: false,
              query: "",
            }));
            return;
        }
      }

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
      if (
        e.key === "ArrowUp" &&
        selectionStart === 0 &&
        !mentionPopup.isVisible &&
        onNavigateUp
      ) {
        e.preventDefault();
        onNavigateUp();
        return;
      }

      // Down arrow at end moves to next input
      if (
        e.key === "ArrowDown" &&
        selectionStart === text.length &&
        !mentionPopup.isVisible &&
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

    // Handle click on mention suggestion
    const handleMentionClick = (username: string) => {
      insertMention(username);
    };

    useEffect(() => {
      formatContent(value);

      // Close mention popup when clicking outside
      const handleClickOutside = (e: MouseEvent) => {
        if (
          wrapperRef.current &&
          !wrapperRef.current.contains(e.target as Node)
        ) {
          setMentionPopup((prev) => ({
            ...prev,
            isVisible: false,
            query: "",
          }));
        }
      };

      document.addEventListener("click", handleClickOutside);
      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }, [value]);

    return (
      <div className="relative w-full" ref={wrapperRef}>
        <textarea
          ref={setRefs}
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

        {/* Mention popup - simple fixed positioning below content */}
        {mentionPopup.isVisible && mentionPopup.users.length > 0 && (
          <div
            className="absolute z-10 bg-black border border-gray-700 rounded-lg shadow-lg overflow-hidden"
            style={{
              top: "100%", // Position below the textarea
              left: 0,
              right: 0,
              width: "100%",
              maxHeight: "200px", // Limit height on mobile
              marginTop: "4px", // Small gap between text and popup
            }}
          >
            <ul className="py-1">
              {mentionPopup.users.map((user, index) => (
                <li
                  key={user.id}
                  className={`px-3 py-2 flex items-center cursor-pointer hover:bg-gray-800 ${
                    index === mentionPopup.selectedIndex ? "bg-gray-800" : ""
                  }`}
                  onClick={() => handleMentionClick(user.username)}
                >
                  {user.profileImageUrl && (
                    <img
                      src={user.profileImageUrl}
                      alt={user.name}
                      className="w-8 h-8 rounded-full mr-2"
                    />
                  )}
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-gray-400 text-sm">
                      @{user.username}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
);

MentionInput.displayName = "MentionInput";

export default MentionInput;
