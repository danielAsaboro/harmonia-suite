// File: src/hooks/helm/useHelm.ts

import { useCallback } from "react";
import { HelmErrorHandler } from "../../services/helm";
import { PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { useHelmContext } from "@/contexts/helm/HelmContext";

export function useHelm() {
  const { program, instructions, connected, loading, error } = useHelmContext();
  const { connection } = useConnection();

  const handleTransaction = useCallback(
    async (
      transaction: Promise<string>,
      options?: {
        onSuccess?: () => void;
        onError?: (error: any) => void;
      }
    ) => {
      try {
        console.log("About to process the transaction");
        console.log("sending to user and awaiting it");
        // console.log(" program ::::", program);
        const txId = await transaction;

        // Early return if transaction was cancelled
        if (!txId) {
          throw new Error("There's something wrong with this transaction");
        }

        // Wait for confirmation before considering it a success
        try {
          await connection.confirmTransaction(txId);
          options?.onSuccess?.();
          return txId;
        } catch (confirmError) {
          options?.onError?.(confirmError);
          throw confirmError;
        }
      } catch (error: unknown) {
        console.log("Error Handling Transaction", error);

        // First, check if error has a message property
        if (error instanceof Error) {
          if (error.message.includes("failed to get recent blockhash")) {
            throw new Error("Can't Connect to the Solana Network");
          }
        }

        // Type assertion for transaction errors if needed
        interface TransactionError {
          transactionMessage?: string;
        }

        if (typeof error === "object" && error !== null) {
          const txError = error as TransactionError;
          if (
            txError.transactionMessage?.includes("custom program error: 0x0")
          ) {
            throw new Error("Error: One-time Operation already occurred");
          }
        }

        // If we reach here, pass the error to my custom handler
        const formattedError = HelmErrorHandler.formatTransactionError(error);
        options?.onError?.(formattedError);
      }
    },
    [connection]
  );

  /**
   * Fetch a Twitter account by its PDA
   */
  const getTwitterAccount = useCallback(
    async (twitterAccountPda: PublicKey) => {
      if (!program) throw new Error("Program not initialized");
      try {
        return await program.account.twitterAccount.fetch(twitterAccountPda);
      } catch (error) {
        console.error("Error fetching Twitter account:", error);
        throw error;
      }
    },
    [program]
  );

  /**
   * Fetch content by its PDA
   */
  const getContent = useCallback(
    async (contentPda: PublicKey) => {
      if (!program) throw new Error("Program not initialized");
      try {
        return await program.account.content.fetch(contentPda);
      } catch (error) {
        console.error("Error fetching content:", error);
        throw error;
      }
    },
    [program]
  );

  return {
    program,
    instructions,
    connected,
    loading,
    error,
    handleTransaction,
    getTwitterAccount,
    getContent,
  };
}
