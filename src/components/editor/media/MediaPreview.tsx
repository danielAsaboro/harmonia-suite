// components/editor/media/MediaPreview.tsx

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { UserRound, AlignLeft } from "lucide-react";
import ImageTaggingModal from "./ImageTaggingModal";
import ImageDescriptionModal from "./ImageDescriptionModal";

interface User {
  id: string;
  username: string;
  name: string;
  profileImageUrl?: string;
}

interface Props {
  mediaIds: string[];
  onRemove: (index: number) => void;
  getMediaUrl: (id: string) => Promise<string | null>;
  isDraft?: boolean;
  onUpdateTaggedUsers?: (mediaId: string, users: User[]) => void;
  onUpdateDescriptions?: (descriptions: { [mediaId: string]: string }) => void;
  taggedUsers?: { [mediaId: string]: User[] };
  descriptions?: { [mediaId: string]: string };
}

export default function MediaPreview({
  mediaIds,
  onRemove,
  getMediaUrl,
  isDraft = true,
  onUpdateTaggedUsers,
  onUpdateDescriptions,
  taggedUsers = {},
  descriptions = {},
}: Props) {
  const [mediaUrls, setMediaUrls] = useState<(string | null)[]>([]);
  const [fullscreenMedia, setFullscreenMedia] = useState<string | null>(null);
  const [currentFullscreenIndex, setCurrentFullscreenIndex] =
    useState<number>(-1);

  // Separate state for each modal
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [descriptionModalOpen, setDescriptionModalOpen] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number>(-1);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);

  useEffect(() => {
    const loadMediaUrls = async () => {
      const urls = await Promise.all(
        mediaIds.map((mediaId) => getMediaUrl(mediaId))
      );
      setMediaUrls(urls);
    };

    loadMediaUrls();
  }, [mediaIds, getMediaUrl]);

  const handleNavigation = (direction: "left" | "right") => {
    setCurrentFullscreenIndex((prev) => {
      let newIndex;
      if (direction === "left") {
        newIndex = prev > 0 ? prev - 1 : mediaUrls.length - 1;
      } else {
        newIndex = prev < mediaUrls.length - 1 ? prev + 1 : 0;
      }
      const newUrl = mediaUrls[newIndex];
      if (newUrl) setFullscreenMedia(newUrl);
      return newIndex;
    });
  };

  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (fullscreenMedia) {
        switch (e.key) {
          case "Escape":
            setFullscreenMedia(null);
            setCurrentFullscreenIndex(-1);
            break;
          case "ArrowLeft":
            handleNavigation("left");
            break;
          case "ArrowRight":
            handleNavigation("right");
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [fullscreenMedia]);

  const isImageUrl = (url: string): boolean => {
    if (url.startsWith("data:image/")) {
      return true;
    }

    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      return imageExtensions.some((ext) => pathname.endsWith(ext));
    } catch (e) {
      return imageExtensions.some((ext) => url.toLowerCase().endsWith(ext));
    }
  };

  const handleMediaClick = (url: string, index: number) => {
    setFullscreenMedia(url);
    setCurrentFullscreenIndex(index);
  };

  const openTagModal = (mediaId: string, index: number) => {
    setSelectedMediaId(mediaId);
    setSelectedMediaIndex(index);
    setTagModalOpen(true);
  };

  const openDescriptionModal = (index: number) => {
    setSelectedMediaIndex(index);
    setDescriptionModalOpen(true);
  };

  const handleSaveTaggedUsers = (users: User[]) => {
    if (selectedMediaId && onUpdateTaggedUsers) {
      onUpdateTaggedUsers(selectedMediaId, users);
    }
  };

  const handleSaveDescriptions = (newDescriptions: {
    [mediaId: string]: string;
  }) => {
    if (onUpdateDescriptions) {
      onUpdateDescriptions(newDescriptions);
    }
  };

  // Calculate grid classes based on number of media items
  const getGridClasses = () => {
    switch (mediaUrls.filter(Boolean).length) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-2";
      case 4:
        return "grid-cols-2";
      default:
        return "grid-cols-2";
    }
  };

  return (
    <>
      <div className={`grid gap-2 ${getGridClasses()}`}>
        {mediaUrls.map((url, index) => {
          if (!url) return null;
          const mediaId = mediaIds[index];
          const hasDescription = descriptions[mediaId];
          const taggedCount = taggedUsers[mediaId]?.length || 0;

          // Special case for first item when there are 3 images
          const isFirstOfThree =
            index === 0 && mediaUrls.filter(Boolean).length === 3;

          return (
            <div
              key={`index_${mediaIds[index]}`}
              className={`relative group ${isFirstOfThree ? "col-span-2" : ""}`}
            >
              <div
                className="relative rounded-lg overflow-hidden cursor-pointer aspect-square w-full"
                onClick={() => handleMediaClick(url, index)}
              >
                {isImageUrl(url) ? (
                  <img
                    src={url}
                    alt={descriptions[mediaId] || `Media ${index + 1}`}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <video
                    src={url}
                    className="w-full h-full object-cover"
                    controls={false}
                  />
                )}

                {/* Indicator badges for descriptions and tags */}
                <div className="absolute bottom-2 left-2 flex gap-1">
                  {hasDescription && (
                    <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                      ALT
                    </div>
                  )}
                  {taggedCount > 0 && (
                    <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                      {taggedCount} {taggedCount === 1 ? "person" : "people"}
                    </div>
                  )}
                </div>

                {/* Action buttons - visible on hover */}
                {isDraft && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openTagModal(mediaId, index);
                      }}
                      className="p-2 bg-black/70 rounded-full hover:bg-black text-white"
                      title="Tag people"
                    >
                      <UserRound size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDescriptionModal(index);
                      }}
                      className="p-2 bg-black/70 rounded-full hover:bg-black text-white"
                      title="Add description"
                    >
                      <AlignLeft size={16} />
                    </button>
                  </div>
                )}
              </div>

              {isDraft && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(index);
                  }}
                  className="absolute -top-2 -right-2 bg-gray-900 rounded-full p-1 
                           hover:bg-gray-800 text-red-400 z-10"
                  aria-label="Remove media"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Fullscreen Media Modal */}
      {fullscreenMedia &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
            onClick={() => {
              setFullscreenMedia(null);
              setCurrentFullscreenIndex(-1);
            }}
          >
            <div
              className="max-w-[90vw] max-h-[90vh] relative"
              onClick={(e) => e.stopPropagation()}
            >
              {isImageUrl(fullscreenMedia) ? (
                <img
                  src={fullscreenMedia}
                  alt={
                    descriptions[mediaIds[currentFullscreenIndex]] ||
                    `Fullscreen media ${currentFullscreenIndex + 1}`
                  }
                  className="max-w-full max-h-[90vh] object-contain"
                />
              ) : (
                <video
                  src={fullscreenMedia}
                  className="max-w-full max-h-[90vh]"
                  controls
                  autoPlay
                />
              )}

              {/* Navigation UI */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <span className="text-white bg-black/50 px-3 py-1 rounded-full text-sm">
                  {currentFullscreenIndex + 1} / {mediaUrls.length}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFullscreenMedia(null);
                    setCurrentFullscreenIndex(-1);
                  }}
                  className="bg-gray-900/50 hover:bg-gray-900 
                         rounded-full p-2 text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Arrow buttons - only show if there's more than one media item */}
              {mediaUrls.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigation("left");
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-gray-900/50 hover:bg-gray-900 
                           rounded-full p-2 sm:p-3 text-white transition-colors z-10"
                    aria-label="Previous image"
                  >
                    ←
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigation("right");
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-900/50 hover:bg-gray-900 
                           rounded-full p-2 sm:p-3 text-white transition-colors z-10"
                    aria-label="Next image"
                  >
                    →
                  </button>
                </>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* Tag Modal with correct selected media */}
      <ImageTaggingModal
        isOpen={tagModalOpen}
        onClose={() => {
          setTagModalOpen(false);
          // Clear selection state when closing
          setSelectedMediaId(null);
          setSelectedMediaIndex(-1);
        }}
        onSave={handleSaveTaggedUsers}
        initialTaggedUsers={
          selectedMediaId ? taggedUsers[selectedMediaId] || [] : []
        }
      />

      {/* Updated Description Modal to focus on the selected image */}
      <ImageDescriptionModal
        isOpen={descriptionModalOpen}
        onClose={() => setDescriptionModalOpen(false)}
        onSave={handleSaveDescriptions}
        mediaIds={mediaIds}
        getMediaUrl={getMediaUrl}
        initialDescriptions={descriptions}
        initialMediaIndex={selectedMediaIndex}
      />
    </>
  );
}
