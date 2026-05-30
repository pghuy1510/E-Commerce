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
