// File: src/contexts/creator/mod.rs
use anchor_lang::prelude::*;
use crate::{
    constants::{ CREATOR_LIST_SEED, TWITTER_ACCOUNT_SEED, MAX_CREATORS },
    errors::HelmError,
    state::{ CreatorList, TwitterAccount },
};

pub trait CreatorValidator {
    fn validate_creator_limit(&self) -> Result<()>;
    fn validate_creator_authority(&self) -> Result<()>;
    fn validate_creator_uniqueness(&self, creator: &Pubkey) -> Result<()>;
    fn validate_creator_exists(&self, creator: &Pubkey) -> Result<()>;
}

#[derive(Accounts)]
#[instruction(creator: Pubkey)]
pub struct ManageCreator<'info> {
    #[account(
        mut,
        seeds = [
            CREATOR_LIST_SEED,
            twitter_account.twitter_id.as_bytes()
        ],
        bump = creator_list.bump,
        constraint = creator_list.twitter_account == twitter_account.key() @ HelmError::InvalidTwitterAccount
    )]
    pub creator_list: Account<'info, CreatorList>,

    #[account(
        seeds = [
            TWITTER_ACCOUNT_SEED,
            twitter_account.twitter_id.as_bytes()
        ],
        bump = twitter_account.bump,
        constraint = twitter_account.owner == owner.key() @ HelmError::Unauthorized,
        constraint = twitter_account.is_verified @ HelmError::TwitterAccountNotVerified
    )]
    pub twitter_account: Account<'info, TwitterAccount>,

    #[account(
        constraint = owner.key() == twitter_account.owner @ HelmError::Unauthorized
    )]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> CreatorValidator for ManageCreator<'info> {
    fn validate_creator_limit(&self) -> Result<()> {
        require!(self.creator_list.creators.len() < MAX_CREATORS, HelmError::MaxCreatorsReached);
        Ok(())
    }

    fn validate_creator_authority(&self) -> Result<()> {
        require!(self.twitter_account.owner == self.owner.key(), HelmError::Unauthorized);
        Ok(())
    }

    fn validate_creator_uniqueness(&self, creator: &Pubkey) -> Result<()> {
        require!(!self.creator_list.creators.contains(creator), HelmError::CreatorAlreadyExists);
        Ok(())
    }

    fn validate_creator_exists(&self, creator: &Pubkey) -> Result<()> {
        require!(self.creator_list.creators.contains(creator), HelmError::CreatorDoesNotExist);
        Ok(())
    }
}

// Add helper for PDA validation
impl CreatorList {
    pub fn seeds(twitter_id: &[u8]) -> Vec<Vec<u8>> {
        vec![CREATOR_LIST_SEED.to_vec(), twitter_id.to_vec()]
    }
}
