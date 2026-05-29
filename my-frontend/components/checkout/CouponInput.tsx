"use client";

import React, { useEffect, useState } from "react";
import { couponAPI, type CouponInfo, type CouponProgress } from "@/lib/api";
import { Percent, Ticket, Trash2, Truck, Check } from "lucide-react";
import { usePreferences } from "@/lib/i18n";

type CouponInputProps = {
  value: string;
  onChange: (value: string) => void;
  subtotal: number;
  shippingFee: number;
  onApplyCoupon: (discount: number, code: string) => void;
  onRemoveCoupon: () => void;
  appliedCode: string | null;
};

export default function CouponInput({
  value,
  onChange,
  subtotal,
  shippingFee,
  onApplyCoupon,
  onRemoveCoupon,
  appliedCode,
}: CouponInputProps) {
  const { formatPrice } = usePreferences();
  const [coupons, setCoupons] = useState<CouponInfo[]>([]);
  const [progress, setProgress] = useState<CouponProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Tải danh sách coupon của user và progress freeship
  useEffect(() => {
    const loadCouponData = async () => {
      try {
        setLoading(true);
        const [myCoupons, progressData] = await Promise.all([
          couponAPI.getMyCoupons().catch(() => []),
          couponAPI.getProgress(subtotal).catch(() => null),
        ]);
        setCoupons(myCoupons);
        setProgress(progressData);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu coupon:", err);
      } finally {
        setLoading(false);
      }
    };
    void loadCouponData();
  }, [subtotal]);

  // Áp dụng coupon
  const handleApply = async (codeToApply: string) => {
    if (!codeToApply.trim()) return;
    setValidating(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await couponAPI.validate(codeToApply.trim(), subtotal, shippingFee);
      if (res.valid) {
        onApplyCoupon(res.discountTotal, res.couponCode);
        setSuccessMsg(`Áp dụng thành công! Bạn được giảm ${formatPrice(res.discountTotal)}.`);
        onChange(res.couponCode);
      }
    } catch (err: any) {
      console.error(err);
      const backendMessage = err?.response?.data?.message;
      setErrorMsg(
        backendMessage || "Không thể áp dụng mã giảm giá này. Vui lòng kiểm tra lại."
      );
    } finally {
      setValidating(false);
    }
  };

  const handleCancel = () => {
    onRemoveCoupon();
    setSuccessMsg("");
    setErrorMsg("");
    onChange("");
  };

  // Tính phần trăm Freeship progress (ngưỡng 500k)
  const freeShipPct = progress 
    ? Math.min(100, Math.round((subtotal / progress.freeShippingThreshold) * 100))
    : 0;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-amber-100 p-6 space-y-6">
      {/* HEADER */}
      <div>
        <div className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-semibold text-gray-900">Mã giảm giá (Coupon)</h3>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Chọn hoặc nhập mã giảm giá của bạn để được khấu trừ vào đơn hàng.
        </p>
      </div>

      {/* FREESHIP & NEXT COUPON PROGRESS */}
      {progress && (
        <div className="bg-amber-50/30 rounded-2xl p-4 border border-amber-100/50 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
            <span className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-amber-500" />
              {progress.neededForFreeShipping > 0 
                ? `Mua thêm ${formatPrice(progress.neededForFreeShipping)} để được miễn phí vận chuyển`
                : "Chúc mừng! Đơn hàng của bạn đã được miễn phí vận chuyển"}
            </span>
            <span>{freeShipPct}%</span>
          </div>
          
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-amber-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${freeShipPct}%` }}
            />
          </div>

          {progress.nextCoupon && (
            <p className="text-[11px] text-amber-700 bg-amber-100/50 rounded-xl px-3 py-1.5 font-medium">
              💡 Mua thêm <strong className="text-amber-800">{formatPrice(progress.nextCoupon.needed)}</strong> để kích hoạt mã <strong className="text-amber-800">#{progress.nextCoupon.code}</strong> (giúp tiết kiệm thêm {formatPrice(progress.nextCoupon.estimatedSaving)}).
            </p>
          )}
        </div>
      )}

      {/* INPUT AND VALIDATION */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              if (errorMsg) setErrorMsg("");
              if (successMsg) setSuccessMsg("");
            }}
            disabled={!!appliedCode}
            placeholder="Nhập mã giảm giá (ví dụ: WELCOME10)"
            className="flex-1 rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-300 disabled:bg-gray-100 disabled:text-gray-500 font-mono uppercase"
          />
          {appliedCode ? (
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-100 transition flex items-center gap-1.5 justify-center">
              <Trash2 className="w-4 h-4" />
              Hủy áp dụng
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleApply(value)}
              disabled={validating || !value.trim()}
              className="rounded-2xl bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
              {validating ? "Đang kiểm tra..." : "Áp dụng"}
            </button>
          )}
        </div>

        {/* FEEDBACK MESSAGES */}
        {errorMsg && (
          <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-xs text-rose-600 font-medium">
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-700 font-medium">
            🎉 {successMsg}
          </div>
        )}
      </div>

      {/* AVAILABLE USER COUPONS LIST */}
      <div>
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Mã giảm giá có sẵn của bạn</h4>
        {loading ? (
          <p className="text-xs text-gray-400 italic">Đang tìm mã giảm giá khả dụng...</p>
        ) : coupons.length === 0 ? (
          <p className="text-xs text-gray-500 italic bg-gray-50 rounded-2xl p-4 text-center">
            Bạn chưa sở hữu mã giảm giá nào. Hãy hoàn thành các thử thách hoặc đặt thêm đơn hàng để được tặng mã!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
            {coupons.map((item) => {
              const isSelected = appliedCode === item.code;
              const formattedMinOrder = item.coupon.minOrder 
                ? formatPrice(item.coupon.minOrder) 
                : "Không giới hạn";
              const discountText = item.coupon.discountType === "percentage"
                ? `Giảm ${item.coupon.discountValue}%`
                : `Giảm ${formatPrice(item.coupon.discountValue)}`;
              const labelText = item.coupon.type === "shipping" 
                ? "Vận chuyển" 
                : item.coupon.type === "shop" 
                ? "Danh mục" 
                : "Cửa hàng";

              return (
                <div 
                  key={item.code} 
                  className={`border rounded-2xl p-3 flex flex-col justify-between transition-all duration-200 bg-white ${
                    isSelected 
                      ? "border-amber-500 bg-amber-50/10 shadow-sm" 
                      : "border-gray-200 hover:border-amber-300"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 font-mono font-bold text-[10px] px-2 py-0.5 rounded-md border border-amber-100 uppercase">
                        {item.code}
                      </span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase">{labelText}</span>
                    </div>
                    
                    <h5 className="font-bold text-sm text-gray-900 mt-1">{discountText}</h5>
                    <p className="text-[10px] text-gray-500">Đơn tối thiểu: {formattedMinOrder}</p>
                    
                    <p className="text-[9px] text-gray-400 italic">
                      Hạn dùng: {new Date(item.expiresAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>

                  <div className="mt-3.5 pt-2 border-t border-dashed border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-gray-400">Tồn: {item.remainingUses} lượt</span>
                    {isSelected ? (
                      <span className="inline-flex items-center gap-0.5 text-xs text-amber-600 font-bold bg-amber-100/50 px-2 py-1 rounded-xl">
                        <Check className="w-3.5 h-3.5" /> Đã dùng
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApply(item.code)}
                        disabled={!!appliedCode || validating}
                        className="text-xs font-semibold text-amber-600 hover:text-amber-700 transition"
                      >
                        Áp dụng
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
