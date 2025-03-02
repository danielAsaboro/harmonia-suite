// /overview/page.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Check,
  Twitter,
  MessageCircle,
  Users,
  FileText,
  ActivitySquare,
  ArrowUp,
  ArrowDown,
  Menu,
} from "lucide-react";

import { useRouter } from "next/navigation";

export default function OverviewPage() {
  const router = useRouter();
  const systemStatus = {
    llm: "operational",
    telegram: "operational",
    twitter: "degraded",
  };

  const quickStats = {
    activeDocuments: {
      value: 24,
      trend: "up",
      change: "+12%",
    },
    pendingTweets: {
      value: 3,
      trend: "down",
      change: "-2",
    },
    recentQueries: {
      value: 156,
      trend: "up",
      change: "+23%",
    },
    activeUsers: {
      value: 89,
      trend: "up",
      change: "+5%",
    },
  };

  const recentActivity = [
    {
      type: "query",
      message: "Rust developer inquiry matched with @dev_name",
      time: "2 mins ago",
      icon: MessageCircle,
    },
    {
      type: "tweet",
      message: "New tweet draft created for review",
      time: "15 mins ago",
      icon: Twitter,
    },
    {
      type: "document",
      message: "New knowledge base document uploaded",
      time: "1 hour ago",
      icon: FileText,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "text-green-500 bg-green-500/10";
      case "degraded":
        return "text-yellow-500 bg-yellow-500/10";
      default:
        return "text-red-500 bg-red-500/10";
    }
  };

  const getTrendIcon = (trend: string) => {
    return trend === "up" ? (
      <ArrowUp className="w-3 h-3 text-green-500" />
    ) : (
      <ArrowDown className="w-3 h-3 text-red-500" />
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto bg-black text-white">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-white">
            System Overview
          </h1>
          <p className="text-neutral-400 mt-1">
            Real-time monitoring and system status
          </p>
        </div>
        <div className="flex gap-2 md:gap-4 w-full sm:w-auto">
          <Button
            variant="outline"
            className="gap-2 text-xs sm:text-sm flex-1 sm:flex-initial justify-center border-neutral-700 bg-black text-neutral-300 hover:bg-neutral-900 hover:text-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black"
          >
            <FileText className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden xs:inline">Upload</span> Document
          </Button>
          <Button
            onClick={() => router.push("/content/compose/twitter")}
            className="gap-2 text-xs sm:text-sm flex-1 sm:flex-initial justify-center bg-blue-500 text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black rounded-full"
          >
            <Twitter className="w-3 h-3 md:w-4 md:h-4" />
            New Tweet
          </Button>
        </div>
      </div>

      {/* System Status Section */}
      {/* <Card className="border-neutral-800 bg-black shadow-lg">
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="text-base text-white">System Status</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {Object.entries(systemStatus).map(([key, status]) => (
            <div
              key={key}
              className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-neutral-900 border border-neutral-800"
            >
              <div className="flex items-center gap-2 md:gap-3">
                {key === "llm" && (
                  <ActivitySquare className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                )}
                {key === "telegram" && (
                  <MessageCircle className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                )}
                {key === "twitter" && (
                  <Twitter className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                )}
                <div>
                  <p className="text-xs md:text-sm font-medium text-neutral-300">
                    {key.toUpperCase()}
                  </p>
                  <div
                    className={`inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-xs font-medium ${getStatusColor(
                      status
                    )}`}
                  >
                    {status}
                  </div>
                </div>
              </div>
              {status === "operational" ? (
                <Check className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
              ) : (
                <AlertCircle
                  className={`w-4 h-4 md:w-5 md:h-5 ${
                    status === "degraded" ? "text-yellow-500" : "text-red-500"
                  }`}
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card> */}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {Object.entries(quickStats).map(([key, data]) => (
          <Card key={key} className="border-neutral-800 bg-black shadow-lg">
            <CardHeader className="pb-1 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-2 text-neutral-300">
                {key === "activeDocuments" && (
                  <FileText className="w-3 h-3 md:w-4 md:h-4 text-blue-400" />
                )}
                {key === "pendingTweets" && (
                  <Twitter className="w-3 h-3 md:w-4 md:h-4 text-blue-400" />
                )}
                {key === "recentQueries" && (
                  <MessageCircle className="w-3 h-3 md:w-4 md:h-4 text-blue-400" />
                )}
                {key === "activeUsers" && (
                  <Users className="w-3 h-3 md:w-4 md:h-4 text-blue-400" />
                )}
                {key.split(/(?=[A-Z])/).join(" ")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <span className="text-xl md:text-2xl font-semibold text-white">
                  {data.value}
                </span>
                <div className="flex items-center gap-1 text-xs md:text-sm">
                  {getTrendIcon(data.trend)}
                  <span
                    className={
                      data.trend === "up" ? "text-green-500" : "text-red-500"
                    }
                  >
                    {data.change}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity Feed */}
      <Card className="border-neutral-800 bg-black shadow-lg">
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="text-base md:text-lg text-white">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {recentActivity.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div
                  key={index}
                  className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg transition-colors hover:bg-neutral-900 border border-transparent hover:border-neutral-800"
                >
                  <div className="p-1.5 md:p-2 rounded-full bg-neutral-800">
                    <Icon className="w-3 h-3 md:w-4 md:h-4 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm text-neutral-200">
                      {activity.message}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
