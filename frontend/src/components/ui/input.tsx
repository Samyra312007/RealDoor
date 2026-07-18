import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="block font-sans text-sm font-medium text-ink/80">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(
            "flex h-10 w-full rounded-sm border bg-paper px-3 py-2 font-sans text-sm text-ink",
            "file:border-0 file:bg-transparent file:font-sans file:text-sm file:font-medium",
            "placeholder:text-ink/40",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error ? "border-expired" : "border-line",
            className
          )}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="font-sans text-sm text-expired" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
