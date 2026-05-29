"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  FileText,
  MapPin,
  CreditCard,
  CheckCircle,
  Truck,
  PackageCheck,
  AlertTriangle,
  Loader2,
  Clock,
  ShieldCheck,
  MessageSquare,
  Undo2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { orderAPI } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";
import LeaveReviewModal from "@/components/reviews/LeaveReviewModal";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params.id);

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ id: number; name: string } | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const { t, formatPrice } = usePreferences();

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await orderAPI.getById(orderId);
      setOrder(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to load order details.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    const reason = prompt("Vui lòng nhập lý do hủy đơn hàng:");
    if (reason === null) return;
    if (!reason.trim()) {
      alert("Lý do hủy không được để trống.");
      return;
    }

    try {
      setCancelling(true);
      await orderAPI.cancel(orderId, reason.trim());
      alert("Đơn hàng đã được hủy thành công!");
      fetchOrderDetails();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Không thể hủy đơn hàng lúc này.");
    } finally {
      setCancelling(false);
    }
  };

  const handleChangeToCod = async () => {
    if (!orderId) return;
    if (
      !confirm(
        "Bạn có chắc chắn muốn đổi phương thức thanh toán sang COD (thanh toán khi nhận hàng)?"
      )
    )
      return;

    try {
      setLoading(true);
      await orderAPI.changeToCod(orderId);
      alert("Đã chuyển đổi phương thức thanh toán sang COD thành công!");
      fetchOrderDetails();
    } catch (err: any) {
      console.error(err);
      alert(
        err?.response?.data?.message ||
          "Không thể chuyển đổi phương thức thanh toán."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-yellow-600 animate-spin" />
          <p className="text-gray-500 font-medium">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900">Không tìm thấy đơn hàng</h2>
          <p className="text-gray-500 text-sm">{error || "Đơn hàng không tồn tại hoặc bạn không có quyền xem."}</p>
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-sm text-yellow-600 font-semibold hover:underline"
          >
            <ArrowLeft size={16} /> Quay về danh sách đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  // Helper to extract timestamp for status logs
  const getLogTime = (statusName: string) => {
    const log = order.statusLogs?.find((l: any) => l.newStatus === statusName);
    if (!log) return null;
    return new Date(log.createdAt).toLocaleDateString("vi-VN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const steps = [
    { key: "pending", label: "Chờ Thanh Toán", icon: Clock },
    { key: "confirmed", label: "Đã Xác Nhận", icon: ShieldCheck },
    { key: "shipping", label: "Đang Vận Chuyển", icon: Truck },
    { key: "delivered", label: "Đã Giao Hàng", icon: PackageCheck },
  ];

  const currentStatusIndex = steps.findIndex((s) => s.key === order.status);
  const isTerminalState = ["cancelled", "refunded"].includes(order.status);

  return (
    <div className="min-h-screen bg-[#efefef] py-10 px-4 lg:px-10">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* BACK ACTION */}
        <div className="flex items-center justify-between">
          <Link href="/orders" className="flex items-center gap-2 text-gray-600 hover:text-yellow-600 transition font-medium">
            <ArrowLeft size={18} /> Lịch sử đơn hàng
          </Link>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Mã đơn hàng:</span>
            <span className="font-bold text-gray-900">#ORD-{order.id}</span>
          </div>
        </div>

        {/* STATUS BANNER */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Trạng thái hiện tại</span>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold uppercase ${
                order.status === "delivered" ? "text-green-600" :
                order.status === "cancelled" ? "text-red-500" :
                order.status === "shipping" ? "text-blue-500" :
                "text-yellow-600"
              }`}>
                {order.status === "pending" && "Chờ thanh toán"}
                {order.status === "confirmed" && "Đã xác nhận"}
                {order.status === "shipping" && "Đang vận chuyển"}
                {order.status === "delivered" && "Đã giao hàng"}
                {order.status === "cancelled" && "Đã hủy"}
                {order.status === "refunded" && "Đã hoàn tiền"}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Đặt ngày {new Date(order.created_at).toLocaleDateString("vi-VN", {
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {order.status === "pending" && (
              <>
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="px-6 py-3 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs transition"
                >
                  Hủy đơn hàng
                </button>

                {order.paymentMethod === "qr" && order.paymentId && (
                  <>
                    <Link
                      href={`/checkout/payment?paymentId=${order.paymentId}`}
                      className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition flex items-center justify-center"
                    >
                      Thanh toán QR
                    </Link>
                    <button
                      onClick={handleChangeToCod}
                      className="px-6 py-3 rounded-2xl border border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white font-bold text-xs transition"
                    >
                      Đổi sang COD
                    </button>
                  </>
                )}
              </>
            )}

            {order.status === "delivered" && (
              <Link
                href={`/orders/${order.id}/return`}
                className="px-6 py-3 rounded-2xl border border-gray-300 hover:border-gray-500 font-semibold text-sm transition flex items-center gap-1.5 bg-white text-gray-700"
              >
                <Undo2 size={16} /> Yêu cầu đổi trả
              </Link>
            )}
          </div>
        </div>

        {/* TIMELINE */}
        {!isTerminalState ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
            <h3 className="font-bold text-gray-800 text-lg mb-6">Tiến trình vận chuyển</h3>
            <div className="grid grid-cols-4 relative">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const time = getLogTime(step.key);
                const isCompleted = idx <= currentStatusIndex;
                const isActive = idx === currentStatusIndex;

                return (
                  <div key={step.key} className="flex flex-col items-center text-center relative z-10">
                    <div
                      className={`w-12 h-12 rounded-full border-2 flex items-center justify-center mb-3 transition-colors ${
                        isCompleted
                          ? "bg-yellow-500 border-yellow-500 text-white shadow-md shadow-yellow-100"
                          : "bg-gray-50 border-gray-200 text-gray-300"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-xs font-bold leading-tight ${isCompleted ? "text-gray-800" : "text-gray-400"}`}>
                      {step.label}
                    </span>
                    {time && (
                      <span className="text-[10px] text-gray-400 mt-1">{time}</span>
                    )}
                  </div>
                );
              })}

              {/* TIMELINE CONNECTOR LINE */}
              <div className="absolute top-6 left-[12.5%] right-[12.5%] h-0.5 bg-gray-100 -z-0">
                <div
                  className="h-full bg-yellow-500 transition-all duration-500"
                  style={{
                    width: `${
                      currentStatusIndex === -1 ? 0 : (currentStatusIndex / (steps.length - 1)) * 100
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-6 flex gap-4 items-start">
            <XCircle className="w-8 h-8 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-800 text-lg">
                {order.status === "cancelled" ? "Đơn hàng đã bị hủy" : "Đơn hàng đã hoàn tiền"}
              </h3>
              <p className="text-sm text-red-700 mt-1">
                Lý do & Nhật ký thay đổi đã được cập nhật vào nhật ký trạng thái của hệ thống. Bạn không cần thực hiện thêm thao tác nào.
              </p>
              {order.statusLogs?.length > 0 && (
                <div className="mt-4 text-xs text-red-600 bg-white/40 border border-red-200/50 rounded-xl p-3">
                  <span className="font-semibold block mb-1">Chi tiết hủy:</span>
                  {order.statusLogs.map((log: any, index: number) => log.note && (
                    <span key={index} className="block italic">"{log.note}" vào lúc {new Date(log.createdAt).toLocaleString()}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* DETAILS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SHIPPING INFO */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b">
              <MapPin className="text-yellow-600 w-5 h-5" />
              <h3 className="font-bold text-gray-800">Thông tin nhận hàng</h3>
            </div>
            
            {order.shippingAddress ? (
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-medium text-gray-800">Người nhận:</span> {order.shippingAddress.receiverName}</p>
                <p><span className="font-medium text-gray-800">Điện thoại:</span> {order.shippingAddress.receiverPhone}</p>
                <p><span className="font-medium text-gray-800">Địa chỉ:</span> {order.shippingAddress.detail}, {order.shippingAddress.province}</p>
                {order.trackingNumber && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between text-blue-700">
                    <div>
                      <span className="text-[10px] block font-semibold uppercase tracking-wider text-blue-500">Mã vận đơn</span>
                      <span className="font-bold text-sm tracking-wider font-mono">{order.trackingNumber}</span>
                    </div>
                    {order.estimatedDeliveryDate && (
                      <div className="text-right">
                        <span className="text-[10px] block font-semibold uppercase text-blue-500">Dự kiến giao</span>
                        <span className="text-xs font-semibold">{new Date(order.estimatedDeliveryDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Không tìm thấy thông tin vận chuyển.</p>
            )}
          </div>

          {/* PAYMENT INFO */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b">
              <CreditCard className="text-yellow-600 w-5 h-5" />
              <h3 className="font-bold text-gray-800">Phương thức thanh toán</h3>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-medium text-gray-800">Hình thức:</span> <span className="uppercase font-semibold">{order.paymentMethod}</span></p>
              <p><span className="font-medium text-gray-800">Trạng thái:</span> 
                <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  order.paymentStatus === "paid" ? "bg-green-100 text-green-700" :
                  order.paymentStatus === "refunded" ? "bg-purple-100 text-purple-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>
                  {order.paymentStatus === "paid" && "Đã thanh toán"}
                  {order.paymentStatus === "pending" && "Chờ thanh toán"}
                  {order.paymentStatus === "failed" && "Thất bại"}
                  {order.paymentStatus === "refunded" && "Đã hoàn tiền"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* ITEMS LIST */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b">
            <FileText className="text-yellow-600 w-5 h-5" />
            <h3 className="font-bold text-gray-800">Chi tiết sản phẩm</h3>
          </div>

          <div className="divide-y divide-gray-100">
            {order.items?.map((item: any) => (
              <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-16 bg-amber-50 rounded-xl border flex items-center justify-center text-yellow-700 shrink-0 font-bold text-[10px] shadow-inner">
                    BOOK
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 line-clamp-1">{item.productName}</h4>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">Số lượng: {item.quantity}</span>
                      {order.status === "delivered" && (
                        <button
                          onClick={() => {
                            setSelectedProduct({ id: item.productId, name: item.productName });
                            setIsReviewOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-semibold transition hover:underline"
                        >
                          <MessageSquare size={13} /> Viết đánh giá
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                  <span className="text-xs text-gray-400">{formatPrice(item.price)}/sp</span>
                </div>
              </div>
            ))}
          </div>

          {/* TOTALS SUMMARY */}
          <div className="pt-4 border-t space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Tạm tính</span>
              <span className="font-semibold text-gray-900">{formatPrice(order.subtotalAmount || order.totalAmount)}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Phí vận chuyển</span>
              <span className="font-semibold text-gray-900">+{formatPrice(order.shippingFee ?? 0)}</span>
            </div>

            {order.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Khuyến mãi áp dụng</span>
                <span className="font-semibold">-{formatPrice(order.discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between pt-3 border-t text-base font-bold text-gray-900">
              <span>Tổng số tiền thực tế</span>
              <span className="text-yellow-600 text-lg">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {selectedProduct && (
          <LeaveReviewModal
            isOpen={isReviewOpen}
            onClose={() => {
              setIsReviewOpen(false);
              setSelectedProduct(null);
            }}
            productId={selectedProduct.id}
            productName={selectedProduct.name}
            orderId={orderId}
            onSuccess={() => fetchOrderDetails()}
          />
        )}
      </div>
    </div>
  );
}
