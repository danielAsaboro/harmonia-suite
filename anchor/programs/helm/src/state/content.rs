// File: src/state/content.rs
use anchor_lang::prelude::*;

use crate::{
    constants::{ CONTENT_SEED, MAX_SCHEDULE_DELAY, MIN_SCHEDULE_DELAY },
    enums::{ ContentStatus, ContentType },
    errors::HelmError,
};

#[account]
pub struct Content {
    /// Reference to the Twitter account this content belongs to
    pub twitter_account: Pubkey,
    /// Content creator's public key
    pub author: Pubkey,
    /// Content type (single tweet or thread)
    pub content_type: ContentType,
    /// Keccak256 hash of the content
    pub content_hash: [u8; 32],
    /// Unix timestamp for scheduled publication
    pub scheduled_for: Option<i64>,
    /// Current content status
    pub status: ContentStatus,
    /// List of admin approvals
    pub approvals: Vec<Pubkey>,
    /// Reason for rejection if rejected
    pub rejection_reason: Option<String>,
    /// Reason for failure if failed
    pub failure_reason: Option<String>,
    /// When the content was created
    pub created_at: i64,
    /// Last time content was modified
    pub updated_at: i64,
    /// Bump for PDA derivation
    pub bump: u8,
}

impl Content {
    // Account initialization and PDA helpers
    pub fn seeds(
        twitter_account: &Pubkey,
        author: &Pubkey,
        content_hash: &[u8; 32]
    ) -> Vec<Vec<u8>> {
        vec![
            CONTENT_SEED.to_vec(),
            twitter_account.to_bytes().to_vec(),
            author.to_bytes().to_vec(),
            content_hash.to_vec()
        ]
    }

    pub fn initialize(
        &mut self,
        twitter_account: Pubkey,
        author: Pubkey,
        content_type: ContentType,
        content_hash: [u8; 32],
        scheduled_for: Option<i64>,
        bump: u8,
        timestamp: i64
    ) {
        self.twitter_account = twitter_account;
        self.author = author;
        self.content_type = content_type;
        self.content_hash = content_hash;
        self.scheduled_for = scheduled_for;
        self.status = ContentStatus::Draft;
        self.approvals = Vec::new();
        self.rejection_reason = None;
        self.failure_reason = None;
        self.created_at = timestamp;
        self.updated_at = timestamp;
        self.bump = bump;
    }

    // Main content workflow methods
    pub fn submit(&mut self, authority: Pubkey, required_approvals: u8) -> Result<()> {
        require!(self.status == ContentStatus::Draft, HelmError::InvalidContentStatus);

        if let Some(scheduled_time) = self.scheduled_for {
            let clock = Clock::get()?;
            require!(scheduled_time > clock.unix_timestamp, HelmError::ScheduleTimeInPast);
            self.validate_scheduled_time(&clock)?;
        }

        self.transition_to(ContentStatus::PendingApproval)?;

        // Add initial approval from submitter
        if !self.approvals.contains(&authority) {
            self.approvals.push(authority);

            // Auto-approve if we have enough approvals
            if self.approvals.len() >= (required_approvals as usize) {
                self.transition_to(ContentStatus::Approved)?;
            }
        }

        Ok(())
    }

    pub fn approve(&mut self, approver: Pubkey, required_approvals: u8) -> Result<()> {
        require!(self.status == ContentStatus::PendingApproval, HelmError::InvalidContentStatus);
        require!(!self.approvals.contains(&approver), HelmError::AlreadyApproved);
        require!(
            self.approvals.len() < (required_approvals as usize) * 2,
            HelmError::InvalidContentStatus
        );

        self.approvals.push(approver);

        if self.approvals.len() >= (required_approvals as usize) {
            self.transition_to(ContentStatus::Approved)?;
        }

        self.updated_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn reject(&mut self, reason: String) -> Result<()> {
        require!(self.status == ContentStatus::PendingApproval, HelmError::InvalidContentStatus);
        self.transition_to(ContentStatus::Rejected)?;
        self.rejection_reason = Some(reason);
        self.updated_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    // State transition and validation methods
    pub fn transition_to(&mut self, new_status: ContentStatus) -> Result<()> {
        require!(self.can_transition_to(new_status), HelmError::InvalidStateTransition);

        if new_status == ContentStatus::Draft {
            self.approvals.clear();
            self.rejection_reason = None;
            self.failure_reason = None;
        }

        if self.status == ContentStatus::Rejected && new_status != ContentStatus::Rejected {
            self.rejection_reason = None;
        }

        self.status = new_status;
        self.updated_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn validate_scheduled_time(&self, clock: &Clock) -> Result<()> {
        if let Some(scheduled_time) = self.scheduled_for {
            let current_time = clock.unix_timestamp;

            let min_allowed_time = current_time
                .checked_add(MIN_SCHEDULE_DELAY)
                .ok_or(HelmError::InvalidScheduleTime)?;
            require!(scheduled_time > min_allowed_time, HelmError::InvalidScheduleTime);

            let max_allowed_time = current_time
                .checked_add(MAX_SCHEDULE_DELAY)
                .ok_or(HelmError::InvalidScheduleTime)?;
            require!(scheduled_time < max_allowed_time, HelmError::InvalidScheduleTime);

            require!(
                scheduled_time > 0 && scheduled_time <= i64::MAX - MAX_SCHEDULE_DELAY,
                HelmError::InvalidScheduleTime
            );
        }
        Ok(())
    }

    // State check helpers
    pub fn can_transition_to(&self, new_status: ContentStatus) -> bool {
        match (self.status, new_status) {
            // From Draft
            (ContentStatus::Draft, ContentStatus::PendingApproval) => true,
            (ContentStatus::Draft, ContentStatus::Canceled) => true,

            // From PendingApproval
            (ContentStatus::PendingApproval, ContentStatus::Approved) => true,
            (ContentStatus::PendingApproval, ContentStatus::Rejected) => true,
            (ContentStatus::PendingApproval, ContentStatus::Canceled) => true,

            // From Approved
            (ContentStatus::Approved, ContentStatus::Published) => true,
            (ContentStatus::Approved, ContentStatus::Failed) => true,
            (ContentStatus::Approved, ContentStatus::Canceled) => true,

            // From Rejected/Failed - allow retry
            (ContentStatus::Rejected, ContentStatus::Draft) => true,
            (ContentStatus::Failed, ContentStatus::Draft) => true,

            // Terminal states
            (ContentStatus::Published, _) => false,
            (ContentStatus::Canceled, _) => false,

            _ => false,
        }
    }

    pub fn is_terminal(&self) -> bool {
        matches!(
            self.status,
            ContentStatus::Published | ContentStatus::Failed | ContentStatus::Canceled
        )
    }

    pub fn is_within_schedule_bounds(timestamp: i64) -> bool {
        timestamp > 0 && timestamp <= i64::MAX - MAX_SCHEDULE_DELAY
    }
}
