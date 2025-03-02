// /components/calendar/MonthView.tsx
import React, { memo, useCallback, useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  startOfWeek,
  endOfWeek,
  isPast,
} from "date-fns";
import {
  CalendarEvent,
  CalendarEventType,
  DragPosition,
} from "@/types/calendar";
import { Card } from "../ui/card";
import { cn } from "@/utils/ts-merge";
import { useMousePosition } from "./hooks/useMousePosition";
import { useSlotTypes } from "./hooks/useSlotTypes";
import { MessageSquare, Share2 } from "lucide-react";

const MAX_VISIBLE_EVENTS = 3;

interface MonthViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  onEventClick: (event: CalendarEvent) => void;
  onEventDrop: (event: CalendarEvent, start: Date, end: Date) => void;
  onSlotClick: (start: Date) => void;
  timezone: string;
  slotTypeManager: ReturnType<typeof useSlotTypes>;
}

// Twitter-inspired color scheme
const EVENT_TYPE_STYLES: Record<
  CalendarEventType | string | "default",
  string
> = {
  default: "bg-[#1D9BF0]/20 border-[#1D9BF0]/40 hover:bg-[#1D9BF0]/30",
  community: "bg-[#00BA7C]/20 border-[#00BA7C]/40 hover:bg-[#00BA7C]/30",
  educational: "bg-[#7856FF]/20 border-[#7856FF]/40 hover:bg-[#7856FF]/30",
  meme: "bg-[#F91880]/20 border-[#F91880]/40 hover:bg-[#F91880]/30",
  challenge: "bg-[#FFD400]/20 border-[#FFD400]/40 hover:bg-[#FFD400]/30",
  tweet: "bg-[#1D9BF0]/20 border-[#1D9BF0]/40 hover:bg-[#1D9BF0]/30",
  thread: "bg-[#7856FF]/20 border-[#7856FF]/40 hover:bg-[#7856FF]/30",
  published:
    "bg-neutral-700/20 border-neutral-700/40 hover:bg-neutral-700/30 opacity-75",
};

// Event card component
interface EventCardProps {
  event: CalendarEvent;
  onClick: (event: CalendarEvent) => void;
  onDragStart: (event: CalendarEvent, e: React.DragEvent) => void;
  onDragEnd: () => void;
  index: number;
  totalEvents: number;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  onClick,
  onDragStart,
  onDragEnd,
  index,
  totalEvents,
}) => {
  // Check if this is a published event
  const isPublished = event.status === "published";

  // Determine style based on type or published status
  const styleKey = isPublished ? "published" : event.type || "default";

  return (
    <Card
      key={event.id}
      draggable={!isPublished} // Only allow dragging if not published
      onDragStart={!isPublished ? (e) => onDragStart(event, e) : undefined}
      onDragEnd={onDragEnd}
      onClick={(e) => {
        e.stopPropagation();
        onClick(event);
      }}
      className={cn(
        "absolute inset-x-0 cursor-pointer p-1.5 transition-all duration-150",
        "hover:z-50 hover:scale-[1.02] shadow-sm hover:shadow-md",
        "text-gray-100 rounded-lg border overflow-hidden",
        event.isEmptySlot
          ? "border-dashed border-neutral-700 bg-neutral-900/50"
          : EVENT_TYPE_STYLES[styleKey] || EVENT_TYPE_STYLES.default,
        // Add staggered positioning to create a stack effect
        "group"
      )}
      style={{
        height: "calc(100% - 4px)",
        transform: totalEvents > 1 ? `translateY(${index * 4}px)` : undefined,
        zIndex: 10 + index,
      }}
    >
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium truncate pr-2">
          {isPublished && <span className="opacity-70">📢 </span>}
          {event.title}
        </div>

        {/* Event type indicator */}
        <div className="flex items-center space-x-1">
          {event.type === "thread" && (
            <MessageSquare className="w-3 h-3 text-[#7856FF]" />
          )}
          {event.status === "published" && (
            <Share2 className="w-3 h-3 text-neutral-500" />
          )}
        </div>
      </div>

      {/* Tags - only show on hover to save space */}
      {event.tags && event.tags.length > 0 && (
        <div className="absolute bottom-1 left-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-1 flex-wrap">
            {event.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-1 text-[10px] rounded bg-black/30 text-gray-300"
              >
                {tag}
              </span>
            ))}
            {event.tags.length > 2 && (
              <span className="text-[10px] text-gray-400">
                +{event.tags.length - 2}
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

interface StackedEventsProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDragStart: (event: CalendarEvent, e: React.DragEvent) => void;
  onDragEnd: () => void;
}

const StackedEvents: React.FC<StackedEventsProps> = ({
  events,
  onEventClick,
  onDragStart,
  onDragEnd,
}) => {
  const [showAll, setShowAll] = useState(false);
  const visibleEvents = showAll ? events : events.slice(0, MAX_VISIBLE_EVENTS);
  const hiddenCount = events.length - MAX_VISIBLE_EVENTS;

  return (
    <div className="absolute inset-x-1 inset-y-0.5">
      {visibleEvents.map((event, index) => (
        <EventCard
          key={event.id}
          event={event}
          onClick={onEventClick}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          index={index}
          totalEvents={visibleEvents.length}
        />
      ))}

      {!showAll && hiddenCount > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowAll(true);
          }}
          className="absolute bottom-1 right-1 text-xs bg-neutral-900 px-2 py-0.5 rounded-full
                     text-[#1D9BF0] hover:text-white font-medium transition-colors
                     border border-neutral-800 hover:bg-neutral-800 shadow-sm z-50"
        >
          +{hiddenCount} more
        </button>
      )}
    </div>
  );
};

const DragPreview = memo(
  ({ event, position }: { event: CalendarEvent; position: DragPosition }) => (
    <div
      className="fixed pointer-events-none z-50 opacity-70"
      style={{
        left: position.x + 10,
        top: position.y + 10,
        width: "200px",
      }}
    >
      <Card
        className={cn(
          "p-2 border border-opacity-50 text-gray-100 rounded-xl shadow-lg",
          EVENT_TYPE_STYLES[event.type || "default"] ||
            EVENT_TYPE_STYLES.default
        )}
      >
        <div className="text-sm font-medium truncate">{event.title}</div>
        <div className="text-xs text-gray-300 mt-1">
          {format(new Date(event.start), "MMM d, h:mm a")}
        </div>
      </Card>
    </div>
  )
);

DragPreview.displayName = "DragPreview";

// Slot type indicator for day cells
const SlotTypeIndicator = ({
  date,
  slotTypeManager,
}: {
  date: Date;
  slotTypeManager: ReturnType<typeof useSlotTypes>;
}) => {
  const slotTypes = slotTypeManager.getSlotTypesForDate(date);

  if (slotTypes.length === 0) return null;

  return (
    <div className="absolute top-0.5 right-1 flex -space-x-1">
      {slotTypes.map((type, index) => (
        <div
          key={type.id}
          className="w-2.5 h-2.5 rounded-full border border-black"
          style={{
            backgroundColor: type.color,
            zIndex: slotTypes.length - index,
          }}
        />
      ))}
    </div>
  );
};

export default function MonthView({
  events,
  currentDate,
  onEventClick,
  onEventDrop,
  onSlotClick,
  slotTypeManager,
}: MonthViewProps) {
  const [draggingEvent, setDraggingEvent] = useState<CalendarEvent | null>(
    null
  );
  const [dragTargetDay, setDragTargetDay] = useState<Date | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const mousePosition = useMousePosition();

  // Calculate month start and end, including days from previous/next months
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setDraggingEvent(null);
        setDragTargetDay(null);
      }
    };

    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [isDragging]);

  const getEventsForDay = useCallback(
    (date: Date) => {
      return events.filter((event) => isSameDay(new Date(event.start), date));
    },
    [events]
  );

  const handleDragStart = (event: CalendarEvent, e: React.DragEvent) => {
    if (event.status === "published") return;

    setDraggingEvent(event);
    setIsDragging(true);

    const dragImage = new Image();
    dragImage.src =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    e.dataTransfer.setDragImage(dragImage, 0, 0);
  };

  const handleDragOver = (date: Date, e: React.DragEvent) => {
    e.preventDefault();
    setDragTargetDay(date);
  };

  const handleDrop = (targetDate: Date) => {
    if (draggingEvent) {
      const originalDate = new Date(draggingEvent.start);
      const newStart = new Date(targetDate);

      // Preserve the original time
      newStart.setHours(originalDate.getHours());
      newStart.setMinutes(originalDate.getMinutes());
      newStart.setSeconds(originalDate.getSeconds());

      const duration =
        draggingEvent.end.getTime() - draggingEvent.start.getTime();
      const newEnd = new Date(newStart.getTime() + duration);

      // Check slot type compatibility
      const slotTypes = slotTypeManager.getSlotTypesForDate(newStart);
      const isCompatible =
        slotTypes.length === 0 ||
        slotTypes.some((type) => type.id === draggingEvent.type);

      // Allow the drop but could show a warning
      onEventDrop(draggingEvent, newStart, newEnd);

      setDraggingEvent(null);
      setDragTargetDay(null);
      setIsDragging(false);
    }
  };

  const handleDragEnd = () => {
    setDraggingEvent(null);
    setDragTargetDay(null);
    setIsDragging(false);
  };

  return (
    <div className="flex-1 grid grid-cols-7 grid-rows-6 bg-black border-t border-l border-neutral-800/70">
      {/* Day headers */}
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
        <div
          key={day}
          className="p-2 text-sm font-medium border-b border-r border-neutral-800/70 text-neutral-400"
        >
          {day}
        </div>
      ))}

      {/* Calendar grid */}
      {days.map((day, index) => {
        const dayEvents = getEventsForDay(day);
        const isCurrentMonth = isSameMonth(day, currentDate);
        const isCurrentDay = isToday(day);
        const isPastDay = isPast(day);

        // Get slot types for this date
        const slotTypes = slotTypeManager.getSlotTypesForDate(day);
        const hasSlotTypes = slotTypes.length > 0;

        // Check if this is the drag target
        const isDragTarget = dragTargetDay && isSameDay(day, dragTargetDay);

        return (
          <div
            key={index}
            onClick={() => onSlotClick(day)}
            onDragOver={(e) => handleDragOver(day, e)}
            onDrop={() => handleDrop(day)}
            className={cn(
              "min-h-[120px] p-2 border-b border-r border-neutral-800/70 relative transition-colors duration-150",
              !isCurrentMonth && "bg-neutral-900/30 text-neutral-600",
              isCurrentDay && "bg-[#1D9BF0]/10",
              isPastDay && !isCurrentDay && "bg-neutral-900/20",
              isDragTarget && "bg-[#1D9BF0]/20",
              hasSlotTypes && "border-t-2",
              "hover:bg-neutral-900/40"
            )}
            style={{
              borderTopColor: hasSlotTypes ? slotTypes[0].color : undefined,
            }}
          >
            <div className="flex justify-between items-start">
              <span
                className={cn(
                  "text-sm font-medium",
                  !isCurrentMonth ? "text-neutral-600" : "text-neutral-300",
                  isCurrentDay && "text-[#1D9BF0] font-semibold"
                )}
              >
                {format(day, "d")}
              </span>

              {/* Slot type indicator */}
              <SlotTypeIndicator date={day} slotTypeManager={slotTypeManager} />
            </div>

            <div className="mt-2 space-y-1 relative min-h-[60px]">
              {dayEvents.length > 0 && (
                <StackedEvents
                  events={dayEvents}
                  onEventClick={onEventClick}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
              )}
            </div>
          </div>
        );
      })}

      {/* Drag preview */}
      {isDragging && draggingEvent && (
        <DragPreview event={draggingEvent} position={mousePosition} />
      )}
    </div>
  );
}
