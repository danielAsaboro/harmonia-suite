// File: tests/helm.ts

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Helm } from "../target/types/helm";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { describe, it, expect, jest } from "@jest/globals";
// import { expect } from "jest";

// Helper function to generate unique twitter IDs
const generateUniqueTwitterId = () => {
  return Math.floor(Math.random() * 1000000000).toString();
};

const findCreatorListPDA = (twitterId: string, programId: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("creator-list"), Buffer.from(twitterId)],
    programId
  );
};

describe("helm", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Helm as Program<Helm>;

  it("Can register a twitter account", async () => {
    // Test data
    const twitterId = "123456789";
    const twitterHandle = "test_handle";

    // Derive PDA for twitter account
    const [twitterAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("twitter-account"), Buffer.from(twitterId)],
      program.programId
    );

    // Derive PDA for admin list
    const [adminListPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("admin-list"), Buffer.from(twitterId)],
      program.programId
    );
    const [creatorListPda] = findCreatorListPDA(twitterId, program.programId);

    // Register the twitter account
    const tx = await program.methods
      .registerTwitterAccount(twitterId, twitterHandle)
      .accountsPartial({
        twitterAccount: twitterAccountPda,
        adminList: adminListPda,
        creatorList: creatorListPda,
        owner: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Fetch the created account
    const twitterAccount = await program.account.twitterAccount.fetch(
      twitterAccountPda
    );

    // Verify the account data
    expect(twitterAccount.owner.toString()).toBe(
      provider.wallet.publicKey.toString()
    );
    expect(twitterAccount.twitterId).toBe(twitterId);
    expect(twitterAccount.twitterHandle).toBe(twitterHandle);
    expect(twitterAccount.isVerified).toBe(false);
    expect(twitterAccount.requiredApprovals).toBe(3); // Default value

    // Fetch and verify admin list
    const adminList = await program.account.adminList.fetch(adminListPda);
    expect(adminList.admins).toHaveLength(1);
    expect(adminList.admins[0].toString()).toBe(
      provider.wallet.publicKey.toString()
    );
    expect(adminList.authority.toString()).toBe(
      provider.wallet.publicKey.toString()
    );
    // try {
    //   // Register the twitter account
    //   const tx = await program.methods
    //     .registerTwitterAccount(twitterId, twitterHandle)
    //     .accountsPartial({
    //       twitterAccount: twitterAccountPda,
    //       adminList: adminListPda,
    //       creatorList: creatorListPda,
    //       owner: provider.wallet.publicKey,
    //       systemProgram: SystemProgram.programId,
    //     })
    //     .rpc();

    //   // Fetch the created account
    //   const twitterAccount = await program.account.twitterAccount.fetch(
    //     twitterAccountPda
    //   );

    //   // Verify the account data
    //   expect(twitterAccount.owner.toString()).toBe(
    //     provider.wallet.publicKey.toString()
    //   );
    //   expect(twitterAccount.twitterId).toBe(twitterId);
    //   expect(twitterAccount.twitterHandle).toBe(twitterHandle);
    //   expect(twitterAccount.isVerified).toBe(false);
    //   expect(twitterAccount.requiredApprovals).toBe(3); // Default value

    //   // Fetch and verify admin list
    //   const adminList = await program.account.adminList.fetch(adminListPda);
    //   expect(adminList.admins).toHaveLength(1);
    //   expect(adminList.admins[0].toString()).toBe(
    //     provider.wallet.publicKey.toString()
    //   );
    //   expect(adminList.authority.toString()).toBe(
    //     provider.wallet.publicKey.toString()
    //   );
    // } catch (error) {
    //   console.error("Error:", error);
    //   throw error;
    // }
  });

  it("Fails with invalid twitter handle", async () => {
    const twitterId = "987654321";
    const invalidHandle = "invalid@@handle"; // Invalid handle with special characters

    const [twitterAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("twitter-account"), Buffer.from(twitterId)],
      program.programId
    );

    const [adminListPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("admin-list"), Buffer.from(twitterId)],
      program.programId
    );
    const [creatorListPda] = findCreatorListPDA(twitterId, program.programId);

    await expect(
      program.methods
        .registerTwitterAccount(twitterId, invalidHandle)
        .accountsPartial({
          twitterAccount: twitterAccountPda,
          adminList: adminListPda,
          creatorList: creatorListPda,
          owner: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()
    ).rejects.toThrow("Invalid Twitter handle format");
  });

  it("Can add an admin", async () => {
    // Use unique twitter ID
    const twitterId = generateUniqueTwitterId();
    const twitterHandle = "test_handle";
    const newAdmin = Keypair.generate();

    const [twitterAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("twitter-account"), Buffer.from(twitterId)],
      program.programId
    );

    const [adminListPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("admin-list"), Buffer.from(twitterId)],
      program.programId
    );

    const [creatorListPda] = findCreatorListPDA(twitterId, program.programId);

    // Register the twitter account
    await program.methods
      .registerTwitterAccount(twitterId, twitterHandle)
      .accountsPartial({
        twitterAccount: twitterAccountPda,
        adminList: adminListPda,
        creatorList: creatorListPda,
        owner: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Verify the twitter account
    await program.methods
      .verifyTwitterAccount()
      .accountsPartial({
        twitterAccount: twitterAccountPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    // Now add the new admin
    await program.methods
      .addAdmin(newAdmin.publicKey)
      .accountsPartial({
        adminList: adminListPda,
        twitterAccount: twitterAccountPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    // Verify the admin was added
    const adminList = await program.account.adminList.fetch(adminListPda);
    expect(adminList.admins).toHaveLength(2);
    expect(adminList.admins[1].toString()).toBe(newAdmin.publicKey.toString());
  });

  it("Can remove an admin and prevents removing last admin", async () => {
    // Use unique twitter ID
    const twitterId = generateUniqueTwitterId();
    const twitterHandle = "test_handle";
    const newAdmin = Keypair.generate();

    const [twitterAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("twitter-account"), Buffer.from(twitterId)],
      program.programId
    );

    const [adminListPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("admin-list"), Buffer.from(twitterId)],
      program.programId
    );

    const [creatorListPda] = findCreatorListPDA(twitterId, program.programId);

    // Register account and verify
    await program.methods
      .registerTwitterAccount(twitterId, twitterHandle)
      .accountsPartial({
        twitterAccount: twitterAccountPda,
        adminList: adminListPda,
        creatorList: creatorListPda,
        owner: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    await program.methods
      .verifyTwitterAccount()
      .accountsPartial({
        twitterAccount: twitterAccountPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    // Add new admin
    await program.methods
      .addAdmin(newAdmin.publicKey)
      .accountsPartial({
        adminList: adminListPda,
        twitterAccount: twitterAccountPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    // Remove the new admin
    await program.methods
      .removeAdmin(newAdmin.publicKey)
      .accountsPartial({
        adminList: adminListPda,
        twitterAccount: twitterAccountPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    // Verify admin was removed
    const adminList = await program.account.adminList.fetch(adminListPda);
    expect(adminList.admins).toHaveLength(1);

    // Try to remove the last admin
    await expect(
      program.methods
        .removeAdmin(provider.wallet.publicKey)
        .accountsPartial({
          adminList: adminListPda,
          twitterAccount: twitterAccountPda,
          owner: provider.wallet.publicKey,
        })
        .rpc()
    ).rejects.toThrow("Cannot remove last admin");
  });

  it("Cannot add admin to unverified account", async () => {
    const twitterId = generateUniqueTwitterId();
    const twitterHandle = "unique_handle";
    const newAdmin = Keypair.generate();

    const [twitterAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("twitter-account"), Buffer.from(twitterId)],
      program.programId
    );

    const [adminListPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("admin-list"), Buffer.from(twitterId)],
      program.programId
    );
    const [creatorListPda] = findCreatorListPDA(twitterId, program.programId);

    // Register account
    await program.methods
      .registerTwitterAccount(twitterId, twitterHandle)
      .accountsPartial({
        twitterAccount: twitterAccountPda,
        adminList: adminListPda,
        creatorList: creatorListPda,
        owner: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Try to add admin to unverified account
    await expect(
      program.methods
        .addAdmin(newAdmin.publicKey)
        .accountsPartial({
          adminList: adminListPda,
          twitterAccount: twitterAccountPda,
          owner: provider.wallet.publicKey,
        })
        .rpc()
    ).rejects.toThrow("Twitter account not verified");
  });

  it("Can add a creator", async () => {
    const twitterId = generateUniqueTwitterId();
    const twitterHandle = "test_handle";
    const newCreator = Keypair.generate();

    const [twitterAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("twitter-account"), Buffer.from(twitterId)],
      program.programId
    );

    const [adminListPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("admin-list"), Buffer.from(twitterId)],
      program.programId
    );

    const [creatorListPda] = findCreatorListPDA(twitterId, program.programId);

    // Register and initialize all accounts
    await program.methods
      .registerTwitterAccount(twitterId, twitterHandle)
      .accountsPartial({
        twitterAccount: twitterAccountPda,
        adminList: adminListPda,
        creatorList: creatorListPda,
        owner: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Verify the account
    await program.methods
      .verifyTwitterAccount()
      .accountsPartial({
        twitterAccount: twitterAccountPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    // Add the creator
    await program.methods
      .addCreator(newCreator.publicKey)
      .accountsPartial({
        creatorList: creatorListPda,
        twitterAccount: twitterAccountPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    // Verify creator was added
    const creatorList = await program.account.creatorList.fetch(creatorListPda);
    expect(creatorList.creators.map((p) => p.toString())).toContain(
      newCreator.publicKey.toString()
    );
  });

  it("Can remove a creator", async () => {
    const twitterId = generateUniqueTwitterId();
    const twitterHandle = "test_handle";
    const creator = Keypair.generate();

    const [twitterAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("twitter-account"), Buffer.from(twitterId)],
      program.programId
    );

    const [adminListPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("admin-list"), Buffer.from(twitterId)],
      program.programId
    );

    const [creatorListPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("creator-list"), Buffer.from(twitterId)],
      program.programId
    );

    // Register and verify account
    await program.methods
      .registerTwitterAccount(twitterId, twitterHandle)
      .accountsPartial({
        twitterAccount: twitterAccountPda,
        adminList: adminListPda,
        creatorList: creatorListPda,
        owner: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    await program.methods
      .verifyTwitterAccount()
      .accountsPartial({
        twitterAccount: twitterAccountPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    // Add creator
    await program.methods
      .addCreator(creator.publicKey)
      .accountsPartial({
        creatorList: creatorListPda,
        twitterAccount: twitterAccountPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    // Remove creator
    await program.methods
      .removeCreator(creator.publicKey)
      .accountsPartial({
        creatorList: creatorListPda,
        twitterAccount: twitterAccountPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    // Verify creator was removed
    const creatorList = await program.account.creatorList.fetch(creatorListPda);
    expect(creatorList.creators).not.toContain(creator.publicKey);
  });

  it("Cannot add duplicate creator", async () => {
    const twitterId = generateUniqueTwitterId();
    const twitterHandle = "test_handle";
    const creator = Keypair.generate();

    const [twitterAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("twitter-account"), Buffer.from(twitterId)],
      program.programId
    );

    const [adminListPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("admin-list"), Buffer.from(twitterId)],
      program.programId
    );

    const [creatorListPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("creator-list"), Buffer.from(twitterId)],
      program.programId
    );

    // Setup account
    await program.methods
      .registerTwitterAccount(twitterId, twitterHandle)
      .accountsPartial({
        twitterAccount: twitterAccountPda,
        adminList: adminListPda,
        creatorList: creatorListPda,
        owner: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    await program.methods
      .verifyTwitterAccount()
      .accountsPartial({
        twitterAccount: twitterAccountPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    // Add creator first time
    await program.methods
      .addCreator(creator.publicKey)
      .accountsPartial({
        creatorList: creatorListPda,
        twitterAccount: twitterAccountPda,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    // Try to add same creator again
    await expect(
      program.methods
        .addCreator(creator.publicKey)
        .accountsPartial({
          creatorList: creatorListPda,
          twitterAccount: twitterAccountPda,
          owner: provider.wallet.publicKey,
        })
        .rpc()
    ).rejects.toThrow("Creator already exists");
  });
});

// Helper function to create and verify twitter account for content tests
export const setupVerifiedAccount = async (
  program: Program<Helm>,
  provider: anchor.AnchorProvider
) => {
  const twitterId = generateUniqueTwitterId();
  const twitterHandle = "test_handle";

  const [twitterAccountPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("twitter-account"), Buffer.from(twitterId)],
    program.programId
  );

  const [adminListPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("admin-list"), Buffer.from(twitterId)],
    program.programId
  );

  const [creatorListPda] = findCreatorListPDA(twitterId, program.programId);

  await program.methods
    .registerTwitterAccount(twitterId, twitterHandle)
    .accountsPartial({
      twitterAccount: twitterAccountPda,
      adminList: adminListPda,
      creatorList: creatorListPda,
      owner: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  await program.methods
    .verifyTwitterAccount()
    .accountsPartial({
      twitterAccount: twitterAccountPda,
      owner: provider.wallet.publicKey,
    })
    .rpc();

  return { twitterAccountPda, adminListPda };
};
