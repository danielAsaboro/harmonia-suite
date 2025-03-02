// /components/calendar/EventModal.tsx
import React, { useState, useEffect } from "react";
import {
  X,
  Clock,
  Tag,
  Calendar,
  Trash2,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { format, isSameDay } from "date-fns";
import { Card, CardHeader, CardContent, CardFooter } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { CalendarEvent, CalendarEventType } from "@/types/calendar";
import { useSlotTypes } from "./hooks/useSlotTypes";
import SlotTypeBadge from "./SlotTypeBadge";
import { cn } from "@/utils/ts-merge";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Partial<CalendarEvent>) => void;
  onDelete?: (event: CalendarEvent) => void;
  event?: CalendarEvent;
  defaultDate?: Date;
  slotTypeManager: ReturnType<typeof useSlotTypes>;
}

export default function EventModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  event,
  defaultDate,
  slotTypeManager,
}: EventModalProps) {
  // Event form data
  const [formData, setFormData] = useState<Partial<CalendarEvent>>({
    title: "",
    start: new Date(),
    end: new Date(),
    type: "tweet",
    tags: [],
  });

  // For tag input
  const [newTag, setNewTag] = useState("");

  // Local state to track if the selected type is valid for the date
  const [isValidType, setIsValidType] = useState(true);

  // Reset form when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: event?.title || "",
        start: event?.start || defaultDate || new Date(),
        end: event?.end || defaultDate || new Date(),
        type: event?.type || "tweet",
        tags: event?.tags || [],
        status: event?.status,
      });

      // Check validity of the type
      const date = event?.start || defaultDate || new Date();
      const type = event?.type || "tweet";
      setIsValidType(slotTypeManager.isValidSlotType(date, type));

      setNewTag("");
    }
  }, [isOpen, event, defaultDate, slotTypeManager]);

  if (!isOpen) return null;

  // Date handling helper
  const isValidDate = (date: Date | undefined): date is Date => {
    return date !== undefined && date instanceof Date && !isNaN(date.getTime());
  };

  // Get available slot types for the selected date
  const date = isValidDate(formData.start) ? formData.start : new Date();
  const availableSlotTypes = slotTypeManager.getSlotTypesForDate(date);
  const hasSlotTypes = availableSlotTypes.length > 0;

  // Handle slot type changes
  const handleTypeChange = (typeId: string) => {
    const newIsValid = slotTypeManager.isValidSlotType(date, typeId);
    setIsValidType(newIsValid);
    setFormData({ ...formData, type: typeId as CalendarEventType });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  // Handle tag management
  const handleAddTag = () => {
    if (newTag.trim() && formData.tags) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()],
      });
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    if (formData.tags) {
      setFormData({
        ...formData,
        tags: formData.tags.filter((tag) => tag !== tagToRemove),
      });
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (onDelete && event) {
      onDelete(event);
      onClose();
    }
  };

  // Get all slot types to choose from
  const allSlotTypes = slotTypeManager.slotTypes;

  // Check if content is published
  const isPublished = formData.status === "published";

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg bg-neutral-900 text-white border-neutral-800 rounded-xl shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold text-white">
              {event
                ? isPublished
                  ? "View Event"
                  : "Edit Event"
                : "Create Event"}
            </h2>
            {isPublished && (
              <p className="text-sm text-neutral-400 mt-1">
                This content has been published and cannot be modified
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {event && onDelete && !isPublished && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="py-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-neutral-300">
                Content Title
              </label>
              <Input
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Event title"
                required
                disabled={isPublished}
                className="bg-neutral-800 border-neutral-700 focus:border-[#1D9BF0] text-white placeholder:text-neutral-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-neutral-300">
                  Start Time
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                  <Input
                    type="datetime-local"
                    value={
                      isValidDate(formData.start)
                        ? format(formData.start, "yyyy-MM-dd'T'HH:mm")
                        : format(new Date(), "yyyy-MM-dd'T'HH:mm")
                    }
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({
                        ...formData,
                        start: new Date(e.target.value),
                      })
                    }
                    className="pl-10 bg-neutral-800 border-neutral-700 focus:border-[#1D9BF0] text-white"
                    disabled={isPublished}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-neutral-300">
                  End Time
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                  <Input
                    type="datetime-local"
                    value={
                      isValidDate(formData.end)
                        ? format(formData.end, "yyyy-MM-dd'T'HH:mm")
                        : format(new Date(), "yyyy-MM-dd'T'HH:mm")
                    }
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({
                        ...formData,
                        end: new Date(e.target.value),
                      })
                    }
                    className="pl-10 bg-neutral-800 border-neutral-700 focus:border-[#1D9BF0] text-white"
                    disabled={isPublished}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-neutral-300">
                Content Type
              </label>

              {/* Warning when slot type doesn't match day's configuration */}
              {hasSlotTypes && !isValidType && !isPublished && (
                <div className="mb-3 flex items-center gap-2 text-amber-500 p-2 bg-amber-950/30 border border-amber-900/50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <p className="text-xs">
                    The selected type doesn't match this day's recommended types
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 mb-2">
                {allSlotTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleTypeChange(type.id)}
                    disabled={isPublished}
                    className={cn(
                      "p-2 rounded-lg border flex items-center gap-2 text-sm transition-all",
                      formData.type === type.id
                        ? `border-${type.color} bg-neutral-800`
                        : "border-neutral-800 bg-neutral-900 hover:border-neutral-700",
                      isPublished && "opacity-50 cursor-not-allowed"
                    )}
                    style={{
                      borderColor:
                        formData.type === type.id ? type.color : undefined,
                    }}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: type.color }}
                    />
                    <span>{type.name}</span>

                    {/* Show if this is a recommended type for this day */}
                    {hasSlotTypes &&
                      availableSlotTypes.some((t) => t.id === type.id) && (
                        <span className="ml-auto text-xs text-neutral-500">
                          Recommended
                        </span>
                      )}
                  </button>
                ))}
              </div>

              {hasSlotTypes && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {availableSlotTypes.map((type) => (
                    <SlotTypeBadge
                      key={type.id}
                      name={type.name}
                      color={type.color}
                      small
                    />
                  ))}
                </div>
              )}

              {/* Show slot type schedule info */}
            </div>

            <div>
              <label className=" text-sm font-medium mb-1.5 text-neutral-300 flex items-center">
                <Tag className="h-4 w-4 mr-1" />
                Tags
              </label>
              <div className="flex gap-2 mb-2 flex-wrap">
                {formData.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded-full bg-neutral-800 text-sm flex items-center gap-1 border border-neutral-700"
                  >
                    {tag}
                    {!isPublished && (
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-red-400"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>

              {!isPublished && (
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewTag(e.target.value)
                    }
                    placeholder="Add a tag"
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="bg-neutral-800 border-neutral-700 focus:border-[#1D9BF0] text-white placeholder:text-neutral-500"
                  />
                  <Button
                    type="button"
                    onClick={handleAddTag}
                    variant="outline"
                    className="border-neutral-700 hover:bg-neutral-800 text-neutral-300"
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>

            {formData.type === "thread" && (
              <div className="bg-neutral-800 p-3 rounded-lg border border-neutral-700 flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-[#7856FF]" />
                <div>
                  <div className="text-sm font-medium">Thread Content</div>
                  <div className="text-xs text-neutral-400">
                    This item will be posted as a Twitter thread
                  </div>
                </div>
              </div>
            )}
          </form>
        </CardContent>

        <CardFooter className="flex justify-end gap-2 border-t border-neutral-800 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-neutral-700 hover:bg-neutral-800 text-neutral-300 hover:text-white"
          >
            Cancel
          </Button>

          {!isPublished && (
            <Button
              onClick={handleSubmit}
              className="bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white rounded-full"
            >
              {event ? "Save Changes" : "Create Event"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
