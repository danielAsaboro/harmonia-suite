// File: src/instructions/admin/mod.rs
use anchor_lang::prelude::*;
use crate::{
    contexts::admin::{ ManageAdmin, AdminValidator },
    errors::HelmError,
    constants::MAX_ADMINS,
};

pub fn add(ctx: Context<ManageAdmin>, admin: Pubkey) -> Result<()> {
    // Validate all conditions using the trait
    ctx.accounts.validate_admin_authority()?;
    ctx.accounts.validate_twitter_verified()?;

    let admin_list = &mut ctx.accounts.admin_list;

    require!(!admin_list.admins.contains(&admin), HelmError::AdminAlreadyExists);
    require!(admin_list.admins.len() < MAX_ADMINS, HelmError::MaxAdminsReached);

    admin_list.admins.push(admin);
    Ok(())
}

pub fn remove(ctx: Context<ManageAdmin>, admin: Pubkey) -> Result<()> {
    // Validate conditions
    ctx.accounts.validate_admin_authority()?;

    let admin_list = &mut ctx.accounts.admin_list;

    // Check if admin exists
    require!(admin_list.admins.contains(&admin), HelmError::AdminDoesNotExist);

    // Check if trying to remove the last admin
    require!(admin_list.admins.len() > 1, HelmError::CannotRemoveLastAdmin);

    // If admin is authority, ensure there's another admin who is authority
    if admin == ctx.accounts.twitter_account.owner {
        let has_other_authority = admin_list.admins
            .iter()
            .any(|&x| x != admin && x == ctx.accounts.twitter_account.owner);
        require!(has_other_authority, HelmError::CannotRemoveLastAdmin);
    }

    admin_list.admins.retain(|&x| x != admin);
    Ok(())
}
