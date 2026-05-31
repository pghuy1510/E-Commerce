"use client";

import React, { useEffect, useState } from "react";
import { formatVietnameseAddress, isAddressValid, getAddressMissingFields } from "@/lib/address";
import { userAddressAPI, getBrowserToken, ProvinceOption } from "@/lib/api";
import { MapPin, Plus, Check, Loader2 } from "lucide-react";
import AddressSelectorDropdown from "../address-selector";

export type ShippingAddress = {
  receiverName: string;
  receiverPhone: string;
  province: string;
  commune: string;
  detail: string;
  provinceId?: number;
  wardId?: number;
  addressDetail?: string;
};

type AddressSelectorProps = {
  value: ShippingAddress;
  onChange: (value: ShippingAddress) => void;
  provinces: ProvinceOption[];
  profileName?: string;
  profilePhone?: string;
};

export default function AddressSelector({
  value,
  onChange,
  provinces = [],
  profileName = "",
  profilePhone = "",
}: AddressSelectorProps) {
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showManualForm, setShowManualForm] = useState(true);
  const [loading, setLoading] = useState(false);

  // Address edit modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [modalForm, setModalForm] = useState({
    id: undefined as number | undefined,
    receiverName: "",
    receiverPhone: "",
    provinceId: undefined as number | undefined,
    wardId: undefined as number | undefined,
    addressDetail: "",
    provinceName: "",
    wardName: "",
    label: "home",
    isDefault: false,
  });

  const isLoggedIn = typeof window !== "undefined" && !!getBrowserToken();

  const loadAddresses = async (idToSelect?: number) => {
    try {
      setLoading(true);
      const list = await userAddressAPI.list().catch(() => []);
      setSavedAddresses(list);

      const activeId = idToSelect ?? selectedId;
      const currentSelected = activeId ? list.find((a) => a.id === activeId) : null;
      const defaultAddress = list.find((a) => a.isDefault);
      const defaultAddressValid = defaultAddress && isAddressValid(defaultAddress);
      const firstValidAddress = list.find(isAddressValid);

      // Smart selection priority
      const def = (currentSelected && isAddressValid(currentSelected) ? currentSelected : null)
        ?? (defaultAddressValid ? defaultAddress : null)
        ?? firstValidAddress
        ?? currentSelected
        ?? defaultAddress
        ?? list[0];

      if (def) {
        setSelectedId(def.id ?? null);
        setShowManualForm(false);
        onChange({
          receiverName: def.receiverName || profileName || "",
          receiverPhone: def.receiverPhone || profilePhone || "",
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

  useEffect(() => {
    if (!isLoggedIn) {
      setShowManualForm(true);
      return;
    }
    void loadAddresses();
  }, [isLoggedIn, profileName, profilePhone]);

  const handleSelectSaved = (addr: any) => {
    setSelectedId(addr.id);
    setShowManualForm(false);
    onChange({
      receiverName: addr.receiverName || profileName || "",
      receiverPhone: addr.receiverPhone || profilePhone || "",
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

  const handleStartEdit = (addr: any) => {
    setModalForm({
      id: addr.id,
      receiverName: addr.receiverName || profileName || "",
      receiverPhone: addr.receiverPhone || profilePhone || "",
      provinceId: addr.provinceId || undefined,
      wardId: addr.wardId || undefined,
      addressDetail: addr.addressDetail || addr.detail || "",
      provinceName: addr.province || "",
      wardName: addr.commune || addr.district || "",
      label: addr.label || "home",
      isDefault: !!addr.isDefault,
    });
    setShowFormModal(true);
  };

  const handleStartAdd = () => {
    setModalForm({
      id: undefined,
      receiverName: profileName || "",
      receiverPhone: profilePhone || "",
      provinceId: undefined,
      wardId: undefined,
      addressDetail: "",
      provinceName: "",
      wardName: "",
      label: "home",
      isDefault: false,
    });
    setShowFormModal(true);
  };

  const handleSaveModalForm = async () => {
    if (
      !modalForm.receiverName.trim() ||
      !modalForm.receiverPhone.trim() ||
      !modalForm.provinceId ||
      !modalForm.wardId ||
      !modalForm.addressDetail.trim()
    ) {
      alert("Vui lòng nhập đầy đủ họ tên, số điện thoại, tỉnh/huyện/xã và địa chỉ chi tiết!");
      return;
    }

    try {
      setLoading(true);
      const payload: any = {
        receiverName: modalForm.receiverName.trim(),
        receiverPhone: modalForm.receiverPhone.trim(),
        provinceId: modalForm.provinceId,
        wardId: modalForm.wardId,
        addressDetail: modalForm.addressDetail.trim(),
        province: modalForm.provinceName,
        commune: modalForm.wardName,
        detail: modalForm.addressDetail.trim(),
        label: modalForm.label,
        isDefault: modalForm.isDefault,
      };

      let targetId = modalForm.id;

      if (modalForm.id) {
        // Edit existing address
        await userAddressAPI.patch(modalForm.id, payload);
        if (modalForm.isDefault) {
          await userAddressAPI.setDefault(modalForm.id).catch(() => {});
        }
      } else {
        // Create new address
        const newAddr = await userAddressAPI.add(payload);
        targetId = newAddr.id;
        if (modalForm.isDefault && newAddr.id) {
          await userAddressAPI.setDefault(newAddr.id).catch(() => {});
        }
      }

      setShowFormModal(false);
      if (targetId) {
        setSelectedId(targetId);
      }
      await loadAddresses(targetId);
    } catch (err: any) {
      console.error(err);
      alert("Lỗi khi lưu địa chỉ: " + (err.response?.data?.message ?? err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      setLoading(true);
      await userAddressAPI.setDefault(id);
      await loadAddresses();
    } catch (err: any) {
      console.error(err);
      alert("Không thể đặt địa chỉ mặc định.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return;
    try {
      setLoading(true);
      await userAddressAPI.remove(id);
      if (selectedId === id) {
        setSelectedId(null);
      }
      await loadAddresses();
    } catch (err: any) {
      console.error(err);
      alert("Không thể xóa địa chỉ.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: keyof ShippingAddress, newValue: any) => {
    onChange({ ...value, [key]: newValue });
  };

  const formattedAddress = formatVietnameseAddress(value);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-amber-100 p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-500" />
            Địa chỉ giao hàng
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Chọn một địa chỉ từ sổ địa chỉ của bạn hoặc nhập thủ công địa chỉ nhận hàng.
          </p>
        </div>
        {isLoggedIn && (
          <button
            type="button"
            onClick={handleStartAdd}
            className="self-start sm:self-center flex items-center gap-1.5 px-4 py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-2xl text-xs font-bold transition border border-yellow-200 shadow-xs cursor-pointer focus:outline-none"
          >
            <Plus className="w-4 h-4" />
            Thêm địa chỉ mới
          </button>
        )}
      </div>

      {loading && savedAddresses.length === 0 && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 text-yellow-600 animate-spin" />
        </div>
      )}

      {/* SAVED ADDRESSES GRID FOR LOGGED IN USERS */}
      {isLoggedIn && savedAddresses.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Sổ địa chỉ của bạn
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedAddresses.map((addr) => {
              const isSelected = selectedId === addr.id;
              const formatted = formatVietnameseAddress({
                provinceName: addr.province || "",
                wardName: addr.commune || addr.district || "",
                addressDetail: addr.addressDetail || addr.detail || "",
              });
              const missingFields = getAddressMissingFields({
                ...addr,
                receiverName: addr.receiverName || profileName,
                receiverPhone: addr.receiverPhone || profilePhone,
              });
              const isMissingFields = missingFields.length > 0;

              return (
                <div
                  key={addr.id}
                  onClick={() => handleSelectSaved(addr)}
                  className={`border rounded-3xl p-5 cursor-pointer transition-all duration-200 bg-white relative flex flex-col justify-between ${
                    isSelected
                      ? "border-amber-500 bg-amber-50/10 shadow-md"
                      : "border-gray-250 hover:border-amber-350 hover:shadow-sm"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900">
                          {addr.receiverName || profileName || "Người nhận"}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          ({addr.receiverPhone || profilePhone || "Không có SĐT"})
                        </span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                      {formatted || "Chưa có địa chỉ chi tiết"}
                    </p>

                    {isMissingFields && (
                      <p className="text-[10px] text-rose-600 font-bold bg-rose-50 border border-rose-100 rounded-lg p-1.5 flex items-start gap-1">
                        <span>⚠️ Địa chỉ thiếu: {missingFields.join(", ")}. Hãy bấm "Chỉnh sửa" để điền lại.</span>
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                        {addr.label === "work" ? "Công ty" : addr.label === "home" ? "Nhà riêng" : "Khác"}
                      </span>
                      {addr.isDefault && (
                        <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          Mặc định
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div
                    className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-gray-100 text-xs font-bold"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => handleStartEdit(addr)}
                      className="text-yellow-600 hover:text-yellow-700 transition cursor-pointer"
                    >
                      Chỉnh sửa
                    </button>

                    {!addr.isDefault && (
                      <>
                        <span className="text-gray-300">|</span>
                        <button
                          type="button"
                          onClick={() => handleSetDefault(addr.id)}
                          className="text-gray-500 hover:text-gray-700 transition cursor-pointer"
                        >
                          Đặt mặc định
                        </button>
                      </>
                    )}

                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(addr.id)}
                      className="text-red-500 hover:text-red-600 transition cursor-pointer"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              );
            })}

            <div
              onClick={handleSelectManualMode}
              className={`border border-dashed rounded-3xl p-5 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 min-h-[140px] text-center ${
                showManualForm && !selectedId
                  ? "border-amber-500 bg-amber-50/10 shadow-sm"
                  : "border-gray-250 hover:border-amber-300 bg-gray-50/30"
              }`}
            >
              <Plus className="w-6 h-6 text-amber-500" />
              <div>
                <span className="block text-sm font-bold text-gray-700">
                  Giao đến địa chỉ khác
                </span>
                <span className="block text-[10px] text-gray-400 mt-0.5">
                  Nhập địa chỉ nhận hàng tạm thời cho đơn này
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL FORM FOR GUESTS OR OTHER TEMPORARY ADDRESSES */}
      {showManualForm && (
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Chi tiết địa chỉ nhận hàng
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

          <AddressSelectorDropdown
            value={{
              provinceId: value.provinceId,
              wardId: value.wardId,
              addressDetail: value.addressDetail,
              provinceName: value.province,
              wardName: value.commune,
            }}
            provinces={provinces}
            onChange={(val) => {
              onChange({
                ...value,
                provinceId: val.provinceId,
                wardId: val.wardId,
                addressDetail: val.addressDetail,
                province: val.provinceName || "",
                detail: val.addressDetail || "",
                commune: val.wardName || "",
              });
            }}
          />
        </div>
      )}

      {formattedAddress && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/30 px-4 py-3 text-sm text-gray-700 flex items-start gap-2">
          <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-gray-900">Thông tin giao hàng:</span>{" "}
            <span className="font-semibold text-gray-800">{value.receiverName} ({value.receiverPhone})</span>
            <span className="block text-xs text-gray-500 mt-0.5">{formattedAddress}</span>
          </div>
        </div>
      )}

      {(() => {
        const selectedAddressObj = selectedId ? savedAddresses.find((a) => a.id === selectedId) : null;
        const selectedAddressMissingFields = selectedAddressObj
          ? getAddressMissingFields({
              ...selectedAddressObj,
              receiverName: selectedAddressObj.receiverName || profileName,
              receiverPhone: selectedAddressObj.receiverPhone || profilePhone,
            })
          : [];
        const isSelectedAddressInvalid = selectedAddressObj && selectedAddressMissingFields.length > 0;

        if (!isSelectedAddressInvalid || !selectedAddressObj) return null;

        return (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-pulse">
            <div className="flex items-start gap-2">
              <span className="text-base shrink-0">⚠️</span>
              <div>
                <span className="font-bold">Địa chỉ được chọn chưa đầy đủ thông tin (thiếu: {selectedAddressMissingFields.join(", ")})!</span>
                <span className="block text-xs text-rose-600 mt-0.5">Vui lòng cập nhật thông tin để tiếp tục đặt hàng.</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleStartEdit(selectedAddressObj)}
              className="shrink-0 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer border-none"
            >
              Cập nhật ngay
            </button>
          </div>
        );
      })()}

      {/* NEW ADDRESS MODAL POPUP */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-lg border overflow-hidden shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-3 border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {modalForm.id ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ giao hàng mới"}
              </h3>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold transition text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Họ và tên người nhận</label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={modalForm.receiverName}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, receiverName: e.target.value }))}
                    className="w-full border border-gray-250 rounded-2xl px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 bg-gray-50/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Số điện thoại liên hệ</label>
                  <input
                    type="text"
                    required
                    placeholder="0901234567"
                    value={modalForm.receiverPhone}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, receiverPhone: e.target.value }))}
                    className="w-full border border-gray-250 rounded-2xl px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 bg-gray-50/50"
                  />
                </div>
              </div>

              {/* Location Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Địa chỉ giao hàng</label>
                <AddressSelectorDropdown
                  value={{
                    provinceId: modalForm.provinceId,
                    wardId: modalForm.wardId,
                    addressDetail: modalForm.addressDetail,
                    provinceName: modalForm.provinceName,
                    wardName: modalForm.wardName,
                  }}
                  provinces={provinces}
                  onChange={(val) => {
                    setModalForm((prev) => ({
                      ...prev,
                      provinceId: val.provinceId,
                      wardId: val.wardId,
                      addressDetail: val.addressDetail || "",
                      provinceName: val.provinceName || "",
                      wardName: val.wardName || "",
                    }));
                  }}
                />
              </div>

              {/* Address label & default toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Nhãn địa chỉ</label>
                  <select
                    value={modalForm.label}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, label: e.target.value }))}
                    className="w-full border border-gray-250 bg-white rounded-2xl px-3 py-3 text-sm outline-none focus:border-yellow-500"
                  >
                    <option value="home">Nhà riêng / Căn hộ</option>
                    <option value="work">Văn phòng / Công ty</option>
                    <option value="other">Khác</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-5 sm:pt-0 sm:pl-3">
                  <input
                    type="checkbox"
                    id="isDefaultCheckbox"
                    checked={modalForm.isDefault}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                    className="rounded text-amber-500 focus:ring-amber-500 h-4 w-4 cursor-pointer"
                  />
                  <label htmlFor="isDefaultCheckbox" className="text-xs font-bold text-gray-700 cursor-pointer select-none">
                    Đặt làm địa chỉ mặc định
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="px-5 py-2.5 border rounded-full text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveModalForm}
                className="px-6 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-full text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer"
              >
                Lưu địa chỉ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
