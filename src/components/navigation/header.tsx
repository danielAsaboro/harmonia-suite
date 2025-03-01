// /components/navigation/header.tsx
"use client";

import { cn } from "@/utils/ts-merge";
import { Bell, Menu } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";

interface HeaderProps {
  userName: string;
  profile_image_url: string;
  className?: string;
  onMenuClick?: () => void;
}

const Header = ({
  userName,
  profile_image_url,
  className,
  onMenuClick,
}: HeaderProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <header
      className={cn(
        "flex h-16 items-center justify-between border-b border-neutral-800 bg-black px-4 md:px-6",
        className
      )}
    >
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden rounded-full p-2 text-neutral-300 hover:bg-neutral-900 hover:text-white transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <h1 className="text-lg md:text-xl font-semibold text-white truncate">
          Welcome, {userName}
        </h1>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <button
          className="rounded-full p-2 text-neutral-300 hover:bg-neutral-900 hover:text-white transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>

        <Link
          href="/settings"
          className="relative flex h-8 w-8 overflow-hidden rounded-full bg-neutral-900 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
          title="Go to settings"
        >
          {!imageError && profile_image_url && (
            <Image
              src={profile_image_url}
              alt={`${userName}'s profile`}
              fill
              className={cn(
                "object-cover transition-opacity duration-300",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          )}
          {/* Show initials as fallback when image fails to load */}
          {(imageError || !profile_image_url) && userName && (
            <div className="flex h-full w-full items-center justify-center text-sm font-medium text-white">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
        </Link>
      </div>
    </header>
  );
};

export default Header;
