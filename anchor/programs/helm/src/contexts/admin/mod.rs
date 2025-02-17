// /src/contexts/admin/mod.rs

use anchor_lang::prelude::*;
use crate::{
    constants::{ ADMIN_LIST_SEED, TWITTER_ACCOUNT_SEED },
    errors::HelmError,
    state::{ AdminList, TwitterAccount },
};

pub trait AdminValidator {
    fn validate_admin_count(&self) -> Result<()>;
    fn validate_admin_authority(&self) -> Result<()>;
    fn validate_twitter_verified(&self) -> Result<()>;
}

#[derive(Accounts)]
#[instruction(admin: Pubkey)]
pub struct ManageAdmin<'info> {
    #[account(
        mut,
        seeds = [
            ADMIN_LIST_SEED,
            twitter_account.twitter_id.as_bytes()
        ],
        bump = admin_list.bump
    )]
    pub admin_list: Account<'info, AdminList>,

    #[account(
        seeds = [
            TWITTER_ACCOUNT_SEED,
            twitter_account.twitter_id.as_bytes(),
        ],
        bump = twitter_account.bump,
        constraint = twitter_account.owner == owner.key() @ HelmError::Unauthorized,
        constraint = twitter_account.is_verified @ HelmError::TwitterAccountNotVerified
    )]
    pub twitter_account: Account<'info, TwitterAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,
}

impl<'info> AdminValidator for ManageAdmin<'info> {
    fn validate_admin_count(&self) -> Result<()> {
        require!(self.admin_list.admins.len() > 1, HelmError::CannotRemoveLastAdmin);
        Ok(())
    }

    fn validate_admin_authority(&self) -> Result<()> {
        require!(self.twitter_account.owner == self.owner.key(), HelmError::Unauthorized);
        Ok(())
    }

    fn validate_twitter_verified(&self) -> Result<()> {
        require!(self.twitter_account.is_verified, HelmError::TwitterAccountNotVerified);
        Ok(())
    }
}
