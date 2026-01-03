import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, icon, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className='w-full'>
        {label && (
          <label
            htmlFor={inputId}
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            {label}
            {props.required && <span className='text-red-500 ml-1'>*</span>}
          </label>
        )}
        <div className='relative'>
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "block w-full rounded-lg border px-3 py-2 text-gray-900 shadow-sm transition-colors",
              "placeholder:text-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              error
                ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-200",
              "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
              icon ? "pr-10" : "",
              className
            )}
            {...props}
          />
          {icon && (
            <div className='absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500'>
              {icon}
            </div>
          )}
        </div>
        {hint && !error && <p className='mt-1 text-sm text-gray-500'>{hint}</p>}
        {error && <p className='mt-1 text-sm text-red-600'>{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

// Textarea variant
interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className='w-full'>
        {label && (
          <label
            htmlFor={inputId}
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            {label}
            {props.required && <span className='text-red-500 ml-1'>*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "block w-full rounded-lg border px-3 py-2 text-gray-900 shadow-sm transition-colors",
            "placeholder:text-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-offset-0",
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-200"
              : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-200",
            "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
            "resize-none",
            className
          )}
          {...props}
        />
        {error && <p className='mt-1 text-sm text-red-600'>{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
