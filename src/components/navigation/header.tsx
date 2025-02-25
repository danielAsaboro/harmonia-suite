import { cn } from "@/utils/ts-merge";
import { Bell } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";

interface HeaderProps {
  userName: string;
  profile_image_url: string;
  className?: string;
}

const Header = ({ userName, profile_image_url, className }: HeaderProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <header
      className={cn(
        "flex h-16 items-center justify-between border-b border-slate-700 bg-slate-800 px-6",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-white">
          Welcome, {userName}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <button className="rounded-full p-2 text-slate-200 hover:bg-slate-700">
          <Bell className="h-5 w-5" />
        </button>

        <Link
          href="/settings"
          className="relative h-8 w-8 overflow-hidden rounded-full bg-slate-700 cursor-pointer hover:ring-2 hover:ring-slate-300 transition-all"
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
