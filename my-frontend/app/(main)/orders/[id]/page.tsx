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
    statusLogs: [
      { id: 1, oldStatus: "pending", newStatus: "confirmed", createdAt: "2026-05-12T10:05:00Z" },
      { id: 2, oldStatus: "confirmed", newStatus: "shipping", createdAt: "2026-05-12T12:00:00Z" },
      { id: 3, oldStatus: "shipping", newStatus: "delivered", createdAt: "2026-05-14T14:00:00Z" },
    ],
    shippingAddress: {
      fullName: "Nguyễn Văn A",
      phone: "0901234567",
      address: "123 Đường Láng, Đống Đa, Hà Nội",
    },
    paymentId: 1001,
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
    statusLogs: [
      { id: 1, oldStatus: "pending", newStatus: "pending", createdAt: "2026-05-10T09:00:00Z" },
    ],
    shippingAddress: {
      fullName: "Nguyễn Văn A",
      phone: "0901234567",
      address: "123 Đường Láng, Đống Đa, Hà Nội",
    },
    paymentId: 1002,
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
    statusLogs: [
      { id: 1, oldStatus: "pending", newStatus: "cancelled", createdAt: "2026-05-08T16:00:00Z", note: "Khách hàng không nhận cuộc gọi xác nhận" },
    ],
    shippingAddress: {
      fullName: "Nguyễn Văn A",
      phone: "0901234567",
      address: "123 Đường Láng, Đống Đa, Hà Nội",
    },
    paymentId: 1003,
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
    statusLogs: [
      { id: 1, oldStatus: "pending", newStatus: "confirmed", createdAt: "2026-05-05T08:05:00Z" },
      { id: 2, oldStatus: "confirmed", newStatus: "delivered", createdAt: "2026-05-06T10:00:00Z" },
      { id: 3, oldStatus: "delivered", newStatus: "refunded", createdAt: "2026-05-20T11:00:00Z" },
    ],
    shippingAddress: {
      fullName: "Nguyễn Văn A",
      phone: "0901234567",
      address: "123 Đường Láng, Đống Đa, Hà Nội",
    },
    paymentId: 1004,
  },
  1005: {
    id: 1005,
    status: "cancelled",
    created_at: "2026-05-02T11:00:00Z",
    paymentMethod: "vietqr",
    paymentStatus: "expired",
    totalAmount: 320000,
    items: [
      {
        id: 5,
        productName: "Chuột Gaming RGB Tiki Pro",
        price: 320000,
        quantity: 1,
      }
    ],
    statusLogs: [
      { id: 1, oldStatus: "pending", newStatus: "cancelled", createdAt: "2026-05-02T12:00:00Z", note: "Mã thanh toán QR hết hạn" },
    ],
    shippingAddress: {
      fullName: "Nguyễn Văn A",
      phone: "0901234567",
      address: "123 Đường Láng, Đống Đa, Hà Nội",
    },
    paymentId: 1005,
  },
  1006: {
    id: 1006,
    status: "delivered",
    created_at: "2026-05-24T10:00:00Z",
    paymentMethod: "vietqr",
    paymentStatus: "paid",
    totalAmount: 1200000,
    items: [
      {
        id: 6,
        productName: "Bàn Phím Cơ Silent Edition",
        price: 1200000,
        quantity: 1,
      }
    ],
    statusLogs: [
      { id: 1, oldStatus: "pending", newStatus: "confirmed", createdAt: "2026-05-24T10:05:00Z" },
      { id: 2, oldStatus: "confirmed", newStatus: "delivered", createdAt: "2026-05-25T09:00:00Z" },
    ],
    shippingAddress: {
      fullName: "Nguyễn Văn A",
      phone: "0901234567",
      address: "123 Đường Láng, Đống Đa, Hà Nội",
    },
    paymentId: 1006,
  },
  1007: {
    id: 1007,
    status: "delivered",
    created_at: "2026-05-27T10:00:00Z",
    paymentMethod: "vietqr",
    paymentStatus: "paid",
    totalAmount: 850000,
    items: [
      {
        id: 7,
        productName: "Tai Nghe Không Dây Noise Cancelling",
        price: 850000,
        quantity: 1,
      }
    ],
    statusLogs: [
      { id: 1, oldStatus: "pending", newStatus: "confirmed", createdAt: "2026-05-27T10:05:00Z" },
      { id: 2, oldStatus: "confirmed", newStatus: "delivered", createdAt: "2026-05-28T09:00:00Z" },
    ],
    shippingAddress: {
      fullName: "Nguyễn Văn A",
      phone: "0901234567",
      address: "123 Đường Láng, Đống Đa, Hà Nội",
    },
    paymentId: 1007,
  }
};

const mockReturnMap: Record<number, any> = {
  1004: {
    status: "refunded",
    reason: "Sản phẩm bị lỗi nứt nắp lưng bảo vệ",
    imageProof: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=200",
    refundMethod: "VietQR",
    refundTransactionId: "TXN-REF-1001",
    refundedAt: "2026-05-20T11:00:00Z",
    createdAt: "2026-05-15T09:00:00Z",
  },
  1006: {
    status: "refund_processing",
    reason: "Không đúng thông số kỹ thuật đã đặt",
    imageProof: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=200",
    createdAt: "2026-05-25T10:00:00Z",
  },
  1007: {
    status: "return_rejected",
    reason: "Không thích sản phẩm nữa",
    imageProof: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=200",
    rejectionReason: "Chính sách trả hàng không áp dụng cho trường hợp đổi ý định mua hàng cá nhân",
    createdAt: "2026-05-28T09:30:00Z",
  }
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params.id);

  const [order, setOrder] = useState<any>(null);
  const [returnReq, setReturnReq] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ id: number; name: string } | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const { t, formatPrice } = usePreferences();

  const getProofUrl = (path?: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL.replace("/api", "") 
      : "http://localhost:3001";
    return baseUrl + path;
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let data;
      try {
        data = await orderAPI.getById(orderId);
      } catch (apiErr) {
        if (mockOrdersMap[orderId]) {
          data = mockOrdersMap[orderId];
        } else {
          throw apiErr;
        }
      }
      setOrder(data);

      const returnStatuses = [
        "return_requested",
        "return_approved",
        "product_received",
        "refund_processing",
        "refunded",
        "return_rejected",
        "return_cancelled",
      ];
      if (returnStatuses.includes(data.status)) {
        try {
          let ret;
          try {
            ret = await orderAPI.getOrderReturn(orderId);
          } catch (apiErr) {
            if (mockReturnMap[orderId]) {
              ret = mockReturnMap[orderId];
            } else {
              throw apiErr;
            }
          }
          setReturnReq(ret);
        } catch (e) {
          console.error("Failed to load return details", e);
        }
      } else {
        try {
          let ret;
          try {
            ret = await orderAPI.getOrderReturn(orderId);
          } catch (apiErr) {
            if (mockReturnMap[orderId]) {
              ret = mockReturnMap[orderId];
            } else {
              ret = null;
            }
          }
          if (ret) {
            setReturnReq(ret);
          } else {
            setReturnReq(null);
          }
        } catch (e) {
          setReturnReq(null);
        }
      }
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

  const [cancellingReturn, setCancellingReturn] = useState(false);
  const handleCancelReturn = async () => {
    if (!confirm("Bạn có chắc chắn muốn hủy yêu cầu trả hàng này?")) return;
    try {
      setCancellingReturn(true);
      await orderAPI.cancelReturnRequest(orderId);
      alert("Hủy yêu cầu trả hàng thành công!");
      fetchOrderDetails();
    } catch (err: any) {
      alert(err.response?.data?.message || "Không thể hủy yêu cầu trả hàng lúc này.");
    } finally {
      setCancellingReturn(false);
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
                order.status === "refunded" ? "text-purple-600" :
                ["return_requested", "return_approved", "product_received", "refund_processing"].includes(order.status) ? "text-orange-500" :
                "text-yellow-600"
              }`}>
                {order.status === "pending" && "Chờ thanh toán"}
                {order.status === "confirmed" && "Đã xác nhận"}
                {order.status === "shipping" && "Đang vận chuyển"}
                {order.status === "delivered" && "Đã giao hàng"}
                {order.status === "cancelled" && "Đã hủy"}
                {order.status === "refunded" && "Đã hoàn tiền"}
                {order.status === "return_requested" && "Yêu cầu trả hàng"}
                {order.status === "return_approved" && "Đã duyệt trả hàng"}
                {order.status === "product_received" && "Đã nhận sản phẩm"}
                {order.status === "refund_processing" && "Đang hoàn tiền"}
                {order.status === "return_rejected" && "Từ chối trả hàng"}
                {order.status === "return_cancelled" && "Đã hủy trả hàng"}
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
              (() => {
                const deliveredAt = order.deliveredAt;
                let isEligible = true;
                if (deliveredAt) {
                  const diffTime = Math.abs(new Date().getTime() - new Date(deliveredAt).getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  if (diffDays > 7) {
                    isEligible = false;
                  }
                }
                return isEligible ? (
                  <Link
                    href={`/orders/${order.id}/return`}
                    className="px-6 py-3 rounded-2xl border border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white font-semibold text-sm transition flex items-center gap-1.5 bg-white"
                  >
                    <Undo2 size={16} /> Yêu cầu đổi trả
                  </Link>
                ) : null;
              })()
            )}

            {order.status === "return_requested" && (
              <button
                onClick={handleCancelReturn}
                disabled={cancellingReturn}
                className="px-6 py-3 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs transition"
              >
                Hủy yêu cầu trả hàng
              </button>
            )}
          </div>
        </div>

        {/* BANNERS */}
        {order.status === "return_rejected" && returnReq && (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-6 flex gap-4 items-start shadow-sm animate-fadeIn">
            <XCircle className="w-8 h-8 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-800 text-lg">Yêu cầu trả hàng đã bị từ chối</h3>
              {returnReq.rejectionReason && (
                <p className="text-sm text-red-700 mt-1">
                  Lý do từ chối: <span className="font-semibold text-red-900">{returnReq.rejectionReason}</span>
                </p>
              )}
              <p className="text-xs text-red-500 mt-2 font-medium">
                Đơn hàng của bạn đã quay trở lại trạng thái "Đã giao hàng". Bạn không cần thực hiện thêm thao tác nào.
              </p>
            </div>
          </div>
        )}

        {order.status === "refunded" && returnReq && (
          <div className="bg-green-50 border border-green-200 rounded-3xl p-6 flex gap-4 items-start shadow-sm animate-fadeIn">
            <CheckCircle className="w-8 h-8 text-green-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-green-800 text-lg">Yêu cầu trả hàng & hoàn tiền thành công</h3>
              <p className="text-sm text-green-700 mt-1">
                Chúng tôi đã hoàn tất xử lý hoàn tiền cho đơn hàng của bạn.
              </p>
              <div className="mt-3 text-xs text-green-600 bg-white/50 border border-green-200/50 rounded-xl p-3 space-y-1">
                {returnReq.refundMethod && <p><span className="font-bold text-gray-700">Phương thức hoàn tiền:</span> {returnReq.refundMethod}</p>}
                {returnReq.refundTransactionId && <p><span className="font-bold text-gray-700">Mã giao dịch:</span> <span className="font-mono bg-green-200/30 px-1.5 py-0.5 rounded">{returnReq.refundTransactionId}</span></p>}
                {returnReq.refundedAt && <p><span className="font-bold text-gray-700">Thời gian hoàn tiền:</span> {new Date(returnReq.refundedAt).toLocaleString("vi-VN")}</p>}
              </div>
            </div>
          </div>
        )}

        {/* DYNAMIC TIMELINE */}
        <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
          <h3 className="font-bold text-gray-800 text-lg mb-6 text-center md:text-left">Tiến trình & Nhật ký hành trình đơn hàng</h3>
          <div className="relative border-l border-gray-200 pl-6 space-y-6 text-sm py-1">
            {order.statusLogs && order.statusLogs.length > 0 ? (
              [...order.statusLogs]
                .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                .map((log: any, idx: number) => {
                  const getStatusLabel = (status: string) => {
                    const labels: Record<string, string> = {
                      pending: "Chờ thanh toán (Pending)",
                      confirmed: "Đã xác nhận (Confirmed)",
                      shipping: "Đang giao hàng (Shipping)",
                      delivered: "Đã giao hàng thành công (Delivered)",
                      cancelled: "Đã hủy đơn hàng (Cancelled)",
                      refunded: "Đã hoàn tiền (Refunded)",
                      return_requested: "Yêu cầu trả hàng (Return Requested)",
                      return_approved: "Duyệt trả hàng (Return Approved)",
                      product_received: "Kho đã nhận hàng (Product Received)",
                      refund_processing: "Đang xử lý hoàn tiền (Refund Processing)",
                      return_rejected: "Yêu cầu trả hàng bị từ chối (Return Rejected)",
                      return_cancelled: "Yêu cầu trả hàng đã bị hủy (Return Cancelled)",
                    };
                    return labels[status] || status;
                  };

                  return (
                    <div key={log.id || idx} className="relative">
                      {/* Bullet icon dot */}
                      <div className="absolute -left-[30px] top-1 w-3.5 h-3.5 rounded-full bg-yellow-500 border-2 border-white shadow-sm" />
                      <div className="flex justify-between items-start gap-4 flex-wrap">
                        <div>
                          <p className="font-bold text-gray-800">
                            {getStatusLabel(log.oldStatus)} <span className="font-normal text-gray-400 font-mono">→</span> {getStatusLabel(log.newStatus)}
                          </p>
                          {log.note && <p className="text-gray-500 italic mt-1 text-xs">"{log.note}"</p>}
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString("vi-VN")}
                        </span>
                      </div>
                    </div>
                  );
                })
            ) : (
              /* Fallback for legacy orders without status logs */
              <div className="relative">
                <div className="absolute -left-[30px] top-1 w-3.5 h-3.5 rounded-full bg-yellow-500 border-2 border-white shadow-sm" />
                <p className="font-bold text-gray-800 font-bold">Trạng thái đơn hàng: {order.status}</p>
                <p className="text-xs text-gray-400 mt-1">Đơn hàng được đặt vào lúc {new Date(order.created_at).toLocaleString("vi-VN")}</p>
              </div>
            )}
          </div>
        </div>

        {/* RETURN INFORMATION CARD */}
        {returnReq && (
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <Undo2 className="text-orange-500 w-5 h-5" />
              <h3 className="font-bold text-gray-800">Thông tin Yêu cầu Trả hàng & Hoàn tiền</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
              <div className="space-y-2">
                <p>
                  <span className="font-medium text-gray-800">Trạng thái đổi trả:</span> 
                  <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    returnReq.status === "return_requested" ? "bg-orange-50 text-orange-700 border-orange-100" :
                    returnReq.status === "return_approved" ? "bg-blue-50 text-blue-700 border-blue-100" :
                    returnReq.status === "product_received" ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                    returnReq.status === "refund_processing" ? "bg-purple-50 text-purple-700 border-purple-100" :
                    returnReq.status === "refunded" ? "bg-green-50 text-green-700 border-green-100" :
                    returnReq.status === "return_rejected" ? "bg-red-50 text-red-700 border-red-100" :
                    "bg-gray-50 text-gray-500 border-gray-100"
                  }`}>
                    {returnReq.status === "return_requested" && "Chờ duyệt"}
                    {returnReq.status === "return_approved" && "Đã duyệt / Chờ nhận hàng"}
                    {returnReq.status === "product_received" && "Đã nhận sản phẩm"}
                    {returnReq.status === "refund_processing" && "Đang hoàn tiền"}
                    {returnReq.status === "refunded" && "Đã hoàn tiền"}
                    {returnReq.status === "return_rejected" && "Từ chối trả hàng"}
                    {returnReq.status === "return_cancelled" && "Đã hủy"}
                  </span>
                </p>
                <p><span className="font-medium text-gray-800">Lý do trả hàng:</span> {returnReq.reason}</p>
                {returnReq.rejectionReason && (
                  <p className="text-red-650"><span className="font-medium text-red-800">Lý do từ chối:</span> {returnReq.rejectionReason}</p>
                )}
                {returnReq.createdAt && (
                  <p><span className="font-medium text-gray-800">Ngày tạo yêu cầu:</span> {new Date(returnReq.createdAt).toLocaleString("vi-VN")}</p>
                )}
              </div>

              <div className="space-y-3">
                {returnReq.imageProof && (
                  <div className="space-y-1">
                    <span className="font-medium text-gray-800 block">Minh chứng hình ảnh:</span>
                    <div className="w-32 h-20 rounded-xl border overflow-hidden relative bg-gray-50 shadow-inner">
                      <img
                        src={getProofUrl(returnReq.imageProof)}
                        alt="Proof Image"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as any).src = returnReq.imageProof;
                        }}
                      />
                    </div>
                  </div>
                )}

                {(returnReq.refundMethod || returnReq.refundTransactionId) && (
                  <div className="pt-2 border-t border-gray-100 space-y-1">
                    <p className="font-bold text-gray-800 text-xs">Chi tiết hoàn tiền</p>
                    {returnReq.refundMethod && <p><span className="font-medium text-gray-700">Phương thức:</span> {returnReq.refundMethod}</p>}
                    {returnReq.refundTransactionId && <p><span className="font-medium text-gray-700">Mã giao dịch:</span> <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs text-gray-800">{returnReq.refundTransactionId}</span></p>}
                    {returnReq.refundedAt && <p><span className="font-medium text-gray-700">Ngày hoàn tiền:</span> {new Date(returnReq.refundedAt).toLocaleString("vi-VN")}</p>}
                  </div>
                )}
              </div>
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
              {returnReq && returnReq.refundedAt && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-xs text-purple-700 bg-purple-50/50 p-3 rounded-2xl">
                  <p className="font-bold text-purple-800 uppercase tracking-wider text-[10px]">Thông tin hoàn tiền</p>
                  <p><span className="font-medium text-gray-700">Phương thức:</span> {returnReq.refundMethod}</p>
                  <p><span className="font-medium text-gray-700">Mã giao dịch:</span> <span className="font-mono bg-purple-100/50 px-1.5 py-0.5 rounded">{returnReq.refundTransactionId}</span></p>
                  <p><span className="font-medium text-gray-700">Thời gian:</span> {new Date(returnReq.refundedAt).toLocaleString("vi-VN")}</p>
                </div>
              )}
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
