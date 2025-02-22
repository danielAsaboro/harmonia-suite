// app/content/compose/twitter/layout.tsx
"use client";
import { Suspense } from "react";
import React, { useState, useEffect, useRef } from "react";
import { EditorProvider, useEditor } from "@/components/editor/context/Editor";
import {
  UserAccountProvider,
  useUserAccount,
} from "@/components/editor/context/account";

import LoadingState from "@/components/editor/LoadingState";
import { KeyboardProvider, useKeyboard } from "@/contexts/keyboard-context";
import KeyboardShortcutsDialog from "@/components/keyboard/KeyboardShortcutsDialog";
import SearchModal from "@/components/search/SearchModal";

function WholeEditor({ children }: { children: React.ReactNode }) {
  const { showSearch, setShowSearch, showShortcuts, setShowShortcuts } =
    useKeyboard();

  // Monitor showSearch changes
  // and close shortcuts if needed
  useEffect(() => {
    if (showSearch && showShortcuts) {
      setShowShortcuts(false);
    }
  });

  // Monitor showShortcuts changes
  // and close search if needed
  useEffect(() => {
    if (showShortcuts && showSearch) {
      setShowSearch(false);
    }
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (showSearch) {
          setShowSearch(false);
        }
        if (showShortcuts) {
          setShowShortcuts(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showSearch, showShortcuts, setShowSearch, setShowShortcuts]);

  return (
    <>
      <main className="h-screen">{children}</main>

      {/* ADD ON */}

      <KeyboardShortcutsDialog
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <KeyboardProvider>
      <UserAccountProvider>
        <EditorProvider>
          {/* <AuthErrorHandler> */}
          <Suspense fallback={<LoadingState />}>
            <WholeEditor>{children}</WholeEditor>
          </Suspense>
          {/* </AuthErrorHandler> */}
        </EditorProvider>
      </UserAccountProvider>
    </KeyboardProvider>
  );
}

// New component to handle auth errors within the provider context
function AuthErrorHandler({ children }: { children: React.ReactNode }) {
  const { error } = useUserAccount();

  // If there's an auth error, redirect to login
  useEffect(() => {
    if (error) {
      window.location.href = "/auth/twitter";
    }
  }, [error]);

  return <>{children}</>;
}
