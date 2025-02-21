// File: src/components/content/content-ui.tsx

"use client";

import { useState } from "react";
import { useContentActions } from "./content-data-access";
import toast from "react-hot-toast";

export function ContentSubmit({ twitterId }: { twitterId: string }) {
  const [content, setContent] = useState("");
  const { submitContent } = useContentActions(twitterId);

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("Please enter some content");
      return;
    }

    const result = await submitContent.mutateAsync(
      {
        content,
        contentType: { tweet: {} }, //not meant to be hardcoded lol
      },
      {
        onSuccess: (txId) => {
          console.log("i'm inside on success");
          // Only show success if we have a transaction ID
          if (txId) {
            setContent("");
            toast.success("Content submitted successfully");
          }
        },
        onError: (error: any) => {
          // Don't show error toast for user rejections
          if (error.message === "User rejected the request.") {
            toast.error(
              `Failed to submit content because you cancelled the request; I hope everything is fine? is wrong?`
            );
            return;
          }
          toast.error(error.message || "Failed to submit content");
        },
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Content</span>
        </label>
        <textarea
          className="textarea textarea-bordered h-24"
          placeholder="Enter your content here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      <div className="mt-4">
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={submitContent.isPending || !content.trim()}
        >
          {submitContent.isPending ? "Submitting..." : "Submit Content"}
        </button>
      </div>
    </div>
  );
}
