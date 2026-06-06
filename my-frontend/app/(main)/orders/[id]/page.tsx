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
  Package,
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
    const reason = prompt(t("trackOrder.promptCancelReason"));
    if (reason === null) return;
    if (!reason.trim()) {
      alert(t("trackOrder.promptCancelEmpty"));
      return;
    }

    try {
      setCancelling(true);
      await orderAPI.cancel(orderId, reason.trim());
      alert(t("trackOrder.alertCancelSuccess"));
      fetchOrderDetails();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || t("trackOrder.alertCancelFail"));
    } finally {
      setCancelling(false);
    }
  };

  const handleChangeToCod = async () => {
    if (!orderId) return;
    if (
      !confirm(
        t("trackOrder.confirmChangeToCod")
      )
    )
      return;

    try {
      setLoading(true);
      await orderAPI.changeToCod(orderId);
      alert(t("trackOrder.alertChangeCodSuccess"));
      fetchOrderDetails();
    } catch (err: any) {
      console.error(err);
      alert(
        err?.response?.data?.message ||
          t("trackOrder.alertChangeCodFail")
      );
    } finally {
      setLoading(false);
    }
  };

  const [cancellingReturn, setCancellingReturn] = useState(false);
  const handleCancelReturn = async () => {
    if (!confirm(t("trackOrder.confirmCancelReturn"))) return;
    try {
      setCancellingReturn(true);
      await orderAPI.cancelReturnRequest(orderId);
      alert(t("trackOrder.alertCancelReturnSuccess"));
      fetchOrderDetails();
    } catch (err: any) {
      alert(err.response?.data?.message || t("trackOrder.alertCancelReturnFail"));
    } finally {
      setCancellingReturn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-yellow-600 animate-spin" />
          <p className="text-gray-500 font-medium">{t("label.loading") || "Loading order details..."}</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900">{t("trackOrder.notFound")}</h2>
          <p className="text-gray-500 text-sm">{error || t("trackOrder.notFoundDesc")}</p>
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-sm text-yellow-600 font-semibold hover:underline"
          >
            <ArrowLeft size={16} /> {t("trackOrder.backToHistory")}
          </Link>
        </div>
      </div>
    );
  }

  // Helper to extract timestamp for status logs
  const getLogTime = (statusName: string) => {
    const log = order.statusLogs?.find((l: any) => l.newStatus === statusName);
    if (!log) return null;
    return new Date(log.createdAt).toLocaleDateString(
      t("language.english") === "English" ? "en-US" : "vi-VN",
      {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const steps = [
    { key: "pending", label: t("status.pending"), icon: Clock },
    { key: "confirmed", label: t("status.confirmed"), icon: ShieldCheck },
    { key: "shipping", label: t("status.shipping"), icon: Truck },
    { key: "delivered", label: t("status.delivered"), icon: PackageCheck },
  ];

  const currentStatusIndex = steps.findIndex((s) => s.key === order.status);
  const isTerminalState = ["cancelled", "refunded"].includes(order.status);

  return (
    <div className="min-h-screen bg-[#efefef] py-10 px-4 lg:px-10">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* BACK ACTION */}
        <div className="flex items-center justify-between">
          <Link href="/orders" className="flex items-center gap-2 text-gray-600 hover:text-yellow-600 transition font-medium">
            <ArrowLeft size={18} /> {t("trackOrder.orderHistory")}
          </Link>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{t("trackOrder.orderIdLabel")}</span>
            <span className="font-bold text-gray-900">#ORD-{order.id}</span>
          </div>
        </div>

        {/* STATUS BANNER */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("trackOrder.currentStatus")}</span>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold uppercase ${
                order.status === "delivered" ? "text-green-600" :
                order.status === "cancelled" ? "text-red-500" :
                order.status === "shipping" ? "text-blue-500" :
                order.status === "refunded" ? "text-purple-600" :
                ["return_requested", "return_approved", "product_received", "refund_processing"].includes(order.status) ? "text-orange-500" :
                "text-yellow-600"
              }`}>
                {t(`status.${order.status}`) || order.status}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              {t("trackOrder.placedOn").replace(
                "{date}",
                new Date(order.created_at).toLocaleDateString(
                  t("language.english") === "English" ? "en-US" : "vi-VN",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )
              )}
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
                  {t("trackOrder.cancelOrder")}
                </button>

                {order.paymentMethod === "qr" && order.paymentId && (
                  <>
                    <Link
                      href={`/checkout/payment?paymentId=${order.paymentId}`}
                      className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition flex items-center justify-center"
                    >
                      {t("trackOrder.payQr")}
                    </Link>
                    <button
                      onClick={handleChangeToCod}
                      className="px-6 py-3 rounded-2xl border border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white font-bold text-xs transition"
                    >
                      {t("trackOrder.changeToCod")}
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
                    <Undo2 size={16} /> {t("trackOrder.requestReturn")}
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
                {t("trackOrder.cancelReturn")}
              </button>
            )}
          </div>
        </div>

        {/* BANNERS */}
        {order.status === "return_rejected" && returnReq && (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-6 flex gap-4 items-start shadow-sm animate-fadeIn">
            <XCircle className="w-8 h-8 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-800 text-lg">{t("trackOrder.returnRejectedTitle")}</h3>
              {returnReq.rejectionReason && (
                <p className="text-sm text-red-700 mt-1">
                  {t("trackOrder.rejectionReasonLabel")} <span className="font-semibold text-red-900">{returnReq.rejectionReason}</span>
                </p>
              )}
              <p className="text-xs text-red-500 mt-2 font-medium">
                {t("trackOrder.returnRejectedDesc")}
              </p>
            </div>
          </div>
        )}

        {order.status === "refunded" && returnReq && (
          <div className="bg-green-50 border border-green-200 rounded-3xl p-6 flex gap-4 items-start shadow-sm animate-fadeIn">
            <CheckCircle className="w-8 h-8 text-green-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-green-800 text-lg">{t("trackOrder.returnSuccessTitle")}</h3>
              <p className="text-sm text-green-700 mt-1">
                {t("trackOrder.refundProcessedDesc")}
              </p>
              <div className="mt-3 text-xs text-green-600 bg-white/50 border border-green-200/50 rounded-xl p-3 space-y-1">
                {returnReq.refundMethod && <p><span className="font-bold text-gray-700">{t("trackOrder.refundMethodLabel")}</span> {returnReq.refundMethod}</p>}
                {returnReq.refundTransactionId && <p><span className="font-bold text-gray-700">{t("trackOrder.refundTxnLabel")}</span> <span className="font-mono bg-green-200/30 px-1.5 py-0.5 rounded">{returnReq.refundTransactionId}</span></p>}
                {returnReq.refundedAt && <p><span className="font-bold text-gray-700">{t("trackOrder.refundTimeLabel")}</span> {new Date(returnReq.refundedAt).toLocaleString(t("language.english") === "English" ? "en-US" : "vi-VN")}</p>}
              </div>
            </div>
          </div>
        )}

        {/* DYNAMIC TIMELINE */}
        <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
          <h3 className="font-bold text-gray-800 text-lg mb-6 text-center md:text-left">{t("trackOrder.timelineTitle")}</h3>
          <div className="relative border-l border-gray-200 pl-6 space-y-6 text-sm py-1">
            {order.statusLogs && order.statusLogs.length > 0 ? (
              [...order.statusLogs]
                .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                .map((log: any, idx: number) => {
                  const getStatusLabel = (status: string) => {
                    if (!status) return "";
                    return t(`status.${status}.log`) || status;
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
                          {new Date(log.createdAt).toLocaleString(t("language.english") === "English" ? "en-US" : "vi-VN")}
                        </span>
                      </div>
                    </div>
                  );
                })
            ) : (
              /* Fallback for legacy orders without status logs */
              <div className="relative">
                <div className="absolute -left-[30px] top-1 w-3.5 h-3.5 rounded-full bg-yellow-500 border-2 border-white shadow-sm" />
                <p className="font-bold text-gray-800">{t("trackOrder.timelineFallbackStatus").replace("{status}", t(`status.${order.status}`) || order.status)}</p>
                <p className="text-xs text-gray-400 mt-1">{t("trackOrder.timelineFallbackDesc").replace("{time}", new Date(order.created_at).toLocaleString(t("language.english") === "English" ? "en-US" : "vi-VN"))}</p>
              </div>
            )}
          </div>
        </div>

        {/* RETURN INFORMATION CARD */}
        {returnReq && (
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <Undo2 className="text-orange-500 w-5 h-5" />
              <h3 className="font-bold text-gray-800">{t("trackOrder.returnRequestDetailsTitle")}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
              <div className="space-y-2">
                <p>
                  <span className="font-medium text-gray-800">{t("trackOrder.returnStatusLabel")}</span> 
                  <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    returnReq.status === "return_requested" ? "bg-orange-50 text-orange-700 border-orange-100" :
                    returnReq.status === "return_approved" ? "bg-blue-50 text-blue-700 border-blue-100" :
                    returnReq.status === "product_received" ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                    returnReq.status === "refund_processing" ? "bg-purple-50 text-purple-700 border-purple-100" :
                    returnReq.status === "refunded" ? "bg-green-50 text-green-700 border-green-100" :
                    returnReq.status === "return_rejected" ? "bg-red-50 text-red-700 border-red-100" :
                    "bg-gray-50 text-gray-500 border-gray-100"
                  }`}>
                    {returnReq.status === "return_requested" && t("returnReqStatus.pendingApproval")}
                    {returnReq.status === "return_approved" && t("returnReqStatus.approvedWaiting")}
                    {returnReq.status === "product_received" && t("status.product_received")}
                    {returnReq.status === "refund_processing" && t("status.refund_processing")}
                    {returnReq.status === "refunded" && t("status.refunded")}
                    {returnReq.status === "return_rejected" && t("status.return_rejected")}
                    {returnReq.status === "return_cancelled" && t("status.return_cancelled")}
                  </span>
                </p>
                <p><span className="font-medium text-gray-800">{t("trackOrder.returnReasonLabel")}</span> {returnReq.reason}</p>
                {returnReq.rejectionReason && (
                  <p className="text-red-650"><span className="font-medium text-red-800">{t("trackOrder.rejectionReasonLabel")}</span> {returnReq.rejectionReason}</p>
                )}
                {returnReq.createdAt && (
                  <p><span className="font-medium text-gray-800">{t("trackOrder.returnDateLabel")}</span> {new Date(returnReq.createdAt).toLocaleString(t("language.english") === "English" ? "en-US" : "vi-VN")}</p>
                )}
              </div>
 
              <div className="space-y-3">
                {returnReq.imageProof && (
                  <div className="space-y-1">
                    <span className="font-medium text-gray-800 block">{t("trackOrder.returnProofLabel")}</span>
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
                    <p className="font-bold text-gray-800 text-xs">{t("trackOrder.refundDetailsTitle")}</p>
                    {returnReq.refundMethod && <p><span className="font-medium text-gray-700">{t("trackOrder.refundMethodLabel")}</span> {returnReq.refundMethod}</p>}
                    {returnReq.refundTransactionId && <p><span className="font-medium text-gray-700">{t("trackOrder.refundTxnLabel")}</span> <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs text-gray-800">{returnReq.refundTransactionId}</span></p>}
                    {returnReq.refundedAt && <p><span className="font-medium text-gray-700">{t("trackOrder.refundTimeLabel")}</span> {new Date(returnReq.refundedAt).toLocaleString(t("language.english") === "English" ? "en-US" : "vi-VN")}</p>}
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
              <h3 className="font-bold text-gray-800">{t("trackOrder.shippingInfoTitle")}</h3>
            </div>
            
            {order.shippingAddress ? (
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-medium text-gray-800">{t("trackOrder.receiverLabel")}</span> {order.shippingAddress.receiverName}</p>
                <p><span className="font-medium text-gray-800">{t("trackOrder.phoneLabel")}</span> {order.shippingAddress.receiverPhone}</p>
                <p><span className="font-medium text-gray-800">{t("trackOrder.addressLabel")}</span> {order.shippingAddress.detail}, {order.shippingAddress.province}</p>
                {order.trackingNumber && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between text-blue-700">
                    <div>
                      <span className="text-[10px] block font-semibold uppercase tracking-wider text-blue-500">{t("trackOrder.trackingNumberLabel")}</span>
                      <span className="font-bold text-sm tracking-wider font-mono">{order.trackingNumber}</span>
                    </div>
                    {order.estimatedDeliveryDate && (
                      <div className="text-right">
                        <span className="text-[10px] block font-semibold uppercase text-blue-500">{t("trackOrder.estimatedDeliveryLabel")}</span>
                        <span className="text-xs font-semibold">{new Date(order.estimatedDeliveryDate).toLocaleDateString(t("language.english") === "English" ? "en-US" : "vi-VN")}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">{t("trackOrder.shippingNotFound")}</p>
            )}
          </div>
 
          {/* PAYMENT INFO */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b">
              <CreditCard className="text-yellow-600 w-5 h-5" />
              <h3 className="font-bold text-gray-800">{t("trackOrder.paymentMethodTitle")}</h3>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-medium text-gray-800">{t("trackOrder.paymentMethodLabel")}</span> <span className="uppercase font-semibold">{order.paymentMethod}</span></p>
              <p><span className="font-medium text-gray-800">{t("trackOrder.paymentStatusLabel")}</span> 
                <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  order.paymentStatus === "paid" ? "bg-green-100 text-green-700" :
                  order.paymentStatus === "refunded" ? "bg-purple-100 text-purple-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>
                  {order.paymentStatus === "paid" && t("paymentStatus.paid")}
                  {order.paymentStatus === "pending" && t("paymentStatus.pending")}
                  {order.paymentStatus === "failed" && t("paymentStatus.failed")}
                  {order.paymentStatus === "refunded" && t("paymentStatus.refunded")}
                </span>
              </p>
              {returnReq && returnReq.refundedAt && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-xs text-purple-700 bg-purple-50/50 p-3 rounded-2xl">
                  <p className="font-bold text-purple-800 uppercase tracking-wider text-[10px]">{t("trackOrder.refundDetailsTitle")}</p>
                  <p><span className="font-medium text-gray-700">{t("trackOrder.refundMethodLabel")}</span> {returnReq.refundMethod}</p>
                  <p><span className="font-medium text-gray-700">{t("trackOrder.refundTxnLabel")}</span> <span className="font-mono bg-purple-100/50 px-1.5 py-0.5 rounded">{returnReq.refundTransactionId}</span></p>
                  <p><span className="font-medium text-gray-700">{t("trackOrder.refundTimeLabel")}</span> {new Date(returnReq.refundedAt).toLocaleString(t("language.english") === "English" ? "en-US" : "vi-VN")}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ITEMS LIST */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b">
            <FileText className="text-yellow-600 w-5 h-5" />
            <h3 className="font-bold text-gray-800">{t("trackOrder.productDetailsTitle")}</h3>
          </div>

          <div className="divide-y divide-gray-100">
            {order.items?.map((item: any) => (
              <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-16 bg-amber-50/50 rounded-xl border flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                    {item.productImage ? (
                      <img
                        src={getProofUrl(item.productImage)}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-yellow-700/60" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 line-clamp-1">{item.productName}</h4>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{t("trackOrder.quantityLabel")} {item.quantity}</span>
                      {order.status === "delivered" && (
                        <button
                          onClick={() => {
                            setSelectedProduct({ id: item.productId, name: item.productName });
                            setIsReviewOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-semibold transition hover:underline"
                        >
                          <MessageSquare size={13} /> {t("trackOrder.writeReview")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                  <span className="text-xs text-gray-400">{formatPrice(item.price)}{t("trackOrder.each")}</span>
                </div>
              </div>
            ))}
          </div>

          {/* TOTALS SUMMARY */}
          <div className="pt-4 border-t space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>{t("trackOrder.subtotal")}</span>
              <span className="font-semibold text-gray-900">{formatPrice(order.subtotalAmount || order.totalAmount)}</span>
            </div>
            
            <div className="flex justify-between">
              <span>{t("trackOrder.shippingFee")}</span>
              <span className="font-semibold text-gray-900">+{formatPrice(order.shippingFee ?? 0)}</span>
            </div>

            {order.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>{t("trackOrder.discountApplied")}</span>
                <span className="font-semibold">-{formatPrice(order.discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between pt-3 border-t text-base font-bold text-gray-900">
              <span>{t("trackOrder.totalAmount")}</span>
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
