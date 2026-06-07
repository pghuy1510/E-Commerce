"use client";

import React, { useState } from "react";
import { Copy, Check, Info, Smartphone, QrCode } from "lucide-react";
import { usePreferences } from "@/lib/i18n";

type QRPaymentBoxProps = {
  qrDataURL: string;
  amount: number;
  addInfo: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  formatPrice: (value: number) => string;
};

export default function QRPaymentBox({
  qrDataURL,
  amount,
  addInfo,
  bankName,
  accountName,
  accountNumber,
  formatPrice,
}: QRPaymentBoxProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { t } = usePreferences();

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="bg-brand-surface rounded-3xl shadow-sm border border-brand-border p-6 md:p-8 space-y-6">
      <div className="flex items-center gap-3 border-b border-brand-border/40 pb-4">
        <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center text-white shrink-0 shadow-sm">
          <QrCode className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-brand-text">
            {t("payment.qr.title")}
          </h2>
          <p className="text-xs text-brand-muted mt-0.5">
            {t("payment.qr.desc")}
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* QR Code Column */}
        <div className="flex flex-col items-center justify-center rounded-3xl border border-brand-border bg-brand-primary-light/25 p-6 shrink-0 lg:w-72">
          <img
            src={qrDataURL}
            alt="QR Code"
            className="h-52 w-52 object-contain rounded-xl shadow-inner bg-white p-2"
          />
          <div className="mt-4 flex items-center gap-2 text-xs text-brand-muted font-semibold">
            <Smartphone className="w-4 h-4 text-brand-primary animate-pulse" />
            <span>{t("payment.qr.scanApp")}</span>
          </div>
        </div>

        {/* Account & Copy Actions Column */}
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Amount */}
            <div className="rounded-2xl bg-brand-primary-light/25 border border-brand-border/60 p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">{t("payment.qr.amount")}</p>
                <p className="text-2xl font-extrabold text-brand-text mt-1">
                  {formatPrice(amount)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(amount.toString(), "amount")}
                className="p-2 bg-brand-surface hover:bg-brand-primary-light/60 border border-brand-border text-brand-primary rounded-xl transition shadow-xs focus:outline-none cursor-pointer"
                title={t("payment.qr.copyAmount")}
              >
                {copiedField === "amount" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Account Number */}
            <div className="rounded-2xl bg-brand-primary-light/25 border border-brand-border/60 p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">{t("payment.qr.accountNumber")}</p>
                <p className="text-xl font-extrabold text-brand-text mt-1">
                  {accountNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(accountNumber, "accountNumber")}
                className="p-2 bg-brand-surface hover:bg-brand-primary-light/60 border border-brand-border text-brand-primary rounded-xl transition shadow-xs focus:outline-none cursor-pointer"
                title={t("payment.qr.copyAccount")}
              >
                {copiedField === "accountNumber" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Transfer Info Detail */}
          <div className="border border-brand-border rounded-2xl p-4 divide-y divide-brand-border/40 space-y-3 bg-brand-primary-light/10">
            <div className="flex items-center justify-between pb-3">
              <span className="text-xs font-semibold text-brand-muted">{t("payment.qr.beneficiaryBank")}</span>
              <span className="text-sm font-extrabold text-brand-text uppercase">{bankName}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-xs font-semibold text-brand-muted">{t("payment.qr.recipientName")}</span>
              <span className="text-sm font-extrabold text-brand-text">{accountName}</span>
            </div>
            <div className="flex items-center justify-between pt-3">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-brand-muted">{t("payment.qr.transferContent")}</span>
                <span className="text-sm font-extrabold text-brand-primary tracking-wide mt-1 select-all">{addInfo}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(addInfo, "addInfo")}
                className="p-2 bg-brand-surface hover:bg-brand-primary-light/60 border border-brand-border text-brand-primary rounded-xl transition shadow-xs focus:outline-none shrink-0 self-end cursor-pointer"
                title={t("payment.qr.copyContent")}
              >
                {copiedField === "addInfo" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Guide Block */}
      <div className="border border-brand-border/50 bg-brand-primary-light/10 rounded-2xl p-5 space-y-3 text-xs leading-relaxed text-brand-muted">
        <h4 className="font-bold text-brand-text flex items-center gap-2">
          <Info className="w-4 h-4 text-brand-primary shrink-0" />
          <span>{t("payment.qr.guideTitle")}</span>
        </h4>
        <ol className="list-decimal pl-4 space-y-1.5 font-medium">
          <li>{t("payment.qr.guideStep1")}</li>
          <li>{t("payment.qr.guideStep2")}</li>
          <li>{t("payment.qr.guideStep3")}</li>
          <li>{t("payment.qr.guideStep4")}</li>
          <li>{t("payment.qr.guideStep5")}</li>
        </ol>
      </div>
    </div>
  );
}
