"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
}: ModalProps) {
  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity'
        onClick={onClose}
        aria-hidden='true'
      />

      {/* Modal */}
      <div className='flex min-h-full items-center justify-center p-4'>
        <div
          className={cn(
            "relative w-full bg-white rounded-2xl shadow-xl",
            "transform transition-all",
            sizes[size]
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || description) && (
            <div className='flex items-start justify-between px-6 py-4 border-b border-gray-100'>
              <div>
                {title && (
                  <h2 className='text-lg font-semibold text-gray-900'>
                    {title}
                  </h2>
                )}
                {description && (
                  <p className='mt-1 text-sm text-gray-500'>{description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className='rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors'
              >
                <X className='h-5 w-5' />
              </button>
            </div>
          )}

          {/* Content */}
          <div className='px-6 py-4'>{children}</div>
        </div>
      </div>
    </div>
  );
}

// Confirmation Dialog variant
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
}: ConfirmDialogProps) {
  const variantStyles = {
    danger: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
    warning: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
    info: "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500",
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='sm'>
      <div className='text-center'>
        <h3 className='text-lg font-semibold text-gray-900 mb-2'>{title}</h3>
        <p className='text-sm text-gray-600 mb-6'>{message}</p>
        <div className='flex gap-3 justify-center'>
          <button
            onClick={onClose}
            disabled={isLoading}
            className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50'
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50",
              variantStyles[variant]
            )}
          >
            {isLoading ? "Loading..." : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
