"use client";

import React from "react";

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
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-amber-100 p-6 space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Scan & pay securely
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Use your banking app to scan the QR code.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex items-center justify-center rounded-3xl border border-amber-100 bg-amber-50/30 p-6">
          <img
            src={qrDataURL}
            alt="VietQR"
            className="h-56 w-56 object-contain"
          />
        </div>

        <div className="flex-1 space-y-4">
          <div className="rounded-2xl bg-amber-50/60 border border-amber-100 p-4">
            <p className="text-xs uppercase text-amber-700">Transfer amount</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatPrice(amount)}
            </p>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <span className="font-semibold text-gray-900">Bank:</span>{" "}
              {bankName}
            </p>
            <p>
              <span className="font-semibold text-gray-900">Account name:</span>{" "}
              {accountName}
            </p>
            <p>
              <span className="font-semibold text-gray-900">
                Account number:
              </span>{" "}
              {accountNumber}
            </p>
            <p className="text-xs text-amber-600">
              Transfer content: <span className="font-semibold">{addInfo}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
