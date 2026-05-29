export type VietnamAddressInput = {
  province?: string | null;
  commune?: string | null;
  district?: string | null;
  detail?: string | null;
};

function cleanPart(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

export function getCommuneName(address: VietnamAddressInput): string {
  return cleanPart(address.commune) || cleanPart(address.district);
}

export function formatVietnameseAddress(address: VietnamAddressInput): string {
  return [
    cleanPart(address.detail),
    getCommuneName(address),
    cleanPart(address.province),
  ]
    .filter(Boolean)
    .join(", ");
}

export function toLegacyAddressPayload<T extends VietnamAddressInput>(
  address: T,
) {
  return {
    ...address,
    district: getCommuneName(address),
    ward: "",
  };
}
