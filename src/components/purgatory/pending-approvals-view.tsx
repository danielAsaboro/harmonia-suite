// // /components/purgatory/pending-approvals-view.tsx

"use client";

import React, { useState, useEffect } from "react";
import { ScheduledTable } from "@/components/purgatory/ScheduledTable";
import { ScheduledItem } from "@/components/purgatory/Columns";
import { Card } from "@/components/ui/card";
import { SortingState } from "@tanstack/react-table";
import {
  tweetToScheduledItem,
  threadToScheduledItem,
} from "@/utils/dataTransformers";
import { Loader2 } from "lucide-react";

export default function PendingApprovalsView() {
  const [items, setItems] = useState<ScheduledItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "scheduledFor", desc: false },
  ]);

  useEffect(() => {
    const fetchPendingApprovals = async () => {
      try {
        setLoading(true);

        // Fetch pending approvals using the new consolidated API endpoint
        const response = await fetch("/api/team/content/approval/pending");

        if (!response.ok) {
          throw new Error("Failed to fetch pending approvals");
        }

        const data = await response.json();

        // Transform tweets to ScheduledItem format with share links already included
        const tweetItems: ScheduledItem[] = data.tweets.map((tweet: any) =>
          tweetToScheduledItem(tweet, tweet.authorData)
        );

        // Transform threads to ScheduledItem format with share links already included
        const threadItems: ScheduledItem[] = data.threads.map(
          (threadData: any) =>
            threadToScheduledItem(threadData, threadData.authorData)
        );

        // Combine all items
        const allItems = [...tweetItems, ...threadItems];

        setItems(allItems);
        setError(null);
      } catch (err) {
        console.error("Error fetching pending approvals:", err);
        setError("Failed to load pending approvals. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPendingApprovals();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-400">Loading pending approvals...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-500">
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-gray-800 rounded-md hover:bg-gray-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">
          Pending Approvals
        </h1>
        <p className="text-gray-400">
          Content waiting for approval before publishing or Scheduling. Click
          column headers to sort.
        </p>
      </div>

      <Card className="p-6 bg-gray-900 border-gray-800">
        {items.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No pending approvals found.</p>
            <p className="mt-2 text-sm">
              Content submitted for approval will appear here.
            </p>
          </div>
        ) : (
          <ScheduledTable
            items={items}
            initialSorting={sorting}
            onSortingChange={setSorting}
          />
        )}
      </Card>
    </div>
  );
}
