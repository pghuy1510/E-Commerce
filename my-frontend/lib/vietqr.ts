import axios from "axios";

export type GenerateVietQrPayload = {
  amount: number;
  addInfo: string;
  machineId: string;
};

export type VietQrResponse = {
  qrDataURL: string;
  amount: number;
  addInfo: string;
  expiredAt: string;
};

export async function generateVietQr(
  payload: GenerateVietQrPayload,
): Promise<VietQrResponse> {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";

  const { data } = await axios.post<VietQrResponse>(
    `${baseUrl}/payment/vietqr`,
    payload,
  );

  return data;
}
