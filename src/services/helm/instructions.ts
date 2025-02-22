// File: src//services/helm/instructions.ts

import { BN, Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  findTwitterAccountPDA,
  findAdminListPDA,
  findCreatorListPDA,
  findContentPDA,
  createContentHash,
} from "./accounts";
import { ContentType } from "./types";
import { Helm } from "./program";

export class HelmInstructions {
  constructor(private program: Program<Helm>) {}

  /**
   * Twitter Management
   */

  /**
   * Register a new Twitter account
   */
  registerTwitterAccount(
    twitterId: string,
    twitterHandle: string,
    owner: PublicKey
  ) {
    const [twitterAccountPda] = findTwitterAccountPDA(twitterId);
    const [adminListPda] = findAdminListPDA(twitterId);
    const [creatorListPda] = findCreatorListPDA(twitterId);

    return this.program.methods
      .registerTwitterAccount(twitterId, twitterHandle)
      .accountsPartial({
        twitterAccount: twitterAccountPda,
        adminList: adminListPda,
        creatorList: creatorListPda,
        owner,
        systemProgram: SystemProgram.programId,
      });
  }

  /**
   * Verify a Twitter account
   */
  verifyTwitterAccount(twitterId: string, owner: PublicKey) {
    const [twitterAccountPda] = findTwitterAccountPDA(twitterId);

    return this.program.methods.verifyTwitterAccount().accountsPartial({
      twitterAccount: twitterAccountPda,
      owner,
    });
  }

  /**
   * Admin Instructions
   */

  /**
   * Add an admin to a Twitter account
   */
  addAdmin(twitterId: string, newAdmin: PublicKey, owner: PublicKey) {
    const [twitterAccountPda] = findTwitterAccountPDA(twitterId);
    const [adminListPda] = findAdminListPDA(twitterId);

    return this.program.methods.addAdmin(newAdmin).accountsPartial({
      adminList: adminListPda,
      twitterAccount: twitterAccountPda,
      owner,
    });
  }

  removeAdmin(twitterId: string, adminToRemove: PublicKey, owner: PublicKey) {
    //
    const [twitterAccountPda] = findTwitterAccountPDA(twitterId);
    const [adminListPda] = findAdminListPDA(twitterId);
    return this.program?.methods.removeAdmin(adminToRemove).accountsPartial({
      adminList: adminListPda,
      twitterAccount: twitterAccountPda,
      owner,
    });
  }

  /**
   * Creator Instructions
   */

  /**
   * Creator
   */
  addCreator(twitterId: string, creator: PublicKey) {
    const [twitterAccountPda] = findTwitterAccountPDA(twitterId);
    const [adminListPda] = findAdminListPDA(twitterId);
    const [creatorListPda] = findCreatorListPDA(twitterId);

    return this.program.methods.addCreator(creator).accountsPartial({
      creatorList: creatorListPda,
      twitterAccount: twitterAccountPda,
      owner: adminListPda,
    });
  }

  removeCreator(twitterId: string, creator: PublicKey) {
    const [twitterAccountPda] = findTwitterAccountPDA(twitterId);
    const [adminListPda] = findAdminListPDA(twitterId);
    const [creatorListPda] = findCreatorListPDA(twitterId);

    return this.program.methods.removeCreator(creator).accountsPartial({
      creatorList: creatorListPda,
      twitterAccount: twitterAccountPda,
      owner: adminListPda,
    });
  }

  /**
   * Content Instructions
   */

  /**
   * Submit content for approval
   */
  submitForApproval(
    twitterId: string,
    content: string,
    contentType: ContentType,
    author: PublicKey,
    scheduledFor?: number
  ) {
    const [twitterAccountPda] = findTwitterAccountPDA(twitterId);
    const [adminListPda] = findAdminListPDA(twitterId);
    const contentHash = createContentHash(content);
    const [contentPda] = findContentPDA(twitterAccountPda, author, contentHash);

    return this.program.methods
      .submitForApproval(
        contentType,
        Array.from(contentHash),
        scheduledFor ? new BN(scheduledFor) : null
      )
      .accountsPartial({
        content: contentPda,
        twitterAccount: twitterAccountPda,
        adminList: adminListPda,
        authority: author,
        systemProgram: SystemProgram.programId,
      });
  }

  /**
   * Approve content
   */
  approveContent(
    twitterId: string,
    content: string,
    author: PublicKey,
    authority: PublicKey
  ) {
    const [twitterAccountPda] = findTwitterAccountPDA(twitterId);
    const [adminListPda] = findAdminListPDA(twitterId);
    const contentHash = createContentHash(content);
    const [contentPda] = findContentPDA(twitterAccountPda, author, contentHash);

    return this.program.methods.approveContent().accountsPartial({
      content: contentPda,
      twitterAccount: twitterAccountPda,
      adminList: adminListPda,
      authority,
    });
  }

  /**
   * Reject content
   */
  rejectContent(
    twitterId: string,
    content: string,
    author: PublicKey,
    authority: PublicKey,
    reason: string
  ) {
    const [twitterAccountPda] = findTwitterAccountPDA(twitterId);
    const [adminListPda] = findAdminListPDA(twitterId);
    const contentHash = createContentHash(content);
    const [contentPda] = findContentPDA(twitterAccountPda, author, contentHash);

    return this.program.methods.rejectContent(reason).accountsPartial({
      content: contentPda,
      twitterAccount: twitterAccountPda,
      adminList: adminListPda,
      authority,
    });
  }

  /**
   * Cancel content
   */
  cancelContent(
    twitterId: string,
    content: string,
    author: PublicKey,
    authority: PublicKey
  ) {
    const [twitterAccountPda] = findTwitterAccountPDA(twitterId);
    const [adminListPda] = findAdminListPDA(twitterId);
    const contentHash = createContentHash(content);
    const [contentPda] = findContentPDA(twitterAccountPda, author, contentHash);

    return this.program.methods.cancelContent().accountsPartial({
      content: contentPda,
      twitterAccount: twitterAccountPda,
      adminList: adminListPda,
      authority,
    });
  }
}
