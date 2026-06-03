"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  ShoppingBag,
  Users,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Loader2,
  Calendar
} from "lucide-react";
import Link from "next/link";
import { adminAPI } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";
import RevenueAreaChart from "@/components/admin/dashboard/RevenueAreaChart";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { formatPrice } = usePreferences();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminAPI.getStats();
      setStats(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Không thể tải số liệu thống kê.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-500 font-medium">Đang tải số liệu...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 text-red-600 border border-red-200 rounded-3xl p-6 text-center max-w-lg mx-auto">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h3 className="font-bold text-lg">Đã xảy ra lỗi</h3>
        <p className="text-sm mt-1 mb-4">{error}</p>
        <button
          onClick={fetchDashboardStats}
          className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition"
        >
          Thử Lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 4 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* REVENUE */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Doanh Thu Thực Tế</span>
            <h3 className="text-2xl font-black text-gray-900">{formatPrice(stats.totalRevenue)}</h3>
            <p className="text-[11px] text-green-600 font-semibold flex items-center gap-1">
              <TrendingUp size={12} /> Đơn giao thành công
            </p>
          </div>
          <div className="bg-orange-500 text-white p-3 rounded-2xl shadow-md shadow-orange-100 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* ORDERS */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Tổng Số Đơn Hàng</span>
            <h3 className="text-2xl font-black text-gray-900">{stats.totalOrders}</h3>
            <p className="text-[11px] text-gray-400 font-semibold">Tất cả trạng thái</p>
          </div>
          <div className="bg-blue-500 text-white p-3 rounded-2xl shadow-md shadow-blue-100 shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* CUSTOMERS */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Khách Hàng</span>
            <h3 className="text-2xl font-black text-gray-900">{stats.totalCustomers}</h3>
            <p className="text-[11px] text-gray-400 font-semibold">Người dùng hoạt động</p>
          </div>
          <div className="bg-green-500 text-white p-3 rounded-2xl shadow-md shadow-green-100 shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* LOW STOCK WARNING */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Sách Sắp Hết Hàng</span>
            <h3 className="text-2xl font-black text-gray-900">{stats.lowStockCount}</h3>
            <p className="text-[11px] text-red-500 font-semibold">Số lượng còn lại &le; 10</p>
          </div>
          <div className="bg-red-500 text-white p-3 rounded-2xl shadow-md shadow-red-100 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* SALES CHART */}
      <div className="bg-white border border-gray-150 rounded-3xl p-6 lg:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Biểu Đồ Doanh Thu</h3>
            <p className="text-xs text-gray-400">Thống kê doanh thu hàng ngày trong 30 ngày gần đây</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 border px-3 py-1.5 rounded-xl font-medium">
            <Calendar size={14} /> 30 ngày qua
          </div>
        </div>

        {/* Premium SVG Area Chart Component */}
        <RevenueAreaChart data={stats.revenueChart} />
      </div>

      {/* RECENT ORDERS & LOW STOCK PRODUCTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latest Orders */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-gray-900">Đơn hàng mới nhận</h3>
            <Link href="/admin/orders" className="text-xs font-bold text-orange-500 hover:text-orange-600 transition flex items-center gap-1">
              Xem tất cả <ArrowRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-gray-400 border-b">
                  <th className="pb-3 font-semibold">Mã đơn</th>
                  <th className="pb-3 font-semibold">Khách hàng</th>
                  <th className="pb-3 font-semibold text-right">Tổng tiền</th>
                  <th className="pb-3 font-semibold text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.latestOrders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-gray-50/50">
                    <td className="py-3.5 font-bold text-gray-900">#ORD-{o.id}</td>
                    <td className="py-3.5 text-gray-600 font-medium">{o.fullName}</td>
                    <td className="py-3.5 text-right font-bold text-orange-500">{formatPrice(o.totalAmount)}</td>
                    <td className="py-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        o.status === "delivered" ? "bg-green-50 text-green-700 border border-green-100" :
                        o.status === "cancelled" ? "bg-red-50 text-red-700 border border-red-100" :
                        o.status === "shipping" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                        "bg-yellow-50 text-yellow-700 border border-yellow-100"
                      }`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-gray-900">Sách sắp hết kho</h3>
            <Link href="/admin/products" className="text-xs font-bold text-orange-500 hover:text-orange-600 transition flex items-center gap-1">
              Xem kho <ArrowRight size={14} />
            </Link>
          </div>

          <div className="space-y-3.5">
            {stats.lowStockProducts.length === 0 ? (
              <p className="text-center py-6 text-xs text-gray-400">Kho hàng ở mức an toàn.</p>
            ) : (
              stats.lowStockProducts.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Mã sản phẩm: #{p.id}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                    p.stock === 0 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                  }`}>
                    Còn {p.stock}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
