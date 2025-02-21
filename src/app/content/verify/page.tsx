// /app/verify/page.tsx
import VerificationForm from "@/components/verify/VerificationForm";

export default function VerifyPage() {
  return <VerificationForm />;
}

// Set metadata for the page
export const metadata = {
  title: "Verify Tweet Origin",
  description: "Verify if a tweet was published through our platform",
};
