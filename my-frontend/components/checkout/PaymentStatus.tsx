"use client";

import { CheckCircle2, Clock, XCircle } from "lucide-react";
import React from "react";
import type { PaymentStatus } from "@/lib/api";

type PaymentStatusProps = {
  status: PaymentStatus;
};

export default function PaymentStatus({ status }: PaymentStatusProps) {
  const config = {
    pending: {
      label: "Pending payment",
      icon: Clock,
      className: "text-status-warning-text bg-status-warning-bg border-status-warning-border",
    },
    paid: {
      label: "Payment successful",
      icon: CheckCircle2,
      className: "text-status-success-text bg-status-success-bg border-status-success-border",
    },
    failed: {
      label: "Payment failed",
      icon: XCircle,
      className: "text-status-danger-text bg-status-danger-bg border-status-danger-border",
    },
    expired: {
      label: "Payment expired",
      icon: XCircle,
      className: "text-status-danger-text bg-status-danger-bg border-status-danger-border",
    },
    refunded: {
      label: "Payment refunded",
      icon: XCircle,
      className: "text-status-info-text bg-status-info-bg border-status-info-border",
    },
  }[status];

  const Icon = config.icon;

  return (
    <div
      className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold ${config.className}`}>
      <Icon className="h-4 w-4" />
      <span>{config.label}</span>
    </div>
  );
}
