// /knowledge/page.tsx
"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileUp,
  Trash2,
  Edit,
  FileText,
  Settings,
  Search,
  AlertCircle,
  Check,
  Timer,
} from "lucide-react";

interface Document {
  id: string;
  title: string;
  status: "active" | "processing" | "failed";
  type: string;
  lastUpdated: string;
  queryCount: number;
  metadata: {
    description: string;
    tags: string[];
  };
}

export default function KnowledgePage() {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileView, setIsMobileView] = useState(false);

  // Mock data - replace with actual data fetching
  const documents: Document[] = [
    {
      id: "1",
      title: "Superteam Vietnam Handbook",
      status: "active",
      type: "PDF",
      lastUpdated: "2024-01-14",
      queryCount: 156,
      metadata: {
        description: "Official handbook for Superteam Vietnam members",
        tags: ["handbook", "guidelines", "procedures"],
      },
    },
    {
      id: "2",
      title: "Project Guidelines",
      status: "processing",
      type: "DOCX",
      lastUpdated: "2024-01-13",
      queryCount: 89,
      metadata: {
        description: "Project submission and evaluation guidelines",
        tags: ["projects", "evaluation", "submission"],
      },
    },
  ];

  // Handle mobile view toggle
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Check className="w-4 h-4 text-green-500" />;
      case "processing":
        return <Timer className="w-4 h-4 text-yellow-500" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
        <h1 className="text-2xl md:text-3xl font-bold">Knowledge Base</h1>
        <div className="flex flex-wrap gap-2 md:gap-4">
          <Button
            variant="outline"
            className="flex items-center gap-2 text-xs md:text-sm"
            size="sm"
          >
            <Settings className="w-3 h-3 md:w-4 md:h-4" />
            RAG Settings
          </Button>
          <Button
            className="flex items-center gap-2 text-xs md:text-sm"
            size="sm"
          >
            <FileUp className="w-3 h-3 md:w-4 md:h-4" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Document List */}
        <div className="col-span-1 space-y-3 md:space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search documents..."
              className="pl-8"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
            />
          </div>

          <div className="space-y-2 max-h-[60vh] md:max-h-[70vh] overflow-y-auto">
            {documents.map((doc) => (
              <Card
                key={doc.id}
                className={`cursor-pointer hover:bg-gray-50 ${
                  selectedDoc?.id === doc.id
                    ? "ring-2 ring-primary ring-opacity-50"
                    : ""
                }`}
                onClick={() => setSelectedDoc(doc)}
              >
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 md:mb-2">
                        {getStatusIcon(doc.status)}
                        <h3 className="font-medium text-sm md:text-base line-clamp-1">
                          {doc.title}
                        </h3>
                      </div>
                      <div className="text-xs md:text-sm text-gray-500">
                        Updated: {doc.lastUpdated}
                      </div>
                      <div className="text-xs md:text-sm text-gray-500">
                        Queries: {doc.queryCount}
                      </div>
                    </div>
                    <Badge className="text-xs">{doc.type}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Document Preview/Edit */}
        <div className="col-span-1 md:col-span-2">
          {selectedDoc ? (
            <Card>
              <CardHeader className="border-b p-3 md:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-0">
                  <div>
                    <CardTitle className="text-xl md:text-2xl mb-1 md:mb-2">
                      {selectedDoc.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedDoc.status)}
                      <span className="capitalize text-sm">
                        {selectedDoc.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-3 md:p-6 space-y-4 md:space-y-6 max-h-[60vh] md:max-h-[70vh] overflow-y-auto">
                {/* Document Metadata */}
                <div>
                  <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-3">
                    Metadata
                  </h3>
                  <div className="space-y-3 md:space-y-4">
                    <div>
                      <label className="text-xs md:text-sm font-medium">
                        Description
                      </label>
                      <p className="text-sm md:text-base text-gray-600">
                        {selectedDoc.metadata.description}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs md:text-sm font-medium">
                        Tags
                      </label>
                      <div className="flex flex-wrap gap-1 md:gap-2 mt-1">
                        {selectedDoc.metadata.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Usage Statistics */}
                <div>
                  <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-3">
                    Usage Statistics
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4">
                    <Card>
                      <CardContent className="p-3 md:p-4">
                        <div className="text-xs md:text-sm font-medium text-gray-500">
                          Total Queries
                        </div>
                        <div className="text-xl md:text-2xl font-bold">
                          {selectedDoc.queryCount}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3 md:p-4">
                        <div className="text-xs md:text-sm font-medium text-gray-500">
                          Last Updated
                        </div>
                        <div className="text-xl md:text-2xl font-bold">
                          {selectedDoc.lastUpdated}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3 md:p-4">
                        <div className="text-xs md:text-sm font-medium text-gray-500">
                          Format
                        </div>
                        <div className="text-xl md:text-2xl font-bold">
                          {selectedDoc.type}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Response Testing Interface */}
                <div>
                  <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-3">
                    Response Testing
                  </h3>
                  <div className="space-y-2 md:space-y-4">
                    <Input
                      placeholder="Enter a test query..."
                      className="w-full"
                    />
                    <Button className="w-full">Test Response</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full min-h-[200px] flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FileText className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2" />
                <span className="text-sm md:text-base">
                  Select a document to view details
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// 3. Knowledge Base Management (/knowledge)

// Document list view

// Status (active/processing)
// Last updated
// Query count

// Upload interface

// Drag-and-drop zone
// Progress indicator
// Format support: PDF, TXT, DOCX

// Document preview/edit mode

// Basic metadata editing
// Delete option
// Usage statistics

// Knowledge Base

// Document Upload/Management
// RAG Configuration
// Response Testing Interface
// Training Data Management
// Content Verification
