// src/app/content/submit/page.tsx

"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { AppHero } from "@/components/ui/ui-layout";
import { WalletButton } from "@/components/solana/solana-provider";
import { useContent } from "@/hooks/helm";

export default function SubmitPage() {
  const TEMP_TWITTER_ID = "123456789";
  const { submitContent, loading, error } = useContent(TEMP_TWITTER_ID);
  const { publicKey } = useWallet();
  const [content, setContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      console.log("Submitting content...");
      const result = await submitContent(content, { tweet: {} });
      console.log("Submission result:", result);
      setContent("");
    } catch (err) {
      console.error("Error submitting content:", err);
    }
  };

  if (!publicKey) {
    return (
      <div className="hero py-[64px]">
        <div className="hero-content text-center">
          <div>
            <h1 className="text-5xl font-bold mb-4">Connect Wallet</h1>
            <WalletButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AppHero
        title="Submit Content"
        subtitle="Create new content for approval"
      >
        <p className="text-sm">Connected: {publicKey.toString()}</p>
      </AppHero>

      <div className="max-w-xl mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-2 border rounded min-h-[150px]"
            placeholder="What would you like to tweet?"
          />
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? "Submitting..." : "Submit for Approval"}
          </button>
          {error && <div className="alert alert-error">{error.message}</div>}
        </form>
      </div>
    </div>
  );
}
