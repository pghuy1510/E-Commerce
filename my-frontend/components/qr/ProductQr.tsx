"use client";

import Image from "next/image";
import { usePreferences } from "@/lib/i18n";
import { BANK_INFO, buildVietQrImageUrl } from "@/lib/vietqr";

type ProductQrProps = {
  amount: number;
  addInfo: string;
  productName: string;
  size?: "sm" | "lg";
  showBankInfo?: boolean;
  className?: string;
};

const SIZE_MAP: Record<NonNullable<ProductQrProps["size"]>, number> = {
  sm: 88,
  lg: 160,
};

export default function ProductQr({
  amount,
  addInfo,
  productName,
  size = "sm",
  showBankInfo = false,
  className,
}: ProductQrProps) {
  const { t, formatPrice } = usePreferences();
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const qrUrl = buildVietQrImageUrl({ amount: safeAmount, addInfo });
  const bankLabel = BANK_INFO.bankName ?? String(BANK_INFO.acqId);
  const qrSize = SIZE_MAP[size];

  return (
    <div
      className={`rounded-2xl border border-amber-100 bg-amber-50/60 p-3 ${className ?? ""}`}>
      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-amber-100 bg-white p-2">
          <Image
            src={qrUrl}
            alt={t("product.qrAlt", { name: productName })}
            width={qrSize}
            height={qrSize}
            sizes={`${qrSize}px`}
            className="object-contain"
          />
        </div>

        <div className="space-y-1 text-sm text-gray-600">
          <p className="text-xs uppercase text-amber-700">
            {t("product.qrTitle")}
          </p>
          <p className="text-base font-semibold text-gray-900">
            {formatPrice(safeAmount)}
          </p>
          <p className="text-xs text-gray-500">{t("product.qrHint")}</p>

          {showBankInfo && (
            <div className="space-y-0.5 text-xs text-gray-600">
              <p>
                <span className="font-semibold text-gray-800">
                  {t("product.qrBankLabel")}
                </span>{" "}
                {bankLabel}
              </p>
              <p>
                <span className="font-semibold text-gray-800">
                  {t("product.qrAccountNameLabel")}
                </span>{" "}
                {BANK_INFO.accountName}
              </p>
              <p>
                <span className="font-semibold text-gray-800">
                  {t("product.qrAccountNumberLabel")}
                </span>{" "}
                {BANK_INFO.accountNo}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
