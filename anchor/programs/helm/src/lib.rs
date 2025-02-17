// File: src/lib.rs

use anchor_lang::prelude::*;
use crate::contexts::*;
use crate::enums::ContentType;

pub mod state;
pub mod contexts;
pub mod instructions;
pub mod errors;
pub mod constants;
pub mod enums;

declare_id!("D9nBEe6FjDwub19rBUPUsThMqgBYF4aGCNaYBVcGr2zf");

#[program]
pub mod helm {
    use super::*;

    // Keep existing functions...
    pub fn register_twitter_account(
        ctx: Context<RegisterTwitterAccount>,
        twitter_id: String,
        twitter_handle: String
    ) -> Result<()> {
        instructions::twitter::register(ctx, twitter_id, twitter_handle)
    }

    pub fn add_admin(ctx: Context<ManageAdmin>, admin: Pubkey) -> Result<()> {
        instructions::admin::add(ctx, admin)
    }

    pub fn remove_admin(ctx: Context<ManageAdmin>, admin: Pubkey) -> Result<()> {
        instructions::admin::remove(ctx, admin)
    }

    pub fn verify_twitter_account(ctx: Context<VerifyTwitterAccount>) -> Result<()> {
        let twitter_account = &mut ctx.accounts.twitter_account;
        twitter_account.is_verified = true;
        Ok(())
    }

    pub fn add_creator(ctx: Context<ManageCreator>, creator: Pubkey) -> Result<()> {
        instructions::creator::add(ctx, creator)
    }

    pub fn remove_creator(ctx: Context<ManageCreator>, creator: Pubkey) -> Result<()> {
        instructions::creator::remove(ctx, creator)
    }

    // Update content workflow instructions
    pub fn submit_for_approval(
        ctx: Context<SubmitContentAction>,
        content_type: ContentType,
        content_hash: [u8; 32],
        scheduled_for: Option<i64>
    ) -> Result<()> {
        let content = &mut ctx.accounts.content;

        // Initialize content with provided parameters
        content.initialize(
            ctx.accounts.twitter_account.key(),
            ctx.accounts.authority.key(),
            content_type,
            content_hash,
            scheduled_for,
            ctx.bumps.content,
            Clock::get()?.unix_timestamp
        );

        instructions::content::submit_for_approval(ctx)
    }

    pub fn approve_content(ctx: Context<ContentAction>) -> Result<()> {
        instructions::content::approve_content(ctx)
    }

    pub fn reject_content(ctx: Context<ContentAction>, reason: String) -> Result<()> {
        instructions::content::reject_content(ctx, reason)
    }

    pub fn cancel_content(ctx: Context<ContentAction>) -> Result<()> {
        instructions::content::cancel_content(ctx)
    }
}
