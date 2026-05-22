"use client";

import React from "react";

type SummaryItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
};

type OrderSummaryProps = {
  items: SummaryItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  formatPrice: (value: number) => string;
};

export default function OrderSummary({
  items,
  subtotal,
  shippingFee,
  discount,
  total,
  formatPrice,
}: OrderSummaryProps) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-amber-100 p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Order summary</h3>

      <div className="space-y-3">
        {items.length === 0 && (
          <p className="text-sm text-gray-500">Your cart is empty.</p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between gap-4 border-b border-amber-50 pb-3 text-sm">
            <div>
              <p className="font-medium text-gray-900">{item.name}</p>
              <p className="text-xs text-gray-500">
                {item.quantity} × {formatPrice(item.price)}
              </p>
            </div>
            <span className="font-semibold text-amber-600">
              {formatPrice(item.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between text-gray-600">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-gray-600">
          <span>Shipping</span>
          <span>{formatPrice(shippingFee)}</span>
        </div>
        <div className="flex items-center justify-between text-gray-600">
          <span>Discount</span>
          <span className="text-emerald-600">-{formatPrice(discount)}</span>
        </div>
        <div className="flex items-center justify-between text-lg font-semibold text-gray-900 pt-2 border-t border-amber-100">
          <span>Total</span>
          <span className="text-amber-600">{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  );
}
