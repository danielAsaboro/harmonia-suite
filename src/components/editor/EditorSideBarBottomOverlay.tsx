// // src/components/editor/EditorSideBarBottomOverlay.tsx

import {
  Calendar,
  ClipboardCheck,
  HelpCircle,
  LayoutDashboardIcon,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function EditorSideBarBottomOverlay({
  isVisible,
}: {
  isVisible: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`
        fixed bottom-0 left-0 
        bg-black border-t border-r border-gray-800 
        transition-all duration-300
        ${isVisible ? "w-72 opacity-100" : "w-0 opacity-0"}
      `}
    >
      {/* Toggle button row - always visible when sidebar is shown */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          w-full flex items-center justify-between py-3 px-6 
          border-b border-gray-800 text-gray-400 
          hover:text-blue-400 transition-colors rounded-none
          ${isExpanded ? "" : ""}
        `}
      >
        <span>{isExpanded ? "Hide Menu" : "Show Menu"}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transform transition-transform ${isExpanded ? "" : "rotate-180"}`}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {/* Navigation content */}
      <nav
        className={`
          overflow-hidden transition-all duration-300
          ${!isVisible ? "hidden" : "block"}
          ${isExpanded ? "h-96 md:h-72 mb-6 md:mb-0" : "md:h-4 h-32"}
        `}
      >
        <Link
          href="/content/calendar"
          className="flex items-center py-4 px-6 border-b border-gray-800 text-gray-400 hover:text-blue-400 transition-colors"
        >
          <Calendar className="mr-4"></Calendar>
          <span>Calendar</span>
        </Link>
        <Link
          href="/dashboard"
          className="flex items-center py-4 px-6 border-b border-gray-800 text-gray-400 hover:text-blue-400 transition-colors"
        >
          <LayoutDashboardIcon className="mr-4"></LayoutDashboardIcon>
          <span>Dashboard</span>
        </Link>
        <Link
          href="/content/purgatory"
          className="flex items-center py-4 px-6 border-b border-gray-800 text-gray-400 hover:text-blue-400 transition-colors"
        >
          <ClipboardCheck className="mr-4"></ClipboardCheck>
          <span>Approval Queue</span>
        </Link>
        <Link
          href="/dashboard"
          className="flex items-center py-4 px-6 border-b border-gray-800 text-gray-400 hover:text-blue-400 transition-colors"
        >
          <HelpCircle className="mr-4"></HelpCircle>
          <span>Help</span>
        </Link>

        <Link
          href="/settings"
          className="flex items-center py-4 px-6 border-b border-gray-800 text-gray-400 hover:text-blue-400 transition-colors"
        >
          <Settings className="mr-4"></Settings>
          <span>Settings</span>
        </Link>

        <div className="pb-4">{}</div>
      </nav>
    </div>
  );
}
