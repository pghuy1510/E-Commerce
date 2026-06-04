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
    <div className="bg-white rounded-3xl shadow-sm border border-amber-100 p-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Payment method</h2>
        <p className="text-sm text-gray-500 mt-1">
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
                  ? "border-amber-400 bg-amber-50"
                  : "border-amber-100 bg-white hover:border-amber-300"
              }`}>
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                    active
                      ? "bg-amber-500 text-white"
                      : "bg-amber-100 text-amber-600"
                  }`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-gray-900">{method.title}</p>
                  <p className="text-sm text-gray-500">{method.subtitle}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
