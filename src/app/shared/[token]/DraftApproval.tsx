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
import { useAdmin, useContent, useHelm } from "@/hooks/helm";
import { useWallet } from "@solana/wallet-adapter-react";

interface DraftApprovalProps {
  draftId: string;
}

type TxStatus = "idle" | "pending" | "success" | "error";
type ActionType = "approve" | "reject" | null;

const DraftApproval = ({ draftId }: DraftApprovalProps) => {
  const [isAdmin, setIsAdmin] = useState(true);
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [completedAction, setCompletedAction] = useState<ActionType>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const { isAdmin: checkIfAdmin } = useAdmin();
  const { approveContent, rejectContent } = useContent();
  const { publicKey } = useWallet();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const adminStat = await checkIfAdmin(publicKey!);
        // setIsAdmin(adminStat);
      } catch (err) {
        console.error("Error checking admin status:", err);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, []);

  const handleTransaction = async (action: ActionType, reason?: string) => {
    if (!action) return;

    try {
      setTxStatus("pending");
      setError(null);

      // Simulate blockchain transaction
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (action === "approve") {
        await approveContent(draftId, publicKey!);
      } else {
        await rejectContent(draftId, publicKey!, reason || "");
      }

      setTxStatus("success");
      setCompletedAction(action);
      setRejectDialogOpen(false);
    } catch (err) {
      console.error("Transaction failed:", err);
      setError(`Failed to ${action} draft. Please try again.`);
      setTxStatus("error");
    }
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }
    handleTransaction("reject", rejectReason);
  };

  if (!isAdmin) return null;

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
            ? "The draft has been successfully approved on the blockchain."
            : "The draft has been rejected and will be returned to the author."}
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
                Confirming Transaction...
              </>
            ) : (
              "Approve Draft"
            )}
          </Button>

          <Button
            onClick={() => setRejectDialogOpen(true)}
            disabled={txStatus === "pending"}
            variant="outline"
            className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
          >
            {txStatus === "pending" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirming Transaction...
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
                  Confirming...
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
