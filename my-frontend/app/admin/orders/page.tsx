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
  ClipboardList
} from "lucide-react";
import { adminAPI } from "@/lib/api";
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
            <option value="refunded">Đã Hoàn Tiền (Refunded)</option>
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
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        o.status === "delivered" ? "bg-green-50 text-green-700 border border-green-100" :
                        o.status === "cancelled" ? "bg-red-50 text-red-700 border border-red-100" :
                        o.status === "shipping" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                        o.status === "refunded" ? "bg-purple-50 text-purple-700 border border-purple-100" :
                        "bg-yellow-50 text-yellow-700 border border-yellow-100"
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleOpenStatusModal(o)}
                        className="px-4 py-2 bg-gray-50 hover:bg-amber-500 hover:text-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 transition flex items-center gap-1 mx-auto"
                      >
                        <ClipboardList size={13} /> Cập nhật
                      </button>
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
                <h3 className="font-extrabold text-gray-900 text-base">Cập Nhật Trạng Thái Đơn Hàng</h3>
                <p className="text-xs text-gray-500 mt-0.5">Mã đơn hàng: #ORD-{selectedOrder.id}</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUpdateStatusSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 text-xs bg-red-50 text-red-600 border border-red-100 rounded-xl flex items-center gap-2">
                  <AlertTriangle size={14} />
                  <span>{error}</span>
                </div>
              )}

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

              {/* Shipping Details (Only visible when shipping or delivered) */}
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
          </div>
        </div>
      )}
    </div>
  );
}
