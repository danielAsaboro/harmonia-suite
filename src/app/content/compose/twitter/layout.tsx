// app/content/compose/twitter/layout.tsx
"use client";
import { Suspense } from "react";
import React, { useEffect } from "react";
import { EditorProvider } from "@/components/editor/context/Editor";
import { UserAccountProvider } from "@/components/editor/context/account";

import LoadingState from "@/components/editor/LoadingState";
import { KeyboardProvider, useKeyboard } from "@/contexts/keyboard-context";
import KeyboardShortcutsDialog from "@/components/keyboard/KeyboardShortcutsDialog";
import SearchModal from "@/components/search/SearchModal";
import { syncAllDraftsFromServer } from "@/utils/sync";

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

  useEffect(() => {
    syncAllDraftsFromServer();
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
          <Suspense fallback={<LoadingState />}>
            <WholeEditor>{children}</WholeEditor>
          </Suspense>
        </EditorProvider>
      </UserAccountProvider>
    </KeyboardProvider>
  );
}
