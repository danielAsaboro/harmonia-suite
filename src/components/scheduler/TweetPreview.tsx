// /components/scheduler/TweetPreview.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { ScheduledItem } from "./Columns";

interface PreviewPosition {
  x: number;
  y: number;
}

interface TweetPreviewProps {
  item: ScheduledItem;
  position: PreviewPosition;
}

interface PreviewContent {
  text: string;
  author: {
    name: string;
    handle: string;
  };
}

export const TweetPreview: React.FC<TweetPreviewProps> = ({
  item,
  position,
}) => {
  const [shouldShow, setShouldShow] = useState<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getPreviewContent = (item: ScheduledItem): PreviewContent => {
    const content =
      item.type === "thread"
        ? item.threadTweets[0]?.content || item.content
        : item.content;

    return {
      text: content,
      author: {
        name: item.author.name,
        handle: item.author.handle,
      },
    };
  };

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setShouldShow(true);
    }, 500);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setShouldShow(false);
    };
  }, [item.id]);

  if (!shouldShow) return null;

  const previewContent = getPreviewContent(item);

  return (
    <Card
      className="absolute z-50 w-72 p-4 bg-gray-900 border border-gray-800 shadow-xl"
      style={{
        left: `${position.x + 20}px`,
        top: `${position.y}px`,
      }}
    >
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-sm">
            {previewContent.author.name}
          </span>
          <span className="text-sm text-gray-400">
            @{previewContent.author.handle}
          </span>
        </div>
        <p className="text-sm text-gray-200">{previewContent.text}</p>
      </div>
    </Card>
  );
};
