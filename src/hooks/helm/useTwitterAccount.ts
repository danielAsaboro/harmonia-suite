// // File: src/hooks/helm/useTwitterAccount.ts

import { useCallback, useEffect, useState } from "react";
import { useHelm } from "./useHelm";
import { useWallet } from "@solana/wallet-adapter-react";
import { findTwitterAccountPDA } from "../../services/helm";
import { TwitterAccount } from "../../services/helm";

export function useTwitterAccount(twitterId: string | undefined) {
  const { instructions, handleTransaction, getTwitterAccount } = useHelm();
  const { publicKey } = useWallet();
  const [cachedRegistrationStatus, setCachedRegistrationStatus] = useState<
    boolean | null
  >(null);

  const registerAccount = useCallback(
    async (twitterId: string, twitterHandle: string) => {
      if (!instructions || !publicKey) throw new Error("Not connected");

      try {
        console.log(" twitterid ", twitterId);
        console.log(" twitter handle ", twitterHandle);
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

        console.log("Registration result:", result);

        if (!result) {
          throw new Error("Failed to Register your account with Helm");
        }

        // Fetch and return the new account
        const [accountPda] = findTwitterAccountPDA(twitterId);
        const account = await getTwitterAccount(accountPda);
        setCachedRegistrationStatus(true);
        return result;
      } catch (err) {
        throw err;
      }
    },
    [instructions, publicKey, handleTransaction, getTwitterAccount]
  );

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
        const account = await getTwitterAccount(accountPda);
        setCachedRegistrationStatus(true);
        return account;
      } catch (err) {
        return err;
      }
    },
    [instructions, publicKey, handleTransaction, getTwitterAccount]
  );

  const fetchAccount = useCallback(async () => {
    console.log("Fetching account for twitter ID:", twitterId);
    if (!twitterId) {
      console.log("No twitter ID provided, skipping fetch");
      return null;
    }

    try {
      const [accountPda] = findTwitterAccountPDA(twitterId);
      const account = await getTwitterAccount(accountPda);
      console.log("Fetched account:", account);
      return account as unknown as TwitterAccount;
    } catch (err) {
      console.error("Error fetching account:", err);
      throw err;
    }
  }, [twitterId, getTwitterAccount]);

  // Modify isRegistered to use cached value
  const isRegistered = useCallback(async () => {
    if (!twitterId) {
      console.log(
        "No twitter ID provided, returning false for registration check"
      );
      return false;
    }

    try {
      const retrievedAccount = await fetchAccount();
      console.log(
        "Retrieved account for registration check:",
        retrievedAccount
      );
      const isRegistered = retrievedAccount != null;
      setCachedRegistrationStatus(isRegistered);
      return isRegistered;
    } catch (err) {
      console.error("Error checking registration:", err);
      // throw err;
      return false;
    }
  }, [twitterId, fetchAccount]);

  // Effect to check registration status when twitterId changes
  useEffect(() => {
    if (twitterId) {
      console.log("Checking registration status for twitter ID:", twitterId);
      isRegistered().catch((err) => {
        console.error("Error in registration check effect:", err);
      });
    }
  }, [twitterId, isRegistered]);

  return {
    registerAccount,
    verifyAccount,
    fetchAccount,
    isRegistered,
    isRegisteredValue: cachedRegistrationStatus,
  };
}
