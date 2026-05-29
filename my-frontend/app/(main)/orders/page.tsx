"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Package,
  Clock3,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Search,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { orderAPI } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";
import { useRouter } from "next/navigation";

const tabs = [
  { id: "all", label: "All", icon: Package },
  { id: "pending", label: "Pending Payment", icon: Clock3 },
  { id: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { id: "shipping", label: "Shipping", icon: Truck },
  { id: "delivered", label: "Delivered", icon: CheckCircle2 },
  { id: "cancelled", label: "Cancelled", icon: XCircle },
];

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const { t, formatPrice } = usePreferences();
  const router = useRouter();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await orderAPI.list();
      setOrders(data);
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    const reason = prompt("Vui lòng nhập lý do hủy đơn hàng:");
    if (reason === null) return;
    if (!reason.trim()) {
      alert("Lý do hủy không được để trống.");
      return;
    }

    try {
      setCancellingId(orderId);
      await orderAPI.cancel(orderId, reason.trim());
      alert("Đơn hàng đã được hủy thành công!");
      fetchOrders();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Không thể hủy đơn hàng lúc này.");
    } finally {
      setCancellingId(null);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchTab = activeTab === "all" || order.status === activeTab;
      
      const searchStr = search.toLowerCase();
      const matchSearch =
        order.id.toString().includes(searchStr) ||
        order.items?.some((item: any) =>
          item.productName.toLowerCase().includes(searchStr)
        );

      return matchTab && matchSearch;
    });
  }, [activeTab, search, orders]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-yellow-600 animate-spin" />
          <p className="text-gray-500 font-medium">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#efefef] py-10 px-4 lg:px-10">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">Lịch sử đơn hàng</h1>
          <p className="text-gray-500 mt-2">Theo dõi trạng thái và chi tiết các đơn hàng của bạn.</p>

          {/* SEARCH */}
          <div className="mt-6 relative max-w-xl">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã đơn hoặc tên sản phẩm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-2xl border border-gray-300 bg-gray-50 outline-none focus:ring-2 focus:ring-gray-300 text-sm"
            />
          </div>
        </div>

        {/* TABS */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const count = orders.filter((order) =>
              tab.id === "all" ? true : order.status === tab.id
            ).length;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`p-4 rounded-2xl border transition-all duration-200 text-left bg-white shadow-sm ${
                  activeTab === tab.id
                    ? "border-gray-900 bg-gray-100"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      activeTab === tab.id
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm whitespace-nowrap">{tab.label}</p>
                    <p className="text-xs text-gray-500">{count} orders</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ORDERS LIST */}
        <div className="space-y-5">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden"
              >
                {/* TOP HEADER */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 border-b border-gray-100 bg-gray-50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-lg">
                        #ORD-{order.id}
                      </span>
                      <span className="text-xs text-gray-400">|</span>
                      <span className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleDateString("vi-VN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {order.paymentMethod && (
                      <p className="text-xs text-gray-500 mt-1 uppercase">
                        Phương thức: {order.paymentMethod}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                {/* BODY */}
                <div className="p-6 divide-y divide-gray-100">
                  {order.items?.map((item: any) => (
                    <div key={item.id} className="py-4 flex gap-5 first:pt-0 last:pb-0">
                      <div className="w-16 h-20 bg-amber-50 rounded-xl border flex items-center justify-center text-yellow-700 shrink-0 font-bold text-xs shadow-inner">
                        BOOK
                      </div>
                      <div className="flex-1 space-y-1">
                        <h3 className="text-md font-semibold text-gray-900 line-clamp-1">
                          {item.productName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatPrice(item.price)} × {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* FOOTER METRICS AND ACTIONS */}
                <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <span className="text-xs text-gray-400">Tổng cộng</span>
                    <p className="text-2xl font-bold text-yellow-600">
                      {formatPrice(order.totalAmount)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/orders/${order.id}`}
                      className="px-5 py-2.5 rounded-xl border border-gray-300 hover:border-gray-500 transition font-medium text-sm flex items-center gap-1.5 bg-white text-gray-700"
                    >
                      Chi tiết đơn <ChevronRight size={16} />
                    </Link>

                    {order.status === "pending" && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={cancellingId === order.id}
                        className="px-5 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition font-semibold text-sm disabled:opacity-50"
                      >
                        Hủy đơn hàng
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center shadow-sm">
              <Package className="w-14 h-14 text-gray-300 mx-auto mb-5" />
              <h3 className="text-2xl font-semibold text-gray-800">
                Không tìm thấy đơn hàng nào
              </h3>
              <p className="text-gray-500 mt-2">
                Bạn chưa có đơn hàng nào thuộc bộ lọc này.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    confirmed: "bg-green-100 text-green-700 border-green-200",
    shipping: "bg-blue-100 text-blue-700 border-blue-200",
    delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
    refunded: "bg-purple-100 text-purple-700 border-purple-200",
  };

  const labels: Record<string, string> = {
    pending: "Chờ thanh toán",
    confirmed: "Đã xác nhận",
    shipping: "Đang vận chuyển",
    delivered: "Đã giao hàng",
    cancelled: "Đã hủy",
    refunded: "Đã hoàn tiền",
  };

  return (
    <div
      className={`px-4 py-1.5 rounded-full text-xs font-bold border ${
        map[status] || "bg-gray-100 text-gray-700 border-gray-200"
      }`}
    >
      {labels[status] || status}
    </div>
  );
}
