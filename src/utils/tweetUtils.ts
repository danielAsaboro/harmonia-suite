import { TweetStatus } from "../types/tweet";

export type Tab = "drafts" | "scheduled" | "published";

export function mapTabToTweetStatus(tab: Tab): TweetStatus {
  return tab === "drafts" ? "draft" : (tab as TweetStatus);
}
