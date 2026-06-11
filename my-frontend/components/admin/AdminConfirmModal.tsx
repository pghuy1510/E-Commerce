"use client";

import { X } from "lucide-react";

interface AdminConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "primary" | "danger" | "warning";
}

export default function AdminConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy bỏ",
  type = "primary",
}: AdminConfirmModalProps) {
  if (!isOpen) return null;

  const getConfirmButtonClass = () => {
    switch (type) {
      case "danger":
        return "bg-status-danger-bg hover:bg-red-600 hover:text-white border border-status-danger-border text-status-danger-text shadow-sm";
      case "warning":
        return "bg-status-warning-bg hover:bg-orange-655 hover:text-white border border-status-warning-border text-status-warning-text shadow-sm";
      default:
        return "bg-brand-primary hover:bg-brand-primary-hover text-white shadow-md shadow-brand-primary/20";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-brand-surface border border-brand-border rounded-3xl shadow-2xl ring-1 ring-brand-border/20 w-full max-w-md overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border/40 bg-brand-primary-light/10">
          <h3 className="font-extrabold text-brand-text text-base">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-brand-primary-light/20 text-brand-muted hover:text-brand-primary transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <p className="text-sm text-brand-text leading-relaxed font-semibold">
            {message}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-bold text-brand-muted bg-brand-bg border border-brand-border hover:bg-brand-surface rounded-2xl transition cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 py-3 text-sm font-bold rounded-2xl transition cursor-pointer flex items-center justify-center ${getConfirmButtonClass()}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
