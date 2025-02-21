// /components/purgatory/pending-approvals-view.tsx
"use client";

import React, { useState, useEffect } from "react";
import { ScheduledTable } from "@/components/purgatory/ScheduledTable";
import { ScheduledItem } from "@/components/purgatory/Columns";
import { Card } from "@/components/ui/card";
import { SortingState } from "@tanstack/react-table";
import {
  tweetToScheduledItem,
  threadToScheduledItem,
  addShareLinkToItem,
} from "@/utils/dataTransformers";
import { Loader2 } from "lucide-react";

interface ShareLinkInfo {
  contentId: string;
  shareLink?: string;
  sharedDraftToken?: string;
}

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

        // Fetch user data for author information
        const userResponse = await fetch("/api/auth/twitter/user");
        if (!userResponse.ok) throw new Error("Failed to fetch user data");
        const userData = await userResponse.json();

        // Fetch pending approvals
        const response = await fetch("/api/approvals/pending");
        if (!response.ok) throw new Error("Failed to fetch pending approvals");

        const data = await response.json();

        // Create a list of content IDs to fetch shared draft info for
        const contentIds = [
          ...data.tweets.map((tweet: any) => ({
            id: tweet.id,
            type: "tweet",
          })),
          ...data.threads.map((thread: any) => ({
            id: thread.thread.id,
            type: "thread",
          })),
        ];

        // Transform tweets and threads to ScheduledItem format
        const tweetItems: ScheduledItem[] = data.tweets.map((tweet: any) =>
          tweetToScheduledItem(tweet, userData)
        );

        const threadItems: ScheduledItem[] = data.threads.map((thread: any) =>
          threadToScheduledItem(thread, userData)
        );

        // Combine all items
        const allItems = [...tweetItems, ...threadItems];

        // Fetch shared draft info for each content item
        // This is done in batches to avoid too many simultaneous requests
        const shareLinkInfoMap = new Map<string, ShareLinkInfo>();

        // Process in batches of 5
        const batchSize = 5;
        for (let i = 0; i < contentIds.length; i += batchSize) {
          const batch = contentIds.slice(i, i + batchSize);

          const batchPromises = batch.map(async ({ id, type }) => {
            try {
              const approvalResponse = await fetch(
                `/api/approval?id=${id}&type=${type}`
              );
              if (approvalResponse.ok) {
                const approvalData = await approvalResponse.json();
                if (approvalData.sharedDraft) {
                  return {
                    contentId: id,
                    shareLink: approvalData.sharedDraft.shareLink,
                    sharedDraftToken: approvalData.sharedDraft.token,
                  };
                }
              }
              return { contentId: id };
            } catch (e) {
              console.error(`Failed to fetch share link for ${type} ${id}:`, e);
              return { contentId: id };
            }
          });

          const batchResults = await Promise.all(batchPromises);

          // Add to the map
          batchResults.forEach((info) => {
            if (info.contentId) {
              shareLinkInfoMap.set(info.contentId, info);
            }
          });
        }

        // Update items with share links
        const itemsWithShareLinks = allItems.map((item) => {
          const shareInfo = shareLinkInfoMap.get(item.id);
          if (shareInfo) {
            return addShareLinkToItem(
              item,
              shareInfo.shareLink,
              shareInfo.sharedDraftToken
            );
          }
          return item;
        });

        setItems(itemsWithShareLinks);
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
          Content waiting for approval before publishing. Click column headers
          to sort.
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
