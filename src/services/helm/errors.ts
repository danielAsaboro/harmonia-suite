// File: src//services/helm/errors.ts

import { HelmError } from "./types";
import { AnchorError } from "@coral-xyz/anchor";

const ERROR_MESSAGES: Record<HelmError, string> = {
  [HelmError.TwitterAccountNotVerified]:
    "Twitter account must be verified first",
  [HelmError.AlreadyVerified]: "Twitter account is already verified",
  [HelmError.InvalidTwitterHandle]: "The provided Twitter handle is invalid",
  [HelmError.InvalidTwitterId]: "The provided Twitter ID is invalid",
  [HelmError.InvalidContentStatus]: "Invalid content status for this operation",
  [HelmError.ContentInTerminalState]:
    "Content is in a terminal state and cannot be modified",
  [HelmError.ContentNotActive]: "Content is not active",
  [HelmError.InvalidStateTransition]: "Invalid state transition requested",
  [HelmError.AlreadySubmitted]:
    "Content has already been submitted for approval",
  [HelmError.AlreadyApproved]:
    "Content has already been approved by this admin",
  [HelmError.InsufficientApprovals]: "Not enough approvals to proceed",
  [HelmError.InvalidRequiredApprovals]: "Invalid number of required approvals",
  [HelmError.AdminAlreadyExists]: "This admin already exists",
  [HelmError.AdminDoesNotExist]: "Admin not found",
  [HelmError.CannotRemoveLastAdmin]: "Cannot remove the last admin",
  [HelmError.MaxAdminsReached]: "Maximum number of admins reached",
  [HelmError.CreatorAlreadyExists]: "This creator already exists",
  [HelmError.CreatorDoesNotExist]: "Creator not found",
  [HelmError.MaxCreatorsReached]: "Maximum number of creators reached",
  [HelmError.InvalidScheduleTime]: "Invalid scheduling time",
  [HelmError.ScheduleTimeRequired]: "Schedule time is required",
  [HelmError.ScheduleTimeInPast]: "Cannot schedule content in the past",
  [HelmError.Unauthorized]: "Not authorized to perform this action",
  [HelmError.InvalidTwitterAccount]: "Invalid Twitter account",
  [HelmError.InvalidContentHash]: "Invalid content hash",
  [HelmError.ContentTooLong]: "Content exceeds maximum length",
  [HelmError.ThreadTooLong]: "Thread exceeds maximum length",
  [HelmError.TooManyRequests]: "Too many requests, please try again later",
};

export class HelmErrorHandler {
  /**
   * Parse program error into user-friendly message
   */
  static parseError(error: any): string {
    if (error instanceof AnchorError) {
      const code = error.error.errorCode.number;
      return ERROR_MESSAGES[code as HelmError] || error.message;
    }

    // Handle other types of errors
    if (error.message) {
      // Check if error message contains a program error code
      const errorCodeMatch = error.message.match(/0x[0-9a-fA-F]+/);
      if (errorCodeMatch) {
        const code = parseInt(errorCodeMatch[0]);
        return ERROR_MESSAGES[code as HelmError] || error.message;
      }
    }

    return error.message || "An unknown error occurred";
  }

  /**
   * Check if error is a specific program error
   */
  static isError(error: any, code: HelmError): boolean {
    if (error instanceof AnchorError) {
      return error.error.errorCode.number === code;
    }
    return false;
  }

  /**
   * Format transaction error for logging
   */
  static formatTransactionError(error: any): {
    message: string;
    code?: number;
    details?: any;
  } {
    return {
      message: this.parseError(error),
      code:
        error instanceof AnchorError ? error.error.errorCode.number : undefined,
      details: error instanceof AnchorError ? error.error : error,
    };
  }
}
