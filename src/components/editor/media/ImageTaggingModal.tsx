// components/editor/media/ImageTaggingModal.tsx

import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

// Mock user data (replace with actual API call in production)
interface User {
  id: string;
  username: string;
  name: string;
  profileImageUrl?: string;
}

interface ImageTaggingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taggedUsers: User[]) => void;
  initialTaggedUsers?: User[];
}

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

const ImageTaggingModal: React.FC<ImageTaggingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTaggedUsers = [],
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [taggedUsers, setTaggedUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Reset tagged users when modal opens with new initialTaggedUsers
  useEffect(() => {
    if (isOpen) {
      setTaggedUsers(initialTaggedUsers || []);
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [isOpen, initialTaggedUsers]);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle search input change
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchUsers(query);
      // Filter out already tagged users
      const filteredResults = results.filter(
        (user) => !taggedUsers.some((taggedUser) => taggedUser.id === user.id)
      );
      setSearchResults(filteredResults);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tagging a user
  const handleTagUser = (user: User) => {
    if (taggedUsers.length >= 10) {
      alert("You can tag up to 10 people");
      return;
    }

    setTaggedUsers((prev) => [...prev, user]);
    setSearchQuery("");
    setSearchResults([]);
    searchInputRef.current?.focus();
  };

  // Handle removing a tagged user
  const handleRemoveTag = (userId: string) => {
    setTaggedUsers((prev) => prev.filter((user) => user.id !== userId));
  };

  // Handle save
  const handleSave = () => {
    onSave(taggedUsers);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-black border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-800"
          >
            <X size={20} className="text-gray-400" />
          </button>
          <h2 className="text-white text-lg font-bold">Tag people</h2>
          <button
            onClick={handleSave}
            className="px-4 py-1 rounded-full bg-white text-black font-medium"
          >
            Done
          </button>
        </div>

        <div className="p-4">
          {/* Tagged users */}
          {taggedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {taggedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-1 bg-gray-800 rounded-full pl-2 pr-1 py-1"
                >
                  <span className="text-white text-sm">{user.username}</span>
                  <button
                    onClick={() => handleRemoveTag(user.id)}
                    className="p-1 rounded-full hover:bg-gray-700 text-gray-400"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search input */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-full text-white focus:outline-none focus:border-blue-500"
              placeholder="Search people"
            />
          </div>

          {/* Search results */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="text-gray-400 text-center py-4">Loading...</div>
            ) : searchResults.length > 0 ? (
              <ul>
                {searchResults.map((user) => (
                  <li
                    key={user.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg cursor-pointer"
                    onClick={() => handleTagUser(user)}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700">
                      {user.profileImageUrl ? (
                        <img
                          src={user.profileImageUrl}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.name}</p>
                      <p className="text-gray-400">@{user.username}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : searchQuery.trim() !== "" ? (
              <div className="text-gray-400 text-center py-4">
                No results found
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageTaggingModal;
