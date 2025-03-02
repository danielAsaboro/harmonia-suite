// /components/calendar/SlotTypeBadge.tsx
import React from "react";
import { cn } from "@/utils/ts-merge";

interface SlotTypeBadgeProps {
  name: string;
  color: string;
  small?: boolean;
  className?: string;
}

export default function SlotTypeBadge({
  name,
  color,
  small = false,
  className,
}: SlotTypeBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        small ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        className
      )}
      style={{
        backgroundColor: `${color}20`, // 20% opacity
        color: color,
        border: `1px solid ${color}40`, // 40% opacity
      }}
    >
      <span
        className="w-2 h-2 rounded-full mr-1"
        style={{ backgroundColor: color }}
      />
      {name}
    </div>
  );
}
