// /components/calendar/hooks/useSlotTypes.ts
import { useState, useEffect } from "react";
import { format, isSameDay } from "date-fns";

export type SlotType = {
  id: string;
  name: string;
  color: string;
};

export type DaySlotConfig = {
  dayOfWeek: number; // 0-6 for Sunday-Saturday
  slotTypes: string[]; // Array of slot type IDs
};

export const useSlotTypes = () => {
  // Default slot types
  const [slotTypes, setSlotTypes] = useState<SlotType[]>([
    { id: "tweet", name: "Tweet", color: "#1D9BF0" },
    { id: "thread", name: "Thread", color: "#7856FF" },
    { id: "motivation", name: "Motivation", color: "#F91880" },
    { id: "news", name: "News", color: "#FFD400" },
    { id: "educational", name: "Educational", color: "#00BA7C" },
  ]);

  // Default day configurations (empty for all days)
  const [dayConfigs, setDayConfigs] = useState<DaySlotConfig[]>(
    Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      slotTypes: [],
    }))
  );

  // Load configs from localStorage on mount
  useEffect(() => {
    try {
      const savedSlotTypes = localStorage.getItem("calendar_slot_types");
      const savedDayConfigs = localStorage.getItem("calendar_day_configs");

      if (savedSlotTypes) {
        setSlotTypes(JSON.parse(savedSlotTypes));
      }

      if (savedDayConfigs) {
        setDayConfigs(JSON.parse(savedDayConfigs));
      }
    } catch (error) {
      console.error("Error loading slot type configurations:", error);
    }
  }, []);

  // Save to localStorage when configs change
  useEffect(() => {
    try {
      localStorage.setItem("calendar_slot_types", JSON.stringify(slotTypes));
      localStorage.setItem("calendar_day_configs", JSON.stringify(dayConfigs));
    } catch (error) {
      console.error("Error saving slot type configurations:", error);
    }
  }, [slotTypes, dayConfigs]);

  // Add a new slot type
  const addSlotType = (slotType: Omit<SlotType, "id">) => {
    const newSlotType = {
      ...slotType,
      id: `slot-${Date.now()}`,
    };
    setSlotTypes((prev) => [...prev, newSlotType]);
    return newSlotType.id;
  };

  // Edit a slot type
  const updateSlotType = (
    id: string,
    updates: Partial<Omit<SlotType, "id">>
  ) => {
    setSlotTypes((prev) =>
      prev.map((type) => (type.id === id ? { ...type, ...updates } : type))
    );
  };

  // Delete a slot type
  const deleteSlotType = (id: string) => {
    setSlotTypes((prev) => prev.filter((type) => type.id !== id));

    // Also remove this slot type from any day configurations
    setDayConfigs((prev) =>
      prev.map((config) => ({
        ...config,
        slotTypes: config.slotTypes.filter((typeId) => typeId !== id),
      }))
    );
  };

  // Set slot types for a specific day of week
  const setDaySlotTypes = (dayOfWeek: number, slotTypeIds: string[]) => {
    setDayConfigs((prev) =>
      prev.map((config) =>
        config.dayOfWeek === dayOfWeek
          ? { ...config, slotTypes: slotTypeIds.slice(0, 3) } // Max 3 types per day
          : config
      )
    );
  };

  // Get slot types for a specific date
  const getSlotTypesForDate = (date: Date) => {
    const dayOfWeek = date.getDay();
    const config = dayConfigs.find((c) => c.dayOfWeek === dayOfWeek);

    if (!config || config.slotTypes.length === 0) {
      return [];
    }

    return config.slotTypes
      .map((typeId) => slotTypes.find((type) => type.id === typeId)!)
      .filter(Boolean);
  };

  // Check if a slot type is valid for a specific date
  const isValidSlotType = (date: Date, slotTypeId: string) => {
    const typesForDate = getSlotTypesForDate(date);

    // If no slot types are configured for this day, any type is valid
    if (typesForDate.length === 0) {
      return true;
    }

    return typesForDate.some((type) => type.id === slotTypeId);
  };

  return {
    slotTypes,
    dayConfigs,
    addSlotType,
    updateSlotType,
    deleteSlotType,
    setDaySlotTypes,
    getSlotTypesForDate,
    isValidSlotType,
  };
};
