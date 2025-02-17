// File: src/state/creator_list.rs
use anchor_lang::prelude::*;
use crate::{ constants::MAX_CREATORS, errors::HelmError };

#[account]
pub struct CreatorList {
    /// The Twitter account this creator list belongs to
    pub twitter_account: Pubkey,
    /// List of creator public keys that can create content
    pub creators: Vec<Pubkey>,
    /// Authority who can add/remove creators (usually twitter_account owner)
    pub authority: Pubkey,
    /// Bump for PDA derivation
    pub bump: u8,
}

impl CreatorList {
    pub fn add_creator(&mut self, creator: Pubkey) -> Result<()> {
        // Check if we've reached the maximum number of creators
        require!(self.creators.len() < MAX_CREATORS, HelmError::MaxCreatorsReached);

        // Check if creator already exists
        require!(!self.creators.contains(&creator), HelmError::CreatorAlreadyExists);

        self.creators.push(creator);
        Ok(())
    }

    pub fn remove_creator(&mut self, creator: &Pubkey) -> Result<()> {
        // Check if creator exists before removal
        require!(self.creators.contains(creator), HelmError::CreatorDoesNotExist);

        self.creators.retain(|&x| x != *creator);
        Ok(())
    }
}
