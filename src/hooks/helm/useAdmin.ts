// File: src/hooks/helm/useAdmin.ts

import { useCallback, useState } from "react";
import { useHelm } from "./useHelm";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { findAdminListPDA } from "@/services/helm";

export function useAdmin(twitterId?: string) {
  const { program, instructions, handleTransaction } = useHelm();
  const { publicKey: currentUserPublicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Add a new admin
   */
  const addAdmin = useCallback(
    async (newAdmin: PublicKey) => {
      if (!instructions || !currentUserPublicKey || !twitterId) {
        throw new Error("Missing required parameters");
      }

      setLoading(true);
      setError(null);

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
            setError(new Error(error.message));
          },
        });

        // Return the updated admin list
        const [adminListPda] = findAdminListPDA(twitterId);
        return await program?.account.adminList.fetch(adminListPda);
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
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

      setLoading(true);
      setError(null);

      try {
        const tx = await program?.methods
          .removeAdmin(adminToRemove)
          .accountsPartial({
            owner: currentUserPublicKey,
          })
          .rpc();

        await handleTransaction(Promise.resolve(tx!), {
          onSuccess: () => console.log("Admin removed successfully"),
          onError: (error) => {
            console.error("Failed to remove admin:", error);
            setError(new Error(error.message));
          },
        });

        // Return the updated admin list
        const [adminListPda] = findAdminListPDA(twitterId);
        return await program?.account.adminList.fetch(adminListPda);
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
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
    loading,
    error,
  };
}
