// File: src/hooks/helm/useCreator.ts

import { useCallback, useState } from "react";
import { useHelm } from "./useHelm";
import { useWallet } from "@solana/wallet-adapter-react";
import { findCreatorListPDA } from "../../services/helm";
import { PublicKey } from "@solana/web3.js";

export function useCreator(twitterId?: string) {
  const { program, instructions, handleTransaction } = useHelm();
  const { publicKey } = useWallet();

  /**
   * Add a new creator
   */
  const addCreator = useCallback(
    async (newCreator: PublicKey) => {
      if (!instructions || !publicKey || !twitterId) {
        throw new Error("Missing required parameters");
      }
      try {
        // TODO: flesh out the main instructions;
        const tx = instructions.addCreator(twitterId, newCreator);
        await handleTransaction(tx.rpc(), {
          onSuccess: () => console.log("Creator added successfully"),
          onError: (error) => {
            console.error("Failed to add creator:", error);
            throw error;
          },
        });
        // // Return the updated creator list
        const [creatorListPda] = findCreatorListPDA(twitterId);
        return await program?.account.creatorList.fetch(creatorListPda);
      } catch (err) {
        throw err;
      }
    },
    [instructions, publicKey, twitterId, program, handleTransaction]
  );

  /**
   * Remove a creator
   */
  const removeCreator = useCallback(
    async (creatorToRemove: PublicKey) => {
      if (!instructions || !publicKey || !twitterId) {
        throw new Error("Missing required parameters");
      }

      try {
        const tx = instructions.removeCreator(twitterId, creatorToRemove);
        await handleTransaction(tx.rpc(), {
          onSuccess: () => console.log("Creator removed successfully"),
          onError: (error) => {
            console.error("Failed to  creator:", error);
            throw error;
          },
        });

        // Return the updated creator list
        const [creatorListPda] = findCreatorListPDA(twitterId);
        return await program?.account.creatorList.fetch(creatorListPda);
      } catch (err) {
        throw err;
      }
    },
    [instructions, publicKey, twitterId, program, handleTransaction]
  );

  /**
   * Get current creator list
   */
  const getCreatorList = useCallback(async () => {
    if (!program || !twitterId) {
      throw new Error("Missing required parameters");
    }

    try {
      const [creatorListPda] = findCreatorListPDA(twitterId);
      return await program.account.creatorList.fetch(creatorListPda);
    } catch (err) {
      console.error("Failed to fetch creator list:", err);
      throw err;
    }
  }, [program, twitterId]);

  /**
   * Check if an address is a creator
   */
  const isCreator = useCallback(
    async (address: PublicKey) => {
      try {
        const creatorList = await getCreatorList();
        return creatorList.creators.some(
          (creator) => creator.toString() === address.toString()
        );
      } catch (err) {
        console.error("Failed to check creator status:", err);
        return false;
      }
    },
    [getCreatorList]
  );

  return {
    addCreator,
    removeCreator,
    getCreatorList,
    isCreator,
  };
}
