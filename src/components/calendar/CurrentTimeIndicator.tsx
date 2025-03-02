// /components/calendar/CurrentTimeIndicator.tsx
import { useEffect, useState } from "react";
import { format } from "date-fns";

interface CurrentTimeIndicatorProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

export default function CurrentTimeIndicator({
  containerRef,
}: CurrentTimeIndicatorProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  if (!containerRef.current) {
    return null;
  }

  // Calculate position
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const hourHeight = 80; // Match the height in WeekView (h-20)
  const position = (hours + minutes / 60) * hourHeight;

  return (
    <div
      className="absolute left-0 right-0 pointer-events-none z-20"
      style={{ top: `${position}px` }}
    >
      <div className="flex items-center">
        <div className="w-16 text-right pr-2">
          <span className="text-xs font-medium text-red-500">
            {format(currentTime, "h:mm a")}
          </span>
        </div>
        <div className="flex-1 h-0.5 bg-red-500/70" />
      </div>
    </div>
  );
}
