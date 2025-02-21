// /app/content/purgatory/page.tsx
import ScheduledView from "@/components/purgatory/scheduled-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scheduled Posts",
  description: "View and manage your scheduled tweets and threads.",
};


export default function ScheduledPage() {
  return <ScheduledView />;
}
