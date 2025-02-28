// app/not-found.tsx
"use client";
import Link from "next/link";
import { ArrowLeft, Home, RefreshCw } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden p-8 space-y-8">
        <div className="text-center">
          <h1 className="text-9xl font-bold text-blue-500">404</h1>
          <h2 className="text-3xl font-semibold text-gray-800 mt-6">
            Page Not Found
          </h2>
          <p className="text-gray-500 mt-4">
            The page you're looking for doesn't seem to exist or might have been
            moved.
          </p>
        </div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg transition duration-200"
          >
            <ArrowLeft size={20} />
            <span>Go Back</span>
          </button>

          <Link
            href="/"
            className="flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-6 rounded-lg transition duration-200"
          >
            <Home size={20} />
            <span>Go Home</span>
          </Link>

          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center space-x-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-300 py-3 px-6 rounded-lg transition duration-200"
          >
            <RefreshCw size={20} />
            <span>Refresh Page</span>
          </button>
        </div>

        <div className="border-t border-gray-200 pt-4 text-center text-sm text-gray-500">
          <p>
            If you believe this is an error, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
}
