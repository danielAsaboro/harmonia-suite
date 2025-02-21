// File: src/components/content/content-data-access.tsx

import { useContent } from "@/hooks/helm";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTransactionToast } from "../ui/ui-layout";
import { ContentType } from "@/services/helm";

export function useContentActions(twitterId?: string) {
  const transactionToast = useTransactionToast();
  const { publicKey } = useWallet();
  const { submitContent, approveContent, rejectContent, getContent } =
    useContent(twitterId);

  const submitMutation = useMutation({
    mutationFn: async ({
      content,
      contentType,
    }: {
      content: string;
      contentType: ContentType;
    }) => {
      if (!publicKey || !twitterId) {
        throw new Error("Wallet not connected or Twitter ID missing");
      }

      console.log(" about to submit content with submitContent");
      const result = await submitContent(content, contentType);
      // Only return actual transaction results
      return result;
    },
    onSuccess: (result) => {
      // Only show toast for successful transactions
      if (result) {
        transactionToast(result.toString());
      }
    },
    onError: (error: any) => {
      // Don't show error for user rejections
      if (error?.message?.includes("User rejected") || !error) {
        return;
      }
      console.error("Mutation error:", error);
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({
      content,
      author,
    }: {
      content: string;
      author: PublicKey;
    }) => {
      if (!publicKey || !twitterId) throw new Error("Not connected");
      return approveContent(content, author);
    },
    onSuccess: () => {
      transactionToast("Content approved successfully");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({
      content,
      author,
      reason,
    }: {
      content: string;
      author: PublicKey;
      reason: string;
    }) => {
      if (!publicKey || !twitterId) throw new Error("Not connected");
      return rejectContent(content, author, reason);
    },
    onSuccess: () => {
      transactionToast("Content rejected successfully");
    },
  });

  return {
    submitContent: submitMutation,
    approveContent: approveMutation,
    rejectContent: rejectMutation,
  };
}
