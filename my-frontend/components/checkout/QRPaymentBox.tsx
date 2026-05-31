"use client";

import React, { useState } from "react";
import { Copy, Check, Info, Smartphone, QrCode } from "lucide-react";

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

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-amber-100 p-6 md:p-8 space-y-6">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-sm">
          <QrCode className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Thanh toán chuyển khoản VietQR
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Quét mã QR hoặc chuyển khoản thủ công qua thông tin bên dưới để hoàn tất đơn hàng.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* QR Code Column */}
        <div className="flex flex-col items-center justify-center rounded-3xl border border-amber-100 bg-amber-50/20 p-6 shrink-0 lg:w-72">
          <img
            src={qrDataURL}
            alt="VietQR"
            className="h-52 w-52 object-contain rounded-xl shadow-inner bg-white p-2"
          />
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 font-semibold">
            <Smartphone className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>Mở App ngân hàng quét mã</span>
          </div>
        </div>

        {/* Account & Copy Actions Column */}
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Amount */}
            <div className="rounded-2xl bg-amber-50/40 border border-amber-100/70 p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Số tiền thanh toán</p>
                <p className="text-2xl font-extrabold text-gray-900 mt-1">
                  {formatPrice(amount)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(amount.toString(), "amount")}
                className="p-2 bg-white hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-xl transition shadow-xs focus:outline-none cursor-pointer"
                title="Sao chép số tiền"
              >
                {copiedField === "amount" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Account Number */}
            <div className="rounded-2xl bg-amber-50/40 border border-amber-100/70 p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Số tài khoản nhận</p>
                <p className="text-xl font-extrabold text-gray-900 mt-1">
                  {accountNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(accountNumber, "accountNumber")}
                className="p-2 bg-white hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-xl transition shadow-xs focus:outline-none cursor-pointer"
                title="Sao chép số tài khoản"
              >
                {copiedField === "accountNumber" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Transfer Info Detail */}
          <div className="border border-gray-150 rounded-2xl p-4 divide-y divide-gray-100 space-y-3 bg-gray-50/30">
            <div className="flex items-center justify-between pb-3">
              <span className="text-xs font-semibold text-gray-500">Ngân hàng thụ hưởng:</span>
              <span className="text-sm font-extrabold text-gray-900 uppercase">{bankName}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-xs font-semibold text-gray-500">Tên người nhận:</span>
              <span className="text-sm font-extrabold text-gray-900">{accountName}</span>
            </div>
            <div className="flex items-center justify-between pt-3">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-500">Nội dung chuyển khoản (Bắt buộc chính xác):</span>
                <span className="text-sm font-extrabold text-amber-600 tracking-wide mt-1 select-all">{addInfo}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(addInfo, "addInfo")}
                className="p-2 bg-white hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-xl transition shadow-xs focus:outline-none shrink-0 self-end cursor-pointer"
                title="Sao chép nội dung chuyển khoản"
              >
                {copiedField === "addInfo" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Guide Block */}
      <div className="border border-amber-100/60 bg-amber-50/20 rounded-2xl p-5 space-y-3 text-xs leading-relaxed text-gray-600">
        <h4 className="font-bold text-gray-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Hướng dẫn thanh toán nhanh:</span>
        </h4>
        <ol className="list-decimal pl-4 space-y-1.5 font-medium">
          <li>Mở ứng dụng ngân hàng di động (e-banking) trên điện thoại của bạn.</li>
          <li>Chọn tính năng <span className="font-bold text-gray-900">Quét mã QR</span> và hướng camera về phía mã QR ở trên.</li>
          <li>Hệ thống sẽ tự động điền số tiền thụ hưởng và nội dung chuyển khoản. Vui lòng kiểm tra lại trước khi nhấn chuyển.</li>
          <li>Nếu chuyển khoản thủ công, hãy nhập đúng số tài khoản, số tiền và <span className="font-bold text-amber-600 text-[13px] bg-amber-50 px-1 py-0.5 rounded border border-amber-200">GHI CHÍNH XÁC NỘI DUNG CHUYỂN KHOẢN</span> như trên để hệ thống ghi nhận tự động.</li>
          <li>Sau khi hoàn tất chuyển khoản thành công, hệ thống sẽ tự động xác nhận đơn hàng sau 10 - 20 giây.</li>
        </ol>
      </div>
    </div>
  );
}
