// /app/onboarding/PreferencesStep.tsx
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ContentType } from "@/types/onboarding";

interface PreferencesStepProps {
  contentTypes: ContentType[];
  onPreferencesChange: (types: ContentType[]) => void;
}

const PreferencesStep = ({
  contentTypes,
  onPreferencesChange,
}: PreferencesStepProps) => {
  const options: { value: ContentType; label: string; description: string }[] =
    [
      {
        value: "tweets",
        label: "Single Tweets",
        description: "Quick thoughts and updates",
      },
      {
        value: "threads",
        label: "Thread Builder",
        description: "Create engaging tweet threads",
      },
      {
        value: "scheduled",
        label: "Scheduled Posts",
        description: "Plan your content ahead",
      },
    ];

  return (
    <div className="space-y-2">
      {options.map((type) => (
        <div key={type.value} className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={contentTypes.includes(type.value)}
            onCheckedChange={(checked) =>
              onPreferencesChange(
                checked
                  ? [...contentTypes, type.value]
                  : contentTypes.filter((t) => t !== type.value)
              )
            }
          />
          <div className="space-y-1">
            <span className="text-sm font-medium block text-gray-100">
              {type.label}
            </span>
            <span className="text-xs text-gray-400 block">
              {type.description}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PreferencesStep;
