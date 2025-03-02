// /components/calendar/WeekView.tsx
import React, { memo, useCallback, useState, useEffect, useRef } from "react";
import {
  format,
  addDays,
  startOfWeek,
  isSameDay,
  isToday,
  isPast,
  addMinutes,
} from "date-fns";
import {
  CalendarEvent,
  CalendarEventType,
  DragPosition,
  DragTarget,
} from "@/types/calendar";
import { Card } from "../ui/card";
import { cn } from "@/utils/ts-merge";
import { useMousePosition } from "./hooks/useMousePosition";
import { useSlotTypes } from "./hooks/useSlotTypes";
import SlotTypeBadge from "./SlotTypeBadge";
import { MessageSquare, Share2 } from "lucide-react";

const MAX_VISIBLE_EVENTS = 3;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = Array.from({ length: 7 }, (_, i) => i);

interface WeekViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  onEventClick: (event: CalendarEvent) => void;
  onEventDrop: (event: CalendarEvent, start: Date, end: Date) => void;
  onSlotClick: (start: Date) => void;
  timezone: string;
  slotTypeManager: ReturnType<typeof useSlotTypes>;
}

interface EventCardProps {
  event: CalendarEvent;
  onClick: (event: CalendarEvent) => void;
  onDragStart: (event: CalendarEvent, e: React.DragEvent) => void;
  onDragEnd: () => void;
  index: number;
  totalEvents: number;
}

// Event type styles with Twitter-inspired colors
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

// Event card for calendar events
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
        zIndex: index,
      }}
    >
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium truncate pr-2">
          {isPublished && <span className="opacity-70">📢 </span>}
          {event.title}
        </div>

        {/* Event type indicator */}
        {event.type && (
          <div
            className={`w-2 h-2 rounded-full flex-shrink-0 mt-1`}
            style={{
              backgroundColor: isPublished
                ? "#525252"
                : event.type === "tweet"
                  ? "#1D9BF0"
                  : event.type === "thread"
                    ? "#7856FF"
                    : "#FFD400",
            }}
          />
        )}
      </div>

      {/* Event metadata/icons */}
      <div className="flex items-center justify-between mt-1 text-[10px] text-gray-400">
        <div className="flex items-center space-x-1">
          {event.type === "thread" && <MessageSquare className="w-3 h-3" />}
          {event.status === "published" && <Share2 className="w-3 h-3" />}
        </div>

        {/* Tags display */}
        {event.tags && event.tags.length > 0 && (
          <div className="flex gap-1 mt-0.5 flex-wrap">
            {event.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-1 text-[10px] rounded bg-black/30 text-gray-300"
              >
                {tag}
              </span>
            ))}
            {event.tags.length > 2 && (
              <span className="text-[10px]">+{event.tags.length - 2}</span>
            )}
          </div>
        )}
      </div>

      {/* Hover details that appear on hover */}
      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center text-center p-2">
        <p className="text-xs font-medium text-white">{event.title}</p>
        <p className="text-[10px] text-gray-300 mt-0.5">
          {format(new Date(event.start), "h:mm a")}
        </p>
        <p className="text-[10px] text-blue-400 mt-1">Click to view details</p>
      </div>
    </Card>
  );
};

// Component for stacked events in a time slot
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

// Drag preview component that follows the cursor during drag operations
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
          {format(new Date(event.start), "h:mm a")}
        </div>
      </Card>
    </div>
  )
);

DragPreview.displayName = "DragPreview";

// Slot type indicator component
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
          className="w-3 h-3 rounded-full border border-black"
          style={{
            backgroundColor: type.color,
            zIndex: slotTypes.length - index,
          }}
        />
      ))}
    </div>
  );
};

export default function WeekView({
  events,
  currentDate,
  onEventClick,
  onEventDrop,
  onSlotClick,
  timezone,
  slotTypeManager,
}: WeekViewProps) {
  const [draggingEvent, setDraggingEvent] = useState<CalendarEvent | null>(
    null
  );
  const [dragTarget, setDragTarget] = useState<DragTarget | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const mousePosition = useMousePosition();
  const weekStart = startOfWeek(currentDate);
  const currentTimeRef = useRef<HTMLDivElement>(null);

  // Scroll to current time on initial render
  useEffect(() => {
    if (currentTimeRef.current) {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const hourHeight = 80; // Match the h-20 classes

      // Calculate scroll position: add a small offset to see upcoming events
      const scrollPosition = (hours + minutes / 60) * hourHeight - 200;

      // Smooth scroll to position
      window.scrollTo({
        top: Math.max(0, scrollPosition),
        behavior: "smooth",
      });
    }
  }, []);

  // Get events for a specific time slot
  const getEventsForSlot = useCallback(
    (day: number, hour: number) => {
      const slotDate = addDays(weekStart, day);
      slotDate.setHours(hour);

      return events.filter((event) => {
        const eventStart = new Date(event.start);
        return (
          isSameDay(slotDate, eventStart) && eventStart.getHours() === hour
        );
      });
    },
    [events, weekStart]
  );

  // Drag and drop handlers
  const handleDragStart = (event: CalendarEvent, e: React.DragEvent) => {
    // Don't allow dragging published events
    if (event.status === "published") return;

    setDraggingEvent(event);
    setIsDragging(true);

    // Use empty image for custom drag preview
    const dragImage = new Image();
    dragImage.src =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    e.dataTransfer.setDragImage(dragImage, 0, 0);
  };

  const handleDragOver = (day: number, hour: number, e: React.DragEvent) => {
    e.preventDefault();
    setDragTarget({ day, hour });
  };

  const handleDrop = (day: number, hour: number) => {
    if (draggingEvent) {
      const newStart = addDays(weekStart, day);
      newStart.setHours(hour);
      newStart.setMinutes(new Date(draggingEvent.start).getMinutes());

      // Keep duration the same
      const duration =
        draggingEvent.end.getTime() - draggingEvent.start.getTime();
      const newEnd = new Date(newStart.getTime() + duration);

      // Check slot type compatibility
      const slotTypes = slotTypeManager.getSlotTypesForDate(newStart);
      const isCompatible =
        slotTypes.length === 0 ||
        slotTypes.some((type) => type.id === draggingEvent.type);

      // Proceed with the drop, but we could show a warning here
      onEventDrop(draggingEvent, newStart, newEnd);

      // Reset drag state
      setDraggingEvent(null);
      setDragTarget(null);
      setIsDragging(false);
    }
  };

  const handleDragEnd = () => {
    setDraggingEvent(null);
    setDragTarget(null);
    setIsDragging(false);
  };

  // Get current time for indicator
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimePosition = currentHour + currentMinutes / 60;

  return (
    <div className="flex flex-1 overflow-hidden bg-black">
      {/* Time column */}
      <div className="flex-none w-16 border-r border-neutral-800/70">
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="h-20 border-b border-neutral-800/50 text-xs text-neutral-500 text-right pr-2 py-1"
          >
            {format(new Date().setHours(hour), "h a")}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="flex-1 grid grid-cols-7">
        {/* Day headers */}
        {DAYS.map((day) => {
          const date = addDays(weekStart, day);
          const isCurrentDay = isToday(date);
          const isPastDay = isPast(addDays(date, 1)); // Check if this day is in the past

          return (
            <div
              key={day}
              className={cn(
                "border-b border-r border-neutral-800/70 px-2 py-1",
                isCurrentDay && "bg-[#1D9BF0]/10",
                isPastDay && !isCurrentDay && "bg-neutral-900/30"
              )}
            >
              <div
                className={cn(
                  "text-sm font-medium",
                  isCurrentDay ? "text-[#1D9BF0]" : "text-neutral-300"
                )}
              >
                {format(date, "EEE")}
              </div>
              <div
                className={cn(
                  "text-xs",
                  isCurrentDay ? "text-[#1D9BF0]" : "text-neutral-500"
                )}
              >
                {format(date, "d")}
              </div>
            </div>
          );
        })}

        {/* Time slots */}
        {HOURS.map((hour) => (
          <React.Fragment key={hour}>
            {DAYS.map((day) => {
              const slotEvents = getEventsForSlot(day, hour);
              const date = addDays(weekStart, day);
              date.setHours(hour);

              const isCurrentDay = isToday(date);
              const isPastTime = isPast(addMinutes(date, 30)); // Consider past if 30min in the past
              const isCurrentTimeSlot = isCurrentDay && hour === currentHour;

              // Get slot types for this date
              const slotTypes = slotTypeManager.getSlotTypesForDate(date);
              const hasSlotTypes = slotTypes.length > 0;

              return (
                <div
                  key={`${day}-${hour}`}
                  className={cn(
                    "h-20 border-b border-r border-neutral-800/50 relative transition-colors duration-150",
                    isCurrentDay && "bg-[#1D9BF0]/5",
                    isPastTime && "bg-neutral-900/20",
                    isCurrentTimeSlot && "bg-[#1D9BF0]/10",
                    dragTarget?.day === day &&
                      dragTarget?.hour === hour &&
                      "bg-[#1D9BF0]/20",
                    hasSlotTypes && "border-l-2",
                    "hover:bg-neutral-900/40"
                  )}
                  style={{
                    borderLeftColor: hasSlotTypes
                      ? slotTypes[0].color
                      : undefined,
                  }}
                  onClick={() => onSlotClick(date)}
                  onDragOver={(e) => handleDragOver(day, hour, e)}
                  onDrop={() => handleDrop(day, hour)}
                  ref={isCurrentTimeSlot ? currentTimeRef : undefined}
                >
                  {/* Current time indicator for the current day */}
                  {isCurrentDay && hour === currentHour && (
                    <div
                      className="absolute left-0 right-0 h-0.5 bg-red-500 z-10"
                      style={{
                        top: `${(currentMinutes / 60) * 100}%`,
                      }}
                    />
                  )}

                  {/* Slot type indicator */}
                  <SlotTypeIndicator
                    date={date}
                    slotTypeManager={slotTypeManager}
                  />

                  {/* Event stack */}
                  {slotEvents.length > 0 && (
                    <StackedEvents
                      events={slotEvents}
                      onEventClick={onEventClick}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    />
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Drag preview */}
      {isDragging && draggingEvent && (
        <DragPreview event={draggingEvent} position={mousePosition} />
      )}
    </div>
  );
}
