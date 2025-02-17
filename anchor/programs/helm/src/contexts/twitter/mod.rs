// File: src/contexts/twitter/mod.rs
use anchor_lang::prelude::*;
use crate::{
    constants::{
        ADMIN_LIST_SEED,
        CREATOR_LIST_SEED,
        TWITTER_ACCOUNT_SEED,
        TWITTER_ACCOUNT_SIZE,
        ADMIN_LIST_SIZE,
        CREATOR_LIST_SIZE,
    },
    errors::HelmError,
    state::{ AdminList, CreatorList, TwitterAccount },
};

pub trait TwitterAccountValidator {
    fn validate_handle_format(&self, handle: &str) -> Result<()>;
    fn validate_id_format(&self, id: &str) -> Result<()>;
}

#[derive(Accounts)]
#[instruction(twitter_id: String, twitter_handle: String)]
pub struct RegisterTwitterAccount<'info> {
    #[account(
        init,
        payer = owner,
        space = TWITTER_ACCOUNT_SIZE,
        seeds = [TWITTER_ACCOUNT_SEED, twitter_id.as_bytes()],
        bump
    )]
    pub twitter_account: Account<'info, TwitterAccount>,

    #[account(
        init,
        payer = owner,
        space = ADMIN_LIST_SIZE,
        seeds = [ADMIN_LIST_SEED, twitter_id.as_bytes()],
        bump
    )]
    pub admin_list: Account<'info, AdminList>,

    #[account(
        init,
        payer = owner,
        space = CREATOR_LIST_SIZE,
        seeds = [CREATOR_LIST_SEED, twitter_id.as_bytes()],
        bump
    )]
    pub creator_list: Account<'info, CreatorList>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> TwitterAccountValidator for RegisterTwitterAccount<'info> {
    fn validate_handle_format(&self, handle: &str) -> Result<()> {
        require!(
            handle.len() <= 15 && handle.chars().all(|c| (c.is_alphanumeric() || c == '_')),
            HelmError::InvalidTwitterHandle
        );
        Ok(())
    }

    fn validate_id_format(&self, id: &str) -> Result<()> {
        require!(id.chars().all(char::is_numeric), HelmError::InvalidTwitterId);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct VerifyTwitterAccount<'info> {
    #[account(
        mut,
        seeds = [TWITTER_ACCOUNT_SEED, twitter_account.twitter_id.as_bytes()],
        bump = twitter_account.bump,
        constraint = twitter_account.owner == owner.key() @ HelmError::Unauthorized
    )]
    pub twitter_account: Account<'info, TwitterAccount>,

    #[account(constraint = owner.key() == twitter_account.owner @ HelmError::Unauthorized)]
    pub owner: Signer<'info>,
}
