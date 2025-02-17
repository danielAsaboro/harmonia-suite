// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import HelmIDL from "../target/idl/helm.json";
import type { Helm } from "../target/types/helm";

// Re-export the generated IDL and type
export { Helm, HelmIDL };

// The programId is imported from the program IDL.
export const HELM_PROGRAM_ID = new PublicKey(HelmIDL.address);

// This is a helper function to get the Helm Anchor program.
export function getHelmProgram(provider: AnchorProvider) {
  return new Program(HelmIDL as Helm, provider);
}
