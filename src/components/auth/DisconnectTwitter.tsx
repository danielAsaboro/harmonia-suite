// /components/auth/DisconnectTwitter.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Twitter, Check, X, Loader2 } from "lucide-react";
import { useUserAccount } from "@/components/editor/context/account";
import Image from "next/image";
import { cn } from "@/utils/ts-merge";

interface DisconnectTwitterProps {
  onDisconnectSuccess?: () => void;
}

export function DisconnectTwitter({
  onDisconnectSuccess,
}: DisconnectTwitterProps) {
  const { handle, name, profileImageUrl } = useUserAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [disconnectError, setDisconnectError] = useState<string | null>(null);

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      setDisconnectError(null);

      const response = await fetch("/api/auth/twitter/disconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to disconnect Twitter");
      }

      // Success handling
      onDisconnectSuccess?.();
      // Optional: Trigger a full page reload or update user context
      window.location.href = "/settings"; // a preferred redirect
    } catch (error) {
      console.error("Disconnect error:", error);
      setDisconnectError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
      setShowConfirmation(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-neutral-900 rounded-lg border border-neutral-800 relative">
      <div className="flex items-center space-x-4">
        {profileImageUrl ? (
          <Image
            src={profileImageUrl}
            alt={name}
            className="w-12 h-12 rounded-full border-2 border-blue-500"
            width={48}
            height={48}
          />
        ) : (
          <Twitter className="w-12 h-12 text-blue-400" />
        )}
        <div>
          <p className="font-semibold text-white">{name}</p>
          <p className="text-neutral-400">@{handle}</p>
        </div>
      </div>

      {!showConfirmation ? (
        <Button
          onClick={() => setShowConfirmation(true)}
          className="bg-transparent border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors rounded-full"
          variant="outline"
        >
          Disconnect
        </Button>
      ) : (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowConfirmation(false)}
            disabled={isLoading}
            className="border-neutral-700 bg-black text-neutral-300 hover:bg-neutral-900 hover:text-white transition-colors rounded-full"
          >
            <X className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button
            onClick={handleDisconnect}
            disabled={isLoading}
            className={cn(
              "bg-red-500 hover:bg-red-600 text-white transition-colors rounded-full",
              "focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black"
            )}
          >
            {isLoading ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                Disconnecting...
              </span>
            ) : (
              <span className="flex items-center">
                <Check className="mr-2 h-4 w-4" /> Confirm
              </span>
            )}
          </Button>
        </div>
      )}

      {disconnectError && (
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-red-500/10 text-red-500 text-sm text-center rounded-b-lg">
          {disconnectError}
        </div>
      )}
    </div>
  );
}
