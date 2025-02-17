// File: src/instructions/creator/mod.rs
use anchor_lang::prelude::*;
use crate::contexts::creator::{ ManageCreator, CreatorValidator };

pub fn add(ctx: Context<ManageCreator>, creator: Pubkey) -> Result<()> {
    // Validate all conditions using the traits
    ctx.accounts.validate_creator_authority()?;
    ctx.accounts.validate_creator_limit()?;
    ctx.accounts.validate_creator_uniqueness(&creator)?;

    ctx.accounts.creator_list.add_creator(creator)
}

pub fn remove(ctx: Context<ManageCreator>, creator: Pubkey) -> Result<()> {
    // Validate conditions
    ctx.accounts.validate_creator_authority()?;
    ctx.accounts.validate_creator_exists(&creator)?;

    ctx.accounts.creator_list.remove_creator(&creator)
}
