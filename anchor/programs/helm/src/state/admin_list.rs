// File: src/state/admin_list.rs
use anchor_lang::prelude::*;
use crate::{ constants::MAX_ADMINS, errors::HelmError };

#[account]
pub struct AdminList {
    /// The Twitter account this admin list belongs to
    pub twitter_account: Pubkey,
    /// List of admin public keys that can approve content
    pub admins: Vec<Pubkey>,
    /// Authority who can add/remove admins (usually twitter_account owner)
    pub authority: Pubkey,
    /// Bump for PDA derivation
    pub bump: u8,
}

impl AdminList {
    pub fn initialize(
        &mut self,
        twitter_account: Pubkey,
        authority: Pubkey,
        bump: u8
    ) -> Result<()> {
        // Ensure we can accommodate at least one admin
        require!(MAX_ADMINS > 0, HelmError::MaxAdminsReached);

        // Initialize with pre-allocated capacity
        self.admins = Vec::with_capacity(MAX_ADMINS);

        // Add the authority as the first admin
        self.admins.push(authority);

        self.twitter_account = twitter_account;
        self.authority = authority;
        self.bump = bump;

        Ok(())
    }

    pub fn can_add_admin(&self, admin: &Pubkey) -> Result<()> {
        require!(!self.admins.contains(admin), HelmError::AdminAlreadyExists);
        require!(self.admins.len() < MAX_ADMINS, HelmError::MaxAdminsReached);
        Ok(())
    }

    pub fn can_remove_admin(&self, admin: &Pubkey) -> Result<()> {
        require!(self.admins.len() > 1, HelmError::CannotRemoveLastAdmin);
        require!(self.admins.contains(admin), HelmError::AdminDoesNotExist);
        Ok(())
    }

    pub fn add_admin(&mut self, admin: Pubkey) -> Result<()> {
        self.can_add_admin(&admin)?;
        self.admins.push(admin);
        Ok(())
    }

    pub fn remove_admin(&mut self, admin: &Pubkey) -> Result<()> {
        self.can_remove_admin(admin)?;
        self.admins.retain(|&x| x != *admin);
        Ok(())
    }
}
