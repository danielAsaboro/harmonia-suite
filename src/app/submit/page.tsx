// File: src/components/examples/ContentSubmission.tsx
"use client";
import { useContent } from "@/hooks/helm";
import { useState } from "react";

export default function SubmitPage() {
  return (
    <div>
      <ContentSubmission twitterId={""}></ContentSubmission>
    </div>
  );
}
function ContentSubmission({ twitterId }: { twitterId: string }) {
  const { submitContent, loading, error } = useContent(twitterId);
  const [content, setContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await submitContent(content, { tweet: {} });
      setContent("");
      // Show success message
    } catch (err) {
      // Handle error
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Submit New Tweet</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="What's happening?"
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
        >
          {loading ? "Submitting..." : "Submit for Approval"}
        </button>
        {error && <p className="mt-2 text-red-500">{error.message}</p>}
      </form>
    </div>
  );
}
