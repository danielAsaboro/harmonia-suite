// File: src/instructions/content/mod.rs

use anchor_lang::prelude::*;
use crate::{
    contexts::content::{ SubmitContentAction, ContentAction },
    enums::ContentStatus,
    errors::HelmError,
};

pub fn submit_for_approval(ctx: Context<SubmitContentAction>) -> Result<()> {
    let content = &mut ctx.accounts.content;
    let clock = Clock::get()?;

    // Validate schedule time if present
    if let Some(scheduled_time) = content.scheduled_for {
        require!(scheduled_time > clock.unix_timestamp, HelmError::ScheduleTimeInPast);
        content.validate_scheduled_time(&clock)?;
    }

    // Transition to pending approval
    content.transition_to(ContentStatus::PendingApproval)?;

    // Handle initial approval from submitter
    let approver_key = ctx.accounts.authority.key();
    if !content.approvals.contains(&approver_key) {
        content.approvals.push(approver_key);

        // Check if we have enough approvals to auto-approve
        let required_approvals = ctx.accounts.twitter_account.required_approvals as usize;
        if content.approvals.len() >= required_approvals {
            content.transition_to(ContentStatus::Approved)?;
        }
    }

    Ok(())
}

pub fn approve_content(ctx: Context<ContentAction>) -> Result<()> {
    let content = &mut ctx.accounts.content;
    let twitter_account = &ctx.accounts.twitter_account;
    let approver_key = ctx.accounts.authority.key();
    let clock = Clock::get()?;

    // Validate current state
    require!(content.status == ContentStatus::PendingApproval, HelmError::InvalidContentStatus);
    require!(!content.approvals.contains(&approver_key), HelmError::AlreadyApproved);

    // Check schedule time if present
    if let Some(scheduled_time) = content.scheduled_for {
        require!(scheduled_time > clock.unix_timestamp, HelmError::ScheduleTimeInPast);
    }

    // Get required approvals
    let required_approvals = twitter_account.required_approvals as usize;

    // Verify we won't exceed max approvals
    require!(content.approvals.len() < required_approvals * 2, HelmError::InvalidContentStatus);

    // Add the approval
    content.approvals.push(approver_key);

    // Check if we've hit the required approvals
    if content.approvals.len() >= required_approvals {
        content.transition_to(ContentStatus::Approved)?;
    }

    content.updated_at = clock.unix_timestamp;
    Ok(())
}

pub fn reject_content(ctx: Context<ContentAction>, reason: String) -> Result<()> {
    let content = &mut ctx.accounts.content;

    require!(content.status == ContentStatus::PendingApproval, HelmError::InvalidContentStatus);
    content.transition_to(ContentStatus::Rejected)?;
    content.rejection_reason = Some(reason);
    content.updated_at = Clock::get()?.unix_timestamp;

    Ok(())
}

pub fn cancel_content(ctx: Context<ContentAction>) -> Result<()> {
    let content = &mut ctx.accounts.content;

    require!(!content.is_terminal(), HelmError::ContentInTerminalState);
    content.transition_to(ContentStatus::Canceled)?;
    content.updated_at = Clock::get()?.unix_timestamp;

    Ok(())
}
