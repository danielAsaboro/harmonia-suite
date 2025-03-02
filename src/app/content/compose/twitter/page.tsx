// // app/content/compose/twitter/page.tsx

"use client";

import { useEffect, useState } from "react";
import { Menu, X, Settings, ChevronLeft, Info } from "lucide-react";
import {
  UserAccountProvider,
  useUserAccount,
} from "@/components/editor/context/account";
import { useEditor } from "@/components/editor/context/Editor";
import LoadingState from "@/components/editor/LoadingState";
import PlayGround from "@/components/editor/Main";
import MetadataTab from "@/components/editor/MetadataTab";
import ActionsMenu from "@/components/editor/PowerTab";
import WelcomeScreen from "./WelcomeScreen";
import EditorSidebar from "@/components/editor/EditorSideBar";
import { cn } from "@/utils/ts-merge";

function TwitterEditorContent() {
  const {
    editorState,
    isMetadataTabVisible,
    isSidebarVisible,
    toggleMetadataTab,
  } = useEditor();
  const { isLoading } = useUserAccount();
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  // Use editor context for metadata visibility
  const isMobileMetadataVisible = isSidebarVisible && isMetadataTabVisible;

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-black text-white">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed md:relative md:flex-shrink-0 transition-all duration-300 z-50
        ${
          isMobileSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }
      `}
      >
        <EditorSidebar />
      </div>

      {/* Main Content */}
      <div
        className={`
        flex-1 transition-all duration-300 ease-in-out relative
        ${
          isMetadataTabVisible && editorState.isVisible
            ? "md:w-[calc(100%-20rem)]"
            : "w-full"
        }
      `}
      >
        {/* Mobile Header - Now with transforming menu button */}
        {editorState.isVisible && (
          <div className="sticky top-0 z-40 bg-black md:hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <button
                onClick={() => setMobileSidebarOpen(!isMobileSidebarOpen)}
                className="p-1 transition-transform duration-200"
              >
                {isMobileSidebarOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
              <h1 className="text-lg font-medium">Compose Tweet</h1>
              <button
                onClick={toggleMetadataTab}
                className={cn(
                  "p-1 transition-transform duration-200",
                  isMetadataTabVisible && "text-blue-500"
                )}
              >
                {isMetadataTabVisible ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Info className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        )}

        {editorState.isVisible ? (
          // <div className="flex flex-col h-[calc(100vh-4rem)] md:h-screen relative">
          <div className="flex flex-col h-full relative">
            {/* Scrollable content area */}
            {/* <div className="flex-1 overflow-y-auto pb-24"> */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-4xl mx-auto pt-5 p-4 pb-40">
                <PlayGround
                  draftId={editorState.selectedDraftId}
                  draftType={editorState.selectedDraftType}
                />
              </div>
            </div>

            {/* Actions Menu */}
            <div className="fixed bottom-0 left-0 right-0 md:relative md:bottom-10 flex justify-center bg-black md:bg-transparent">
              <div className="w-full md:w-auto md:relative md:bottom-14">
                <ActionsMenu />
              </div>
            </div>
          </div>
        ) : (
          <WelcomeScreen />
        )}
      </div>

      {/* Metadata Panel */}
      {isMetadataTabVisible && editorState.isVisible && (
        <>
          {/* Mobile Metadata Panel */}
          <div
            className={`
            fixed inset-y-0 right-0 w-[80%] max-w-md z-50 md:hidden
            transition-transform duration-300 ease-in-out bg-gray-900
            ${isMetadataTabVisible ? "translate-x-0" : "translate-x-full"}
          `}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-lg font-medium">Metadata</h2>
              <button
                onClick={toggleMetadataTab}
                className="p-2 hover:bg-gray-800 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="h-[calc(100vh-4rem)] overflow-y-auto">
              <MetadataTab />
            </div>
          </div>

          {/* Desktop Metadata Panel */}
          <div
            className={`
            hidden md:block w-80 right-0 top-0 h-screen
            transition-all duration-300 ease-in-out border-l border-gray-800
            ${isMetadataTabVisible ? "translate-x-0" : "translate-x-full"}
          `}
          >
            <MetadataTab />
          </div>

          {/* Mobile Backdrop */}
          <div
            className={`
              fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden
              transition-opacity duration-300
              ${
                isMetadataTabVisible
                  ? "opacity-100"
                  : "opacity-0 pointer-events-none"
              }
            `}
            onClick={toggleMetadataTab}
          />
        </>
      )}
    </div>
  );
}

export default function TwitterEditor() {
  return (
    <UserAccountProvider>
      <TwitterEditorContent />
    </UserAccountProvider>
  );
}
