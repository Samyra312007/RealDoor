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
          "inline-flex items-center justify-center rounded-sm font-sans font-medium transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass",
          "disabled:pointer-events-none disabled:opacity-50",
          {
            primary: "bg-brass text-paper hover:opacity-90",
            secondary: "bg-line/40 text-ink hover:bg-line/60",
            outline: "border border-line bg-transparent hover:bg-line/30",
            ghost: "hover:bg-line/30 text-ink",
            danger: "bg-expired text-paper hover:opacity-90",
          }[variant],
          {
            sm: "h-8 px-3 text-xs",
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
