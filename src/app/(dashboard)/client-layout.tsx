// /app/(dashboard)/client-layout.tsx
"use client";

import Sidebar from "@/components/navigation/sidebar";
import Header from "@/components/navigation/header";
import {
  UserAccountProvider,
  useUserAccount,
} from "@/components/editor/context/account";

function ApplicationContainer({ children }: { children: React.ReactNode }) {
  const userAccount = useUserAccount();

  return (
    <>
      <nav className="sticky top-0 max-h-screen">
        <Sidebar />
      </nav>
      <main className="flex-1 bg-background">
        <Header
          userName={userAccount.name}
          profile_image_url={userAccount.profileImageUrl}
          className="sticky top-0 z-10 w-full bg-card border-b border-border bg-background"
        />
        <div className="p-6">{children}</div>
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
