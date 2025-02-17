// File: src/constants.rs
use anchor_lang::prelude::*;

// Program Authority
pub const SERVICE_AUTHORITY: Pubkey = pubkey!("Hem9xTjkFZwX2XaJ7oHpGmYzL6Pb58GfzWxr2TmU2PZ");

// Account Sizes and Limits
pub const MAX_ADMINS: usize = 10;
pub const MAX_CREATORS: usize = 10;
pub const ANCHOR_DISCRIMINATOR: usize = 8;
pub const MAX_TWITTER_ID_LENGTH: usize = 64;
pub const MAX_TWITTER_HANDLE_LENGTH: usize = 32;
pub const MAX_REJECTION_REASON_LENGTH: usize = 256;
pub const MAX_FAILURE_REASON_LENGTH: usize = 256;
pub const MIN_REQUIRED_APPROVALS: u8 = 1;
pub const MAX_REQUIRED_APPROVALS: u8 = 10;
pub const MAX_THREAD_LENGTH: u8 = 50; // Maximum number of tweets in a thread

// Space Calculations for Account Sizes
pub const TWITTER_ACCOUNT_SIZE: usize =
    ANCHOR_DISCRIMINATOR + // discriminator (8 bytes)
    32 + // owner pubkey
    4 +
    MAX_TWITTER_ID_LENGTH + // twitter_id string (max) with length prefix
    4 +
    MAX_TWITTER_HANDLE_LENGTH + // twitter_handle string (max) with length prefix
    1 + // required_approvals
    1 + // is_verified
    8 + // created_at
    1; // bump

pub const ADMIN_LIST_SIZE: usize =
    ANCHOR_DISCRIMINATOR + // discriminator
    32 + // twitter_account pubkey
    4 +
    32 * MAX_ADMINS + // admins vec (account for vec length prefix)
    32 + // authority
    1; // bump

pub const CREATOR_LIST_SIZE: usize =
    ANCHOR_DISCRIMINATOR + // discriminator
    32 + // twitter_account pubkey
    4 +
    32 * MAX_CREATORS + // creators vec (account for vec length prefix)
    32 + // authority
    1; // bump

pub const BASE_CONTENT_SIZE: usize =
    ANCHOR_DISCRIMINATOR + // discriminator
    32 + // twitter_account pubkey
    32 + // author pubkey
    2 + // content_type enum (1 byte discriminator + 1 byte for value)
    32 + // content_hash
    9 + // scheduled_for Option<i64> (1 byte for Option + 8 bytes for i64)
    2 + // status enum (1 byte discriminator + 1 byte for value)
    4 +
    32 * MAX_ADMINS + // approvals vec with length prefix
    4 +
    MAX_REJECTION_REASON_LENGTH + // rejection_reason Option<String> with length prefix
    4 +
    MAX_FAILURE_REASON_LENGTH + // failure_reason Option<String> with length prefix
    8 + // created_at
    8 + // updated_at
    1; // bump

// PDA Seeds
pub const TWITTER_ACCOUNT_SEED: &[u8] = b"twitter-account";
pub const ADMIN_LIST_SEED: &[u8] = b"admin-list";
pub const CREATOR_LIST_SEED: &[u8] = b"creator-list";
pub const CONTENT_SEED: &[u8] = b"content";

// Time Constants (in seconds)
pub const MIN_SCHEDULE_DELAY: i64 = 300; // 5 minutes minimum delay for scheduling
pub const MAX_SCHEDULE_DELAY: i64 = 30 * 24 * 60 * 60; // 30 days maximum scheduling window

// Default Values
pub const DEFAULT_REQUIRED_APPROVALS: u8 = 3;
