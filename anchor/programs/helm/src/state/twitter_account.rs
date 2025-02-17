use anchor_lang::prelude::*;

use crate::{
    constants::{ DEFAULT_REQUIRED_APPROVALS, MAX_REQUIRED_APPROVALS },
    errors::HelmError,
};

#[account]
pub struct TwitterAccount {
    /// The wallet that initialized this Twitter account integration
    pub owner: Pubkey,
    /// Twitter account identifier (off-chain)
    pub twitter_id: String,
    /// Twitter handle (off-chain verification)
    pub twitter_handle: String,
    /// Required number of approvals for this account
    pub required_approvals: u8,
    /// Whether the Twitter account is verified with the service
    pub is_verified: bool,
    /// When this integration was created
    pub created_at: i64,
    /// Bump for PDA derivation
    pub bump: u8,
}

impl TwitterAccount {
    pub fn initialize(
        &mut self,
        owner: Pubkey,
        twitter_id: String,
        twitter_handle: String,
        timestamp: i64,
        bump: u8
    ) {
        self.owner = owner;
        self.twitter_id = twitter_id;
        self.twitter_handle = twitter_handle;
        self.required_approvals = DEFAULT_REQUIRED_APPROVALS;
        self.is_verified = false;
        self.created_at = timestamp;
        self.bump = bump;
    }

    pub fn update_required_approvals(&mut self, new_value: u8) -> Result<()> {
        require!(
            new_value > 0 && new_value <= MAX_REQUIRED_APPROVALS,
            HelmError::InvalidRequiredApprovals
        );
        self.required_approvals = new_value;
        Ok(())
    }
}
