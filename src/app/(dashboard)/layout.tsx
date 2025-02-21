// /app/(dashboard)/layout.tsx
import type { Metadata } from "next";
import { ClientLayout } from "./client-layout";

export const metadata: Metadata = {
  title: "Harmonia Dashboard",
  description: "AI-Powered Community Management Dashboard",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ClientLayout>
      {children}
    </ClientLayout>
  );
}