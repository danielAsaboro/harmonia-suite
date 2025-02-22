// File: src/hooks/helm/useAdmin.ts

import { useCallback, useState } from "react";
import { useHelm } from "./useHelm";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { findAdminListPDA } from "@/services/helm";

export function useAdmin(twitterId?: string) {
  const { program, instructions, handleTransaction } = useHelm();
  const { publicKey: currentUserPublicKey } = useWallet();

  /**
   * Add a new admin
   */
  const addAdmin = useCallback(
    async (newAdmin: PublicKey) => {
      if (!instructions || !currentUserPublicKey || !twitterId) {
        throw new Error("Missing required parameters");
      }

      try {
        const tx = instructions.addAdmin(
          twitterId,
          newAdmin,
          currentUserPublicKey
        );

        await handleTransaction(tx.rpc(), {
          onSuccess: () => console.log("Admin added successfully"),
          onError: (error) => {
            console.error("Failed to add admin:", error);
            throw error;
          },
        });

        // Return the updated admin list
        const [adminListPda] = findAdminListPDA(twitterId);
        return await program?.account.adminList.fetch(adminListPda);
      } catch (err) {
        throw err;
      }
    },
    [instructions, currentUserPublicKey, twitterId, program, handleTransaction]
  );

  /**
   * Remove an admin
   */
  const removeAdmin = useCallback(
    async (adminToRemove: PublicKey) => {
      if (!instructions || !currentUserPublicKey || !twitterId) {
        throw new Error("Missing required parameters");
      }

      try {
        const tx = instructions.removeAdmin(
          twitterId,
          adminToRemove,
          currentUserPublicKey
        );
        await handleTransaction(tx.rpc(), {
          onSuccess: () => console.log("Admin removed successfully"),
          onError: (error) => {
            console.error("Failed to remove admin:", error);
            throw error;
          },
        });

        // Return the updated admin list
        const [adminListPda] = findAdminListPDA(twitterId);
        return await program?.account.adminList.fetch(adminListPda);
      } catch (err) {
        throw err;
      }
    },
    [instructions, currentUserPublicKey, twitterId, program, handleTransaction]
  );

  /**
   * Get current admin list
   */
  const getAdminList = useCallback(async () => {
    if (!program || !twitterId) {
      throw new Error("Missing required parameters");
    }

    try {
      const [adminListPda] = findAdminListPDA(twitterId);
      return await program.account.adminList.fetch(adminListPda);
    } catch (err) {
      console.error("Failed to fetch admin list:", err);
      throw err;
    }
  }, [program, twitterId]);

  /**
   * Check if an address is an admin
   */
  const isAdmin = useCallback(
    async (address: PublicKey) => {
      try {
        const adminList = await getAdminList();
        return adminList.admins.some(
          (admin) => admin.toString() === address.toString()
        );
      } catch (err) {
        console.error("Failed to check admin status:", err);
        return false;
      }
    },
    [getAdminList]
  );

  return {
    addAdmin,
    removeAdmin,
    getAdminList,
    isAdmin,
  };
}
