// File: src/components/content/content-feature.tsx

"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "../solana/solana-provider";
import { AppHero } from "../ui/ui-layout";
import { ContentSubmit } from "./content-ui";
import { useHelmContext } from "../../contexts/helm/HelmContext";
import { useEffect, useState } from "react";

export default function ContentFeature() {
  const { publicKey } = useWallet();
  const { program, connected } = useHelmContext();
  const [twitterId, setTwitterId] = useState<string | null>(null);

  useEffect(() => {
    // In a real application, you would fetch the user's Twitter ID
    // from your backend or a different source
    setTwitterId("123456789");
  }, []);

  if (!publicKey) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="hero py-[64px]">
          <div className="hero-content text-center">
            <div>
              <h2 className="text-2xl mb-4">Connect your wallet to continue</h2>
              <WalletButton className="btn btn-primary" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!connected || !program) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="hero py-[64px]">
          <div className="hero-content text-center">
            <div>
              <h2 className="text-2xl mb-4">Connecting to program...</h2>
              <div className="loading loading-spinner loading-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!twitterId) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="hero py-[64px]">
          <div className="hero-content text-center">
            <div>
              <h2 className="text-2xl mb-4">Loading Twitter account...</h2>
              <div className="loading loading-spinner loading-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AppHero
        title="Content Manager"
        subtitle="Submit and manage your social content"
      >
        <ContentSubmit twitterId={twitterId} />
      </AppHero>
    </div>
  );
}
