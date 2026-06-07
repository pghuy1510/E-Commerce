"use client";

import { Banknote, QrCode } from "lucide-react";
import React from "react";
import type { PaymentMethod } from "@/lib/api";

type PaymentMethodsProps = {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
};

export default function PaymentMethods({
  value,
  onChange,
}: PaymentMethodsProps) {
  const methods: Array<{
    id: PaymentMethod;
    title: string;
    subtitle: string;
    icon: React.ElementType;
  }> = [
    {
      id: "qr",
      title: "Instant QR Transfer",
      subtitle: "Scan & pay securely in seconds.",
      icon: QrCode,
    },
    {
      id: "cod",
      title: "Cash on Delivery",
      subtitle: "Pay when your order arrives.",
      icon: Banknote,
    },
  ];

  return (
    <div className="bg-brand-surface rounded-3xl shadow-sm border border-brand-border p-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-brand-text">Payment method</h2>
        <p className="text-sm text-brand-muted mt-1">
          Choose your preferred payment option.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {methods.map((method) => {
          const Icon = method.icon;
          const active = value === method.id;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onChange(method.id)}
              className={`rounded-3xl border px-5 py-4 text-left transition shadow-sm ${
                active
                  ? "border-brand-primary bg-brand-primary-light/30"
                  : "border-brand-border bg-brand-surface hover:border-brand-primary/50"
              }`}>
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                    active
                      ? "bg-brand-primary text-white"
                      : "bg-brand-primary-light text-brand-primary"
                  }`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-brand-text">{method.title}</p>
                  <p className="text-sm text-brand-muted">{method.subtitle}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
