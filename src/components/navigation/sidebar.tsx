// File: /components/navigation/sidebar.tsx
"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/ts-merge";
import {
  LayoutGrid,
  LineChart,
  BookOpen,
  Trophy,
  Target,
  User,
  Settings,
  HelpCircle,
  LogOut,
  X,
} from "lucide-react";
import Image from "next/image";
import LogoutModal from "@/components/auth/LogoutModal";

const navigationItems = [
  {
    title: "Dashboard",
    icon: LayoutGrid,
    href: "/overview",
  },
  // {
  //   title: "Members Management",
  //   icon: LineChart,
  //   href: "/members",
  // },
  // {
  //   title: "Knowledge Base",
  //   icon: BookOpen,
  //   href: "/knowledge",
  // },
  {
    title: "Content Studio",
    icon: Trophy,
    href: "/content",
  },
  // {
  //   title: "System Config",
  //   icon: Target,
  //   href: "/system-config",
  // },
];

const bottomNavigationItems = [
  {
    title: "Settings",
    icon: Settings,
    href: "/settings",
  },
  {
    title: "Support & FAQ",
    icon: HelpCircle,
    href: "/support",
  },
];

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

const Sidebar = ({ className, onClose }: SidebarProps) => {
  const pathname = usePathname();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const NavItem = ({
    href,
    icon: Icon,
    title,
  }: {
    href: string;
    icon: React.ElementType;
    title: string;
  }) => {
    const isActive = pathname === href;

    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-neutral-300 transition-colors",
          isActive 
            ? "bg-blue-500/20 text-blue-400 border-l-2 border-blue-500" 
            : "hover:bg-neutral-900 hover:text-white"
        )}
        onClick={() => {
          // Close sidebar on mobile when an item is clicked
          if (onClose && window.innerWidth < 1024) {
            onClose();
          }
        }}
      >
        <Icon className={cn("h-5 w-5", isActive ? "text-blue-400" : "")} />
        <span>{title}</span>
      </Link>
    );
  };

  return (
    <div
      className={cn(
        "flex min-h-screen w-64 flex-col bg-black border-r border-neutral-800 p-4", 
        className
      )}
    >
      <div className="mb-8 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/icons/app-icon.svg"
            alt="Harmonia"
            className="h-6 w-6"
            width={8}
            height={8}
          />
          <span className="text-white font-semibold">Harmonia</span>
        </Link>

        {/* Close button for mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden rounded-full p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="mb-6 px-3">
        <div className="h-px w-full bg-neutral-800" />
      </div>

      <nav className="space-y-1">
        {navigationItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            title={item.title}
          />
        ))}
      </nav>

      <Link
        href="/team"
        className={cn(
          "mt-6 flex items-center gap-2 rounded-full px-4 py-2 outline-0",
          "border border-blue-500 bg-transparent text-blue-400 hover:bg-blue-500 hover:text-white",
          "transition-colors duration-200",
          pathname === "/team" && "bg-blue-500 text-white"
        )}
        onClick={() => {
          if (onClose && window.innerWidth < 1024) {
            onClose();
          }
        }}
      >
        <User className="h-5 w-5" />
        <span>Manage Team</span>
      </Link>

      <div className="mt-auto space-y-1">
        <div className="mb-4 px-3">
          <div className="h-px w-full bg-neutral-800" />
        </div>

        {bottomNavigationItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            title={item.title}
          />
        ))}

        <button
          onClick={() => setShowLogoutModal(true)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-neutral-300 transition-colors hover:bg-neutral-900 hover:text-white"
        >
          <LogOut className="h-5 w-5 text-neutral-400" />
          <span>Logout</span>
        </button>
      </div>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
      />
    </div>
  );
};

export default Sidebar;