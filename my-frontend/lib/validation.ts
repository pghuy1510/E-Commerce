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
    errors.push("Province is required.");
  }
  if (!payload.district?.trim()) {
    errors.push("District is required.");
  }
  if (!payload.ward?.trim()) {
    errors.push("Ward is required.");
  }
  if (!payload.detail?.trim()) {
    errors.push("Address detail is required.");
  }
  if (payload.paymentMethod === "qr" && !payload.machineId) {
    errors.push("Machine ID is required for QR payment.");
  }
  return errors;
}
