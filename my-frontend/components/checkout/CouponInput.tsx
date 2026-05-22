"use client";

import React from "react";

type CouponInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function CouponInput({ value, onChange }: CouponInputProps) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-amber-100 p-6 space-y-3">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Coupon</h3>
        <p className="text-sm text-gray-500">
          Apply your best coupon for an instant discount.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter coupon code"
          className="flex-1 rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-300"
        />
        <button
          type="button"
          className="rounded-2xl bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition">
          Apply
        </button>
      </div>
    </div>
  );
}
