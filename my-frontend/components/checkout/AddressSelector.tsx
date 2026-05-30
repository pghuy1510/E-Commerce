"use client";

import React, { useEffect, useState } from "react";
import { formatVietnameseAddress } from "@/lib/address";
import { userAddressAPI, getBrowserToken, ProvinceOption } from "@/lib/api";
import { MapPin, Plus, Check } from "lucide-react";
import AddressSelectorDropdown from "../address-selector";

export type ShippingAddress = {
  receiverName: string;
  receiverPhone: string;
  province: string;
  commune: string;
  detail: string;
  // New properties
  provinceId?: number;
  wardId?: number;
  addressDetail?: string;
};

type AddressSelectorProps = {
  value: ShippingAddress;
  onChange: (value: ShippingAddress) => void;
  provinces: ProvinceOption[];
};

export default function AddressSelector({
  value,
  onChange,
  provinces = [],
}: AddressSelectorProps) {
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showManualForm, setShowManualForm] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const isLoggedIn = typeof window !== "undefined" && !!getBrowserToken();

  useEffect(() => {
    if (!isLoggedIn) {
      setShowManualForm(true);
      return;
    }

    const loadAddresses = async () => {
      try {
        setLoading(true);
        const list = await userAddressAPI.list().catch(() => []);
        setSavedAddresses(list);
        
        // Auto select default address
        const def = list.find((a) => a.isDefault) ?? list[0];
        if (def) {
          setSelectedId(def.id ?? null);
          setShowManualForm(false);
          onChange({
            receiverName: def.receiverName || "",
            receiverPhone: def.receiverPhone || "",
            province: def.province || "",
            commune: def.commune || def.district || "",
            detail: def.addressDetail || def.detail || "",
            provinceId: def.provinceId || undefined,
            wardId: def.wardId || undefined,
            addressDetail: def.addressDetail || def.detail || "",
          });
        } else {
          setShowManualForm(true);
        }
      } catch (err) {
        console.error("Lỗi khi tải sổ địa chỉ:", err);
        setShowManualForm(true);
      } finally {
        setLoading(false);
      }
    };
    void loadAddresses();
  }, [isLoggedIn]);

  const handleSelectSaved = (addr: any) => {
    setSelectedId(addr.id);
    setShowManualForm(false);
    onChange({
      receiverName: addr.receiverName || "",
      receiverPhone: addr.receiverPhone || "",
      province: addr.province || "",
      commune: addr.commune || addr.district || "",
      detail: addr.addressDetail || addr.detail || "",
      provinceId: addr.provinceId || undefined,
      wardId: addr.wardId || undefined,
      addressDetail: addr.addressDetail || addr.detail || "",
    });
  };

  const handleSelectManualMode = () => {
    setSelectedId(null);
    setShowManualForm(true);
    onChange({
      receiverName: "",
      receiverPhone: "",
      province: "",
      commune: "",
      detail: "",
      provinceId: undefined,
      wardId: undefined,
      addressDetail: "",
    });
  };

  const handleChange = (key: keyof ShippingAddress, newValue: any) => {
    onChange({ ...value, [key]: newValue });
  };

  const formattedAddress = formatVietnameseAddress(value);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-amber-100 p-6 space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-amber-500" />
          Địa chỉ giao hàng
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Nhập thông tin người nhận chính xác để chúng tôi giao hàng nhanh nhất.
        </p>
      </div>

      {/* SAVED ADDRESSES GRID FOR LOGGED IN USERS */}
      {isLoggedIn && savedAddresses.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Sổ địa chỉ của bạn
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {savedAddresses.map((addr) => {
              const isSelected = selectedId === addr.id;
              const formatted = formatVietnameseAddress({
                provinceName: addr.province || "",
                wardName: addr.commune || addr.district || "",
                addressDetail: addr.addressDetail || addr.detail || "",
              });

              return (
                <div
                  key={addr.id}
                  onClick={() => handleSelectSaved(addr)}
                  className={`border rounded-2xl p-4 cursor-pointer transition-all duration-200 bg-white relative flex flex-col justify-between ${
                    isSelected
                      ? "border-amber-500 bg-amber-50/10 shadow-sm"
                      : "border-gray-200 hover:border-amber-300"
                  }`}
                >
                  <div className="space-y-1 pr-6">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-900">
                        {addr.receiverName || "Người nhận"}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">
                        ({addr.receiverPhone})
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {formatted}
                    </p>
                    <div className="flex gap-1.5 mt-2">
                      <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                        {addr.label === "work" ? "Công ty" : addr.label === "home" ? "Nhà riêng" : "Khác"}
                      </span>
                      {addr.isDefault && (
                        <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                          Mặc định
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="absolute top-3 right-3 text-amber-600">
                      <Check className="w-5 h-5" />
                    </div>
                  )}
                </div>
              );
            })}

            <div
              onClick={handleSelectManualMode}
              className={`border border-dashed rounded-2xl p-4 cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 ${
                showManualForm && !selectedId
                  ? "border-amber-500 bg-amber-50/10"
                  : "border-gray-200 hover:border-amber-300"
              }`}
            >
              <Plus className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-semibold text-gray-700">
                Giao đến địa chỉ khác
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL FORM OR SELECTED DETAIL VIEW */}
      {showManualForm && (
        <div className="space-y-4 pt-2 border-t border-gray-100">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Nhập chi tiết địa chỉ giao hàng
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              value={value.receiverName}
              onChange={(e) => handleChange("receiverName", e.target.value)}
              placeholder="Họ và tên người nhận"
              className="rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-300 text-gray-800"
            />
            <input
              value={value.receiverPhone}
              onChange={(e) => handleChange("receiverPhone", e.target.value)}
              placeholder="Số điện thoại liên hệ"
              className="rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-300 text-gray-800"
            />
          </div>

          {/* New reusable Location dropdown selectors */}
          <AddressSelectorDropdown
            value={{
              provinceId: value.provinceId,
              wardId: value.wardId,
              addressDetail: value.addressDetail,
            }}
            provinces={provinces}
            onChange={(val) => {
              const matchedProv = provinces.find((p) => p.id === val.provinceId);
              onChange({
                ...value,
                provinceId: val.provinceId,
                wardId: val.wardId,
                addressDetail: val.addressDetail,
                // Keep backward compatibility values updated
                province: matchedProv?.name || "",
                detail: val.addressDetail || "",
                commune: "", // Commune is removed
              });
            }}
          />
        </div>
      )}

      {formattedAddress && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 px-4 py-3 text-sm text-gray-700">
          <span className="font-semibold text-gray-900">
            Địa chỉ giao hàng:
          </span>{" "}
          {formattedAddress}
        </div>
      )}
    </div>
  );
}
