// /app/shared/[token]/DraftApproval.tsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface DraftApprovalProps {
  draftId: string;
  contentType: "tweet" | "thread";
}

type TxStatus = "idle" | "pending" | "success" | "error";
type ActionType = "approve" | "reject" | null;

const DraftApproval = ({ draftId, contentType }: DraftApprovalProps) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [completedAction, setCompletedAction] = useState<ActionType>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  // Get team details for the content and check admin status
  useEffect(
    () => {
      const checkTeamAndApprovalStatus = async () => {
        try {
          setIsLoading(true);

          // Get the shared draft token from the URL
          const token = window.location.pathname.split("/").pop();

          // Get the shared draft data to extract the status and creator info
          const sharedDraftResponse = await fetch(`/api/shared-draft/${token}`);
          if (!sharedDraftResponse.ok) {
            console.error(
              "Failed to fetch shared draft:",
              await sharedDraftResponse.text()
            );
            setIsAdmin(false);
            setIsLoading(false);
            return;
          }

          const sharedDraftData = await sharedDraftResponse.json();
          console.log("Shared draft data:", sharedDraftData);

          // Extract creator ID
          const creatorId = sharedDraftData.draft.userId;

          // Extract the status and teamId based on content type
          if (contentType === "tweet") {
            setStatus(sharedDraftData.draft.status);
            setTeamId(sharedDraftData.draft.teamId || null);
          } else if (contentType === "thread") {
            setStatus(sharedDraftData.draft.status);
            setTeamId(sharedDraftData.draft.teamId || null);
          }

          // Directly check if the user is a team admin using the members API
          const membersResponse = await fetch(`/api/team/members`);
          if (!membersResponse.ok) {
            console.error(
              "Failed to fetch team members:",
              await membersResponse.text()
            );
            setIsAdmin(false);
            setIsLoading(false);
            return;
          }

          const membersData = await membersResponse.json();
          console.log("Team membership data:", membersData);

          // Check if the user is currently logged in
          const userResponse = await fetch("/api/auth/twitter/user");
          if (!userResponse.ok) {
            console.error(
              "Failed to fetch user data:",
              await userResponse.text()
            );
            setIsAdmin(false);
            setIsLoading(false);
            return;
          }

          const userData = await userResponse.json();
          console.log("Current user data:", userData);

          // Only set isAdmin to true if:
          // 1. The user is a team admin
          // 2. The user is NOT the creator of the draft
          const isUserAdmin = membersData.userRole === "admin";
          const isCreator = userData.id === creatorId;

          setIsAdmin(isUserAdmin && !isCreator);

          console.log("Admin status check:", {
            isUserAdmin,
            isCreator,
            canApprove: isUserAdmin && !isCreator,
          });
        } catch (err) {
          console.error("Error checking team and approval status:", err);
          setIsAdmin(false);
        } finally {
          setIsLoading(false);
        }
      };

      checkTeamAndApprovalStatus();
    },
    [
      // draftId, contentType
    ]
  );

  // Function to approve content via backend API
  const approveContent = async () => {
    try {
      setTxStatus("pending");
      setError(null);

      // Call the backend API to approve content
      const response = await fetch("/api/team/content/approval", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "approve",
          contentId: draftId,
          contentType: contentType,
          teamId: teamId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to approve content");
      }

      // Success
      setTxStatus("success");
      setCompletedAction("approve");
      setStatus("approved");
    } catch (err) {
      console.error("Approval failed:", err);
      setError(
        `Failed to approve draft: ${err instanceof Error ? err.message : "Unknown error"}`
      );
      setTxStatus("error");
    }
  };

  // Function to reject content via backend API
  const rejectContent = async (reason: string) => {
    try {
      setTxStatus("pending");
      setError(null);

      // Call the backend API to reject content
      const response = await fetch("/api/team/content/approval", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "reject",
          contentId: draftId,
          contentType: contentType,
          teamId: teamId,
          rejectionReason: reason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reject content");
      }

      // Success
      setTxStatus("success");
      setCompletedAction("reject");
      setRejectDialogOpen(false);
      setStatus("rejected");
    } catch (err) {
      console.error("Rejection failed:", err);
      setError(
        `Failed to reject draft: ${err instanceof Error ? err.message : "Unknown error"}`
      );
      setTxStatus("error");
    }
  };

  const handleTransaction = async (action: ActionType) => {
    if (!action) return;

    if (action === "approve") {
      await approveContent();
    } else {
      // Rejection happens in the handleReject function when dialog is confirmed
      setRejectDialogOpen(true);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }

    await rejectContent(rejectReason);
  };

  // Don't show anything while checking status
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground animate-pulse">
          Checking approval status...
        </span>
      </div>
    );
  }

  // Don't show approval options if not an admin or if content isn't pending approval
  // NOTE: We need to check for "pending_approval" specifically here
  const showApprovalButtons = isAdmin && status === "pending_approval";

  if (!showApprovalButtons) {
    console.log("Not showing approval buttons:", {
      isAdmin,
      status,
      showApprovalButtons,
    });
    return null;
  }

  // Show success message after approval/rejection
  if (txStatus === "success") {
    return (
      <Alert
        className={
          completedAction === "approve"
            ? "bg-green-500/10 text-green-500"
            : "bg-neutral-500/10 text-neutral-500"
        }
      >
        <AlertTitle>
          {completedAction === "approve" ? "Draft Approved!" : "Draft Rejected"}
        </AlertTitle>
        <AlertDescription>
          {completedAction === "approve"
            ? "The draft has been successfully approved and will be scheduled for publishing."
            : "The draft has been rejected and will be returned to the author with your feedback."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <div className="mt-6 space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-4">
          <Button
            onClick={() => handleTransaction("approve")}
            disabled={txStatus === "pending"}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {txStatus === "pending" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Approval...
              </>
            ) : (
              "Approve Draft"
            )}
          </Button>

          <Button
            onClick={() => handleTransaction("reject")}
            disabled={txStatus === "pending"}
            variant="outline"
            className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
          >
            {txStatus === "pending" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Rejection...
              </>
            ) : (
              "Reject Draft"
            )}
          </Button>
        </div>
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Draft</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this draft. This will be
              shared with the author.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={txStatus === "pending"}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={txStatus === "pending" || !rejectReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {txStatus === "pending" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Rejection"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DraftApproval;
