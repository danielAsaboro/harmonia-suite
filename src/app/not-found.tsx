// app/not-found.tsx
"use client";
import Link from "next/link";
import { ArrowLeft, Home, RefreshCw } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black px-4">
      <div className="max-w-md w-full rounded-xl border border-neutral-800 bg-black shadow-lg overflow-hidden p-8 space-y-8">
        <div className="text-center">
          <h1 className="text-9xl font-bold text-blue-500">404</h1>
          <h2 className="text-3xl font-semibold text-white mt-6">
            Page Not Found
          </h2>
          <p className="text-neutral-400 mt-4">
            The page you're looking for doesn't seem to exist or might have been
            moved.
          </p>
        </div>

        {/* Twitter-style info container */}
        <div className="relative overflow-hidden rounded-lg bg-neutral-900 p-4 border border-neutral-800">
          <div className="text-sm text-neutral-300">
            You may want to check the URL or navigate back to a page that
            exists.
          </div>
        </div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center rounded-full bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span>Go Back</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-neutral-700 bg-black px-4 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black"
          >
            <Home className="mr-2 h-4 w-4" />
            <span>Go Home</span>
          </Link>

          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-full border border-neutral-700 bg-black px-4 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            <span>Refresh Page</span>
          </button>
        </div>

        <div className="border-t border-neutral-800 pt-4 text-center text-sm text-neutral-500">
          <p>
            If you believe this is an error, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
}
