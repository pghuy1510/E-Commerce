import axios from "axios";

export type BankInfo = {
  accountNo: string;
  accountName: string;
  acqId: number;
  bankName?: string;
};

export const BANK_INFO: BankInfo = {
  accountNo: "4604996654",
  accountName: "Pham Gia Huy",
  acqId: 970418,
  bankName: "BIDV",
};

const DEFAULT_TEMPLATE = "compact2";

export type VietQrImageOptions = {
  amount: number;
  addInfo?: string;
  template?: string;
  bank?: BankInfo;
};

export function buildVietQrImageUrl({
  amount,
  addInfo,
  template = DEFAULT_TEMPLATE,
  bank = BANK_INFO,
}: VietQrImageOptions): string {
  const normalizedAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  const params = new URLSearchParams();

  if (normalizedAmount > 0) {
    params.set("amount", String(normalizedAmount));
  }
  if (addInfo) {
    params.set("addInfo", addInfo);
  }
  if (bank.accountName) {
    params.set("accountName", bank.accountName);
  }

  const baseUrl = `https://img.vietqr.io/image/${bank.acqId}-${bank.accountNo}-${template}.png`;
  const query = params.toString();
  return query ? `${baseUrl}?${query}` : baseUrl;
}

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
