// File: src/errors.rs

use anchor_lang::prelude::*;

#[error_code]
pub enum HelmError {
    // Twitter Account Errors
    #[msg("Twitter account not verified")]
    TwitterAccountNotVerified,
    #[msg("Twitter account already verified")]
    AlreadyVerified,
    #[msg("Invalid Twitter handle format")]
    InvalidTwitterHandle,
    #[msg("Invalid Twitter ID format")]
    InvalidTwitterId,

    // Content Status Errors
    #[msg("Invalid content status for operation")]
    InvalidContentStatus,
    #[msg("Content is in terminal state")]
    ContentInTerminalState,
    #[msg("Content not active")]
    ContentNotActive,
    #[msg("Invalid state transition")]
    InvalidStateTransition,
    #[msg("Content already submitted for approval")]
    AlreadySubmitted,

    // Approval Errors
    #[msg("Content already approved by this admin")]
    AlreadyApproved,
    #[msg("Insufficient approvals")]
    InsufficientApprovals,
    #[msg("Invalid minimum required approvals")]
    InvalidRequiredApprovals,

    // Admin Management Errors
    #[msg("Admin already exists")]
    AdminAlreadyExists,
    #[msg("Admin does not exist")]
    AdminDoesNotExist,
    #[msg("Cannot remove last admin")]
    CannotRemoveLastAdmin,
    #[msg("Maximum number of admins reached")]
    MaxAdminsReached,

    // Creator Management Errors
    #[msg("Creator already exists")]
    CreatorAlreadyExists,
    #[msg("Creator does not exist")]
    CreatorDoesNotExist,
    #[msg("Maximum number of creators reached")]
    MaxCreatorsReached,

    // Schedule Errors
    #[msg("Invalid scheduling time")]
    InvalidScheduleTime,
    #[msg("Schedule time required")]
    ScheduleTimeRequired,
    #[msg("Schedule time in past")]
    ScheduleTimeInPast,

    // Authorization Errors
    #[msg("Not authorized")]
    Unauthorized,
    #[msg("Invalid Twitter account")]
    InvalidTwitterAccount,

    // Validation Errors
    #[msg("Invalid content hash")]
    InvalidContentHash,
    #[msg("Content too long")]
    ContentTooLong,
    #[msg("Thread too long")]
    ThreadTooLong,

    // Rate Limiting
    #[msg("Too many requests")]
    TooManyRequests,
}
