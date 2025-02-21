"use client";
// /components/purgatory/scheduled-view.tsx
import React, { useState } from "react";
import { ScheduledTable } from "@/components/purgatory/ScheduledTable";
import { ScheduledItem } from "@/components/purgatory/Columns";
import { Card } from "@/components/ui/card";
import { SortingState } from "@tanstack/react-table";

const SAMPLE_DATA: ScheduledItem[] = [
  {
    id: "1",
    type: "tweet",
    author: {
      id: "author1",
      name: "John Doe",
      handle: "johndoe",
    },
    scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
    tags: ["marketing", "tech"],
    content: "This is a scheduled tweet about the latest tech trends...",
    readingTime: "1 min",
    status: "scheduled",
    createdAt: new Date(),
    mediaIds: ["media1", "media2"],
  },
  {
    id: "2",
    type: "thread",
    author: {
      id: "author2",
      name: "Alice Smith",
      handle: "alicesmith",
    },
    scheduledFor: new Date(Date.now() + 48 * 60 * 60 * 1000), // day after tomorrow
    tags: ["thread", "tutorial"],
    content: "A comprehensive guide to modern web development...",
    readingTime: "5 min",
    status: "scheduled",
    createdAt: new Date(),
    threadTweets: [],
    totalTweets: 5,
  },
  {
    id: "3",
    type: "tweet",
    author: {
      id: "author3",
      name: "Bob Johnson",
      handle: "bobjohnson",
    },
    scheduledFor: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
    tags: ["announcement", "product"],
    content: "Excited to announce our latest feature release!",
    readingTime: "2 min",
    status: "scheduled",
    createdAt: new Date(),
  },
  {
    id: "1",
    type: "tweet",
    author: {
      id: "author1",
      name: "John Doe",
      handle: "johndoe",
    },
    scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
    tags: ["marketing", "tech"],
    content: "This is a scheduled tweet about the latest tech trends...",
    readingTime: "1 min",
    status: "scheduled",
    createdAt: new Date(),
    mediaIds: ["media1", "media2"],
  },
  {
    id: "2",
    type: "thread",
    author: {
      id: "author2",
      name: "Alice Smith",
      handle: "alicesmith",
    },
    scheduledFor: new Date(Date.now() + 48 * 60 * 60 * 1000), // day after tomorrow
    tags: ["thread", "tutorial"],
    content: "A comprehensive guide to modern web development...",
    readingTime: "5 min",
    status: "scheduled",
    createdAt: new Date(),
    threadTweets: [],
    totalTweets: 5,
  },
  {
    id: "3",
    type: "tweet",
    author: {
      id: "author3",
      name: "Bob Johnson",
      handle: "bobjohnson",
    },
    scheduledFor: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
    tags: ["announcement", "product"],
    content: "Excited to announce our latest feature release!",
    readingTime: "2 min",
    status: "scheduled",
    createdAt: new Date(),
  },
];

export default function ScheduledView() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "scheduledFor", desc: false },
  ]);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Scheduled Posts</h1>
        <p className="text-gray-400">
          Manage your upcoming tweets and threads. Click column headers to sort.
        </p>
      </div>

      <Card className="p-6 bg-gray-900 border-gray-800">
        <ScheduledTable
          items={SAMPLE_DATA}
          initialSorting={sorting}
          onSortingChange={setSorting}
        />
      </Card>
    </div>
  );
}
