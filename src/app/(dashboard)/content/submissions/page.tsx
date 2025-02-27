// /app/submissions/page.tsx
import SubmissionsView from "@/components/purgatory/submissions-view";

export const metadata = {
  title: "My Submissions | Content Management",
  description: "View and manage your content submissions",
};

export default function SubmissionsPage() {
  return <SubmissionsView />;
}
