// /app/(dashboard)/client-layout.tsx
"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/navigation/sidebar";
import Header from "@/components/navigation/header";
import {
  UserAccountProvider,
  useUserAccount,
} from "@/components/editor/context/account";
import { syncAllDraftsFromServer } from "@/utils/sync";
import { Menu } from "lucide-react";

function ApplicationContainer({ children }: { children: React.ReactNode }) {
  const userAccount = useUserAccount();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    syncAllDraftsFromServer();
  });

  // Close sidebar on larger screen changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* Mobile Sidebar - When Open */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden transition-opacity duration-200 ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar for both mobile and desktop */}
      <nav
        className={`fixed top-0 bottom-0 left-0 z-30 w-64 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </nav>

      <main className="flex-1 min-w-0 bg-background">
        <Header
          userName={userAccount.name}
          profile_image_url={userAccount.profileImageUrl}
          className="sticky top-0 z-10 w-full bg-card border-b border-border bg-background"
          onMenuClick={() => setSidebarOpen(true)}
        />
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </>
  );
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <UserAccountProvider>
        <ApplicationContainer>{children}</ApplicationContainer>
      </UserAccountProvider>
    </div>
  );
}
