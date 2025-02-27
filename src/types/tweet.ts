// src/types/tweet.ts

export type TweetStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "scheduled"
  | "published";

export interface Tweet {
  id: string;
  content: string;
  mediaIds?: string[];
  createdAt: Date;
  status: TweetStatus;
  scheduledFor?: Date;
  threadId?: string;
  position?: number;
  lastSaved?: string;
  tags?: string[];
  lastModified?: string;
  teamId?: string;
  isSubmitted?: boolean;
}

export interface Thread {
  id: string;
  tweetIds: string[];
  createdAt: Date;
  status: TweetStatus;
  scheduledFor?: Date;
  tags?: string[];
  lastModified?: string;
  teamId?: string;
  isSubmitted?: boolean;
}

export interface ThreadWithTweets extends Thread {
  tweets: Tweet[];
}
export interface UnifiedTweetComposerProps {
  draftId: string | null;
  draftType: "tweet" | "thread" | null;
}

export interface ThreadData {
  thread: Thread;
  tweets: Tweet[];
}
// Types for media storage
export interface StoredMedia {
  id: string;
  data: string; // base64 encoded file data
  type: string; // mime type
  lastModified: string;
}

export interface CommentMetadata {
  tweetId: string;
  highlightedContent: string;
  startOffset: number;
  endOffset: number;
}

export interface Comment {
  id: string;
  content: string;
  authorName: string;
  authorId?: string;
  createdAt: string;
  position?: number;
  metadata?: CommentMetadata;
  resolved?: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface TwitterUserData {
  id: string;
  name: string;
  username: string;
  profile_image_url: string;
  verified: boolean;
  verified_type?: string;
  fetchedAt: number;
}

export interface DraftResponse {
  draft: Tweet | ThreadWithTweets;
  comments: Comment[];
  canComment: boolean;
  expiresAt: string;
  author: {
    id: string;
    name: string;
    handle: string;
    profileUrl?: string;
  };
}

export interface SidebarContentProps {
  tweets: Tweet[];
  selectedPostId: string | null;
  setSelectedPostId: (id: string | null) => void;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export interface DraftStats {
  wordCount: number;
  characterCount: number;
  readingTime: string;
  threadLength: number;
}

export interface DraftMetadata {
  title: string;
  createdAt: Date;
  lastEdited: Date;
  tags: Tag[];
  stats: DraftStats;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}
