import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, CheckCircle2, RefreshCcw } from "lucide-react";
import { VerificationStatus } from "@/types/onboarding";

interface EmailVerificationProps {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}

const EmailVerification = ({
  email,
  onVerified,
  onBack,
}: EmailVerificationProps) => {
  const [verificationCode, setVerificationCode] = useState("");
  const [status, setStatus] = useState<VerificationStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const sendVerificationCode = async () => {
    setStatus("sending");
    setError(null);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setStatus("sent");
  };

  const verifyCode = async () => {
    if (!verificationCode) {
      setError("Please enter the verification code");
      return;
    }

    setStatus("verifying");
    setError(null);

    // Simulate API verification
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (verificationCode === "12345") {
      setStatus("verified");
      setTimeout(() => {
        onVerified();
      }, 1000);
    } else {
      setStatus("error");
      setError("Invalid verification code. Please try again.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 p-4 rounded-lg">
        <p className="text-sm text-gray-400">
          Verification code will be sent to:
        </p>
        <p className="text-base font-medium text-gray-100 mt-1">{email}</p>
      </div>

      {status === "idle" && (
        <Button
          onClick={sendVerificationCode}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          Send Verification Code
        </Button>
      )}

      {/* Show input field when code is sent or there's an error */}
      {(status === "sent" || status === "error" || status === "verifying") && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Enter verification code"
              value={verificationCode}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setVerificationCode(e.target.value)
              }
              className="bg-gray-800"
              maxLength={5}
              disabled={status === "verifying"}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={sendVerificationCode}
              className="flex-1"
              disabled={status === "verifying"}
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Resend Code
            </Button>
            <Button
              onClick={verifyCode}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={status === "verifying"}
            >
              {status === "verifying" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Verify
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {status === "sending" && (
        <div className="text-center py-4">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
          <p className="text-sm text-gray-400 mt-2">
            Sending verification code...
          </p>
        </div>
      )}

      {status === "verified" && (
        <div className="space-y-4">
          <div className="text-center py-4 text-green-500">
            <CheckCircle2 className="w-6 h-6 mx-auto" />
            <p className="text-sm mt-2">Email verified successfully!</p>
          </div>
          <Button
            onClick={onVerified}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      <div className="text-xs text-gray-400 text-center mt-4">
        Didn't receive the code? Check your spam folder or try a different email
        address.
      </div>
    </div>
  );
};

export default EmailVerification;
