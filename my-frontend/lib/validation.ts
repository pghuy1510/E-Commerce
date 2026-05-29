import type { CheckoutPayload } from "@/lib/api";

export function validateCheckoutPayload(payload: CheckoutPayload): string[] {
  const errors: string[] = [];
  if (!payload.receiverName?.trim()) {
    errors.push("Receiver name is required.");
  }
  if (!payload.receiverPhone?.trim()) {
    errors.push("Receiver phone is required.");
  }
  if (!payload.province?.trim()) {
    errors.push("Tỉnh / thành phố là bắt buộc.");
  }
  if (!payload.commune?.trim()) {
    errors.push("Xã / phường là bắt buộc.");
  }
  if (!payload.detail?.trim()) {
    errors.push("Địa chỉ chi tiết là bắt buộc.");
  }
  if (payload.paymentMethod === "qr" && !payload.machineId) {
    errors.push("Machine ID is required for QR payment.");
  }
  return errors;
}
