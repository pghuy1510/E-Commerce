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
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminPromptModal from "@/components/admin/AdminPromptModal";
import AdminConfirmModal from "@/components/admin/AdminConfirmModal";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const { formatPrice, language } = usePreferences();

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
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [promptConfig, setPromptConfig] = useState<{
    type: "reject" | "create_on_behalf";
    id: number;
    title: string;
    placeholder: string;
    required: boolean;
  } | null>(null);
  const [loadingReturn, setLoadingReturn] = useState(false);
  const [isCompletingRefund, setIsCompletingRefund] = useState(false);
  const [refundMethod, setRefundMethod] = useState("Bank Transfer");
  const [refundTxnId, setRefundTxnId] = useState("");

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    type?: "primary" | "danger" | "warning";
    onConfirm: () => void;
  } | null>(null);

  const triggerConfirm = (title: string, message: string, onConfirm: () => void, type: "primary" | "danger" | "warning" = "primary") => {
    setConfirmConfig({ title, message, onConfirm, type });
    setIsConfirmOpen(true);
  };

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

  const handleApproveReturn = (returnId: number) => {
    triggerConfirm(
      language === "vi" ? "Duyệt Yêu Cầu Trả Hàng" : "Approve Return Request",
      language === "vi" ? "Xác nhận duyệt yêu cầu trả hàng này?" : "Are you sure you want to approve this return request?",
      async () => {
        try {
          setSubmitting(true);
          setError(null);
          await adminAPI.approveReturn(returnId);
          alert(language === "vi" ? "Đã duyệt trả hàng thành công!" : "Return request approved successfully!");
          await refreshAfterReturnAction(selectedOrder.id);
        } catch (err: any) {
          console.error(err);
          setError(err?.response?.data?.message || (language === "vi" ? "Không thể duyệt trả hàng." : "Cannot approve return request."));
        } finally {
          setSubmitting(false);
        }
      }
    );
  };

  const handleRejectReturn = (returnId: number) => {
    setPromptConfig({
      type: "reject",
      id: returnId,
      title: language === "vi" ? "Từ Chối Yêu Cầu Trả Hàng" : "Reject Return Request",
      placeholder: language === "vi" ? "Vui lòng nhập lý do từ chối trả hàng (Bắt buộc)..." : "Please enter a reason for rejecting the return (Required)...",
      required: true
    });
    setIsPromptOpen(true);
  };

  const handleMarkReceived = (returnId: number) => {
    triggerConfirm(
      language === "vi" ? "Xác Nhận Nhận Hàng" : "Confirm Receipt",
      language === "vi" ? "Xác nhận đã nhận sản phẩm hoàn trả tại kho?" : "Confirm that the returned items have been received at the warehouse?",
      async () => {
        try {
          setSubmitting(true);
          setError(null);
          await adminAPI.markReturnReceived(returnId);
          alert(language === "vi" ? "Đã xác nhận nhận hàng tại kho!" : "Successfully confirmed receipt at warehouse!");
          await refreshAfterReturnAction(selectedOrder.id);
        } catch (err: any) {
          console.error(err);
          setError(err?.response?.data?.message || (language === "vi" ? "Không thể cập nhật trạng thái nhận hàng." : "Failed to update receipt status."));
        } finally {
          setSubmitting(false);
        }
      }
    );
  };

  const handleStartRefund = (returnId: number) => {
    triggerConfirm(
      language === "vi" ? "Bắt Đầu Hoàn Tiền" : "Start Refund Processing",
      language === "vi" ? "Bắt đầu xử lý hoàn tiền cho khách hàng?" : "Start refund processing for the customer?",
      async () => {
        try {
          setSubmitting(true);
          setError(null);
          await adminAPI.startReturnRefund(returnId);
          alert(language === "vi" ? "Đã chuyển trạng thái sang Đang xử lý hoàn tiền!" : "Status updated to Refund Processing!");
          await refreshAfterReturnAction(selectedOrder.id);
        } catch (err: any) {
          console.error(err);
          setError(err?.response?.data?.message || (language === "vi" ? "Không thể bắt đầu xử lý hoàn tiền." : "Cannot initiate refund processing."));
        } finally {
          setSubmitting(false);
        }
      }
    );
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
      alert(language === "vi" ? "Đã hoàn tất hoàn tiền thành công!" : "Refund processed successfully!");
      setIsCompletingRefund(false);
      await refreshAfterReturnAction(selectedOrder.id);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || (language === "vi" ? "Không thể hoàn tất hoàn tiền." : "Failed to complete refund."));
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

      alert(language === "vi" ? "Cập nhật trạng thái đơn hàng thành công!" : "Order status updated successfully!");
      setIsModalOpen(false);
      fetchOrdersList();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || (language === "vi" ? "Không thể cập nhật trạng thái đơn hàng." : "Failed to update order status."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateReturnOnBehalf = () => {
    if (!selectedOrder) return;
    setPromptConfig({
      type: "create_on_behalf",
      id: selectedOrder.id,
      title: language === "vi" ? "Yêu Cầu Trả Hàng Hộ Khách" : "Request Return On Behalf",
      placeholder: language === "vi" ? "Nhập lý do trả hàng hộ khách hàng (Bắt buộc)..." : "Enter return reason on behalf of customer (Required)...",
      required: true
    });
    setIsPromptOpen(true);
  };

  const handlePromptSubmit = async (value: string) => {
    if (!promptConfig) return;
    const { type, id } = promptConfig;
    setIsPromptOpen(false);

    if (type === "reject") {
      try {
        setSubmitting(true);
        setError(null);
        await adminAPI.rejectReturn(id, value.trim());
        alert(language === "vi" ? "Đã từ chối trả hàng thành công!" : "Return request rejected successfully!");
        await refreshAfterReturnAction(selectedOrder.id);
      } catch (err: any) {
        console.error(err);
        setError(err?.response?.data?.message || (language === "vi" ? "Không thể từ chối trả hàng." : "Cannot reject return request."));
      } finally {
        setSubmitting(false);
      }
    } else if (type === "create_on_behalf") {
      try {
        setSubmitting(true);
        setError(null);
        await orderAPI.requestReturn(id, {
          reason: value.trim() + (language === "vi" ? " (Admin tạo hộ)" : " (Created by Admin)"),
        });
        alert(language === "vi" ? "Đã tạo yêu cầu trả hàng thành công!" : "Return request created successfully!");
        setIsModalOpen(false);
        fetchOrdersList();
      } catch (err: any) {
        console.error(err);
        setError(err?.response?.data?.message || (language === "vi" ? "Không thể tạo yêu cầu trả hàng." : "Cannot create return request."));
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleDeleteOrder = (orderId: number) => {
    triggerConfirm(
      language === "vi" ? "Xóa Đơn Hàng Vĩnh Viễn" : "Delete Order Permanently",
      language === "vi" ? `Xác nhận xóa vĩnh viễn đơn hàng #ORD-${orderId}? Hành động này sẽ loại bỏ đơn hàng khỏi hệ thống và không thể hoàn tác.` : `Confirm permanent deletion of order #ORD-${orderId}? This action removes the order and cannot be undone.`,
      async () => {
        try {
          setLoading(true);
          await adminAPI.deleteOrder(orderId);
          alert(language === "vi" ? "Xóa đơn hàng thành công!" : "Order deleted successfully!");
          fetchOrdersList();
        } catch (err: any) {
          console.error(err);
          alert(err?.response?.data?.message || (language === "vi" ? "Không thể xóa đơn hàng." : "Cannot delete order."));
        } finally {
          setLoading(false);
        }
      },
      "danger"
    );
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
      <div className="bg-brand-surface border border-brand-border/40 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted w-4 h-4" />
            <input
              type="text"
              placeholder={language === "vi" ? "Tìm kiếm theo mã đơn hoặc người mua..." : "Search by order ID or buyer..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-brand-border bg-transparent pl-10 pr-4 py-2.5 text-sm outline-none focus:border-brand-primary text-brand-text transition placeholder:text-brand-muted"
            />
          </div>
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="rounded-2xl border border-brand-border bg-brand-surface text-brand-text px-4 py-2.5 text-sm outline-none focus:border-brand-primary transition font-semibold"
          >
            <option value="all">{language === "vi" ? "Tất cả Trạng Thái" : "All Statuses"}</option>
            <option value="pending">{language === "vi" ? "Chờ Thanh Toán (Pending)" : "Pending Payment (Pending)"}</option>
            <option value="confirmed">{language === "vi" ? "Đã Xác Nhận (Confirmed)" : "Confirmed (Confirmed)"}</option>
            <option value="shipping">{language === "vi" ? "Đang Giao Hàng (Shipping)" : "Shipping (Shipping)"}</option>
            <option value="delivered">{language === "vi" ? "Đã Giao Thành Công (Delivered)" : "Delivered (Delivered)"}</option>
            <option value="cancelled">{language === "vi" ? "Đã Hủy (Cancelled)" : "Cancelled (Cancelled)"}</option>
            <option value="return_requested">{language === "vi" ? "Yêu cầu trả hàng (Return Requested)" : "Return Requested (Return Requested)"}</option>
            <option value="return_approved">{language === "vi" ? "Đã duyệt trả hàng (Return Approved)" : "Return Approved (Return Approved)"}</option>
            <option value="product_received">{language === "vi" ? "Đã nhận hàng kho (Product Received)" : "Product Received (Product Received)"}</option>
            <option value="refund_processing">{language === "vi" ? "Đang hoàn tiền (Refund Processing)" : "Refund Processing (Refund Processing)"}</option>
            <option value="refunded">{language === "vi" ? "Đã hoàn tiền (Refunded)" : "Refunded (Refunded)"}</option>
            <option value="return_rejected">{language === "vi" ? "Từ chối trả hàng (Return Rejected)" : "Return Rejected (Return Rejected)"}</option>
            <option value="return_cancelled">{language === "vi" ? "Đã hủy trả hàng (Return Cancelled)" : "Return Cancelled (Return Cancelled)"}</option>
          </select>
        </div>
      </div>

      {/* ORDERS LIST CARD */}
      <div className="bg-brand-surface border border-brand-border/40 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-40">
            <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <AdminEmptyState
            icon={ClipboardList}
            title={language === "vi" ? "Không tìm thấy đơn hàng nào" : "No orders found"}
            description={language === "vi" ? "Không có đơn hàng nào khớp với tìm kiếm hoặc bộ lọc trạng thái." : "No orders match your search term or status filter."}
          />
        ) : (
          <div className="overflow-x-auto relative max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-brand-surface/95 backdrop-blur-sm border-b border-brand-border/40 text-brand-muted font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.03)]">
                  <th className="px-6 py-4">{language === "vi" ? "Mã đơn" : "Order ID"}</th>
                  <th className="px-6 py-4">{language === "vi" ? "Ngày đặt" : "Order Date"}</th>
                  <th className="px-6 py-4">{language === "vi" ? "Khách hàng" : "Customer"}</th>
                  <th className="px-6 py-4">{language === "vi" ? "Sản phẩm" : "Products"}</th>
                  <th className="px-6 py-4 text-right">{language === "vi" ? "Tổng tiền" : "Total Amount"}</th>
                  <th className="px-6 py-4 text-center">{language === "vi" ? "Trạng thái" : "Status"}</th>
                  <th className="px-6 py-4 text-center">{language === "vi" ? "Xử lý" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/10">
                {filteredOrders.map((o) => {
                  const isSelected = selectedOrder?.id === o.id;
                  return (
                    <tr
                      key={o.id}
                      className={`transition-colors duration-150 ${
                        isSelected
                          ? "bg-brand-primary/10 border-l-4 border-l-brand-primary"
                          : "hover:bg-brand-bg/20 odd:bg-brand-surface even:bg-brand-bg/50"
                      }`}
                    >
                      <td className="px-6 py-4 font-black text-brand-text">#ORD-{o.id}</td>
                      <td className="px-6 py-4 text-brand-muted text-xs">
                        {new Date(o.created_at).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 font-semibold text-brand-text">
                        {o.user?.fullName || o.user?.username || (language === "vi" ? "Khách vãng lai" : "Guest")}
                      </td>
                      <td className="px-6 py-4 text-brand-muted max-w-xs truncate">
                        {o.items?.map((item: any) => `${item.productName} (x${item.quantity})`).join(", ")}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-brand-primary text-sm">
                        {formatPrice(o.totalAmount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                          o.status === "delivered" ? "bg-status-success-bg text-status-success-text border-status-success-border" :
                          o.status === "cancelled" ? "bg-status-danger-bg text-status-danger-text border-status-danger-border" :
                          o.status === "shipping" ? "bg-status-info-bg text-status-info-text border-status-info-border" :
                          o.status === "refunded" ? "bg-status-success-bg text-status-success-text border-status-success-border" :
                          o.status === "return_requested" ? "bg-status-warning-bg text-status-warning-text border-status-warning-border" :
                          o.status === "return_approved" ? "bg-status-info-bg text-status-info-text border-status-info-border" :
                          o.status === "product_received" ? "bg-status-info-bg text-status-info-text border-status-info-border" :
                          o.status === "refund_processing" ? "bg-status-warning-bg text-status-warning-text border-status-warning-border" :
                          o.status === "return_rejected" ? "bg-status-danger-bg text-status-danger-text border-status-danger-border" :
                          o.status === "return_cancelled" ? "bg-status-danger-bg text-status-danger-text border-status-danger-border" :
                          "bg-status-warning-bg text-status-warning-text border-status-warning-border"
                        }`}>
                          {o.status === "return_requested" && (language === "vi" ? "Chờ duyệt trả" : "Return Requested")}
                          {o.status === "return_approved" && (language === "vi" ? "Đã duyệt trả" : "Return Approved")}
                          {o.status === "product_received" && (language === "vi" ? "Đã nhận hàng kho" : "Product Received")}
                          {o.status === "refund_processing" && (language === "vi" ? "Đang hoàn tiền" : "Refund Processing")}
                          {o.status === "refunded" && (language === "vi" ? "Đã hoàn tiền" : "Refunded")}
                          {o.status === "return_rejected" && (language === "vi" ? "Từ chối trả hàng" : "Return Rejected")}
                          {o.status === "return_cancelled" && (language === "vi" ? "Đã hủy trả" : "Return Cancelled")}
                          {!returnStatuses.includes(o.status) && (
                            o.status === "pending" ? (language === "vi" ? "Chờ thanh toán" : "Pending") :
                            o.status === "confirmed" ? (language === "vi" ? "Đã xác nhận" : "Confirmed") :
                            o.status === "shipping" ? (language === "vi" ? "Đang giao" : "Shipping") :
                            o.status === "delivered" ? (language === "vi" ? "Đã giao" : "Delivered") :
                            o.status === "cancelled" ? (language === "vi" ? "Đã hủy" : "Cancelled") :
                            o.status
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenStatusModal(o)}
                            className="px-3 py-1.5 bg-brand-surface hover:bg-brand-primary hover:text-white border border-brand-border rounded-xl text-xs font-bold text-brand-text transition flex items-center gap-1 cursor-pointer"
                          >
                            <ClipboardList size={13} /> {language === "vi" ? "Cập nhật" : "Update"}
                          </button>
                          {o.status === "cancelled" && (
                            <button
                              onClick={() => handleDeleteOrder(o.id)}
                              className="px-3 py-1.5 bg-status-danger-bg hover:bg-red-600 hover:text-white border border-status-danger-border rounded-xl text-xs font-bold text-status-danger-text transition flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 size={13} /> {language === "vi" ? "Xóa" : "Delete"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* UPDATE STATUS MODAL */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-brand-surface rounded-3xl border border-brand-border shadow-2xl ring-1 ring-brand-border/20 w-full max-w-lg overflow-hidden animate-scaleIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border/40 bg-brand-primary-light/10">
              <div>
                <h3 className="font-extrabold text-brand-text text-base">
                  {returnStatuses.includes(selectedOrder.status) 
                    ? (language === "vi" ? "Xử lý Trả Hàng & Hoàn Tiền" : "Process Return & Refund") 
                    : (language === "vi" ? "Cập Nhật Trạng Thái Đơn Hàng" : "Update Order Status")}
                </h3>
                <p className="text-xs text-brand-muted mt-0.5">
                  {language === "vi" ? `Mã đơn hàng: #ORD-${selectedOrder.id}` : `Order ID: #ORD-${selectedOrder.id}`}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-brand-primary-light/20 text-brand-muted hover:text-brand-primary transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[75vh]">
              {error && (
                <div className="mx-6 mt-4 p-3 text-xs bg-status-danger-bg text-status-danger-text border border-status-danger-border rounded-xl flex items-center gap-2">
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
                      <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
                      <span className="ml-2 text-xs text-brand-muted">
                        {language === "vi" ? "Đang tải thông tin trả hàng..." : "Loading return details..."}
                      </span>
                    </div>
                  ) : selectedOrderReturn ? (
                    <div className="space-y-4">
                      {/* Return Request Info Details */}
                      <div className="bg-brand-primary-light/10 border border-brand-border/40 rounded-2xl p-4 space-y-2.5 text-xs text-brand-muted">
                        <h4 className="font-extrabold text-brand-text text-xs uppercase tracking-wider">
                          {language === "vi" ? "Thông tin yêu cầu trả hàng" : "Return Request Details"}
                        </h4>
                        <p><span className="font-bold text-brand-text">{language === "vi" ? "Lý do:" : "Reason:"}</span> {selectedOrderReturn.reason}</p>
                        <p>
                          <span className="font-bold text-brand-text">{language === "vi" ? "Ngày yêu cầu:" : "Requested Date:"}</span>{" "}
                          {new Date(selectedOrderReturn.createdAt).toLocaleString(language === "vi" ? "vi-VN" : "en-US")}
                        </p>
                        
                        {selectedOrderReturn.imageProof ? (
                          <div className="space-y-1">
                            <span className="font-bold text-brand-text">{language === "vi" ? "Minh chứng hình ảnh:" : "Image Proof:"}</span>
                            <a
                              href={getProofUrl(selectedOrderReturn.imageProof)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] bg-status-info-bg text-status-info-text border border-status-info-border px-2 py-0.5 rounded font-bold hover:bg-brand-primary-light/40 transition block w-fit"
                            >
                              <FileImage size={10} /> {language === "vi" ? "Xem ảnh proof" : "View proof image"}
                            </a>
                            <div className="mt-1 w-32 h-20 rounded border border-brand-border/50 overflow-hidden relative bg-brand-bg/50">
                              <img
                                src={getProofUrl(selectedOrderReturn.imageProof)}
                                alt="Return proof"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as any).src = selectedOrderReturn.imageProof;
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <p>
                            <span className="font-bold text-brand-text">{language === "vi" ? "Minh chứng hình ảnh:" : "Image Proof:"}</span>{" "}
                            {language === "vi" ? "Không có minh chứng" : "No proof provided"}
                          </p>
                        )}

                        {selectedOrderReturn.rejectionReason && (
                          <div className="mt-2 p-2.5 bg-status-danger-bg border border-status-danger-border rounded-xl text-status-danger-text">
                            <span className="font-bold text-status-danger-text">{language === "vi" ? "Lý do từ chối:" : "Rejection Reason:"}</span> {selectedOrderReturn.rejectionReason}
                          </div>
                        )}

                        {/* Refund Details */}
                        {(selectedOrderReturn.refundMethod || selectedOrderReturn.refundTransactionId) && (
                          <div className="mt-2 p-2.5 bg-status-info-bg border border-status-info-border rounded-xl text-status-info-text space-y-1">
                            <span className="font-bold text-status-info-text block">{language === "vi" ? "Thông tin hoàn tiền" : "Refund Information"}</span>
                            <p><span className="font-semibold text-brand-text font-sans">{language === "vi" ? "Phương thức:" : "Method:"}</span> {selectedOrderReturn.refundMethod}</p>
                            <p><span className="font-semibold text-brand-text font-sans">{language === "vi" ? "Mã giao dịch:" : "Transaction ID:"}</span> <span className="font-mono bg-brand-surface px-1.5 py-0.5 rounded border border-brand-border/50 text-[10px]">{selectedOrderReturn.refundTransactionId}</span></p>
                            {selectedOrderReturn.refundedAt && (
                              <p><span className="font-semibold text-brand-text font-sans">{language === "vi" ? "Ngày hoàn tất:" : "Completed Date:"}</span> {new Date(selectedOrderReturn.refundedAt).toLocaleString(language === "vi" ? "vi-VN" : "en-US")}</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* State Machine Transition Actions */}
                      <div className="border-t border-brand-border/40 pt-4 space-y-3">
                        <h4 className="font-extrabold text-brand-text text-xs uppercase tracking-wider">
                          {language === "vi" ? "Thao tác quy trình đổi trả" : "Return Process Actions"}
                        </h4>
                        
                        {!isCompletingRefund ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedOrderReturn.status === "return_requested" && (
                              <>
                                <button
                                  type="button"
                                  disabled={submitting}
                                  onClick={() => handleApproveReturn(selectedOrderReturn.id)}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                                >
                                  {language === "vi" ? "Chấp Nhận Trả Hàng" : "Approve Return"}
                                </button>
                                <button
                                  type="button"
                                  disabled={submitting}
                                  onClick={() => handleRejectReturn(selectedOrderReturn.id)}
                                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                                >
                                  {language === "vi" ? "Từ Chối Trả Hàng" : "Reject Return"}
                                </button>
                              </>
                            )}

                            {selectedOrderReturn.status === "return_approved" && (
                              <button
                                type="button"
                                disabled={submitting}
                                onClick={() => handleMarkReceived(selectedOrderReturn.id)}
                                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                              >
                                {language === "vi" ? "Xác Nhận Nhận Được Hàng Kho" : "Confirm Items Received"}
                              </button>
                            )}

                            {selectedOrderReturn.status === "product_received" && (
                              <button
                                type="button"
                                disabled={submitting}
                                onClick={() => handleStartRefund(selectedOrderReturn.id)}
                                className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover disabled:bg-brand-primary/50 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                              >
                                {language === "vi" ? "Bắt Đầu Xử Lý Hoàn Tiền" : "Start Refund Processing"}
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
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                              >
                                {language === "vi" ? "Tiến Hành Hoàn Tất Hoàn Tiền" : "Complete Refund Transaction"}
                              </button>
                            )}

                            {["refunded", "return_rejected", "return_cancelled"].includes(selectedOrderReturn.status) && (
                              <div className="p-3 bg-brand-bg/50 border border-brand-border/40 rounded-xl text-xs font-medium text-brand-muted w-full text-center">
                                {language === "vi" ? "Quy trình đổi trả đã kết thúc ở trạng thái: " : "Return process ended with status: "}{" "}
                                <span className="font-extrabold uppercase text-brand-primary">{selectedOrderReturn.status}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Refund Completion Sub-Form */
                          <form onSubmit={handleCompleteRefundSubmit} className="bg-brand-primary-light/10 border border-brand-border/40 rounded-2xl p-4 space-y-4 animate-fadeIn">
                            <h5 className="text-xs font-bold text-brand-primary">
                              {language === "vi" ? "Nhập thông tin giao dịch hoàn tiền" : "Enter refund transaction info"}
                            </h5>
                            
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">
                                {language === "vi" ? "Phương thức hoàn tiền *" : "Refund method *"}
                              </label>
                              <select
                                value={refundMethod}
                                onChange={(e) => setRefundMethod(e.target.value)}
                                className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary font-semibold text-brand-text"
                              >
                                <option value="Bank Transfer">{language === "vi" ? "Chuyển khoản ngân hàng (Bank Transfer)" : "Bank Transfer"}</option>
                                <option value="Momo">{language === "vi" ? "Ví điện tử Momo" : "Momo Wallet"}</option>
                                <option value="ZaloPay">{language === "vi" ? "Ví điện tử ZaloPay" : "ZaloPay Wallet"}</option>
                                <option value="Cash">{language === "vi" ? "Tiền mặt" : "Cash"}</option>
                                <option value="Other">{language === "vi" ? "Khác" : "Other"}</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">
                                {language === "vi" ? "Mã giao dịch hoàn tiền *" : "Refund Transaction ID *"}
                              </label>
                              <input
                                type="text"
                                required
                                placeholder={language === "vi" ? "Ví dụ: VCB12345678" : "Example: VCB12345678"}
                                value={refundTxnId}
                                onChange={(e) => setRefundTxnId(e.target.value)}
                                className="w-full bg-brand-surface border border-brand-border text-brand-text rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary font-mono"
                              />
                            </div>

                            <div className="flex gap-2 pt-1">
                              <button
                                type="button"
                                disabled={submitting}
                                onClick={() => setIsCompletingRefund(false)}
                                className="flex-1 py-2 text-xs font-bold text-brand-muted bg-brand-surface hover:bg-brand-primary-light/20 border border-brand-border rounded-xl transition cursor-pointer"
                              >
                                {language === "vi" ? "Quay lại" : "Back"}
                              </button>
                              <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 py-2 text-xs font-bold text-white bg-brand-primary hover:bg-brand-primary-hover disabled:bg-brand-primary/50 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-brand-primary/20 cursor-pointer"
                              >
                                {submitting && <Loader2 size={12} className="animate-spin" />}
                                {language === "vi" ? "Xác nhận hoàn tất" : "Confirm completion"}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-xs bg-status-danger-bg text-status-danger-text border border-status-danger-border rounded-xl text-center">
                      {language === "vi" ? "Không tìm thấy chi tiết yêu cầu trả hàng tương ứng." : "No corresponding return details found."}
                    </div>
                  )}

                  {/* Audit Timeline */}
                  <div className="border-t border-brand-border/40 pt-4 space-y-3">
                    <h4 className="font-extrabold text-brand-text text-xs uppercase tracking-wider">
                      {language === "vi" ? "Lịch sử trạng thái đơn hàng" : "Order Status Logs"}
                    </h4>
                    <div className="relative border-l border-brand-border pl-4 space-y-4 text-xs py-1">
                      {selectedOrder.statusLogs && selectedOrder.statusLogs.length > 0 ? (
                        [...selectedOrder.statusLogs]
                          .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                          .map((log: any, idx: number) => (
                            <div key={log.id || idx} className="relative">
                              {/* Dot */}
                              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-brand-primary border border-brand-surface" />
                              <div className="flex justify-between items-start gap-4">
                                <div>
                                  <p className="font-bold text-brand-text">
                                    {log.oldStatus} <span className="font-normal text-brand-muted font-mono">→</span> {log.newStatus}
                                  </p>
                                  {log.note && <p className="text-brand-muted italic mt-0.5">"{log.note}"</p>}
                                </div>
                                <span className="text-[10px] text-brand-muted whitespace-nowrap">
                                  {new Date(log.createdAt).toLocaleString(language === "vi" ? "vi-VN" : "en-US")}
                                </span>
                              </div>
                            </div>
                          ))
                      ) : (
                        <p className="text-brand-muted italic">
                          {language === "vi" ? "Chưa ghi nhận nhật ký trạng thái." : "No status logs recorded yet."}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Close button at footer */}
                  <div className="flex justify-end pt-3 border-t border-brand-border/40">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl border border-brand-border hover:bg-brand-primary-light/20 text-sm font-semibold text-brand-muted transition cursor-pointer"
                    >
                      {language === "vi" ? "Đóng" : "Close"}
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
                    <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">
                      {language === "vi" ? "Trạng thái mới *" : "New Status *"}
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full rounded-xl border border-brand-border bg-brand-surface px-3 py-2.5 text-sm outline-none focus:border-brand-primary transition text-brand-text font-semibold"
                    >
                      <option value="pending">{language === "vi" ? "Chờ Thanh Toán (Pending)" : "Pending Payment (Pending)"}</option>
                      <option value="confirmed">{language === "vi" ? "Đã Xác Nhận (Confirmed)" : "Confirmed (Confirmed)"}</option>
                      <option value="shipping">{language === "vi" ? "Đang Giao Hàng (Shipping)" : "Shipping (Shipping)"}</option>
                      <option value="delivered">{language === "vi" ? "Đã Giao Thành Công (Delivered)" : "Delivered (Delivered)"}</option>
                      <option value="cancelled">{language === "vi" ? "Hủy Đơn Hàng (Cancelled)" : "Cancelled (Cancelled)"}</option>
                    </select>
                  </div>

                  {/* Shipping Details */}
                  {["shipping", "delivered"].includes(newStatus) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
                      {/* Tracking Number */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-brand-muted uppercase tracking-wider flex items-center gap-1">
                          <Truck size={12} /> {language === "vi" ? "Mã vận đơn" : "Tracking Number"}
                        </label>
                        <input
                          type="text"
                          placeholder={language === "vi" ? "Nhập mã vận đơn (GHTK, GHN...)" : "Enter tracking number (DHL, FedEx...)"}
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                          className="w-full rounded-xl border border-brand-border bg-brand-surface px-3 py-2.5 text-sm outline-none focus:border-brand-primary text-brand-text transition"
                        />
                      </div>

                      {/* Estimated Delivery Date */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-brand-muted uppercase tracking-wider flex items-center gap-1">
                          <Calendar size={12} /> {language === "vi" ? "Ngày giao dự kiến" : "Estimated Delivery Date"}
                        </label>
                        <input
                          type="date"
                          value={estimatedDeliveryDate}
                          onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                          className="w-full rounded-xl border border-brand-border bg-brand-surface px-3 py-2.5 text-sm outline-none focus:border-brand-primary text-brand-text font-semibold transition"
                        />
                      </div>
                    </div>
                  )}

                  {/* Status change Note */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">
                      {language === "vi" ? "Ghi chú lý do / Nhật ký thay đổi" : "Status Change Note / Log"}
                    </label>
                    <textarea
                      rows={3}
                      placeholder={language === "vi" ? "Ghi nhận nhật ký trạng thái..." : "Record status change details..."}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full rounded-xl border border-brand-border bg-brand-surface px-3 py-2.5 text-sm outline-none focus:border-brand-primary text-brand-text transition resize-none"
                    />
                  </div>

                  {selectedOrder.status === "delivered" && (
                    <div className="border-t border-brand-border/40 pt-4 space-y-3">
                      <h4 className="font-extrabold text-brand-text text-xs uppercase tracking-wider">
                        {language === "vi" ? "Hỗ trợ khách đổi trả" : "Customer Return Assistance"}
                      </h4>
                      <p className="text-xs text-brand-muted">
                        {language === "vi" ? "Tạo yêu cầu đổi trả và hoàn tiền hộ khách hàng nếu có yêu cầu." : "Create a return/refund request on behalf of the customer."}
                      </p>
                      <button
                        type="button"
                        onClick={handleCreateReturnOnBehalf}
                        className="w-full py-2.5 bg-status-warning-bg hover:bg-orange-655 hover:text-white border border-status-warning-border text-status-warning-text text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Undo2 size={13} />
                        {language === "vi" ? "Yêu Cầu Trả Hàng Hộ Khách" : "Request Return On Behalf"}
                      </button>
                    </div>
                  )}

                  {/* Audit Timeline */}
                  <div className="border-t border-brand-border/40 pt-4 space-y-3">
                    <h4 className="font-extrabold text-brand-text text-xs uppercase tracking-wider">
                      {language === "vi" ? "Lịch sử trạng thái đơn hàng" : "Order Status Logs"}
                    </h4>
                    <div className="relative border-l border-brand-border pl-4 space-y-4 text-xs py-1">
                      {selectedOrder.statusLogs && selectedOrder.statusLogs.length > 0 ? (
                        [...selectedOrder.statusLogs]
                          .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                          .map((log: any, idx: number) => (
                            <div key={log.id || idx} className="relative animate-fadeIn">
                              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-brand-primary border border-brand-surface" />
                              <div className="flex justify-between items-start gap-4">
                                <div>
                                  <p className="font-bold text-brand-text">
                                    {log.oldStatus} <span className="font-normal text-brand-muted font-mono">→</span> {log.newStatus}
                                  </p>
                                  {log.note && <p className="text-brand-muted italic mt-0.5">"{log.note}"</p>}
                                </div>
                                <span className="text-[10px] text-brand-muted whitespace-nowrap">
                                  {new Date(log.createdAt).toLocaleString(language === "vi" ? "vi-VN" : "en-US")}
                                </span>
                              </div>
                            </div>
                          ))
                      ) : (
                        <p className="text-brand-muted italic">
                          {language === "vi" ? "Chưa ghi nhận nhật ký trạng thái." : "No status logs recorded yet."}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Modal Actions */}
                  <div className="flex justify-end gap-3 pt-3 border-t border-brand-border/40">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      disabled={submitting}
                      className="px-5 py-2.5 rounded-xl border border-brand-border hover:bg-brand-primary-light/20 text-sm font-semibold text-brand-muted transition cursor-pointer"
                    >
                      {language === "vi" ? "Hủy bỏ" : "Cancel"}
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover disabled:bg-brand-primary/50 text-white text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-brand-primary/25"
                    >
                      {submitting && <Loader2 size={16} className="animate-spin" />}
                      {language === "vi" ? "Lưu thay đổi" : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <AdminPromptModal
        isOpen={isPromptOpen}
        onClose={() => setIsPromptOpen(false)}
        onSubmit={handlePromptSubmit}
        title={promptConfig?.title || ""}
        placeholder={promptConfig?.placeholder || ""}
        required={promptConfig?.required || false}
        isSubmitting={submitting}
        inputLabel={language === "vi" ? "Lý do / Ghi chú" : "Reason / Note"}
      />

      <AdminConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmConfig?.onConfirm || (() => {})}
        title={confirmConfig?.title || ""}
        message={confirmConfig?.message || ""}
        type={confirmConfig?.type}
      />
    </div>
  );
}
