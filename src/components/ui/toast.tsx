// /components/ui/toast.tsx
import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number; // in milliseconds
  onClose: () => void;
}

export function Toast({ message, type, duration = 5000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Allow time for fade-out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  // Styles based on type
  const typeStyles = {
    success: "bg-[#00BA7C]/20 border-[#00BA7C] text-[#00BA7C]",
    error: "bg-[#F4212E]/20 border-[#F4212E] text-[#F4212E]",
    warning: "bg-[#FFD400]/20 border-[#FFD400] text-[#FFD400]",
    info: "bg-[#1D9BF0]/20 border-[#1D9BF0] text-[#1D9BF0]",
  };

  return (
    <div
      className={`
        flex items-center gap-3 py-3 px-4 
        border rounded-xl shadow-lg 
        transition-all duration-300
        ${typeStyles[type]}
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
      `}
    >
      <p className="text-sm font-medium">{message}</p>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onClose, 300);
        }}
        className="p-1 hover:bg-black/20 rounded-full"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
