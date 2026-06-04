"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Eye,
  Truck,
  Loader2,
  X,
  AlertTriangle,
  Calendar,
  ClipboardList,
  Check,
  Undo2,
  FileImage,
  ShieldCheck,
  DollarSign,
  History,
  Clock,
  ArrowRight,
  Trash2
} from "lucide-react";
import { adminAPI, orderAPI } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const { formatPrice } = usePreferences();

  // Status Change Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Return Workflow States
  const [selectedOrderReturn, setSelectedOrderReturn] = useState<any>(null);
  const [loadingReturn, setLoadingReturn] = useState(false);
  const [isCompletingRefund, setIsCompletingRefund] = useState(false);
  const [refundMethod, setRefundMethod] = useState("Bank Transfer");
  const [refundTxnId, setRefundTxnId] = useState("");

  const returnStatuses = [
    "return_requested",
    "return_approved",
    "product_received",
    "refund_processing",
    "refunded",
    "return_rejected",
    "return_cancelled"
  ];

  useEffect(() => {
    fetchOrdersList();
  }, []);

  const fetchOrdersList = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getProofUrl = (path?: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL.replace("/api", "") 
      : "http://localhost:3001";
    return baseUrl + path;
  };

  const fetchSingleOrderReturn = async (orderId: number) => {
    try {
      setLoadingReturn(true);
      const ret = await orderAPI.getOrderReturn(orderId);
      setSelectedOrderReturn(ret || null);
    } catch (err) {
      console.error("Failed to fetch order return details:", err);
      setSelectedOrderReturn(null);
    } finally {
      setLoadingReturn(false);
    }
  };

  const handleOpenStatusModal = (order: any) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setTrackingNumber(order.trackingNumber || "");
    
    if (order.estimatedDeliveryDate) {
      const date = new Date(order.estimatedDeliveryDate);
      const formattedDate = date.toISOString().split("T")[0];
      setEstimatedDeliveryDate(formattedDate);
    } else {
      setEstimatedDeliveryDate("");
    }

    setNote("");
    setError(null);
    setIsModalOpen(true);
    setIsCompletingRefund(false);
    setRefundTxnId("");

    if (returnStatuses.includes(order.status)) {
      fetchSingleOrderReturn(order.id);
    } else {
      setSelectedOrderReturn(null);
    }
  };

  const refreshAfterReturnAction = async (orderId: number) => {
    try {
      const data = await adminAPI.getOrders();
      setOrders(data);
      const updatedOrder = data.find((o: any) => o.id === orderId);
      if (updatedOrder) {
        setSelectedOrder(updatedOrder);
        setNewStatus(updatedOrder.status);
      }
    } catch (err) {
      console.error("Failed to refresh orders list:", err);
    }
    await fetchSingleOrderReturn(orderId);
  };

  const handleApproveReturn = async (returnId: number) => {
    if (!confirm("Xác nhận duyệt yêu cầu trả hàng này?")) return;
    try {
      setSubmitting(true);
      setError(null);
      await adminAPI.approveReturn(returnId);
      alert("Đã duyệt trả hàng thành công!");
      await refreshAfterReturnAction(selectedOrder.id);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Không thể duyệt trả hàng.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectReturn = async (returnId: number) => {
    const reason = prompt("Vui lòng nhập lý do từ chối trả hàng:");
    if (reason === null) return;
    if (!reason.trim()) {
      alert("Lý do từ chối không được để trống.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await adminAPI.rejectReturn(returnId, reason.trim());
      alert("Đã từ chối trả hàng thành công!");
      await refreshAfterReturnAction(selectedOrder.id);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Không thể từ chối trả hàng.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkReceived = async (returnId: number) => {
    if (!confirm("Xác nhận đã nhận sản phẩm hoàn trả tại kho?")) return;
    try {
      setSubmitting(true);
      setError(null);
      await adminAPI.markReturnReceived(returnId);
      alert("Đã xác nhận nhận hàng tại kho!");
      await refreshAfterReturnAction(selectedOrder.id);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Không thể cập nhật trạng thái nhận hàng.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartRefund = async (returnId: number) => {
    if (!confirm("Bắt đầu xử lý hoàn tiền cho khách hàng?")) return;
    try {
      setSubmitting(true);
      setError(null);
      await adminAPI.startReturnRefund(returnId);
      alert("Đã chuyển trạng thái sang Đang xử lý hoàn tiền!");
      await refreshAfterReturnAction(selectedOrder.id);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Không thể bắt đầu xử lý hoàn tiền.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderReturn) return;
    try {
      setSubmitting(true);
      setError(null);
      await adminAPI.completeReturnRefund(selectedOrderReturn.id, {
        refundMethod,
        refundTransactionId: refundTxnId,
      });
      alert("Đã hoàn tất hoàn tiền thành công!");
      setIsCompletingRefund(false);
      await refreshAfterReturnAction(selectedOrder.id);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Không thể hoàn tất hoàn tiền.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      setSubmitting(true);
      setError(null);
      await adminAPI.updateOrderStatus(selectedOrder.id, {
        status: newStatus,
        trackingNumber: trackingNumber.trim() || undefined,
        estimatedDeliveryDate: estimatedDeliveryDate || undefined,
        note: note.trim() || undefined,
      });

      alert("Cập nhật trạng thái đơn hàng thành công!");
      setIsModalOpen(false);
      fetchOrdersList();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Không thể cập nhật trạng thái đơn hàng.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm(`Xác nhận xóa vĩnh viễn đơn hàng #ORD-${orderId}? Hành động này sẽ loại bỏ đơn hàng khỏi hệ thống và không thể hoàn tác.`)) return;
    try {
      setLoading(true);
      await adminAPI.deleteOrder(orderId);
      alert("Xóa đơn hàng thành công!");
      fetchOrdersList();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Không thể xóa đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const orderIdStr = `#ORD-${o.id}`;
    const buyerName = o.user?.fullName || o.user?.username || "";
    const matchesSearch = orderIdStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      buyerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatusFilter === "all" || o.status === selectedStatusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* FILTER & SEARCH ROW */}
      <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã đơn hoặc người mua..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-amber-500 transition placeholder:text-gray-400"
            />
          </div>
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="rounded-2xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-amber-500 transition text-gray-600 font-semibold"
          >
            <option value="all">Tất cả Trạng Thái</option>
            <option value="pending">Chờ Thanh Toán (Pending)</option>
            <option value="confirmed">Đã Xác Nhận (Confirmed)</option>
            <option value="shipping">Đang Giao Hàng (Shipping)</option>
            <option value="delivered">Đã Giao Thành Công (Delivered)</option>
            <option value="cancelled">Đã Hủy (Cancelled)</option>
            <option value="return_requested">Yêu cầu trả hàng (Return Requested)</option>
            <option value="return_approved">Đã duyệt trả hàng (Return Approved)</option>
            <option value="product_received">Đã nhận hàng kho (Product Received)</option>
            <option value="refund_processing">Đang hoàn tiền (Refund Processing)</option>
            <option value="refunded">Đã hoàn tiền (Refunded)</option>
            <option value="return_rejected">Từ chối trả hàng (Return Rejected)</option>
            <option value="return_cancelled">Đã hủy trả hàng (Return Cancelled)</option>
          </select>
        </div>
      </div>

      {/* ORDERS LIST CARD */}
      <div className="bg-white border border-gray-150 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-40">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-24 text-gray-400 font-medium">
            Không tìm thấy đơn hàng nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-150 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="px-6 py-4">Mã đơn</th>
                  <th className="px-6 py-4">Ngày đặt</th>
                  <th className="px-6 py-4">Khách hàng</th>
                  <th className="px-6 py-4">Sản phẩm</th>
                  <th className="px-6 py-4 text-right">Tổng tiền</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-center">Xử lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/30 transition">
                    <td className="px-6 py-4 font-bold text-gray-900">#ORD-{o.id}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(o.created_at).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      {o.user?.fullName || o.user?.username || "Guest"}
                    </td>
                    <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                      {o.items?.map((item: any) => `${item.productName} (x${item.quantity})`).join(", ")}
                    </td>
                    <td className="px-6 py-4 text-right font-extrabold text-amber-600">
                      {formatPrice(o.totalAmount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                        o.status === "delivered" ? "bg-green-50 text-green-700 border border-green-100" :
                        o.status === "cancelled" ? "bg-red-50 text-red-700 border border-red-100" :
                        o.status === "shipping" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                        o.status === "refunded" ? "bg-green-50 text-green-700 border border-green-100" :
                        o.status === "return_requested" ? "bg-orange-50 text-orange-700 border border-orange-100" :
                        o.status === "return_approved" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                        o.status === "product_received" ? "bg-indigo-50 text-indigo-700 border border-indigo-100" :
                        o.status === "refund_processing" ? "bg-purple-50 text-purple-700 border border-purple-100" :
                        o.status === "return_rejected" ? "bg-red-50 text-red-700 border border-red-100" :
                        o.status === "return_cancelled" ? "bg-gray-50 text-gray-500 border border-gray-100" :
                        "bg-yellow-50 text-yellow-700 border border-yellow-100"
                      }`}>
                        {o.status === "return_requested" && "Chờ duyệt trả"}
                        {o.status === "return_approved" && "Đã duyệt trả"}
                        {o.status === "product_received" && "Đã nhận hàng kho"}
                        {o.status === "refund_processing" && "Đang hoàn tiền"}
                        {o.status === "refunded" && "Đã hoàn tiền"}
                        {o.status === "return_rejected" && "Từ chối trả hàng"}
                        {o.status === "return_cancelled" && "Đã hủy trả"}
                        {!returnStatuses.includes(o.status) && o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenStatusModal(o)}
                          className="px-3 py-1.5 bg-gray-50 hover:bg-amber-500 hover:text-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 transition flex items-center gap-1"
                        >
                          <ClipboardList size={13} /> Cập nhật
                        </button>
                        {o.status === "cancelled" && (
                          <button
                            onClick={() => handleDeleteOrder(o.id)}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 rounded-xl text-xs font-bold text-red-600 transition flex items-center gap-1"
                          >
                            <Trash2 size={13} /> Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* UPDATE STATUS MODAL */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-amber-50/50">
              <div>
                <h3 className="font-extrabold text-gray-900 text-base">
                  {returnStatuses.includes(selectedOrder.status) ? "Xử lý Trả Hàng & Hoàn Tiền" : "Cập Nhật Trạng Thái Đơn Hàng"}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Mã đơn hàng: #ORD-{selectedOrder.id}</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[75vh]">
              {error && (
                <div className="mx-6 mt-4 p-3 text-xs bg-red-50 text-red-600 border border-red-100 rounded-xl flex items-center gap-2">
                  <AlertTriangle size={14} />
                  <span>{error}</span>
                </div>
              )}

              {returnStatuses.includes(selectedOrder.status) ? (
                /* ========================================================
                   RETURN WORKFLOW MODE
                   ======================================================== */
                <div className="p-6 space-y-5">
                  {loadingReturn ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                      <span className="ml-2 text-xs text-gray-400">Đang tải thông tin trả hàng...</span>
                    </div>
                  ) : selectedOrderReturn ? (
                    <div className="space-y-4">
                      {/* Return Request Info Details */}
                      <div className="bg-amber-50/40 border border-amber-100 rounded-2xl p-4 space-y-2.5 text-xs text-gray-600">
                        <h4 className="font-extrabold text-gray-800 text-xs uppercase tracking-wider">Thông tin yêu cầu trả hàng</h4>
                        <p><span className="font-bold text-gray-700">Lý do:</span> {selectedOrderReturn.reason}</p>
                        <p>
                          <span className="font-bold text-gray-700">Ngày yêu cầu:</span>{" "}
                          {new Date(selectedOrderReturn.createdAt).toLocaleString("vi-VN")}
                        </p>
                        
                        {selectedOrderReturn.imageProof ? (
                          <div className="space-y-1">
                            <span className="font-bold text-gray-700">Minh chứng hình ảnh:</span>
                            <a
                              href={getProofUrl(selectedOrderReturn.imageProof)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 border border-blue-150 px-2 py-0.5 rounded font-bold hover:bg-blue-100 transition block w-fit"
                            >
                              <FileImage size={10} /> Xem ảnh proof
                            </a>
                            <div className="mt-1 w-32 h-20 rounded border overflow-hidden relative bg-gray-50">
                              <img
                                src={getProofUrl(selectedOrderReturn.imageProof)}
                                alt="Return proof"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fail-safe for Base64 or corrupted image path
                                  (e.target as any).src = selectedOrderReturn.imageProof;
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <p><span className="font-bold text-gray-700">Minh chứng hình ảnh:</span> Không có minh chứng</p>
                        )}

                        {selectedOrderReturn.rejectionReason && (
                          <div className="mt-2 p-2.5 bg-red-50 border border-red-100 rounded-xl text-red-700">
                            <span className="font-bold text-red-800">Lý do từ chối:</span> {selectedOrderReturn.rejectionReason}
                          </div>
                        )}

                        {/* Refund Details */}
                        {(selectedOrderReturn.refundMethod || selectedOrderReturn.refundTransactionId) && (
                          <div className="mt-2 p-2.5 bg-purple-50/50 border border-purple-100 rounded-xl text-purple-700 space-y-1">
                            <span className="font-bold text-purple-800 block">Thông tin hoàn tiền</span>
                            <p><span className="font-semibold text-gray-700">Phương thức:</span> {selectedOrderReturn.refundMethod}</p>
                            <p><span className="font-semibold text-gray-700">Mã giao dịch:</span> <span className="font-mono bg-purple-100/50 px-1 py-0.5 rounded">{selectedOrderReturn.refundTransactionId}</span></p>
                            {selectedOrderReturn.refundedAt && (
                              <p><span className="font-semibold text-gray-700">Ngày hoàn tất:</span> {new Date(selectedOrderReturn.refundedAt).toLocaleString("vi-VN")}</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* State Machine Transition Actions */}
                      <div className="border-t border-gray-100 pt-4 space-y-3">
                        <h4 className="font-extrabold text-gray-800 text-xs uppercase tracking-wider">Thao tác quy trình đổi trả</h4>
                        
                        {!isCompletingRefund ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedOrderReturn.status === "return_requested" && (
                              <>
                                <button
                                  type="button"
                                  disabled={submitting}
                                  onClick={() => handleApproveReturn(selectedOrderReturn.id)}
                                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-xs font-bold rounded-xl transition flex items-center gap-1"
                                >
                                  Chấp Nhận Trả Hàng
                                </button>
                                <button
                                  type="button"
                                  disabled={submitting}
                                  onClick={() => handleRejectReturn(selectedOrderReturn.id)}
                                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-xs font-bold rounded-xl transition flex items-center gap-1"
                                >
                                  Từ Chối Trả Hàng
                                </button>
                              </>
                            )}

                            {selectedOrderReturn.status === "return_approved" && (
                              <button
                                type="button"
                                disabled={submitting}
                                onClick={() => handleMarkReceived(selectedOrderReturn.id)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-bold rounded-xl transition flex items-center gap-1"
                              >
                                Xác Nhận Nhận Được Hàng Kho
                              </button>
                            )}

                            {selectedOrderReturn.status === "product_received" && (
                              <button
                                type="button"
                                disabled={submitting}
                                onClick={() => handleStartRefund(selectedOrderReturn.id)}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-bold rounded-xl transition flex items-center gap-1"
                              >
                                Bắt Đầu Xử Lý Hoàn Tiền
                              </button>
                            )}

                            {selectedOrderReturn.status === "refund_processing" && (
                              <button
                                type="button"
                                disabled={submitting}
                                onClick={() => {
                                  setRefundMethod("Bank Transfer");
                                  setRefundTxnId("");
                                  setIsCompletingRefund(true);
                                }}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-xs font-bold rounded-xl transition flex items-center gap-1"
                              >
                                Tiến Hành Hoàn Tất Hoàn Tiền
                              </button>
                            )}

                            {["refunded", "return_rejected", "return_cancelled"].includes(selectedOrderReturn.status) && (
                              <div className="p-3 bg-gray-50 border border-gray-150 rounded-xl text-xs font-medium text-gray-500 w-full text-center">
                                Quy trình đổi trả đã kết thúc ở trạng thái:{" "}
                                <span className="font-extrabold uppercase text-amber-600">{selectedOrderReturn.status}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Refund Completion Sub-Form */
                          <form onSubmit={handleCompleteRefundSubmit} className="bg-purple-50/30 border border-purple-100 rounded-2xl p-4 space-y-4 animate-fadeIn">
                            <h5 className="text-xs font-bold text-purple-800">Nhập thông tin giao dịch hoàn tiền</h5>
                            
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Phương thức hoàn tiền *</label>
                              <select
                                value={refundMethod}
                                onChange={(e) => setRefundMethod(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold text-gray-600"
                              >
                                <option value="Bank Transfer">Chuyển khoản ngân hàng (Bank Transfer)</option>
                                <option value="Momo">Ví điện tử Momo</option>
                                <option value="ZaloPay">Ví điện tử ZaloPay</option>
                                <option value="Cash">Tiền mặt</option>
                                <option value="Other">Khác</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Mã giao dịch hoàn tiền *</label>
                              <input
                                type="text"
                                required
                                placeholder="Ví dụ: VCB12345678"
                                value={refundTxnId}
                                onChange={(e) => setRefundTxnId(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                              />
                            </div>

                            <div className="flex gap-2 pt-1">
                              <button
                                type="button"
                                disabled={submitting}
                                onClick={() => setIsCompletingRefund(false)}
                                className="flex-1 py-2 text-xs font-bold text-gray-500 bg-white hover:bg-gray-50 border rounded-xl transition"
                              >
                                Quay lại
                              </button>
                              <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-purple-100"
                              >
                                {submitting && <Loader2 size={12} className="animate-spin" />}
                                Xác nhận hoàn tất
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-xs bg-red-50 text-red-600 border border-red-100 rounded-xl text-center">
                      Không tìm thấy chi tiết yêu cầu trả hàng tương ứng.
                    </div>
                  )}

                  {/* Audit Timeline */}
                  <div className="border-t border-gray-100 pt-4 space-y-3">
                    <h4 className="font-extrabold text-gray-800 text-xs uppercase tracking-wider">Lịch sử trạng thái đơn hàng</h4>
                    <div className="relative border-l border-gray-205 pl-4 space-y-4 text-xs py-1">
                      {selectedOrder.statusLogs && selectedOrder.statusLogs.length > 0 ? (
                        [...selectedOrder.statusLogs]
                          .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                          .map((log: any, idx: number) => (
                            <div key={log.id || idx} className="relative">
                              {/* Dot */}
                              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white" />
                              <div className="flex justify-between items-start gap-4">
                                <div>
                                  <p className="font-bold text-gray-800">
                                    {log.oldStatus} <span className="font-normal text-gray-400 font-mono">→</span> {log.newStatus}
                                  </p>
                                  {log.note && <p className="text-gray-500 italic mt-0.5">"{log.note}"</p>}
                                </div>
                                <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                  {new Date(log.createdAt).toLocaleString("vi-VN")}
                                </span>
                              </div>
                            </div>
                          ))
                      ) : (
                        <p className="text-gray-400 italic">Chưa ghi nhận nhật ký trạng thái.</p>
                      )}
                    </div>
                  </div>

                  {/* Close button at footer */}
                  <div className="flex justify-end pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-semibold text-gray-600 transition"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              ) : (
                /* ========================================================
                   STANDARD ORDER STATUS UPDATE MODE
                   ======================================================== */
                <form onSubmit={handleUpdateStatusSubmit} className="p-6 space-y-4">
                  {/* Status Selector */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái mới *</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition text-gray-600 font-semibold"
                    >
                      <option value="pending">Chờ Thanh Toán (Pending)</option>
                      <option value="confirmed">Đã Xác Nhận (Confirmed)</option>
                      <option value="shipping">Đang Giao Hàng (Shipping)</option>
                      <option value="delivered">Đã Giao Thành Công (Delivered)</option>
                      <option value="cancelled">Hủy Đơn Hàng (Cancelled)</option>
                    </select>
                  </div>

                  {/* Shipping Details */}
                  {["shipping", "delivered"].includes(newStatus) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
                      {/* Tracking Number */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                          <Truck size={12} /> Mã vận đơn
                        </label>
                        <input
                          type="text"
                          placeholder="Nhập mã vận đơn (GHTK, GHN...)"
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition"
                        />
                      </div>

                      {/* Estimated Delivery Date */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                          <Calendar size={12} /> Ngày giao dự kiến
                        </label>
                        <input
                          type="date"
                          value={estimatedDeliveryDate}
                          onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition text-gray-600 font-semibold"
                        />
                      </div>
                    </div>
                  )}

                  {/* Status change Note */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ghi chú lý do / Nhật ký thay đổi</label>
                    <textarea
                      rows={3}
                      placeholder="Ghi nhận nhật ký trạng thái (ví dụ: 'Admin đã nhận được thanh toán', 'Hàng bắt đầu xuất kho'...)"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition resize-none"
                    />
                  </div>

                  {/* Audit Timeline */}
                  <div className="border-t border-gray-100 pt-4 space-y-3">
                    <h4 className="font-extrabold text-gray-800 text-xs uppercase tracking-wider">Lịch sử trạng thái đơn hàng</h4>
                    <div className="relative border-l border-gray-200 pl-4 space-y-4 text-xs py-1">
                      {selectedOrder.statusLogs && selectedOrder.statusLogs.length > 0 ? (
                        [...selectedOrder.statusLogs]
                          .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                          .map((log: any, idx: number) => (
                            <div key={log.id || idx} className="relative">
                              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white" />
                              <div className="flex justify-between items-start gap-4">
                                <div>
                                  <p className="font-bold text-gray-800">
                                    {log.oldStatus} <span className="font-normal text-gray-400 font-mono">→</span> {log.newStatus}
                                  </p>
                                  {log.note && <p className="text-gray-500 italic mt-0.5">"{log.note}"</p>}
                                </div>
                                <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                  {new Date(log.createdAt).toLocaleString("vi-VN")}
                                </span>
                              </div>
                            </div>
                          ))
                      ) : (
                        <p className="text-gray-400 italic">Chưa ghi nhận nhật ký trạng thái.</p>
                      )}
                    </div>
                  </div>

                  {/* Modal Actions */}
                  <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      disabled={submitting}
                      className="px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-semibold text-gray-600 transition"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white text-sm font-semibold transition flex items-center gap-1.5"
                    >
                      {submitting && <Loader2 size={16} className="animate-spin" />}
                      Lưu thay đổi
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
