// /app/scheduled/page.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scheduled Posts",
  description: "View and manage your scheduled tweets and threads.",
};

import ScheduledView from "../../../components/scheduler/scheduled-view";

export default function ScheduledPage() {
  return <ScheduledView />;
}
