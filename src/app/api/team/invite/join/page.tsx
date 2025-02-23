// /app/team/join/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface InviteStatus {
  valid: boolean;
  teamName?: string;
  role?: string;
  error?: string;
}

export default function JoinTeamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<InviteStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Verify token on page load
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/team/invite/verify?token=${token}`);
        const data = await response.json();
        setStatus(data);
      } catch (error) {
        setStatus({ valid: false, error: "Failed to verify invite" });
      }
    };

    if (token) {
      verifyToken();
    } else {
      setStatus({ valid: false, error: "Invalid invite link" });
    }
  }, [token]);

  const handleAcceptInvite = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/team/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        router.push("/team"); // Redirect to team page after successful acceptance
      } else {
        const data = await response.json();
        setStatus({ valid: false, error: data.error });
      }
    } catch (error) {
      setStatus({ valid: false, error: "Failed to accept invite" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!status) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Team Invitation</CardTitle>
        </CardHeader>
        <CardContent>
          {status.valid ? (
            <div className="space-y-4">
              <p>
                You've been invited to join {status.teamName} as a {status.role}
                .
              </p>
              <Button
                className="w-full"
                onClick={handleAcceptInvite}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Accept Invitation
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-red-500">{status.error}</p>
              <Button variant="outline" onClick={() => router.push("/")}>
                Return Home
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
