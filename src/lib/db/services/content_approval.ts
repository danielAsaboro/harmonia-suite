// /lib/db/services/content_approval.ts
import { PrismaClient } from "@prisma/client";
import { ContentApproval } from "../schema";
import { nanoid } from "nanoid";

export class PrismaContentApprovalsService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  // Create a new approval record
  async createApproval(
    approval: Omit<ContentApproval, "id">
  ): Promise<ContentApproval> {
    const id = nanoid();

    const createdApproval = await this.prisma.content_approvals.create({
      data: {
        id,
        contentType: approval.contentType,
        contentId: approval.contentId,
        blockchainId: approval.blockchainId,
        submittedAt: approval.submittedAt,
        status: approval.status,
        requiredApprovals: approval.requiredApprovals,
        currentApprovals: approval.currentApprovals,
        approvers: approval.approvers
          ? JSON.stringify(approval.approvers)
          : null,
        rejectionReason: approval.rejectionReason || null,
        transactionSignature: approval.transactionSignature || null,
      },
    });

    return {
      ...createdApproval,
      approvers: createdApproval.approvers
        ? JSON.parse(createdApproval.approvers)
        : undefined,
    } as ContentApproval;
  }

  // Get approval by content ID
  async getApprovalByContentId(
    contentId: string
  ): Promise<ContentApproval | null> {
    const approval = await this.prisma.content_approvals.findFirst({
      where: {
        contentId,
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    if (!approval) return null;

    return {
      ...approval,
      approvers: approval.approvers
        ? JSON.parse(approval.approvers)
        : undefined,
    } as ContentApproval;
  }

  // Update approval status
  async updateApprovalStatus(
    id: string,
    status: "pending" | "approved" | "rejected",
    updates: Partial<ContentApproval> = {}
  ): Promise<void> {
    await this.prisma.content_approvals.update({
      where: { id },
      data: {
        status,
        currentApprovals: updates.currentApprovals,
        approvers: updates.approvers
          ? JSON.stringify(updates.approvers)
          : undefined,
        rejectionReason: updates.rejectionReason,
        transactionSignature: updates.transactionSignature,
      },
    });
  }
}

// Helper function to create the service with a singleton-like approach
export function createContentApprovalsService(prismaClient?: PrismaClient) {
  const client = prismaClient || new PrismaClient();
  return new PrismaContentApprovalsService(client);
}
