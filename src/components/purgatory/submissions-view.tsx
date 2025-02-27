// /components/purgatory/submissions-view.tsx
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function SubmissionsView() {
  const [items, setItems] = useState<ScheduledItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "scheduledFor", desc: true },
  ]);
  const [activeTab, setActiveTab] = useState("all");

  const fetchSubmissions = async (status = "all") => {
    try {
      setLoading(true);

      // Fetch submissions using the API
      const response = await fetch(
        `/api/team/content/submissions?status=${status}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch submissions");
      }

      const data = await response.json();

      // Get user data for the author
      const userResponse = await fetch("/api/auth/twitter/user");
      if (!userResponse.ok) throw new Error("Failed to fetch user data");
      const userData = await userResponse.json();

      // Transform tweets to ScheduledItem format
      // const tweetItems: ScheduledItem[] = data.tweets.map((tweet: any) =>
      //   tweetToScheduledItem(tweet, userData)
      // );

      // // Transform threads to ScheduledItem format
      // const threadItems: ScheduledItem[] = data.threads.map((threadData: any) =>
      //   threadToScheduledItem(threadData, userData)
      // );

      const tweetItems: ScheduledItem[] = data.tweets.map((tweet: any) => {
        const item = tweetToScheduledItem(tweet, userData);
        return {
          ...item,
          teamName: tweet.teamName,
          submissionDate: new Date(tweet.submissionDate),
          rejectionReason: tweet.rejectionReason,
        };
      });

      const threadItems: ScheduledItem[] = data.threads.map(
        (threadData: any) => {
          const item = threadToScheduledItem(threadData, userData);
          return {
            ...item,
            teamName: threadData.teamName,
            submissionDate: new Date(threadData.submissionDate),
            rejectionReason: threadData.rejectionReason,
          };
        }
      );

      // Combine all items
      const allItems = [...tweetItems, ...threadItems];

      setItems(allItems);
      setError(null);
    } catch (err) {
      console.error("Error fetching submissions:", err);
      setError("Failed to load submissions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions(activeTab);
  }, [activeTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-400">Loading submissions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-500">
        <p>{error}</p>
        <button
          onClick={() => fetchSubmissions(activeTab)}
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
        <h1 className="text-2xl font-bold text-white mb-2">My Submissions</h1>
        <p className="text-gray-400">
          Track the status of your submitted content
        </p>
      </div>

      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={handleTabChange}
        className="mb-6"
      >
        <TabsList className="bg-gray-800">
          <TabsTrigger value="all" className="data-[state=active]:bg-blue-600">
            All{" "}
            <Badge variant="outline" className="ml-2">
              {items.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="pending_approval"
            className="data-[state=active]:bg-yellow-600"
          >
            Pending
          </TabsTrigger>
          <TabsTrigger
            value="approved"
            className="data-[state=active]:bg-green-600"
          >
            Approved
          </TabsTrigger>
          <TabsTrigger
            value="rejected"
            className="data-[state=active]:bg-red-600"
          >
            Rejected
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card className="p-6 bg-gray-900 border-gray-800">
            {items.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>No submissions found.</p>
                <p className="mt-2 text-sm">
                  {activeTab === "all"
                    ? "You haven't submitted any content for approval yet."
                    : `You don't have any ${activeTab.replace("_", " ")} submissions.`}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
