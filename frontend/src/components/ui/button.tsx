import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
          "disabled:pointer-events-none disabled:opacity-50",
          {
            primary: "bg-brand-600 text-white hover:bg-brand-700",
            secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
            outline: "border border-neutral-300 bg-white hover:bg-neutral-50",
            ghost: "hover:bg-neutral-100",
            danger: "bg-red-600 text-white hover:bg-red-700",
          }[variant],
          {
            sm: "h-8 px-3 text-sm",
            md: "h-10 px-4 text-sm",
            lg: "h-12 px-6 text-base",
          }[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
