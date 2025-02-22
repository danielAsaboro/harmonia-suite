// File: src/instructions/twitter/register.rs

use anchor_lang::prelude::*;
use crate::contexts::twitter::{ RegisterTwitterAccount, TwitterAccountValidator };

pub fn register(
    ctx: Context<RegisterTwitterAccount>,
    twitter_id: String,
    twitter_handle: String
) -> Result<()> {
    // Validate input formats
    ctx.accounts.validate_handle_format(&twitter_handle)?;
    ctx.accounts.validate_id_format(&twitter_id)?;

    let twitter_account = &mut ctx.accounts.twitter_account;
    let admin_list = &mut ctx.accounts.admin_list;
    let creator_list = &mut ctx.accounts.creator_list;
    let clock = Clock::get()?;

    // Initialize Twitter account
    twitter_account.initialize(
        ctx.accounts.owner.key(),
        twitter_id.clone(),
        twitter_handle,
        clock.unix_timestamp,
        ctx.bumps.twitter_account
    );

    admin_list.initialize(twitter_account.key(), ctx.accounts.owner.key(), ctx.bumps.admin_list)?;

    // Initialize admin list

    // Initialize creator list
    creator_list.twitter_account = twitter_account.key();
    creator_list.creators = Vec::new();
    creator_list.authority = ctx.accounts.owner.key();
    creator_list.bump = ctx.bumps.creator_list;

    Ok(())
}

// TODO: need to implement a name upgrade
