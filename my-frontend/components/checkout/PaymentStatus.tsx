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
      className: "text-amber-600 bg-amber-50 border-amber-100",
    },
    paid: {
      label: "Payment successful",
      icon: CheckCircle2,
      className: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    failed: {
      label: "Payment failed",
      icon: XCircle,
      className: "text-rose-600 bg-rose-50 border-rose-100",
    },
    expired: {
      label: "Payment expired",
      icon: XCircle,
      className: "text-rose-600 bg-rose-50 border-rose-100",
    },
    refunded: {
      label: "Payment refunded",
      icon: XCircle,
      className: "text-slate-600 bg-slate-50 border-slate-100",
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
