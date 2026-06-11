"use client";

import { useEffect, useState, useRef } from "react";
import { X, Loader2 } from "lucide-react";

interface AdminPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  description?: string;
  inputLabel?: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  submitText?: string;
  cancelText?: string;
  isSubmitting?: boolean;
}

export default function AdminPromptModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  inputLabel,
  placeholder,
  defaultValue = "",
  required = false,
  submitText = "Xác nhận",
  cancelText = "Hủy bỏ",
  isSubmitting = false,
}: AdminPromptModalProps) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setError(null);
      // Autofocus input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (required && !value.trim()) {
      setError(required ? "Trường này là bắt buộc." : null);
      return;
    }
    onSubmit(value);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-brand-surface border border-brand-border rounded-3xl shadow-2xl ring-1 ring-brand-border/20 w-full max-w-md overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border/40 bg-brand-primary-light/10">
          <div>
            <h3 className="font-extrabold text-brand-text text-base">{title}</h3>
            {description && <p className="text-xs text-brand-muted mt-0.5">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-brand-primary-light/20 text-brand-muted hover:text-brand-primary transition cursor-pointer"
            disabled={isSubmitting}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            {inputLabel && (
              <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">
                {inputLabel} {required && <span className="text-red-500">*</span>}
              </label>
            )}
            <textarea
              ref={inputRef}
              rows={4}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError(null);
              }}
              placeholder={placeholder}
              className="w-full bg-brand-bg border border-brand-border/30 text-brand-text rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary/30 font-medium transition placeholder:text-brand-muted/70 resize-none"
              disabled={isSubmitting}
            />
            {error && <p className="text-xs text-status-danger-text font-bold">{error}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 text-sm font-bold text-brand-muted bg-brand-bg border border-brand-border hover:bg-brand-surface rounded-2xl transition cursor-pointer disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary-hover rounded-2xl transition flex items-center justify-center gap-1.5 shadow-md shadow-brand-primary/20 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
