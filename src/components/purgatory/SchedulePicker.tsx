// /components/purgatory/SchedulePicker.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { SchedulePickerProps } from "@/types/scheduler";
import {
  addDays,
  addYears,
  eachDayOfInterval,
  format,
  isAfter,
  isBefore,
  startOfToday,
} from "date-fns";
import { Calendar, Clock, ChevronDown, AlertCircle, Plus } from "lucide-react";

const SchedulePicker = ({
  onSchedule,
  onCancel,
  initialDate = new Date(),
  minDate = new Date(),
  maxDate = addYears(new Date(), 1),
  timeSlotDuration = 30,
  workingHours = { start: 9, end: 17 },
}: SchedulePickerProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [customHour, setCustomHour] = useState("");
  const [customMinute, setCustomMinute] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCustomTime, setShowCustomTime] = useState(false);

  // Section visibility states
  const [isQuickOptionsOpen, setIsQuickOptionsOpen] = useState(true);
  const [isTimeGridOpen, setIsTimeGridOpen] = useState(false);
  const [isCustomTimeOpen, setIsCustomTimeOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [onCancel]);

  // Generate dates
  const allDates = eachDayOfInterval({ start: minDate, end: maxDate });

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        scrollContainerRef.current;
      setScrollProgress((scrollTop / (scrollHeight - clientHeight)) * 100);
    }
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || (parseInt(value) >= 0 && parseInt(value) <= 23)) {
      setCustomHour(value);
    }
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || (parseInt(value) >= 0 && parseInt(value) <= 59)) {
      setCustomMinute(value);
    }
  };

  const handleCustomTimeSubmit = () => {
    const hour = parseInt(customHour);
    const minute = parseInt(customMinute);

    if (
      isNaN(hour) ||
      isNaN(minute) ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59
    ) {
      return;
    }

    const scheduledDate = new Date(selectedDate);
    scheduledDate.setHours(hour, minute, 0, 0);

    if (isBefore(scheduledDate, new Date())) {
      alert("Cannot schedule for a past time");
      return;
    }

    onSchedule(scheduledDate);
  };

  // Calculate quick schedule times
  const calculateQuickScheduleTimes = (option: string): Date => {
    const now = new Date();
    switch (option) {
      case "Next available": {
        const minutes = now.getMinutes();
        const roundedMinutes = Math.ceil(minutes / 30) * 30;
        const nextAvailable = new Date(now);
        nextAvailable.setMinutes(roundedMinutes, 0, 0);
        return nextAvailable;
      }
      case "Tomorrow morning": {
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        return tomorrow;
      }
      case "Tomorrow afternoon": {
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        tomorrow.setHours(14, 0, 0, 0);
        return tomorrow;
      }
      default:
        return now;
    }
  };

  // Generate time slots for grid
  const generateTimeSlots = (date: Date) => {
    const slots = [];
    const startHour = workingHours.start;
    const endHour = workingHours.end;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += timeSlotDuration) {
        const slotDate = new Date(date);
        slotDate.setHours(hour, minute, 0, 0);

        if (isAfter(slotDate, minDate) && isBefore(slotDate, maxDate)) {
          slots.push({
            time: slotDate,
            isAvailable: Math.random() > 0.3, // Simulated availability
          });
        }
      }
    }
    return slots;
  };

  interface CollapsibleSectionProps {
    title: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    icon?: React.ComponentType<{ className?: string }>;
  }

  const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    title,
    isOpen,
    onToggle,
    children,
    icon: Icon = ChevronDown,
  }) => (
    <div className="border-b border-slate-700/50 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-gray-300 hover:text-white transition-colors py-4"
      >
        <span className="text-sm font-medium">{title}</span>
        <Icon
          className={`w-4 h-4 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`grid transition-all duration-150 ease-out origin-top ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-lg backdrop-blur-xl bg-slate-900/90 rounded-3xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="relative p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 to-transparent pointer-events-none" />
        <div className="relative flex items-center justify-between">
          <h2 className="text-2xl font-medium text-white">Schedule Post</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-300 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
          <Clock className="w-4 h-4" />
          <span>{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
        </div>
      </div>

      <div className="px-6">
        {/* Custom Time Section */}
        <CollapsibleSection
          title="Custom Time"
          isOpen={isCustomTimeOpen}
          onToggle={() => setIsCustomTimeOpen(!isCustomTimeOpen)}
          icon={Clock}
        >
          <div className="pb-4">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-4">
              <div className="flex flex-col space-y-2">
                <label className="text-sm text-gray-400">Select Date</label>
                <input
                  type="date"
                  value={format(selectedDate, "yyyy-MM-dd")}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  min={format(new Date(), "yyyy-MM-dd")}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm text-gray-400">Hour (0-23)</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={customHour}
                    onChange={handleHourChange}
                    placeholder="HH"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm text-gray-400">Minute (0-59)</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={customMinute}
                    onChange={handleMinuteChange}
                    placeholder="MM"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <button
                onClick={handleCustomTimeSubmit}
                className="w-full p-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 
                         text-blue-400 hover:text-blue-300 transition-all duration-150
                         border border-blue-500/30 hover:border-blue-400/30"
              >
                Schedule for Custom Time
              </button>
            </div>
          </div>
        </CollapsibleSection>

        {/* Quick Schedule Section */}
        <CollapsibleSection
          title="Quick Schedule"
          isOpen={isQuickOptionsOpen}
          onToggle={() => setIsQuickOptionsOpen(!isQuickOptionsOpen)}
        >
          <div className="space-y-2 pb-4">
            {["Next available", "Tomorrow morning", "Tomorrow afternoon"].map(
              (option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    const scheduledTime = calculateQuickScheduleTimes(option);
                    onSchedule(scheduledTime);
                  }}
                  className="w-full p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 
                            transition-all duration-150 ease-out transform hover:translate-x-1
                            border border-slate-700/50 hover:border-slate-600/50
                            text-left text-gray-300 hover:text-white flex justify-between items-center"
                >
                  <span>{option}</span>
                  <span className="text-sm text-gray-500">
                    {format(calculateQuickScheduleTimes(option), "EEE, h:mm a")}
                  </span>
                </button>
              )
            )}
          </div>
        </CollapsibleSection>

        {/* Time Grid Section */}
        <CollapsibleSection
          title="Choose Time"
          isOpen={isTimeGridOpen}
          onToggle={() => setIsTimeGridOpen(!isTimeGridOpen)}
          icon={Plus}
        >
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="max-h-[400px] overflow-y-auto scroll-smooth"
          >
            <div className="sticky top-0 z-10 w-full h-1 bg-slate-800 mb-4">
              <div
                className="h-full bg-blue-500/50 transition-all duration-150 ease-out"
                style={{ width: `${scrollProgress}%` }}
              />
            </div>

            <div className="space-y-6 pb-4">
              {allDates.map((date) => (
                <div key={date.toISOString()} className="space-y-3">
                  <div className="sticky top-1 z-10 backdrop-blur-sm bg-slate-900/50 py-2">
                    <h3 className="text-white font-medium">
                      {format(date, "EEEE, MMMM d")}
                    </h3>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {generateTimeSlots(date).map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => onSchedule(slot.time)}
                        disabled={!slot.isAvailable}
                        className={`
                          p-3 rounded-xl text-center transition-all duration-150 ease-out
                          transform hover:scale-105 hover:translate-x-1
                          ${
                            slot.isAvailable
                              ? "bg-slate-800/50 hover:bg-slate-700/50 text-white border border-slate-700/50 hover:border-slate-600/50"
                              : "bg-slate-800/20 text-gray-500 cursor-not-allowed border border-slate-800/50"
                          }
                        `}
                      >
                        {format(slot.time, "h:mm a")}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
};

export default SchedulePicker;
