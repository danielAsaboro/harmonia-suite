"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LogOut, Loader2 } from "lucide-react";
import { cn } from "@/utils/ts-merge";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Optional custom styling
  className?: string;
}

const LogoutModal = ({ isOpen, onClose, className }: LogoutModalProps) => {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      // Call the logout endpoint
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      // Clear local storage auth data (but not content)
      // We're careful to only remove auth-related data
      const userId = localStorage.getItem("helm_app_current_user_id");
      if (userId) {
        const userDetailsKey = `helm_app_${userId}_user_details`;
        localStorage.removeItem(userDetailsKey);
        localStorage.removeItem("helm_app_current_user_id");
      }

      // Redirect to login page
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "sm:max-w-md rounded-xl border border-neutral-800 bg-black shadow-lg",
          className
        )}
      >
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center text-xl font-semibold text-white">
            <LogOut className="mr-2 h-5 w-5 text-blue-400" />
            Logout Confirmation
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            Are you sure you want to log out of your account? Your session will
            end and you'll need to sign in again to access your account.
          </DialogDescription>
        </DialogHeader>

        {/* Twitter-style info container */}
        <div className="relative my-2 overflow-hidden rounded-lg bg-neutral-900 p-4 border border-neutral-800">
          <div className="text-sm text-neutral-300">
            This will sign you out on this device only. Any unsaved changes may
            be lost.
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className="inline-flex w-full items-center justify-center rounded-full border border-neutral-700 bg-black px-4 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 sm:w-auto"
            disabled={isLoggingOut}
          >
            Cancel
          </button>
          <button
            onClick={handleLogout}
            className="inline-flex w-full items-center justify-center rounded-full bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-70 sm:w-auto"
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging out...
              </>
            ) : (
              "Logout"
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LogoutModal;
