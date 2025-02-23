import React, { useState } from "react";
import {
  Lightbulb,
  SmilePlus,
  Reply,
  Heart,
  Eye,
  Sparkles,
  Quote,
  MoveDiagonal,
  MoreVertical,
  X,
} from "lucide-react";

interface ActionButtonProps {
  icon: React.ReactNode;
  count?: number;
  onClick?: () => void;
  tooltip?: string;
  label?: string;
  showLabel?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  count,
  onClick,
  tooltip,
  label,
  showLabel = false,
}) => (
  <button
    onClick={onClick}
    className="p-2 hover:bg-gray-700 rounded-lg transition-colors duration-200 flex items-center gap-2 text-gray-400 hover:text-gray-200 relative group w-full"
    title={tooltip}
  >
    {icon}
    {showLabel && label && <span className="text-sm">{label}</span>}
    {count !== undefined && <span className="text-sm">{count}</span>}
    {tooltip && !showLabel && (
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {tooltip}
      </div>
    )}
  </button>
);

const actions = [
  {
    icon: <Sparkles className="w-5 h-5 text-purple-400" />,
    tooltip: "AI Assist",
    label: "AI Assist",
  },
  {
    icon: <Lightbulb className="w-5 h-5" />,
    tooltip: "Suggestions",
    label: "Suggestions",
  },
  { icon: <SmilePlus className="w-5 h-5" />, tooltip: "Emoji", label: "Emoji" },
  { icon: <Reply className="w-5 h-5" />, tooltip: "Reply", label: "Reply" },
  {
    icon: <Quote className="w-5 h-5 rotate-180" />,
    tooltip: "Quote",
    label: "Quote",
  },
  { icon: <Heart className="w-5 h-5" />, tooltip: "Like", label: "Like" },
  { icon: <Eye className="w-5 h-5" />, tooltip: "Preview", label: "Preview" },
  {
    icon: <MoveDiagonal className="w-5 h-5" />,
    tooltip: "Share",
    label: "Share",
  },
];

const ActionsMenu: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleMenu = () => setIsExpanded(!isExpanded);

  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:flex bg-gray-800/80 backdrop-blur-sm rounded-full px-4 py-2 items-center gap-2">
        {actions.map((action, index) => (
          <ActionButton
            key={index}
            icon={action.icon}
            tooltip={action.tooltip}
          />
        ))}
      </div>

      {/* Mobile View */}
      <div className="md:hidden fixed bottom-4 right-4 z-50">
        {isExpanded ? (
          <div className="bg-gray-800/95 backdrop-blur-sm rounded-lg p-2 flex flex-col items-stretch gap-1 transform opacity-100 transition-all duration-200 ease-out">
            <button
              onClick={toggleMenu}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors duration-200 flex items-center justify-between text-gray-400 hover:text-gray-200 mb-2"
            >
              <span className="text-sm font-medium">Actions</span>
              <X className="w-5 h-5" />
            </button>
            {actions.map((action, index) => (
              <ActionButton
                key={index}
                icon={action.icon}
                label={action.label}
                showLabel={true}
              />
            ))}
          </div>
        ) : (
          <button
            onClick={toggleMenu}
            className="p-3 bg-gray-800/80 hover:bg-gray-700/90 rounded-full transition-colors duration-200 text-gray-400 hover:text-gray-200 shadow-lg"
          >
            <MoreVertical className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Backdrop for mobile when menu is expanded */}
      {isExpanded && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-200 ease-in-out"
          onClick={toggleMenu}
        />
      )}
    </>
  );
};

export default ActionsMenu;
