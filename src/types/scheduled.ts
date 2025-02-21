// /types/scheduled.ts
import { Tweet, Thread } from "./tweet";

export type ScheduledItemType = "tweet" | "thread";

export interface ScheduledItem {
  id: string;
  type: ScheduledItemType;
  author: {
    name: string;
    handle: string;
    avatar?: string;
  };
  scheduledFor: Date;
  tags: string[];
  content: Tweet | Thread;
  readingTime: string;
  createdAt: Date;
}

export interface ScheduledItemsTableProps {
  items: ScheduledItem[];
  onItemClick?: (item: ScheduledItem) => void;
}

export interface PreviewOverlayProps {
  item: ScheduledItem;
  position: { x: number; y: number } | null;
  onClose: () => void;
}
