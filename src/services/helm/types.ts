// File: src//services/helm/types.ts

import { PublicKey } from "@solana/web3.js";

export enum ContentStatus {
  Draft = "draft",
  PendingApproval = "pendingApproval",
  Approved = "approved",
  Rejected = "rejected",
  Published = "published",
  Failed = "failed",
  Canceled = "canceled",
}

export type ContentType =
  | {
      tweet: {};
    }
  | {
      thread: {
        tweetCount: number;
      };
    };

export interface TwitterAccount {
  owner: PublicKey;
  twitterId: string;
  twitterHandle: string;
  requiredApprovals: number;
  isVerified: boolean;
  createdAt: number;
  bump: number;
}

export interface AdminList {
  twitterAccount: PublicKey;
  admins: PublicKey[];
  authority: PublicKey;
  bump: number;
}

export interface CreatorList {
  twitterAccount: PublicKey;
  creators: PublicKey[];
  authority: PublicKey;
  bump: number;
}

export interface Content {
  twitterAccount: PublicKey;
  author: PublicKey;
  contentType: ContentType;
  contentHash: number[];
  scheduledFor: number | null;
  status: ContentStatus;
  approvals: PublicKey[];
  rejectionReason: string | null;
  failureReason: string | null;
  createdAt: number;
  updatedAt: number;
  bump: number;
}

// Program Error Codes
export enum HelmError {
  TwitterAccountNotVerified = 6000,
  AlreadyVerified = 6001,
  InvalidTwitterHandle = 6002,
  InvalidTwitterId = 6003,
  InvalidContentStatus = 6004,
  ContentInTerminalState = 6005,
  ContentNotActive = 6006,
  InvalidStateTransition = 6007,
  AlreadySubmitted = 6008,
  AlreadyApproved = 6009,
  InsufficientApprovals = 6010,
  InvalidRequiredApprovals = 6011,
  AdminAlreadyExists = 6012,
  AdminDoesNotExist = 6013,
  CannotRemoveLastAdmin = 6014,
  MaxAdminsReached = 6015,
  CreatorAlreadyExists = 6016,
  CreatorDoesNotExist = 6017,
  MaxCreatorsReached = 6018,
  InvalidScheduleTime = 6019,
  ScheduleTimeRequired = 6020,
  ScheduleTimeInPast = 6021,
  Unauthorized = 6022,
  InvalidTwitterAccount = 6023,
  InvalidContentHash = 6024,
  ContentTooLong = 6025,
  ThreadTooLong = 6026,
  TooManyRequests = 6027,
}
