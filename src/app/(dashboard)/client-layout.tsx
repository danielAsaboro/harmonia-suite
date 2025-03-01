"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/navigation/sidebar";
import Header from "@/components/navigation/header";
import {
  UserAccountProvider,
  useUserAccount,
} from "@/components/editor/context/account";
import { syncAllDraftsFromServer } from "@/utils/sync";

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
    <div className="flex h-screen overflow-hidden bg-black text-white">
      {/* Mobile Sidebar - When Open */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 flex flex-col z-40 w-64 overflow-y-auto">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop Sidebar - Always visible on lg screens */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-50 overflow-y-auto">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 lg:pl-64">
        {/* Header */}
        <Header
          userName={userAccount.name}
          profile_image_url={userAccount.profileImageUrl}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Main Content with its own scrolling */}
        <main className="flex-1 overflow-y-auto bg-black">{children}</main>
      </div>
    </div>
  );
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserAccountProvider>
      <ApplicationContainer>{children}</ApplicationContainer>
    </UserAccountProvider>
  );
}
