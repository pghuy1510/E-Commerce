"use client";

import React, { useEffect, useState } from "react";
import { ProvinceOption, WardOption, locationAPI } from "@/lib/api";
import { ChevronDown } from "lucide-react";

export type AddressSelectorValue = {
  provinceId?: number;
  wardId?: number;
  addressDetail?: string;
};

type AddressSelectorProps = {
  value: AddressSelectorValue;
  onChange: (value: AddressSelectorValue) => void;
  provinces: ProvinceOption[]; // Preloaded from parent pages to save API requests
  disabled?: boolean;
  required?: boolean;
  className?: string;
};

export default function AddressSelector({
  value,
  onChange,
  provinces = [],
  disabled = false,
  required = false,
  className = "",
}: AddressSelectorProps) {
  const [wards, setWards] = useState<WardOption[]>([]);
  const [loadingWards, setLoadingWards] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Load wards whenever provinceId changes
  useEffect(() => {
    if (!value.provinceId) {
      setWards([]);
      return;
    }

    const loadWards = async () => {
      try {
        setLoadingWards(true);
        setErrorMsg("");
        const data = await locationAPI.getWards(value.provinceId!);
        setWards(data);
      } catch (err) {
        console.error("Lỗi khi tải xã/phường:", err);
        setErrorMsg("Không thể tải dữ liệu địa chỉ");
      } finally {
        setLoadingWards(false);
      }
    };

    void loadWards();
  }, [value.provinceId]);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value ? Number(e.target.value) : undefined;
    onChange({
      ...value,
      provinceId: pId,
      wardId: undefined, // Reset ward when province changes
    });
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const wId = e.target.value ? Number(e.target.value) : undefined;
    onChange({
      ...value,
      wardId: wId,
    });
  };

  const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      addressDetail: e.target.value,
    });
  };

  const selectContainerClass = "relative flex-1";
  const controlClass = `w-full h-12 px-4 pr-10 rounded-2xl border border-amber-100 bg-amber-50/40 text-gray-800 text-sm outline-none focus:ring-2 focus:ring-amber-300 transition appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`;
  const iconClass = "w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-amber-600 pointer-events-none";

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PROVINCE DROPDOWN */}
        <div className={selectContainerClass}>
          <select
            value={value.provinceId ?? ""}
            onChange={handleProvinceChange}
            disabled={disabled || provinces.length === 0}
            required={required}
            className={controlClass}
          >
            <option value="">Chọn Tỉnh / Thành phố</option>
            {provinces.map((prov) => (
              <option key={prov.id} value={prov.id}>
                {prov.name}
              </option>
            ))}
          </select>
          <ChevronDown className={iconClass} />
        </div>

        {/* WARD DROPDOWN */}
        <div className={selectContainerClass}>
          <select
            value={value.wardId ?? ""}
            onChange={handleWardChange}
            disabled={disabled || !value.provinceId || loadingWards}
            required={required}
            className={controlClass}
          >
            <option value="">
              {loadingWards ? "Đang tải..." : "Chọn Xã / Phường"}
            </option>
            {wards.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <ChevronDown className={iconClass} />
        </div>
      </div>

      {/* DETAIL ADDRESS INPUT */}
      <input
        type="text"
        value={value.addressDetail ?? ""}
        onChange={handleDetailChange}
        disabled={disabled}
        required={required}
        placeholder="Số nhà, tên đường (ví dụ: 123 Nguyễn Trãi)"
        className="w-full h-12 px-4 rounded-2xl border border-amber-100 bg-amber-50/40 text-gray-800 text-sm outline-none focus:ring-2 focus:ring-amber-300 transition disabled:opacity-60 disabled:cursor-not-allowed"
      />

      {/* ERROR NOTICE */}
      {errorMsg && (
        <p className="text-xs text-rose-500 font-medium">⚠️ {errorMsg}</p>
      )}
    </div>
  );
}
