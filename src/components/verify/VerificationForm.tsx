"use client";

// /components/verify/VerificationForm.tsx

import React, { useState } from "react";
import {
  Search,
  X,
  Check,
  AlertCircle,
  Twitter,
  Globe,
  Clock,
  Calendar,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";

interface VerificationResult {
  verified: boolean;
  tweetId: string;
  publishedAt: string;
  tweetData?: {
    author: string;
    handle: string;
    content: string;
    publishDate: string;
  };
}

const VerificationForm = () => {
  const [url, setUrl] = useState("");
  const [isValidUrl, setIsValidUrl] = useState(true);
  const [status, setStatus] = useState<
    "idle" | "loading" | "verified" | "unverified"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const validateUrl = (input: string) => {
    const twitterRegex =
      /^https?:\/\/((?:www\.)?twitter\.com|x\.com)\/\w+\/status\/\d+/;
    return twitterRegex.test(input);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setUrl(input);
    setIsValidUrl(input === "" || validateUrl(input));
    if (status !== "idle") setStatus("idle");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUrl(url)) {
      setIsValidUrl(false);
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      const response = await fetch("/api/verify-tweet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) throw new Error("Failed to verify tweet");

      const data = await response.json();
      setResult(data);
      setStatus(data.verified ? "verified" : "unverified");
    } catch (err) {
      setError("Failed to verify tweet. Please try again.");
      setStatus("idle");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col items-center p-4">
      {/* Banner */}
      <div className="w-full max-w-4xl mb-8 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          Tweet Verification Portal
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Verify if a tweet was published through our platform. Simply paste the
          tweet URL below to get started.
        </p>
      </div>

      <Card className="w-full max-w-2xl bg-gray-900/50 backdrop-blur-sm border-gray-700">
        <CardHeader className="border-b border-gray-800">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold">
            <Twitter className="w-5 h-5 text-blue-400" />
            Tweet Verification
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="https://twitter.com/username/status/123456789"
                  value={url}
                  onChange={handleUrlChange}
                  className={`pl-10 pr-4 py-3 bg-gray-800/50 border-gray-700 ${
                    !isValidUrl ? "border-red-500 focus:border-red-500" : ""
                  }`}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
              {!isValidUrl && (
                <p className="text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Please enter a valid Twitter URL
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={status === "loading" || !url || !isValidUrl}
            >
              {status === "loading" ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Verifying Tweet
                </div>
              ) : (
                "Verify Tweet"
              )}
            </Button>

            {/* Results Display */}
            {(status === "verified" || status === "unverified") && result && (
              <div
                className={`mt-6 rounded-lg overflow-hidden border ${
                  status === "verified"
                    ? "border-green-500/20 bg-green-500/5"
                    : "border-red-500/20 bg-red-500/5"
                }`}
              >
                <div className="p-4 border-b border-gray-800">
                  <div className="flex items-center gap-3">
                    {status === "verified" ? (
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-500" />
                        <span className="text-green-500 font-medium">
                          Verified Tweet
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <X className="w-5 h-5 text-red-500" />
                        <span className="text-red-500 font-medium">
                          Unverified Tweet
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {status === "verified" && result.tweetData && (
                  <div className="p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">
                            {result.tweetData.author}
                          </span>
                          <span className="text-gray-400">
                            @{result.tweetData.handle}
                          </span>
                        </div>
                        <p className="text-gray-300">
                          {result.tweetData.content}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Posted through our platform</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(result.publishedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {status === "unverified" && (
                  <div className="p-4">
                    <p className="text-gray-300">
                      This tweet was not published through our platform. It
                      might have been:
                    </p>
                    <ul className="mt-2 space-y-2 text-gray-400">
                      <li className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Posted directly on Twitter
                      </li>
                      <li className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Published using a different service
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-500">{error}</span>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerificationForm;
