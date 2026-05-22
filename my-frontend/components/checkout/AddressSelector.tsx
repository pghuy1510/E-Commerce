"use client";

import React from "react";

export type ShippingAddress = {
  receiverName: string;
  receiverPhone: string;
  province: string;
  district: string;
  ward: string;
  detail: string;
};

type AddressSelectorProps = {
  value: ShippingAddress;
  onChange: (value: ShippingAddress) => void;
};

export default function AddressSelector({
  value,
  onChange,
}: AddressSelectorProps) {
  const handleChange = (key: keyof ShippingAddress, newValue: string) => {
    onChange({ ...value, [key]: newValue });
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-amber-100 p-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Shipping address
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Use the exact receiver details for smooth delivery.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          value={value.receiverName}
          onChange={(e) => handleChange("receiverName", e.target.value)}
          placeholder="Receiver name"
          className="rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-300"
        />
        <input
          value={value.receiverPhone}
          onChange={(e) => handleChange("receiverPhone", e.target.value)}
          placeholder="Phone number"
          className="rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-300"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          value={value.province}
          onChange={(e) => handleChange("province", e.target.value)}
          placeholder="Province"
          className="rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-300"
        />
        <input
          value={value.district}
          onChange={(e) => handleChange("district", e.target.value)}
          placeholder="District"
          className="rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-300"
        />
        <input
          value={value.ward}
          onChange={(e) => handleChange("ward", e.target.value)}
          placeholder="Ward"
          className="rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-300"
        />
      </div>

      <input
        value={value.detail}
        onChange={(e) => handleChange("detail", e.target.value)}
        placeholder="Street, building, apartment..."
        className="w-full rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-300"
      />
    </div>
  );
}
