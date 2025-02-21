// /components/purgatory/Columns.tsx
import { ColumnDef } from "@tanstack/react-table";
import { Tweet, Thread, ThreadWithTweets, TweetStatus } from "@/types/tweet";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import {
  ExternalLink,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Link as LinkIcon,
  Check,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";

export interface Author {
  id: string;
  name: string;
  handle: string;
  profileUrl?: string;
}

export interface ScheduledItemBase {
  id: string;
  type: "tweet" | "thread";
  author: Author;
  scheduledFor: Date;
  tags: string[];
  content: string;
  readingTime: string;
  status: TweetStatus;
  createdAt: Date;
  lastModified?: Date;
  shareLink?: string;
  sharedDraftToken?: string;
}

export interface ScheduledTweet extends ScheduledItemBase {
  type: "tweet";
  mediaIds?: string[];
}

export interface ScheduledThread extends ScheduledItemBase {
  type: "thread";
  threadTweets: Tweet[];
  totalTweets: number;
}

export type ScheduledItem = ScheduledTweet | ScheduledThread;

export interface TableSortingState {
  id: string;
  desc: boolean;
}

// Function to copy link and show confirmation
const CopyLinkButton = ({ shareLink }: { shareLink: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            onClick={handleCopyLink}
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <LinkIcon className="w-4 h-4 text-blue-400" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {copied ? "Copied!" : "Copy share link"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const columns: ColumnDef<ScheduledItem>[] = [
  {
    accessorKey: "content",
    header: "Content",
    cell: ({ row }) => {
      const content = row.getValue("content") as string;
      const type = row.original.type;
      const preview =
        content.length > 30 ? content.slice(0, 30) + "..." : content;

      return (
        <div className="flex items-center gap-2">
          <Badge
            variant={type === "thread" ? "secondary" : "default"}
            className="flex-shrink-0"
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Badge>
          <span className="text-sm text-gray-400 truncate">{preview}</span>
        </div>
      );
    },
    filterFn: (row, id, filterValue: string) => {
      const content = row.getValue(id) as string;
      return content.toLowerCase().includes(filterValue.toLowerCase());
    },
    size: 300,
  },
  {
    accessorKey: "author",
    header: ({ column }) => {
      return (
        <div
          className="flex items-center cursor-pointer text-left"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Author
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
      );
    },
    sortingFn: (rowA, rowB) => {
      return rowA.original.author.name.localeCompare(rowB.original.author.name);
    },
    cell: ({ row }) => {
      const author = row.getValue("author") as Author;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{author.name}</span>
          <span className="text-sm text-gray-400">@{author.handle}</span>
        </div>
      );
    },
    size: 180,
  },
  {
    accessorKey: "scheduledFor",
    header: ({ column }) => {
      return (
        <div
          className="flex items-center cursor-pointer text-left"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Scheduled For
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
      );
    },
    sortingFn: (rowA, rowB) => {
      return (
        rowA.original.scheduledFor.getTime() -
        rowB.original.scheduledFor.getTime()
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("scheduledFor") as Date;
      return (
        <div className="flex flex-col">
          <span>{date.toLocaleDateString()}</span>
          <span className="text-sm text-gray-400">
            {formatDistanceToNow(date, { addSuffix: true })}
          </span>
        </div>
      );
    },
    size: 180,
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: ({ row }) => {
      const tags = row.getValue("tags") as string[];
      return (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "readingTime",
    header: ({ column }) => {
      return (
        <div
          className="flex items-center cursor-pointer text-left"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Reading Time
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
      );
    },
    sortingFn: (rowA, rowB) => {
      // Convert "X min" to number for sorting
      const getMinutes = (time: string) => parseInt(time.split(" ")[0]);
      return (
        getMinutes(rowA.original.readingTime) -
        getMinutes(rowB.original.readingTime)
      );
    },
    cell: ({ row }) => {
      const readingTime = row.getValue("readingTime") as string;
      return <span className="text-gray-400">{readingTime}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const item = row.original;
      const shareLink = item.shareLink;
      const sharedDraftToken = item.sharedDraftToken;

      return (
        <div className="flex items-center space-x-2">
          {shareLink && <CopyLinkButton shareLink={shareLink} />}

          {sharedDraftToken ? (
            <Link
              href={`/shared/${sharedDraftToken}`}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors inline-flex"
              target="_blank"
            >
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </Link>
          ) : (
            <Link
              href={`/content/${item.type}/${item.id}`}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors inline-flex"
              target="_blank"
            >
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </Link>
          )}
        </div>
      );
    },
  },
];
