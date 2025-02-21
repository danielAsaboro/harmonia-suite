// File: src//services/helm/accounts.ts

import { PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";
import { HELM_PROGRAM_ID } from "./program";

/**
 * Find Twitter Account PDA
 * @param twitterId - Twitter account ID
 * @returns [PublicKey, number] - PDA and bump
 */
export function findTwitterAccountPDA(twitterId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("twitter-account"), Buffer.from(twitterId)],
    HELM_PROGRAM_ID
  );
}

/**
 * Find Admin List PDA
 * @param twitterId - Twitter account ID
 * @returns [PublicKey, number] - PDA and bump
 */
export function findAdminListPDA(twitterId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("admin-list"), Buffer.from(twitterId)],
    HELM_PROGRAM_ID
  );
}

/**
 * Find Creator List PDA
 * @param twitterId - Twitter account ID
 * @returns [PublicKey, number] - PDA and bump
 */
export function findCreatorListPDA(twitterId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("creator-list"), Buffer.from(twitterId)],
    HELM_PROGRAM_ID
  );
}

/**
 * Find Content PDA
 * @param twitterAccount - Twitter account public key
 * @param author - Content author public key
 * @param contentHash - Content hash as Buffer
 * @returns [PublicKey, number] - PDA and bump
 */
export function findContentPDA(
  twitterAccount: PublicKey,
  author: PublicKey,
  contentHash: Buffer
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("content"),
      twitterAccount.toBuffer(),
      author.toBuffer(),
      contentHash,
    ],
    HELM_PROGRAM_ID
  );
}

/**
 * Create content hash from string
 * @param content - Content string
 * @returns Buffer - Content hash
 */
export function createContentHash(content: string): Buffer {
  const { keccak_256 } = require("js-sha3");
  return Buffer.from(keccak_256(content), "hex");
}
