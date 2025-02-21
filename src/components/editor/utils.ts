import { sha3_256 } from "js-sha3";
import { Tweet, Thread } from "@/types/tweet";

// Add this function above handleSubmitForReview
export const generateContentHash = (content: string): string => {
  if (!content) return "";

  // Normalize the content - trim whitespace, convert to lowercase
  return content.trim().toLowerCase();
};

export const hashTweet = (tweet: Tweet): string | null => {
  // Ensure we have a tweet object with required fields
  if (!tweet || !tweet.id) return null;

  // Create ordered object with only the content fields we want to hash
  const contentToHash = {
    content: generateContentHash(tweet.content),
    mediaIds: Array.isArray(tweet.mediaIds)
      ? [...tweet.mediaIds].sort().join(",")
      : "",
  };

  // Convert to string in a deterministic way
  const stringToHash = JSON.stringify(contentToHash);

  // Generate hash
  return sha3_256(stringToHash);
};

export const hashThread = (tweets: Tweet[]): string | null => {
  if (!Array.isArray(tweets) || tweets.length === 0) return null;

  // Hash individual tweets first
  const tweetHashes = tweets.map((tweet) => ({
    position:
      tweet.position !== undefined ? tweet.position : tweets.indexOf(tweet),
    hash: hashTweet(tweet),
  }));

  // Sort by position to ensure deterministic order
  tweetHashes.sort((a, b) => a.position - b.position);

  // Join the sorted hashes and hash again
  const combinedHash = tweetHashes.map((item) => item.hash).join("");
  return sha3_256(combinedHash);
};
