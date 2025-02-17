use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum ContentType {
    Tweet,
    Thread { tweet_count: u8 },
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Copy)]
pub enum ContentStatus {
    Draft,
    PendingApproval,
    Approved,
    Rejected,
    Published,
    Failed,
    Canceled,
}
