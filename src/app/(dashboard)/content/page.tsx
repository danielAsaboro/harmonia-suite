// /content/page.tsx
"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Twitter,
  MessageCircle,
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Plus,
  LucideIcon,
  Menu,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Type definitions
interface PendingPost {
  id: string;
  type: "twitter" | "telegram";
  content: string;
  scheduledFor: string;
  status: "pending" | "approved";
}

interface TwitterAnalytics {
  impressions: number;
  engagement: number;
  topPost: string;
}

interface TelegramAnalytics {
  responses: number;
  avgResponseTime: string;
  activeTemplates: number;
}

interface Analytics {
  twitter: TwitterAnalytics;
  telegram: TelegramAnalytics;
}

interface QuickAction {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  href: string;
}

interface MetricDisplay {
  label: string;
  value: string | number;
  type: "number" | "percentage" | "text" | "time";
}

interface PlatformAnalytics {
  platform: string;
  icon: LucideIcon;
  color: string;
  metrics: MetricDisplay[];
}

export default function ContentStudioPage() {
  const router = useRouter();
  const pendingPosts: PendingPost[] = [
    {
      id: "1",
      type: "twitter",
      content: "Exciting news! Join our upcoming...",
      scheduledFor: "2024-01-15 14:00",
      status: "pending",
    },
    {
      id: "2",
      type: "telegram",
      content: "Welcome to all new members...",
      scheduledFor: "2024-01-15 15:30",
      status: "approved",
    },
  ];

  const analytics: Analytics = {
    twitter: {
      impressions: 12500,
      engagement: 3.2,
      topPost: "Announcement: New bounty program...",
    },
    telegram: {
      responses: 245,
      avgResponseTime: "2.5m",
      activeTemplates: 12,
    },
  };

  const quickActions: QuickAction[] = [
    {
      title: "Twitter Composer",
      description: "Create and schedule tweets",
      icon: Twitter,
      color: "text-blue-500",
      href: "/content/compose/twitter",
    },
    {
      title: "Response Templates",
      description: "Manage Telegram responses",
      icon: MessageCircle,
      color: "text-purple-500",
      href: "/content/templates",
    },
    {
      title: "Content Calendar",
      description: "View scheduled content",
      icon: Calendar,
      color: "text-green-500",
      href: "/content/calendar",
    },
  ];

  const platformAnalytics: PlatformAnalytics[] = [
    {
      platform: "Twitter",
      icon: Twitter,
      color: "text-blue-500",
      metrics: [
        {
          label: "Impressions",
          value: analytics.twitter.impressions.toLocaleString(),
          type: "number",
        },
        {
          label: "Engagement",
          value: `${analytics.twitter.engagement}%`,
          type: "percentage",
        },
        { label: "Top Post", value: analytics.twitter.topPost, type: "text" },
      ],
    },
    {
      platform: "Telegram",
      icon: MessageCircle,
      color: "text-purple-500",
      metrics: [
        {
          label: "Responses",
          value: analytics.telegram.responses,
          type: "number",
        },
        {
          label: "Avg Response Time",
          value: analytics.telegram.avgResponseTime,
          type: "time",
        },
        {
          label: "Active Templates",
          value: analytics.telegram.activeTemplates,
          type: "number",
        },
      ],
    },
  ];

  const getMetricClassName = (type: MetricDisplay["type"]): string => {
    switch (type) {
      case "text":
        return "text-sm truncate";
      default:
        return "text-lg";
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
      {/* Header Section with responsive adjustments */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            Content Studio
          </h1>
          <p className="mt-1 md:mt-2 text-sm md:text-base text-zinc-500 dark:text-zinc-400">
            Manage and schedule your social media content
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            className="flex items-center gap-2 text-xs md:text-sm flex-1 sm:flex-auto justify-center"
          >
            <Plus className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden xs:inline">New Template</span>
            <span className="xs:hidden">Template</span>
          </Button>
          <Button
            onClick={() => router.push("/content/compose/twitter")}
            className="flex items-center gap-2 text-xs md:text-sm flex-1 sm:flex-auto justify-center"
          >
            <Twitter className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden xs:inline">New Tweet</span>
            <span className="xs:hidden">Tweet</span>
          </Button>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {quickActions.map((action) => (
          <Link href={action.href} key={action.title}>
            <Card
              variant="glass"
              className="transition-all duration-200 hover:scale-[1.02]"
            >
              <CardContent className="p-4 md:p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-1">
                      {action.title}
                    </h3>
                    <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400">
                      {action.description}
                    </p>
                  </div>
                  <action.icon
                    className={`w-6 h-6 md:w-8 md:h-8 ${action.color}`}
                  />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Content Management & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Content */}
        <Card variant="elevated">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50 text-base md:text-lg">
              <Clock className="w-4 h-4 md:w-5 md:h-5 text-zinc-500" />
              Pending Content
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Content awaiting review or scheduled for posting
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            <div className="space-y-3">
              {pendingPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800"
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    {post.type === "twitter" ? (
                      <Twitter className="w-3 h-3 md:w-4 md:h-4 text-blue-500" />
                    ) : (
                      <MessageCircle className="w-3 h-3 md:w-4 md:h-4 text-purple-500" />
                    )}
                    <div>
                      <p className="text-xs md:text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate w-36 sm:w-48 md:w-64 lg:w-36 xl:w-48">
                        {post.content}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {post.scheduledFor}
                      </p>
                    </div>
                  </div>
                  {post.status === "approved" ? (
                    <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-3 h-3 md:w-4 md:h-4 text-yellow-500" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Analytics Overview */}
        <Card variant="glass">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50 text-base md:text-lg">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-zinc-500" />
              Analytics Overview
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Performance metrics across platforms
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            <div className="space-y-6">
              {platformAnalytics.map((platform) => (
                <div key={platform.platform} className="space-y-3">
                  <div className={`flex items-center gap-2 ${platform.color}`}>
                    <platform.icon className="w-3 h-3 md:w-4 md:h-4" />
                    <h4 className="font-semibold text-sm md:text-base">
                      {platform.platform} Performance
                    </h4>
                  </div>
                  <div className="grid grid-cols-3 gap-3 md:gap-4">
                    {platform.metrics.map((metric) => (
                      <div key={metric.label}>
                        <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400">
                          {metric.label}
                        </p>
                        <p
                          className={`${getMetricClassName(
                            metric.type
                          )} text-sm md:text-base lg:text-lg font-bold text-zinc-900 dark:text-zinc-50`}
                        >
                          {metric.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
