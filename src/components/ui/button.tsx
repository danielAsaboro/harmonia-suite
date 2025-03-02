// /components/ui/button.tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { ButtonProps } from "../product_registration/types";
import { cn } from "@/utils/ts-merge";

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "default",
      size = "default",
      asChild = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    // Twitter-inspired dark theme colors
    const variants = {
      default:
        "bg-[#1D9BF0] text-white hover:bg-[#1A8CD8] focus-visible:bg-[#1A8CD8]",
      destructive: "bg-[#F4212E] text-white hover:bg-[#DD1F2B]",
      outline:
        "border border-neutral-800 bg-black hover:bg-neutral-900 text-neutral-200",
      secondary: "bg-neutral-900 text-neutral-200 hover:bg-neutral-800",
      ghost: "hover:bg-neutral-900 text-neutral-200",
      link: "text-[#1D9BF0] underline-offset-4 hover:underline",
    };

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-8 px-3 text-xs",
      lg: "h-12 px-8 text-lg",
      icon: "h-10 w-10",
    };

    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium",
          "transition-colors focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-[#1D9BF0] focus-visible:ring-offset-1 focus-visible:ring-offset-black",
          "disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
