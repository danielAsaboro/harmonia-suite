// File: src/hooks/helm/useContent.ts

import { useCallback, useState } from "react";
import { useHelm } from "./useHelm";
import { useWallet } from "@solana/wallet-adapter-react";

import { PublicKey } from "@solana/web3.js";
import {
  Content,
  ContentType,
  createContentHash,
  findContentPDA,
} from "@/services/helm";
import { useQuery, useMutation } from "@tanstack/react-query";

export function useContent(twitterId?: string) {
  const { instructions, handleTransaction, getContent } = useHelm();
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Submit content for approval
   */
  const submitContent = useCallback(
    async (
      content: string,
      contentType: ContentType,
      scheduledFor?: number
    ) => {
      if (!instructions || !publicKey || !twitterId) {
        throw new Error("Missing required parameters");
      }

      setLoading(true);
      setError(null);

      try {
        console.log(" composing transactions");
        const tx = instructions.submitForApproval(
          twitterId,
          content,
          contentType,
          publicKey,
          scheduledFor
        );

        const result = await handleTransaction(tx.rpc(), {
          onSuccess: () => console.log("Content submitted successfully"),
          onError: (error) => {
            console.error("Failed to submit content:", error);
            setError(new Error(error.message));
          },
        });

        // If result is null, transaction was cancelled - don't try to fetch content
        if (!result) {
          return null;
        }

        // Return the new content account
        const contentHash = createContentHash(content);
        const [contentPda] = findContentPDA(
          new PublicKey(twitterId),
          publicKey,
          contentHash
        );
        return await getContent(contentPda);
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [instructions, publicKey, twitterId, handleTransaction, getContent]
  );

  /**
   * Approve content
   */
  const approveContent = useCallback(
    async (content: string, author: PublicKey) => {
      if (!instructions || !publicKey || !twitterId) {
        throw new Error("Missing required parameters");
      }

      setLoading(true);
      setError(null);

      try {
        const tx = await instructions.approveContent(
          twitterId,
          content,
          author,
          publicKey
        );

        await handleTransaction(tx.rpc(), {
          onSuccess: () => console.log("Content approved successfully"),
          onError: (error) => {
            console.error("Failed to approve content:", error);
            setError(new Error(error.message));
          },
        });

        // Return the updated content account
        const contentHash = createContentHash(content);
        const [contentPda] = findContentPDA(
          new PublicKey(twitterId),
          author,
          contentHash
        );
        return await getContent(contentPda);
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [instructions, publicKey, twitterId, handleTransaction, getContent]
  );

  /**
   * Reject content
   */
  const rejectContent = useCallback(
    async (content: string, author: PublicKey, reason: string) => {
      if (!instructions || !publicKey || !twitterId) {
        throw new Error("Missing required parameters");
      }

      setLoading(true);
      setError(null);

      try {
        const tx = await instructions.rejectContent(
          twitterId,
          content,
          author,
          publicKey,
          reason
        );

        await handleTransaction(tx.rpc(), {
          onSuccess: () => console.log("Content rejected successfully"),
          onError: (error) => {
            console.error("Failed to reject content:", error);
            setError(new Error(error.message));
          },
        });

        // Return the updated content account
        const contentHash = createContentHash(content);
        const [contentPda] = findContentPDA(
          new PublicKey(twitterId),
          author,
          contentHash
        );
        return await getContent(contentPda);
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [instructions, publicKey, twitterId, handleTransaction, getContent]
  );

  /**
   * Subscribe to content updates
   */
  const watchContent = useCallback(
    (
      content: string,
      author: PublicKey,
      callback: (content: Content) => void
    ) => {
      if (!twitterId) throw new Error("Twitter ID required");

      const contentHash = createContentHash(content);
      const [contentPda] = findContentPDA(
        new PublicKey(twitterId),
        author,
        contentHash
      );

      // return subscribeToContent(contentPda, callback);
    },
    [
      twitterId,
      // subscribeToContent
    ]
  );

  return {
    getContent,
    submitContent,
    approveContent,
    rejectContent,
    watchContent,
    loading,
    error,
  };
}
