// File: src/contexts/content/mod.rs

use anchor_lang::prelude::*;
use crate::constants::{ ADMIN_LIST_SEED, TWITTER_ACCOUNT_SEED, CONTENT_SEED, BASE_CONTENT_SIZE };
use crate::state::{ Content, TwitterAccount, AdminList };
use crate::errors::HelmError;
use crate::enums::ContentType;

// Base context that others will derive from
pub trait ContentValidator {
    fn validate_authority(&self) -> Result<()>;
    fn validate_content_status(&self) -> Result<()>;
    fn validate_admin_authority(&self) -> Result<()>;
    fn validate_content_uniqueness(&self) -> Result<()>;
}

#[derive(Accounts)]
#[instruction(content_type: ContentType, content_hash: [u8; 32])]
pub struct SubmitContentAction<'info> {
    #[account(
        init,
        payer = authority,
        space = BASE_CONTENT_SIZE,
        seeds = [
            CONTENT_SEED,
            twitter_account.key().as_ref(),
            authority.key().as_ref(),
            content_hash.as_ref(),
        ],
        bump
    )]
    pub content: Account<'info, Content>,

    #[account(
        seeds = [
            TWITTER_ACCOUNT_SEED,
            twitter_account.twitter_id.as_bytes(),
        ],
        bump = twitter_account.bump,
        constraint = twitter_account.is_verified @ HelmError::TwitterAccountNotVerified
    )]
    pub twitter_account: Account<'info, TwitterAccount>,

    #[account(
        seeds = [ADMIN_LIST_SEED, twitter_account.twitter_id.as_bytes()],
        bump = admin_list.bump,
        constraint = admin_list.admins.contains(&authority.key()) @ HelmError::Unauthorized
    )]
    pub admin_list: Account<'info, AdminList>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ContentAction<'info> {
    #[account(
        mut,
        seeds = [
            CONTENT_SEED,
            content.twitter_account.as_ref(),
            content.author.as_ref(), 
            content.content_hash.as_ref()
        ],
        bump = content.bump,
        constraint = !content.is_terminal() @ HelmError::ContentInTerminalState
    )]
    pub content: Account<'info, Content>,

    #[account(
        seeds = [
            TWITTER_ACCOUNT_SEED,
            twitter_account.twitter_id.as_bytes(),
        ],
        bump = twitter_account.bump,
        constraint = content.twitter_account == twitter_account.key() @ HelmError::InvalidTwitterAccount,
        constraint = twitter_account.is_verified @ HelmError::TwitterAccountNotVerified
    )]
    pub twitter_account: Account<'info, TwitterAccount>,

    #[account(
        seeds = [ADMIN_LIST_SEED, twitter_account.twitter_id.as_bytes()],
        bump = admin_list.bump,
        constraint = admin_list.admins.contains(&authority.key()) @ HelmError::Unauthorized
    )]
    pub admin_list: Account<'info, AdminList>,

    pub authority: Signer<'info>,
}

impl<'info> ContentValidator for ContentAction<'info> {
    fn validate_content_uniqueness(&self) -> Result<()> {
        // Additional uniqueness checks if needed
        Ok(())
    }
    fn validate_authority(&self) -> Result<()> {
        require!(self.admin_list.admins.contains(&self.authority.key()), HelmError::Unauthorized);
        Ok(())
    }

    fn validate_content_status(&self) -> Result<()> {
        require!(!self.content.is_terminal(), HelmError::ContentInTerminalState);
        Ok(())
    }

    fn validate_admin_authority(&self) -> Result<()> {
        require!(self.twitter_account.is_verified, HelmError::TwitterAccountNotVerified);
        Ok(())
    }
}
