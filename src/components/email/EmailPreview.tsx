// /components/email/EmailPreview.tsx
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface EmailPreviewProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailPreview: React.FC<EmailPreviewProps> = ({
  isOpen,
  onClose,
}) => {
  const [previewParams, setPreviewParams] = useState({
    inviterName: "John Doe",
    teamName: "Demo Team",
    role: "admin",
    inviteUrl: "http://example.com/invite",
    expiresIn: "48 hours",
  });

  const [iframeKey, setIframeKey] = useState(0); // For forcing iframe refresh

  const handleParamChange = (key: string, value: string) => {
    setPreviewParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const refreshPreview = () => {
    setIframeKey((prev) => prev + 1);
  };

  const getPreviewUrl = () => {
    const params = new URLSearchParams(previewParams);
    return `/api/email/preview?${params.toString()}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[900px] h-[800px]">
        <DialogHeader>
          <DialogTitle>Email Template Preview</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="preview" className="h-full">
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="customize">Customize</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="h-[calc(100%-40px)]">
            <iframe
              key={iframeKey}
              src={getPreviewUrl()}
              className="w-full h-full border rounded-md"
            />
          </TabsContent>

          <TabsContent value="customize" className="space-y-4">
            {Object.entries(previewParams).map(([key, value]) => (
              <div key={key} className="grid gap-2">
                <Label htmlFor={key} className="capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </Label>
                <Input
                  id={key}
                  value={value}
                  onChange={(e) => handleParamChange(key, e.target.value)}
                />
              </div>
            ))}
            <Button onClick={refreshPreview}>Update Preview</Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
