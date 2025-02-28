// components/editor/media/ImageDescriptionModal.tsx

import React, { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (descriptions: { [mediaId: string]: string }) => void;
  mediaIds: string[];
  getMediaUrl: (id: string) => Promise<string | null>;
  initialDescriptions?: { [mediaId: string]: string };
  initialMediaIndex?: number; // Add prop for initial media index
}

const ImageDescriptionModal: React.FC<ImageDescriptionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  mediaIds,
  getMediaUrl,
  initialDescriptions = {},
  initialMediaIndex = 0, // Default to the first image if not specified
}) => {
  const [currentIndex, setCurrentIndex] = useState(
    initialMediaIndex >= 0 ? initialMediaIndex : 0
  );
  const [mediaUrls, setMediaUrls] = useState<(string | null)[]>([]);
  const [descriptions, setDescriptions] = useState<{
    [mediaId: string]: string;
  }>(initialDescriptions);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset the current index when the modal opens with a new initialMediaIndex
  useEffect(() => {
    if (isOpen && initialMediaIndex >= 0) {
      setCurrentIndex(initialMediaIndex);
    }
  }, [isOpen, initialMediaIndex]);

  useEffect(() => {
    if (isOpen) {
      loadMediaUrls();
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [isOpen]);

  const loadMediaUrls = async () => {
    const urls = await Promise.all(mediaIds.map((id) => getMediaUrl(id)));
    setMediaUrls(urls);
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const currentMediaId = mediaIds[currentIndex];
    if (!currentMediaId) return;

    const value = e.target.value;
    setDescriptions((prev) => ({
      ...prev,
      [currentMediaId]: value,
    }));
  };

  const handleNext = () => {
    if (currentIndex < mediaIds.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSave = () => {
    onSave(descriptions);
    onClose();
  };

  // Focus textarea when current index changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [currentIndex]);

  const currentMediaId = mediaIds[currentIndex];
  const currentDescription = currentMediaId
    ? descriptions[currentMediaId] || ""
    : "";
  const currentMediaUrl = mediaUrls[currentIndex];
  const descriptionLength = currentDescription.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-black border border-gray-800 rounded-2xl w-full max-w-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-800"
          >
            <X size={20} className="text-gray-400" />
          </button>
          <h2 className="text-white text-lg font-bold">
            Edit image description
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className={`p-2 rounded-full ${currentIndex === 0 ? "text-gray-600" : "text-gray-400 hover:bg-gray-800"}`}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === mediaIds.length - 1}
              className={`p-2 rounded-full ${currentIndex === mediaIds.length - 1 ? "text-gray-600" : "text-gray-400 hover:bg-gray-800"}`}
            >
              <ChevronRight size={20} />
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1 ml-2 rounded-full bg-white text-black font-medium"
            >
              Save
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* Image preview */}
          <div className="mb-4 flex justify-center">
            {currentMediaUrl && (
              <img
                src={currentMediaUrl}
                alt="Media preview"
                className="max-h-64 rounded-lg object-contain bg-gray-900"
              />
            )}
          </div>

          {/* Description textarea */}
          <div className="mb-2">
            <textarea
              ref={textareaRef}
              value={currentDescription}
              onChange={handleDescriptionChange}
              className="w-full h-32 p-3 bg-gray-900 border border-gray-700 rounded-lg text-white resize-none focus:outline-none focus:border-blue-500"
              placeholder="Add a description..."
              maxLength={1000}
            />
          </div>

          {/* Character count */}
          <div className="text-right text-gray-400 text-sm">
            {descriptionLength} / 1,000
          </div>

          {/* Help text */}
          <div className="mt-4 text-gray-400 text-sm">What is alt text?</div>
        </div>
      </div>
    </div>
  );
};

export default ImageDescriptionModal;
