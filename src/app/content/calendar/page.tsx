// /app/calendar/page.tsx
"use client";
import { useEffect, useState, useRef } from "react";
import CalendarView from "@/components/calendar/CalendarView";
import { tweetStorage } from "@/utils/localStorage";
import { KeyboardProvider } from "@/contexts/keyboard-context";
import { CalendarEvent } from "@/types/calendar";
import { Loader2 } from "lucide-react";
import { Tweet, Thread } from "@/types/tweet";
import { Toast } from "@/components/ui/toast";

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning";
  } | null>(null);
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

  // Load scheduled content and set up auto-refresh
  useEffect(() => {
    const loadScheduledContent = () => {
      try {
        setLoading(true);

        // Get standalone scheduled tweets (those without threadId)
        const tweets = tweetStorage
          .getTweets()
          .filter((t) => t.scheduledFor && !t.threadId);

        // Get threads with scheduled dates
        const threads = tweetStorage.getThreads().filter((t) => t.scheduledFor);

        // Convert standalone tweets to calendar events
        const tweetEvents: CalendarEvent[] = tweets.map((tweet) =>
          mapTweetToEvent(tweet)
        );

        // Convert threads to calendar events
        const threadEvents: CalendarEvent[] = threads.map((thread) =>
          mapThreadToEvent(thread)
        );

        // Combine all events and sort by date
        const allEvents = [...tweetEvents, ...threadEvents].sort(
          (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
        );

        setEvents(allEvents);
      } catch (error) {
        console.error("Error loading scheduled content:", error);
        setToast({
          message: "Failed to load scheduled content. Please try again.",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    // Load content immediately
    loadScheduledContent();

    // Set up refresh every 30 seconds
    refreshInterval.current = setInterval(loadScheduledContent, 30000);

    // Clean up on unmount
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, []);

  // Convert a tweet to a calendar event
  const mapTweetToEvent = (tweet: Tweet): CalendarEvent => {
    return {
      id: tweet.id,
      title:
        tweet.content.slice(0, 50) + (tweet.content.length > 50 ? "..." : ""),
      start: new Date(tweet.scheduledFor!),
      end: new Date(tweet.scheduledFor!),
      type: "tweet",
      tags: tweet.tags?.map((tag) => tag.name) || [],
      isDeletable: true,
      status: tweet.status,
    };
  };

  // Convert a thread to a calendar event
  const mapThreadToEvent = (thread: Thread): CalendarEvent => {
    const firstTweet = tweetStorage.getThreadPreview(thread.id);

    return {
      id: thread.id,
      title: firstTweet
        ? firstTweet.content.slice(0, 40) +
          (firstTweet.content.length > 40 ? "..." : "")
        : `Thread (${thread.tweetIds.length} tweets)`,
      start: new Date(thread.scheduledFor!),
      end: new Date(thread.scheduledFor!),
      type: "thread",
      tags: thread.tags?.map((tag) => tag.name) || [],
      isDeletable: true,
      status: thread.status,
    };
  };

  // Handle event creation (creating an empty slot)
  const handleEventCreate = (eventData: Partial<CalendarEvent>) => {
    setToast({
      message:
        "Use the composer to create tweets or threads first, then schedule them.",
      type: "warning",
    });
  };

  // Handle rescheduling events
  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    // Check if this is a scheduled tweet or thread by ID lookup
    const tweet = tweetStorage
      .getTweets()
      .find((t) => t.id === updatedEvent.id);
    const thread = tweetStorage
      .getThreads()
      .find((t) => t.id === updatedEvent.id);

    try {
      if (tweet) {
        const updatedTweet = {
          ...tweet,
          scheduledFor: updatedEvent.start,
        };
        tweetStorage.saveTweet(updatedTweet, true);

        setToast({
          message: "Tweet rescheduled successfully",
          type: "success",
        });
      } else if (thread) {
        const updatedThread = {
          ...thread,
          scheduledFor: updatedEvent.start,
        };
        // Get the tweets for this thread
        const threadTweets = tweetStorage
          .getTweets()
          .filter((t) => t.threadId === thread.id);
        tweetStorage.saveThread(updatedThread, threadTweets, true);

        setToast({
          message: "Thread rescheduled successfully",
          type: "success",
        });
      }

      // Update the events array with the updated event
      setEvents((prev) =>
        prev.map((event) =>
          event.id === updatedEvent.id ? updatedEvent : event
        )
      );
    } catch (error) {
      console.error("Error updating event:", error);
      setToast({
        message: "Failed to update scheduled content. Please try again.",
        type: "error",
      });
    }
  };

  // Handle drag and drop rescheduling
  const handleEventDrop = (event: CalendarEvent, start: Date, end: Date) => {
    // Create an updated event with the new dates
    const updatedEvent = {
      ...event,
      start,
      end: start, // For tweets/threads, end time is same as start
    };

    // Use the update handler to save the change
    handleEventUpdate(updatedEvent);
  };

  // Handle unscheduling (removing schedule but keeping as draft)
  const handleEventDelete = (eventToDelete: CalendarEvent) => {
    try {
      // Check if this is a scheduled tweet or thread by ID lookup
      const tweet = tweetStorage
        .getTweets()
        .find((t) => t.id === eventToDelete.id);
      const thread = tweetStorage
        .getThreads()
        .find((t) => t.id === eventToDelete.id);

      if (tweet) {
        // Unschedule by setting to draft status and removing scheduledFor
        const updatedTweet = {
          ...tweet,
          status: "draft" as const,
          scheduledFor: undefined,
        };
        tweetStorage.saveTweet(updatedTweet, true);

        setToast({
          message: "Tweet unscheduled and moved to drafts",
          type: "success",
        });
      } else if (thread) {
        const updatedThread = {
          ...thread,
          status: "draft" as const,
          scheduledFor: undefined,
        };
        // Get thread tweets to save them together
        const threadTweets = tweetStorage
          .getTweets()
          .filter((t) => t.threadId === thread.id);
        tweetStorage.saveThread(updatedThread, threadTweets, true);

        setToast({
          message: "Thread unscheduled and moved to drafts",
          type: "success",
        });
      }

      // Remove from events array
      setEvents((prev) =>
        prev.filter((event) => event.id !== eventToDelete.id)
      );
    } catch (error) {
      console.error("Error deleting event:", error);
      setToast({
        message: "Failed to unschedule content. Please try again.",
        type: "error",
      });
    }
  };

  // Get user timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <KeyboardProvider>
      <div className="h-screen bg-black text-gray-100 flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 text-[#1D9BF0] animate-spin" />
              <p className="text-neutral-400">
                Loading your scheduled content...
              </p>
            </div>
          </div>
        ) : (
          <CalendarView
            events={events}
            onEventCreate={handleEventCreate}
            onEventUpdate={handleEventUpdate}
            onEventDrop={handleEventDrop}
            onEventDelete={handleEventDelete}
            timezone={userTimezone}
          />
        )}

        {/* Toast notifications */}
        {toast && (
          <div className="fixed bottom-4 right-4 z-50">
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          </div>
        )}
      </div>
    </KeyboardProvider>
  );
}
