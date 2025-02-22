// File: src/hooks/helm/useTwitterAccount.ts

import { useCallback } from "react";
import { useHelm } from "./useHelm";
import { useWallet } from "@solana/wallet-adapter-react";
import { findTwitterAccountPDA } from "../../services/helm";
import { TwitterAccount } from "../../services/helm";

export function useTwitterAccount(twitterId?: string) {
  const { instructions, handleTransaction, getTwitterAccount } = useHelm();
  const { publicKey } = useWallet();

  /**
   * Register a new Twitter account
   */
  const registerAccount = useCallback(
    async (twitterId: string, twitterHandle: string) => {
      if (!instructions || !publicKey) throw new Error("Not connected");

      try {
        const tx = instructions.registerTwitterAccount(
          twitterId,
          twitterHandle,
          publicKey
        );

        const result = await handleTransaction(tx.rpc(), {
          onSuccess: () => {
            console.log("Twitter account registered successfully");
          },
          onError: (error) => {
            console.error("Failed to register Twitter account:", error);
            throw error;
          },
        });

        console.log(" the result, ", result);

        if (!result) {
          throw new Error("Failed to Register your account with Helm");
        }

        // Fetch and return the new account
        const [accountPda] = findTwitterAccountPDA(twitterId);
        await getTwitterAccount(accountPda);

        return result;
      } catch (err) {
        throw err;
      }
    },
    [instructions, publicKey, handleTransaction, getTwitterAccount]
  );

  /**
   * Verify a Twitter account
   */
  const verifyAccount = useCallback(
    async (twitterId: string) => {
      if (!instructions || !publicKey) throw new Error("Not connected");

      try {
        const tx = instructions.verifyTwitterAccount(twitterId, publicKey);

        const result = await handleTransaction(tx.rpc(), {
          onSuccess: () => console.log("Twitter account verified successfully"),
          onError: (error) => {
            console.error("Failed to verify Twitter account:", error);
            return error;
          },
        });

        if (!result) {
          throw Error("Problem registering twitter Account");
        }

        // Fetch and return the updated account
        const [accountPda] = findTwitterAccountPDA(twitterId);
        return await getTwitterAccount(accountPda);
      } catch (err) {
        return err;
      }
    },
    [instructions, publicKey, handleTransaction, getTwitterAccount]
  );

  /**
   * Fetch account data if twitterId is provided
   */
  const fetchAccount = useCallback(async () => {
    if (!twitterId) return null;

    try {
      const [accountPda] = findTwitterAccountPDA(twitterId);
      const account = await getTwitterAccount(accountPda);
      // CHECK; does this work? i hope so
      return account as unknown as TwitterAccount;
    } catch (err) {
      throw err;
    }
  }, [twitterId, getTwitterAccount]);

  return {
    registerAccount,
    verifyAccount,
    fetchAccount,
  };
}
