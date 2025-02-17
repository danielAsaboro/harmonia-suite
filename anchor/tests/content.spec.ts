// File: tests/content.ts

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Helm } from "../target/types/helm";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
// import { expect } from "chai";
import { setupVerifiedAccount } from "./helm.spec";
import { keccak_256 } from "js-sha3";
import { describe, it, expect, jest } from "@jest/globals";

const findContentPDA = (
  twitterAccount: PublicKey,
  author: PublicKey,
  contentHash: Buffer,
  programId: PublicKey
) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("content"),
      twitterAccount.toBuffer(),
      author.toBuffer(),
      contentHash,
    ],
    programId
  );
};

const createContentHash = (content: string): Buffer => {
  return Buffer.from(keccak_256(content), "hex");
};

describe("content workflow", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Helm as Program<Helm>;

  // File: tests/content.ts

  it("Can submit content for approval", async () => {
    const { twitterAccountPda, adminListPda } = await setupVerifiedAccount(
      program,
      provider
    );
    const contentHash = createContentHash("Test tweet content");

    const [contentPda] = findContentPDA(
      twitterAccountPda,
      provider.wallet.publicKey,
      contentHash,
      program.programId
    );

    await program.methods
      .submitForApproval(
        { tweet: {} }, // ContentType::Tweet
        Array.from(contentHash),
        null // no schedule time
      )
      .accountsPartial({
        content: contentPda,
        twitterAccount: twitterAccountPda,
        adminList: adminListPda,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    const contentAccount = await program.account.content.fetch(contentPda);

    // Fix: Instead of comparing objects directly, let's check the discriminant
    // Check all initialized fields
    expect(contentAccount.twitterAccount.toString()).toBe(
      twitterAccountPda.toString()
    );
    expect(contentAccount.author.toString()).toBe(
      provider.wallet.publicKey.toString()
    );
    expect(Object.keys(contentAccount.status)[0]).toBe("pendingApproval");
    expect(contentAccount.approvals).toHaveLength(1);
    expect(contentAccount.approvals[0].toString()).toBe(
      provider.wallet.publicKey.toString()
    );
    expect(contentAccount.contentHash).toEqual(Array.from(contentHash));
    expect(contentAccount.scheduledFor).toBeNull();
    expect(contentAccount.rejectionReason).toBeNull();
    expect(contentAccount.failureReason).toBeNull();
  });

  // File: tests/content.ts

  it("Can approve content", async () => {
    const { twitterAccountPda, adminListPda } = await setupVerifiedAccount(
      program,
      provider
    );

    // Create two new admins to reach required threshold of 3
    const newAdmin1 = Keypair.generate();
    const newAdmin2 = Keypair.generate();

    // Fund both new admin accounts
    for (const admin of [newAdmin1, newAdmin2]) {
      const signature = await provider.connection.requestAirdrop(
        admin.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(signature);
    }

    const contentHash = createContentHash("Test tweet content");

    // Add both new admins
    for (const admin of [newAdmin1, newAdmin2]) {
      await program.methods
        .addAdmin(admin.publicKey)
        .accountsPartial({
          adminList: adminListPda,
          twitterAccount: twitterAccountPda,
          owner: provider.wallet.publicKey,
        })
        .rpc();
    }

    const [contentPda] = findContentPDA(
      twitterAccountPda,
      provider.wallet.publicKey,
      contentHash,
      program.programId
    );

    // Submit content first (this gives us first approval)
    await program.methods
      .submitForApproval({ tweet: {} }, Array.from(contentHash), null)
      .accountsPartial({
        content: contentPda,
        twitterAccount: twitterAccountPda,
        adminList: adminListPda,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    // Second admin approves
    const approve1Ix = await program.methods
      .approveContent()
      .accountsPartial({
        content: contentPda,
        twitterAccount: twitterAccountPda,
        adminList: adminListPda,
        authority: newAdmin1.publicKey,
      })
      .instruction();

    let tx = new anchor.web3.Transaction().add(approve1Ix);
    let latestBlockhash = await provider.connection.getLatestBlockhash();
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.feePayer = newAdmin1.publicKey;
    tx.sign(newAdmin1);
    let txId = await provider.connection.sendRawTransaction(tx.serialize());
    await provider.connection.confirmTransaction(txId);

    // Third admin approves
    const approve2Ix = await program.methods
      .approveContent()
      .accountsPartial({
        content: contentPda,
        twitterAccount: twitterAccountPda,
        adminList: adminListPda,
        authority: newAdmin2.publicKey,
      })
      .instruction();

    tx = new anchor.web3.Transaction().add(approve2Ix);
    latestBlockhash = await provider.connection.getLatestBlockhash();
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.feePayer = newAdmin2.publicKey;
    tx.sign(newAdmin2);
    txId = await provider.connection.sendRawTransaction(tx.serialize());
    await provider.connection.confirmTransaction(txId);

    const contentAccount = await program.account.content.fetch(contentPda);
    expect(Object.keys(contentAccount.status)[0]).toBe("approved");
    expect(contentAccount.approvals).toHaveLength(3);
  });

  it("Can reject content with reason", async () => {
    const { twitterAccountPda, adminListPda } = await setupVerifiedAccount(
      program,
      provider
    );
    const contentHash = createContentHash("Test tweet content");

    const [contentPda] = findContentPDA(
      twitterAccountPda,
      provider.wallet.publicKey,
      contentHash,
      program.programId
    );

    // Submit content first
    await program.methods
      .submitForApproval({ tweet: {} }, Array.from(contentHash), null)
      .accountsPartial({
        content: contentPda,
        twitterAccount: twitterAccountPda,
        adminList: adminListPda,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    // Reject the content
    const rejectionReason = "Content does not meet guidelines";
    await program.methods
      .rejectContent(rejectionReason)
      .accountsPartial({
        content: contentPda,
        twitterAccount: twitterAccountPda,
        adminList: adminListPda,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    const contentAccount = await program.account.content.fetch(contentPda);
    expect(Object.keys(contentAccount.status)[0]).toBe("rejected");
    expect(contentAccount.rejectionReason).toBe(rejectionReason);
  });

  it("Can cancel content", async () => {
    const { twitterAccountPda, adminListPda } = await setupVerifiedAccount(
      program,
      provider
    );
    const contentHash = createContentHash("Test tweet content");

    const [contentPda] = findContentPDA(
      twitterAccountPda,
      provider.wallet.publicKey,
      contentHash,
      program.programId
    );

    // Submit content first
    await program.methods
      .submitForApproval({ tweet: {} }, Array.from(contentHash), null)
      .accountsPartial({
        content: contentPda,
        twitterAccount: twitterAccountPda,
        adminList: adminListPda,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    // Cancel the content
    await program.methods
      .cancelContent()
      .accountsPartial({
        content: contentPda,
        twitterAccount: twitterAccountPda,
        adminList: adminListPda,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    const contentAccount = await program.account.content.fetch(contentPda);
    expect(Object.keys(contentAccount.status)[0]).toBe("canceled");
  });

  it("Validates scheduled content timing", async () => {
    const { twitterAccountPda, adminListPda } = await setupVerifiedAccount(
      program,
      provider
    );
    const contentHash = createContentHash("Test tweet content");

    const [contentPda] = findContentPDA(
      twitterAccountPda,
      provider.wallet.publicKey,
      contentHash,
      program.programId
    );

    // Try to schedule in the past (should fail)
    const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago

    await expect(
      program.methods
        .submitForApproval(
          { tweet: {} },
          Array.from(contentHash),
          new anchor.BN(pastTime)
        )
        .accountsPartial({
          content: contentPda,
          twitterAccount: twitterAccountPda,
          adminList: adminListPda,
          authority: provider.wallet.publicKey,
        })
        .rpc()
    ).rejects.toThrow("Schedule time in past");
  });

  it("Enforces valid state transitions", async () => {
    const { twitterAccountPda, adminListPda } = await setupVerifiedAccount(
      program,
      provider
    );
    const contentHash = createContentHash("Test tweet content");

    const [contentPda] = findContentPDA(
      twitterAccountPda,
      provider.wallet.publicKey,
      contentHash,
      program.programId
    );

    // Submit content
    await program.methods
      .submitForApproval({ tweet: {} }, Array.from(contentHash), null)
      .accountsPartial({
        content: contentPda,
        twitterAccount: twitterAccountPda,
        adminList: adminListPda,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    // Try to cancel first
    await program.methods
      .cancelContent()
      .accountsPartial({
        content: contentPda,
        twitterAccount: twitterAccountPda,
        adminList: adminListPda,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    // Try to approve canceled content (should fail)
    await expect(
      program.methods
        .approveContent()
        .accountsPartial({
          content: contentPda,
          twitterAccount: twitterAccountPda,
          adminList: adminListPda,
          authority: provider.wallet.publicKey,
        })
        .rpc()
    ).rejects.toThrow();
  });
});
