// File: src/hooks/helm/useContent.ts

import { useCallback, useState } from "react";
import { useHelm } from "./useHelm";
import { useWallet } from "@solana/wallet-adapter-react";

import { PublicKey } from "@solana/web3.js";
import {
  ContentType,
  createContentHash,
  findContentPDA,
} from "@/services/helm";

export function useContent(twitterId?: string) {
  const { instructions, handleTransaction, getContent } = useHelm();
  const { publicKey } = useWallet();

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
            throw error;
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
        throw err;
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

      try {
        const tx = instructions.approveContent(
          twitterId,
          content,
          author,
          publicKey
        );

        await handleTransaction(tx.rpc(), {
          onSuccess: () => console.log("Content approved successfully"),
          onError: (error) => {
            console.error("Failed to approve content:", error);
            throw error;
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
        throw err;
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
            throw error;
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
        throw err;
      }
    },
    [instructions, publicKey, twitterId, handleTransaction, getContent]
  );

  /**
   * Cancel content
   */
  const cancelContent = useCallback(
    async (content: string, author: PublicKey, reason: string) => {
      if (!instructions || !publicKey || !twitterId) {
        throw new Error("Missing required parameters");
      }

      try {
        const tx = instructions.cancelContent(
          twitterId,
          content,
          author,
          publicKey
        );

        await handleTransaction(tx.rpc(), {
          onSuccess: () => console.log("Content rejected successfully"),
          onError: (error) => {
            console.error("Failed to reject content:", error);
            throw error;
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
        throw err;
      }
    },
    [instructions, publicKey, twitterId, handleTransaction, getContent]
  );

  return {
    getContent,
    submitContent,
    approveContent,
    rejectContent,
    cancelContent,
  };
}
