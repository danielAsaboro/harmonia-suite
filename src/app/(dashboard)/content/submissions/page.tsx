// /app/content/submissions/page.tsx
import SubmissionsView from "@/components/purgatory/submissions-view";
import { divide } from "lodash";

export const metadata = {
  title: "My Submissions | Content Management",
  description: "View and manage your content submissions",
};

export default function SubmissionsPage() {
  return (
    <div className="px-8">
      <SubmissionsView />
    </div>
  );
}
