export type VietnamAddressInput = {
  province?: string | null;
  commune?: string | null;
  district?: string | null;
  detail?: string | null;
  // New normalized properties
  provinceName?: string | null;
  wardName?: string | null;
  addressDetail?: string | null;
};

function cleanPart(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

export function getCommuneName(address: VietnamAddressInput): string {
  return cleanPart(address.wardName) || cleanPart(address.commune) || cleanPart(address.district);
}

export function formatVietnameseAddress(address: VietnamAddressInput): string {
  const detail = address.addressDetail || address.detail;
  const ward = address.wardName || address.commune || address.district;
  const province = address.provinceName || address.province;

  return [
    cleanPart(detail),
    cleanPart(ward),
    cleanPart(province),
  ]
    .filter(Boolean)
    .join(", ");
}

export function toLegacyAddressPayload<T extends VietnamAddressInput>(
  address: T,
) {
  return {
    ...address,
    province: address.provinceName || address.province || "",
    district: "",
    ward: address.wardName || address.commune || address.district || "",
    detail: address.addressDetail || address.detail || "",
  };
}

export function isAddressValid(addr: any): boolean {
  return Boolean(
    addr?.provinceId &&
    addr?.wardId &&
    addr?.addressDetail?.trim() &&
    addr?.receiverName?.trim() &&
    addr?.receiverPhone?.trim()
  );
}

export function getAddressMissingFields(addr: any): string[] {
  const missing: string[] = [];
  if (!addr?.provinceId) missing.push("Tỉnh/Thành");
  if (!addr?.wardId) missing.push("Xã/Phường");
  if (!addr?.addressDetail?.trim()) missing.push("Địa chỉ chi tiết");
  if (!addr?.receiverName?.trim()) missing.push("Tên người nhận");
  if (!addr?.receiverPhone?.trim()) missing.push("Số điện thoại");
  return missing;
}

