"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Printer, ArrowRight, UserPlus, ShoppingBag } from "lucide-react";
import { orderAPI } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";
import { registerGuestConvert } from "@/lib/auth";
import { setAuthToken } from "@/lib/auth-token";
import PageHero from "@/components/layout/PageHero";

interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  price: number;
  quantity: number;
}

interface OrderDetail {
  id: number;
  totalAmount: number;
  subtotalAmount: number;
  discountAmount: number;
  shippingFee: number;
  couponCodes?: string[];
  paymentMethod: string;
  status: string;
  created_at: string;
  items: OrderItem[];
  guestEmail?: string | null;
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, formatPrice } = usePreferences();
  
  const orderId = searchParams.get("orderId");
  const guestEmail = searchParams.get("email");

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guest Register state
  const [password, setPassword] = useState("");
  const [registering, setRegistering] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const loadOrder = async () => {
      try {
        let data;
        if (guestEmail) {
          data = await orderAPI.getGuestOrder(Number(orderId), guestEmail);
        } else {
          data = await orderAPI.getById(Number(orderId));
        }
        setOrder(data);
      } catch (err: any) {
        console.error("Error loading order:", err);
        setError("Không thể tải thông tin đơn hàng.");
      } finally {
        setLoading(false);
      }
    };

    void loadOrder();
  }, [orderId, guestEmail]);

  const handleRegisterConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestEmail || !password) return;

    setRegistering(true);
    setRegisterError(null);

    try {
      const res = await registerGuestConvert({
        email: guestEmail,
        password,
      });

      if (res.data?.accessToken) {
        setAuthToken(res.data.accessToken);
        setRegisterSuccess(true);
        // Dispatch cart-updated in case guest orders merged
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("cart-updated"));
        }
      } else {
        setRegisterError("Không nhận được mã xác thực đăng nhập.");
      }
    } catch (err: any) {
      console.error("Convert guest error:", err);
      setRegisterError(
        err?.response?.data?.message || "Đã có lỗi xảy ra khi tạo tài khoản."
      );
    } finally {
      setRegistering(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center px-6 py-20">
        <div className="max-w-md w-full bg-brand-surface rounded-3xl p-8 text-center shadow-sm border border-brand-border">
          <p className="text-brand-muted font-medium">Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg pb-12">
      <PageHero
        variant="checkout"
        currentStep="complete"
        title={t("order.successTitle")}
        breadcrumbs={[{ label: t("order.successTitle") }]}
        centered={true}
      />
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* BANNER SUCCESS */}
        <div className="bg-brand-surface rounded-3xl shadow-sm border border-brand-border p-8 md:p-12 mb-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-brand-primary"></div>
          <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-brand-primary-light flex items-center justify-center">
            <CheckCircle2 className="h-9 w-9 text-brand-primary animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold text-brand-text">
            {t("order.successTitle")}
          </h2>
          <p className="text-brand-muted mt-3 max-w-lg mx-auto text-sm font-medium">
            Cảm ơn bạn đã tin tưởng mua sắm tại nhà sách của chúng tôi. Đơn hàng của bạn đã được tiếp nhận và đang được xử lý.
          </p>

          {orderId && (
            <div className="mt-6 inline-block bg-brand-primary-light px-4 py-2 rounded-full border border-brand-border">
              <span className="text-sm text-brand-primary font-semibold">
                Mã đơn hàng: #{orderId}
              </span>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-2xl border border-brand-border px-6 py-3.5 text-sm font-bold text-brand-primary hover:bg-brand-primary-light/50 transition cursor-pointer shadow-sm bg-brand-surface">
              <Printer className="h-4 w-4" />
              In hóa đơn
            </button>
            <Link
              href="/shop"
              className="flex items-center gap-2 rounded-2xl bg-brand-primary hover:bg-brand-primary-hover px-6 py-3.5 text-sm font-bold text-white shadow-md hover:shadow-lg transition cursor-pointer">
              <ShoppingBag className="h-4 w-4" />
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>

        {/* CONTAINER CHIA COT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* TRAI: CHI TIET DON HANG */}
          <div className="lg:col-span-2 space-y-8">
            {/* FILE INVOICE PRINT AREA */}
            <div
              id="invoice-print-area"
              className="bg-brand-surface rounded-3xl shadow-sm border border-brand-border p-8 relative">
              
              {/* PRINT ONLY HEADER */}
              <div className="hidden print:block mb-8 border-b pb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-brand-primary">E-Commerce</h2>
                    <p className="text-xs text-brand-muted mt-1">Hóa đơn mua hàng chính thức</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">Mã HĐ: #{orderId}</p>
                    <p className="text-xs text-brand-muted">
                      Ngày lập: {order ? new Date(order.created_at).toLocaleDateString("vi-VN") : ""}
                    </p>
                  </div>
                </div>
              </div>

              <h2 className="text-xl font-bold text-brand-text mb-6">Chi tiết đơn hàng</h2>
              
              {order ? (
                <div>
                  <div className="border-b pb-6 mb-6">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b text-brand-muted font-semibold text-sm pb-2">
                          <th className="py-2">Tên sản phẩm</th>
                          <th className="py-2 text-center w-20">SL</th>
                          <th className="py-2 text-right w-32">Đơn giá</th>
                          <th className="py-2 text-right w-32">Tổng cộng</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item) => (
                          <tr key={item.id} className="border-b last:border-b-0 text-brand-text text-sm">
                            <td className="py-3 pr-4 font-medium">{item.productName}</td>
                            <td className="py-3 text-center">{item.quantity}</td>
                            <td className="py-3 text-right">{formatPrice(item.price)}</td>
                            <td className="py-3 text-right font-semibold">
                              {formatPrice(item.price * item.quantity)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="w-full md:w-80 ml-auto space-y-3 text-sm text-brand-muted">
                    <div className="flex justify-between">
                      <span>Tạm tính</span>
                      <span className="font-medium">{formatPrice(order.subtotalAmount)}</span>
                    </div>
                    {order.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-650 font-medium">
                        <span>Giảm giá</span>
                        <span>-{formatPrice(order.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Phí vận chuyển</span>
                      <span className="font-medium">{formatPrice(order.shippingFee)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-3 text-base text-brand-text font-bold">
                      <span>Tổng thanh toán</span>
                      <span className="text-brand-primary">{formatPrice(order.totalAmount)}</span>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-brand-muted">
                    <div>
                      <h4 className="font-bold text-brand-text mb-2">Thông tin thanh toán</h4>
                      <p>Phương thức: <span className="font-semibold uppercase">{order.paymentMethod}</span></p>
                      <p>Trạng thái: <span className="font-semibold text-brand-primary uppercase">{order.status === "confirmed" ? "Đã xác nhận" : order.status === "pending" ? "Chờ thanh toán" : order.status}</span></p>
                    </div>
                    {order.guestEmail && (
                      <div>
                        <h4 className="font-bold text-brand-text mb-2">Thông tin khách mua hàng</h4>
                        <p>Email: <span className="font-semibold">{order.guestEmail}</span></p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-brand-muted text-center py-6">Không tìm thấy chi tiết sản phẩm.</p>
              )}
            </div>
          </div>

          {/* PHAI: GUEST TO MEMBER CONVERSION */}
          <div className="lg:col-span-1">
            {guestEmail && (
              <div className="bg-brand-surface rounded-3xl shadow-sm border border-brand-border p-6 md:p-8">
                <div className="h-12 w-12 rounded-2xl bg-brand-primary-light flex items-center justify-center mb-6">
                  <UserPlus className="h-6 w-6 text-brand-primary" />
                </div>
                
                <h3 className="text-lg font-bold text-brand-text">Tạo tài khoản nhanh</h3>
                <p className="text-sm text-brand-muted mt-2">
                  Lưu lại mật khẩu để tự động tạo tài khoản với email <span className="font-semibold text-brand-text">{guestEmail}</span>. Hệ thống sẽ tự động liên kết các đơn hàng đã đặt của bạn!
                </p>

                {registerSuccess ? (
                  <div className="mt-6 bg-status-success-bg text-status-success-text p-4 rounded-2xl border border-status-success-border text-sm">
                    <p className="font-bold">Đăng ký thành công!</p>
                    <p className="mt-1">Chào mừng thành viên mới. Bạn đã được tự động đăng nhập.</p>
                    <button
                      onClick={() => router.push("/orders")}
                      className="mt-4 w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition shadow-sm border-none cursor-pointer">
                      Xem đơn hàng của bạn
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleRegisterConvert} className="mt-6 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-brand-muted uppercase mb-2">
                        Thiết lập mật khẩu
                      </label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Nhập mật khẩu mới..."
                        className="w-full px-4 py-3 rounded-2xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-sm text-brand-text bg-brand-bg/30"
                      />
                    </div>

                    {registerError && (
                      <p className="text-xs text-rose-500 font-medium">
                        {registerError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={registering}
                      className="w-full flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-60 text-white font-bold py-3.5 px-4 rounded-2xl text-sm transition cursor-pointer shadow-sm border-none">
                      {registering ? "Đang xử lý..." : "Kích hoạt tài khoản"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* STYLE PRINT CHUYEN NGHIEP */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          /* Hide everything */
          body * {
            visibility: hidden;
          }
          /* Show print area and descendants only */
          #invoice-print-area, #invoice-print-area * {
            visibility: visible;
          }
          #invoice-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-bg flex items-center justify-center px-6">
          <div className="max-w-md w-full bg-brand-surface rounded-3xl shadow-sm border border-brand-border p-8 text-center">
            <p className="text-sm text-brand-muted">Đang tải...</p>
          </div>
        </div>
      }>
      <OrderSuccessContent />
    </Suspense>
  );
}
