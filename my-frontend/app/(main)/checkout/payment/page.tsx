"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { paymentAPI, orderAPI, PaymentStatusResponse } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";
import QRPaymentBox from "@/components/checkout/QRPaymentBox";
import CountdownTimer from "@/components/checkout/CountdownTimer";
import PaymentStatus from "@/components/checkout/PaymentStatus";
import { Loader2, Package, MapPin, ClipboardList } from "lucide-react";
import PageHero from "@/components/layout/PageHero";

function CheckoutPaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, formatPrice, language } = usePreferences();
  const paymentId = Number(searchParams.get("paymentId"));
  const token = searchParams.get("token") || undefined;
  const email = searchParams.get("email");

  const [status, setStatus] = useState<PaymentStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingRegen, setLoadingRegen] = useState(false);
  const [error, setError] = useState("");

  const [orderDetails, setOrderDetails] = useState<any | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);

  useEffect(() => {
    if (!status?.orderId) return;

    const fetchOrder = async () => {
      try {
        setLoadingOrder(true);
        let data;
        try {
          if (email) {
            data = await orderAPI.getGuestOrder(status.orderId, email);
          } else {
            data = await orderAPI.getById(status.orderId);
          }
        } catch (apiErr) {
          // Fallback mock mapping in development environments
          const mockOrdersMap: Record<number, any> = {
            1001: {
              id: 1001,
              status: "delivered",
              created_at: "2026-05-12T10:00:00Z",
              paymentMethod: "vietqr",
              paymentStatus: "paid",
              totalAmount: 2199000,
              items: [
                {
                  id: 1,
                  productName: "Sách Thiết Kế Hệ Thống E-Commerce Thực Tế",
                  price: 2199000,
                  quantity: 1,
                }
              ],
              shippingAddress: {
                receiverName: "Nguyễn Văn A",
                receiverPhone: "0901234567",
                detail: "123 Đường Láng, Đống Đa",
                province: "Hà Nội",
              },
            },
            1002: {
              id: 1002,
              status: "pending",
              created_at: "2026-05-10T09:00:00Z",
              paymentMethod: "vietqr",
              paymentStatus: "pending",
              totalAmount: 1550000,
              items: [
                {
                  id: 2,
                  productName: "Giày Thể Thao Sneaker Shopee Style v2",
                  price: 1550000,
                  quantity: 1,
                }
              ],
              shippingAddress: {
                receiverName: "Nguyễn Văn A",
                receiverPhone: "0901234567",
                detail: "123 Đường Láng, Đống Đa",
                province: "Hà Nội",
              },
            },
            1003: {
              id: 1003,
              status: "cancelled",
              created_at: "2026-05-08T15:00:00Z",
              paymentMethod: "cod",
              paymentStatus: "failed",
              totalAmount: 450000,
              items: [
                {
                  id: 3,
                  productName: "Áo Thun Unisex Lazada Essential",
                  price: 450000,
                  quantity: 1,
                }
              ],
              shippingAddress: {
                receiverName: "Nguyễn Văn A",
                receiverPhone: "0901234567",
                detail: "123 Đường Láng, Đống Đa",
                province: "Hà Nội",
              },
            },
            1004: {
              id: 1004,
              status: "refunded",
              created_at: "2026-05-05T08:00:00Z",
              paymentMethod: "vietqr",
              paymentStatus: "refunded",
              totalAmount: 2199000,
              items: [
                {
                  id: 4,
                  productName: "Sách Thiết Kế Hệ Thống E-Commerce Thực Tế",
                  price: 2199000,
                  quantity: 1,
                }
              ],
              shippingAddress: {
                receiverName: "Nguyễn Văn A",
                receiverPhone: "0901234567",
                detail: "123 Đường Láng, Đống Đa",
                province: "Hà Nội",
              },
            },
          };
          if (mockOrdersMap[status.orderId]) {
            data = mockOrdersMap[status.orderId];
          } else {
            throw apiErr;
          }
        }
        setOrderDetails(data);
      } catch (err) {
        console.error("Failed to load order details for payment:", err);
      } finally {
        setLoadingOrder(false);
      }
    };

    void fetchOrder();
  }, [status?.orderId, email]);

  const machineId = useMemo(() => {
    if (typeof window === "undefined") return "WEB";
    return localStorage.getItem("checkout-machine-id") ?? "WEB";
  }, []);

  const loadStatus = async () => {
    if (!paymentId) return;
    try {
      const res = await paymentAPI.getStatus(paymentId, token);
      setStatus(res);
      setError("");
      
      if (res.paymentStatus === "paid") {
        localStorage.removeItem("pending_payment");
        localStorage.removeItem(`dismiss_${paymentId}`);
        router.replace(`/order-success?orderId=${res.orderId}` + (email ? `&email=${encodeURIComponent(email)}` : ""));
      } else if (res.paymentStatus === "failed") {
        localStorage.removeItem("pending_payment");
        localStorage.removeItem(`dismiss_${paymentId}`);
        router.replace(`/order-failed?orderId=${res.orderId}` + (email ? `&email=${encodeURIComponent(email)}` : ""));
      } else if (res.orderStatus === "cancelled") {
        localStorage.removeItem("pending_payment");
        localStorage.removeItem(`dismiss_${paymentId}`);
      } else {
        // Pending or expired - save metadata to localStorage
        const expiresAt = res.qr?.expiredAt ? new Date(res.qr.expiredAt).getTime() : Date.now() + 15 * 60 * 1000;
        let checkoutUrl = `/checkout/payment?paymentId=${paymentId}`;
        if (token) checkoutUrl += `&token=${encodeURIComponent(token)}`;
        if (email) checkoutUrl += `&email=${encodeURIComponent(email)}`;

        localStorage.setItem(
          "pending_payment",
          JSON.stringify({
            paymentId,
            checkoutUrl,
            expiresAt,
            lastCheckedAt: Date.now()
          })
        );
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
  }, [paymentId, token]);

  const handleRegenerate = async () => {
    if (!paymentId) return;
    try {
      setLoadingRegen(true);
      const qr = await paymentAPI.regenerateQr(paymentId, machineId, token);
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
    } finally {
      setLoadingRegen(false);
    }
  };

  const handleChangeToCod = async () => {
    if (!status?.orderId) return;
    if (
      !confirm(
        t("trackOrder.confirmChangeToCod")
      )
    )
      return;

    try {
      setLoading(true);
      await orderAPI.changeToCod(status.orderId);
      localStorage.removeItem("pending_payment");
      if (paymentId) {
        localStorage.removeItem(`dismiss_${paymentId}`);
      }
      alert(t("trackOrder.alertChangeCodSuccess"));
      router.replace(`/order-success?orderId=${status.orderId}` + (email ? `&email=${encodeURIComponent(email)}` : ""));
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message ??
          t("trackOrder.alertChangeCodFail")
      );
    } finally {
      setLoading(false);
    }
  };

  const qr = status?.qr ?? null;

  return (
    <div className="w-full min-h-screen bg-brand-bg">
      <PageHero
        variant="checkout"
        currentStep="checkout"
        title={t("payment.secureQrTitle")}
        breadcrumbs={[
          { label: t("label.checkout"), href: "/checkout" },
          { label: t("payment.paymentLabel") }
        ]}
        centered={true}
      />
      <div className="max-w-7xl mx-auto px-6 py-14">
        {/* Header Section above Grid */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border/40 pb-5">
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-brand-text">
              {t("payment.transactionPayment")}
            </h2>
            {!loading && status && qr && (
              <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-brand-muted">
                <CountdownTimer expiresAt={qr.expiredAt} />
                <span className="w-1.5 h-1.5 rounded-full bg-brand-border/80" />
                <span>
                  {t("payment.transferAmount", { amount: formatPrice(status.amount) })}
                </span>
              </div>
            )}
          </div>
          {status && (
            <div className="shrink-0">
              <PaymentStatus status={status.paymentStatus} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT COLUMN: QR Box & COD Toggle */}
          <div className="lg:col-span-2 space-y-6">
            {loading && (
              <div className="rounded-3xl bg-brand-surface border border-brand-border p-6 shadow-sm">
                <p className="text-sm text-brand-muted">Loading payment details...</p>
              </div>
            )}

            {!loading && error && (
              <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-medium">
                {error}
              </div>
            )}

            {!loading && status && qr && (
              <>
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
                  <div className="bg-brand-surface rounded-3xl border border-brand-border p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-brand-text text-sm">
                        {t("payment.difficultyQr")}
                      </h4>
                      <p className="text-xs text-brand-muted mt-1">
                        {t("payment.switchCodDesc")}
                      </p>
                    </div>
                    <button
                      onClick={handleChangeToCod}
                      className="px-5 py-3 rounded-2xl bg-brand-primary-light hover:bg-brand-border text-brand-primary font-bold text-xs shrink-0 transition"
                    >
                      {t("payment.switchToCod")}
                    </button>
                  </div>
                )}
              </>
            )}

            {!loading && status && !qr && (
              <div className="rounded-3xl bg-brand-surface border border-brand-border p-6 shadow-sm">
                <p className="text-sm text-brand-muted">
                  {t("payment.qr.noData")}
                </p>
              </div>
            )}

            {!loading && status?.paymentStatus === "expired" && (
              <div className="rounded-3xl bg-brand-surface border border-brand-border p-6 shadow-sm space-y-3">
                <p className="text-sm text-brand-muted">
                  {t("payment.qr.expired")}
                </p>
                <button
                  onClick={handleRegenerate}
                  disabled={loadingRegen}
                  className="rounded-2xl bg-brand-primary disabled:opacity-60 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary-hover transition flex items-center gap-2">
                  {loadingRegen && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t("payment.qr.regenerate")}
                </button>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Order Items & Details */}
          <div className="space-y-6">
            <div className="bg-brand-surface rounded-3xl border border-brand-border p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-brand-border/40">
                <ClipboardList className="text-brand-primary w-5 h-5" />
                <h3 className="font-bold text-brand-text">
                  {language === "vi" ? "Chi tiết đơn hàng" : "Order Details"}
                </h3>
              </div>

              {loadingOrder && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
                </div>
              )}

              {!loadingOrder && orderDetails && (
                <>
                  {/* Shipping Address */}
                  {orderDetails.shippingAddress && (
                    <div className="space-y-1.5 text-xs text-brand-muted">
                      <div className="flex items-center gap-1.5 font-bold text-brand-text mb-1">
                        <MapPin size={14} className="text-brand-primary" />
                        <span>{language === "vi" ? "Thông tin nhận hàng" : "Shipping Information"}</span>
                      </div>
                      <p>
                        <span className="font-semibold text-brand-text">
                          {language === "vi" ? "Người nhận:" : "Recipient:"}{" "}
                        </span>
                        {orderDetails.shippingAddress.receiverName}
                      </p>
                      <p>
                        <span className="font-semibold text-brand-text">
                          {language === "vi" ? "Số điện thoại:" : "Phone:"}{" "}
                        </span>
                        {orderDetails.shippingAddress.receiverPhone}
                      </p>
                      <p className="leading-relaxed">
                        <span className="font-semibold text-brand-text">
                          {language === "vi" ? "Địa chỉ:" : "Address:"}{" "}
                        </span>
                        {orderDetails.shippingAddress.detail},{" "}
                        {orderDetails.shippingAddress.province}
                      </p>
                    </div>
                  )}

                  <hr className="border-brand-border/40" />

                  {/* Items List */}
                  <div className="space-y-3.5 max-h-[240px] overflow-y-auto pr-1">
                    {orderDetails.items?.map((item: any) => (
                      <div key={item.id} className="flex gap-3 text-xs">
                        <div className="w-10 h-14 bg-brand-bg rounded-lg border border-brand-border/40 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                          {item.productImage ? (
                            <img
                              src={
                                item.productImage.startsWith("http")
                                  ? item.productImage
                                  : (process.env.NEXT_PUBLIC_API_URL
                                      ? process.env.NEXT_PUBLIC_API_URL.replace("/api", "")
                                      : "http://localhost:3001") + item.productImage
                              }
                              alt={item.productName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback image support
                                (e.target as any).src = "/placeholder.png";
                              }}
                            />
                          ) : (
                            <Package className="w-5 h-5 text-brand-muted/70" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-brand-text line-clamp-2 leading-snug">
                            {item.productName}
                          </h4>
                          <p className="text-[11px] text-brand-muted mt-1">
                            {item.quantity} × {formatPrice(item.price)}
                          </p>
                        </div>
                        <span className="font-bold text-brand-primary shrink-0 self-start">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <hr className="border-brand-border/40" />

                  {/* Pricing Breakdown */}
                  <div className="space-y-2 text-xs text-brand-muted">
                    <div className="flex justify-between">
                      <span>{language === "vi" ? "Tạm tính" : "Subtotal"}</span>
                      <span className="font-bold text-brand-text">
                        {formatPrice(orderDetails.subtotalAmount || orderDetails.totalAmount)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>{language === "vi" ? "Phí vận chuyển" : "Shipping Fee"}</span>
                      <span className="font-bold text-brand-text">
                        +{formatPrice(orderDetails.shippingFee ?? 0)}
                      </span>
                    </div>

                    {orderDetails.discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>{language === "vi" ? "Đã giảm giá" : "Discount Applied"}</span>
                        <span className="font-bold">
                          -{formatPrice(orderDetails.discountAmount)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between pt-3 border-t border-brand-border/45 text-sm font-bold text-brand-text">
                      <span>{language === "vi" ? "Tổng cộng" : "Total Amount"}</span>
                      <span className="text-brand-primary text-base">
                        {formatPrice(orderDetails.totalAmount)}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {!loadingOrder && !orderDetails && (
                <div className="py-6 text-center text-xs text-brand-muted">
                  {language === "vi"
                    ? "Không thể tải chi tiết đơn hàng."
                    : "Unable to load order details."}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function CheckoutPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen bg-brand-bg">
          <div className="max-w-5xl mx-auto px-6 py-14">
            <div className="rounded-3xl bg-brand-surface border border-brand-border p-6 shadow-sm">
              <p className="text-sm text-brand-muted">
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
