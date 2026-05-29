"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { paymentAPI, orderAPI, PaymentStatusResponse } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";
import QRPaymentBox from "@/components/checkout/QRPaymentBox";
import CountdownTimer from "@/components/checkout/CountdownTimer";
import PaymentStatus from "@/components/checkout/PaymentStatus";

function CheckoutPaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { formatPrice } = usePreferences();
  const paymentId = Number(searchParams.get("paymentId"));

  const [status, setStatus] = useState<PaymentStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const machineId = useMemo(() => {
    if (typeof window === "undefined") return "WEB";
    return localStorage.getItem("checkout-machine-id") ?? "WEB";
  }, []);

  const loadStatus = async () => {
    if (!paymentId) return;
    try {
      const res = await paymentAPI.getStatus(paymentId);
      setStatus(res);
      setError("");
      if (res.paymentStatus === "paid") {
        router.replace(`/order-success?orderId=${res.orderId}`);
      }
      if (res.paymentStatus === "failed") {
        router.replace(`/order-failed?orderId=${res.orderId}`);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Unable to load payment status.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!paymentId) {
      setError("Missing payment information.");
      setLoading(false);
      return;
    }
    void loadStatus();
    const timer = setInterval(() => void loadStatus(), 5000);
    return () => clearInterval(timer);
  }, [paymentId]);

  const handleRegenerate = async () => {
    if (!paymentId) return;
    try {
      const qr = await paymentAPI.regenerateQr(paymentId, machineId);
      setStatus((prev) =>
        prev
          ? {
              ...prev,
              paymentStatus: "pending",
              qr: qr
                ? {
                    ...(prev.qr ?? {}),
                    ...qr,
                    status: "pending",
                  }
                : prev.qr,
              amount: qr?.amount ?? prev.amount,
            }
          : prev,
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Unable to regenerate QR payment.",
      );
    }
  };

  const handleChangeToCod = async () => {
    if (!status?.orderId) return;
    if (
      !confirm(
        "Bạn có chắc chắn muốn đổi phương thức thanh toán sang COD (thanh toán khi nhận hàng)?"
      )
    )
      return;

    try {
      setLoading(true);
      await orderAPI.changeToCod(status.orderId);
      alert("Đã chuyển đổi phương thức thanh toán sang COD thành công!");
      router.replace(`/order-success?orderId=${status.orderId}`);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message ??
          "Không thể chuyển đổi phương thức thanh toán."
      );
    } finally {
      setLoading(false);
    }
  };

  const qr = status?.qr ?? null;

  return (
    <div className="w-full min-h-screen bg-[#fbf8f3]">
      <div className="max-w-5xl mx-auto px-6 py-14 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">
              Secure QR payment
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Your order is reserved while we wait for payment.
            </p>
          </div>
          {status && <PaymentStatus status={status.paymentStatus} />}
        </div>

        {loading && (
          <div className="rounded-3xl bg-white border border-amber-100 p-6 shadow-sm">
            <p className="text-sm text-gray-500">Loading payment details...</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {!loading && status && qr && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <CountdownTimer expiresAt={qr.expiredAt} />
              <div className="text-sm text-gray-500">
                Transfer amount:{" "}
                <span className="font-semibold text-gray-900">
                  {formatPrice(status.amount)}
                </span>
              </div>
            </div>

            <QRPaymentBox
              qrDataURL={qr.qrDataURL}
              amount={status.amount}
              addInfo={qr.addInfo}
              bankName={qr.bankName}
              accountName={qr.accountName}
              accountNumber={qr.accountNumber}
              formatPrice={formatPrice}
            />

            {/* PAYMENT RECOVERY OPTION */}
            {["pending", "expired", "failed"].includes(status.paymentStatus) && (
              <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">
                    Gặp khó khăn khi quét mã QR?
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Bạn có thể chuyển đổi sang hình thức thanh toán khi nhận hàng (COD) bất kỳ lúc nào.
                  </p>
                </div>
                <button
                  onClick={handleChangeToCod}
                  className="px-5 py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-600 font-bold text-xs shrink-0 transition"
                >
                  Đổi sang COD
                </button>
              </div>
            )}
          </>
        )}

        {!loading && status && !qr && (
          <div className="rounded-3xl bg-white border border-amber-100 p-6 shadow-sm">
            <p className="text-sm text-gray-600">
              No QR payment data available for this transaction.
            </p>
          </div>
        )}

        {!loading && status?.paymentStatus === "expired" && (
          <div className="rounded-3xl bg-white border border-amber-100 p-6 shadow-sm space-y-3">
            <p className="text-sm text-gray-600">
              This QR has expired. Generate a new QR to continue.
            </p>
            <button
              onClick={handleRegenerate}
              className="rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition">
              Regenerate QR
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen bg-[#fbf8f3]">
          <div className="max-w-5xl mx-auto px-6 py-14">
            <div className="rounded-3xl bg-white border border-amber-100 p-6 shadow-sm">
              <p className="text-sm text-gray-500">
                Loading payment details...
              </p>
            </div>
          </div>
        </div>
      }>
      <CheckoutPaymentContent />
    </Suspense>
  );
}
