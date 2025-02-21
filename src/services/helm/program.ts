// File: src//services/helm/program.ts

import { AnchorProvider, Program } from "@coral-xyz/anchor";
import HelmIDL from "../../../anchor/target/idl/helm.json";
import type { Helm } from "../../../anchor/target/types/helm";
import { PublicKey, Connection } from "@solana/web3.js";

// Re-export the generated IDL and type
export { Helm, HelmIDL };

// The programId is imported from the program IDL.
export const HELM_PROGRAM_ID = new PublicKey(HelmIDL.address);

/**
 * Gets the Helm program instance
 * @param provider - AnchorProvider instance
 * @returns Program<Helm>
 */
export function getHelmProgram(provider: AnchorProvider): Program<Helm> {
  return new Program(HelmIDL as any, provider);
}

/**
 * Creates an AnchorProvider instance
 * @param connection - Solana connection
 * @param wallet - Wallet adapter
 * @returns AnchorProvider
 */
export function createProvider(
  connection: Connection,
  wallet: any
): AnchorProvider {
  return new AnchorProvider(
    connection,
    wallet,
    AnchorProvider.defaultOptions()
  );
}

/**
 * Helper to get program with connection and wallet
 * @param connection - Solana connection
 * @param wallet - Wallet adapter
 * @returns Program<Helm>
 */
export function getHelmProgramWithWallet(
  connection: Connection,
  wallet: any
): Program<Helm> {
  const provider = createProvider(connection, wallet);
  return getHelmProgram(provider);
}
