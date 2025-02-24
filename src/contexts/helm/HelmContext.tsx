// File: src/contexts/helm/HelmContext.tsx
"use client";
import { HelmInstructions } from "@/services/helm";
import { getHelmProgramWithWallet } from "@/services/helm/program";
import { Program } from "@coral-xyz/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Helm } from "anchor/target/types/helm";
import { createContext, ReactNode, useContext, useMemo } from "react";

interface HelmContextState {
  program: Program<Helm> | null;
  instructions: HelmInstructions | null;
  connected: boolean;
  loading: boolean;
  error: Error | null;
}

const HelmContext = createContext<HelmContextState>({
  program: null,
  instructions: null,
  connected: false,
  loading: true,
  error: null,
});

export function HelmProvider({ children }: { children: ReactNode }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const connected = wallet.connected;

  const program = useMemo(() => {
    try {
      return getHelmProgramWithWallet(connection, wallet);
    } catch (error) {
      console.error("Error initializing Helm program:", error);
      return null;
    }
  }, [connection, wallet, connected]);

  const instructions = useMemo(() => {
    if (!program) return null;
    return new HelmInstructions(program);
  }, [program]);

  const value = {
    program,
    instructions,
    connected,
    loading: false,
    error: null,
  };

  return <HelmContext.Provider value={value}>{children}</HelmContext.Provider>;
}

export function useHelmContext() {
  const context = useContext(HelmContext);
  if (context === undefined) {
    throw new Error("useHelmContext must be used within a HelmProvider");
  }
  return context;
}
