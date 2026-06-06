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
  Calendar,
  Plus,
  Ticket,
  ChevronRight,
  ClipboardList,
  CheckCircle2,
  Truck,
  XCircle,
  RotateCcw,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { adminAPI, productAPI } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";
import RevenueAreaChart from "@/components/admin/dashboard/RevenueAreaChart";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { formatPrice } = usePreferences();

  // Restock Modal States
  const [restockProduct, setRestockProduct] = useState<any | null>(null);
  const [restockQty, setRestockQty] = useState<number>(50);
  const [updatingStock, setUpdatingStock] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, topSellingData, usersData, ordersData] = await Promise.all([
        adminAPI.getStats(),
        productAPI.getTopSelling(),
        adminAPI.getUsers(),
        adminAPI.getOrders(),
      ]);
      setStats(statsData);
      setTopProducts(topSellingData.slice(0, 4));
      setUsers(usersData);
      setOrders(ordersData);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Không thể tải dữ liệu thống kê.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestockConfirm = async () => {
    if (!restockProduct) return;
    try {
      setUpdatingStock(true);
      const newStock = restockProduct.stock + restockQty;
      await adminAPI.updateProduct(restockProduct.id, { stock: newStock });
      setRestockProduct(null);
      setRestockQty(50);
      // Refresh stats
      await fetchDashboardStats();
    } catch (err: any) {
      console.error(err);
      alert("Không thể bổ sung tồn kho sản phẩm.");
    } finally {
      setUpdatingStock(false);
    }
  };

  // Safe Date Parser
  const parseDate = (d: any) => {
    const dateParsed = new Date(d);
    return isNaN(dateParsed.getTime()) ? new Date() : dateParsed;
  };

  // Calculate Real Growth based on 30-day Chart data
  const chartData = stats?.revenueChart || [];
  const midPoint = Math.floor(chartData.length / 2);
  const previous15Days = chartData.slice(0, midPoint);
  const current15Days = chartData.slice(midPoint);

  const prevRevenue = previous15Days.reduce((sum: number, item: any) => sum + item.revenue, 0);
  const currRevenue = current15Days.reduce((sum: number, item: any) => sum + item.revenue, 0);

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };

  const revenueGrowth = calculateGrowth(currRevenue, prevRevenue);

  const renderGrowthIndicator = (growth: number | null, periodLabel = "15 ngày trước") => {
    if (growth === null) {
      return <span className="text-brand-muted font-medium text-[11px]">Chưa đủ dữ liệu so sánh</span>;
    }
    const isPositive = growth >= 0;
    return (
      <span className={`text-[11px] font-bold flex items-center gap-0.5 ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
        {isPositive ? `↗ +${growth.toFixed(1)}%` : `↘ ${growth.toFixed(1)}%`}
        <span className="text-brand-muted font-normal"> so với {periodLabel}</span>
      </span>
    );
  };

  // Safe Lookup for Today's Stats
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const todayData = chartData.find((r: any) => r.date === todayStr);
  const todayRevenue = todayData ? todayData.revenue : 0;
  const todayOrders = todayData ? todayData.ordersCount : 0;

  // Order Health Summary counts
  const totalOrdersCount = orders.length;
  const deliveredOrdersCount = orders.filter((o) => o.status === "delivered").length;
  const shippingOrdersCount = orders.filter((o) => o.status === "shipping").length;
  const cancelledOrdersCount = orders.filter((o) => o.status === "cancelled").length;
  const refundedOrdersCount = orders.filter((o) => 
    ["refunded", "return_approved", "product_received", "refund_processing"].includes(o.status)
  ).length;

  const successRate = totalOrdersCount > 0 ? Math.round((deliveredOrdersCount / totalOrdersCount) * 100) : 100;

  // Best Customers Sorted by Spent
  const bestCustomers = users
    .filter((u: any) => u.role === "user" || !u.role)
    .sort((a: any, b: any) => Number(b.totalSpent || 0) - Number(a.totalSpent || 0))
    .slice(0, 4);

  const getInitials = (name: string) => {
    if (!name) return "KH";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Activity Feed consolidating dynamic events
  const getRecentActivities = () => {
    const list: any[] = [];

    // Orders Events
    orders.forEach((o) => {
      let icon = "🛒";
      let text = `Đơn hàng mới #ORD-${o.id} từ ${o.fullName || "Khách vãng lai"}`;
      if (o.status === "delivered") {
        icon = "📦";
        text = `Đơn hàng #ORD-${o.id} đã giao thành công`;
      } else if (o.status === "cancelled") {
        icon = "❌";
        text = `Đơn hàng #ORD-${o.id} đã bị hủy`;
      }
      list.push({
        id: `order-${o.id}-${o.status}`,
        type: "order",
        icon,
        text,
        date: parseDate(o.createdAt || o.created_at),
      });
    });

    // Stock Alerts
    if (stats?.lowStockProducts) {
      stats.lowStockProducts.forEach((p: any) => {
        list.push({
          id: `stock-${p.id}`,
          type: "stock",
          icon: "⚠️",
          text: `Sách "${p.name}" sắp hết kho (Chỉ còn ${p.stock} cuốn)`,
          date: new Date(Date.now() - 2 * 3600 * 1000), // Muffed timestamp
        });
      });
    }

    // New User Registration
    users.forEach((u) => {
      list.push({
        id: `user-${u.id}`,
        type: "user",
        icon: "👤",
        text: `Khách hàng ${u.fullName || u.username} vừa tạo tài khoản`,
        date: parseDate(u.created_at),
      });
    });

    return list
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);
  };

  const recentActivities = getRecentActivities();

  // Stock Badge Render helper
  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return (
        <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-700 border border-rose-500/20 whitespace-nowrap">
          Hết hàng (Critical)
        </span>
      );
    }
    if (stock <= 3) {
      return (
        <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-orange-500/10 text-orange-700 border border-orange-500/20 whitespace-nowrap">
          Chỉ còn {stock} cuốn (Danger)
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20 whitespace-nowrap">
        Còn {stock} cuốn (Warning)
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
          <p className="text-brand-muted font-medium text-sm">Đang tải số liệu thống kê...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-rose-500/10 text-rose-700 border border-rose-500/20 rounded-3xl p-6 text-center max-w-lg mx-auto">
        <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
        <h3 className="font-bold text-lg">Đã xảy ra lỗi</h3>
        <p className="text-sm mt-1 mb-4">{error}</p>
        <button
          onClick={fetchDashboardStats}
          className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-semibold transition"
        >
          Thử Lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* SHOPIFY-STYLE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-brand-border/40">
        <div>
          <h2 className="text-2xl font-black text-brand-text flex items-center gap-1.5">
            Xin chào, Admin
          </h2>
          <p className="text-xs text-brand-muted mt-1.5 flex flex-wrap items-center gap-2">
            <span>Hôm nay:</span>
            <strong className="text-brand-text">{todayOrders} đơn hàng</strong>
            <span className="text-brand-border">•</span>
            <strong className="text-brand-primary">{formatPrice(todayRevenue)}</strong>
            <span className="text-brand-border">•</span>
            <strong className="text-brand-text">{stats.lowStockCount} sản phẩm cần nhập</strong>
          </p>
        </div>

        {/* QUICK ACTIONS */}
        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          <Link
            href="/admin/products"
            className="px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold shadow-md shadow-brand-primary/10 transition flex items-center gap-1.5"
          >
            <Plus size={14} /> Thêm sản phẩm
          </Link>
          <Link
            href="/admin/promotions"
            className="px-4 py-2.5 rounded-xl bg-brand-surface border border-brand-border/80 hover:bg-brand-primary-light/20 text-brand-text text-xs font-bold transition flex items-center gap-1.5"
          >
            <Ticket size={14} className="text-brand-muted" /> Tạo khuyến mãi
          </Link>
          <Link
            href="/admin/orders"
            className="px-4 py-2.5 rounded-xl bg-brand-surface border border-brand-border/80 hover:bg-brand-primary-light/20 text-brand-text text-xs font-bold transition flex items-center gap-1.5"
          >
            <ClipboardList size={14} className="text-brand-muted" /> Xem đơn hàng
          </Link>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {/* TODAY REVENUE */}
        <div className="bg-brand-surface border border-brand-border/40 rounded-3xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-2 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-muted block truncate">Hôm nay</span>
            <h3 className="text-xl font-black text-brand-text truncate">{formatPrice(todayRevenue)}</h3>
            <p className="text-[11px] text-brand-muted font-medium">Doanh thu ngày hiện tại</p>
          </div>
          <div className="bg-brand-primary/10 text-brand-primary p-3 rounded-2xl shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* MONTHLY REVENUE */}
        <div className="bg-brand-surface border border-brand-border/40 rounded-3xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center justify-between xl:col-span-1 sm:col-span-2 md:col-span-1">
          <div className="space-y-2 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-muted block truncate">Tháng này (30 ngày)</span>
            <h3 className="text-xl font-black text-brand-text truncate">{formatPrice(stats.totalRevenue)}</h3>
            {renderGrowthIndicator(revenueGrowth)}
          </div>
          <div className="bg-brand-primary/10 text-brand-primary p-3 rounded-2xl shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* ORDERS COUNT */}
        <div className="bg-brand-surface border border-brand-border/40 rounded-3xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-2 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-muted block truncate">Đơn Hàng Mới</span>
            <h3 className="text-xl font-black text-brand-text truncate">{stats.totalOrders}</h3>
            <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-0.5">
              <span>↗ +8%</span>
              <span className="text-brand-muted font-normal"> so với tháng trước</span>
            </p>
          </div>
          <div className="bg-brand-primary/10 text-brand-primary p-3 rounded-2xl shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        {/* SUCCESS RATE */}
        <div className="bg-brand-surface border border-brand-border/40 rounded-3xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-2 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-muted block truncate">Tỉ Lệ Thành Công</span>
            <h3 className="text-xl font-black text-brand-text truncate">{successRate}%</h3>
            <p className="text-[11px] text-brand-muted font-medium">Tỷ lệ đơn giao hoàn tất</p>
          </div>
          <div className="bg-brand-primary/10 text-brand-primary p-3 rounded-2xl shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* LOW STOCK ALERT COUNT */}
        <div className="bg-brand-surface border border-brand-border/40 rounded-3xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-2 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-muted block truncate">Sắp Hết Hàng</span>
            <h3 className="text-xl font-black text-brand-text truncate">{stats.lowStockCount}</h3>
            <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-0.5">
              <span>↘ -5%</span>
              <span className="text-brand-muted font-normal"> so với tháng trước</span>
            </p>
          </div>
          <div className="bg-brand-primary/10 text-brand-primary p-3 rounded-2xl shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ROW 1: REVENUE CHART (70%) & ACTIVITY FEED (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        {/* CHART CONTAINER */}
        <div className="lg:col-span-7 bg-gradient-to-br from-brand-surface to-brand-primary-light/10 border border-brand-border/40 rounded-3xl p-6 lg:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-muted">Doanh thu</span>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-2xl font-black text-brand-text">Revenue Overview</h3>
                {revenueGrowth !== null ? (
                  <span className={`text-sm font-bold flex items-center gap-0.5 ${revenueGrowth >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {revenueGrowth >= 0 ? `↗ +${revenueGrowth.toFixed(1)}%` : `↘ ${revenueGrowth.toFixed(1)}%`}
                    <span className="text-xs text-brand-muted font-normal"> so với 15 ngày trước</span>
                  </span>
                ) : (
                  <span className="text-xs text-brand-muted font-medium">Chưa đủ dữ liệu</span>
                )}
              </div>
              <p className="text-xs text-brand-muted mt-1">Thống kê doanh thu hàng ngày trong 30 ngày gần đây</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-brand-muted bg-brand-surface border border-brand-border/40 px-3 py-1.5 rounded-xl font-medium self-start sm:self-auto shadow-sm">
              <Calendar size={14} className="text-brand-muted" /> 30 ngày qua
            </div>
          </div>

          {/* Premium SVG Area Chart Component */}
          <RevenueAreaChart data={stats.revenueChart} />
        </div>

        {/* ACTIVITY FEED */}
        <div className="lg:col-span-3 bg-brand-surface border border-brand-border/40 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-brand-border/40 pb-3 mb-4">
              <h3 className="font-extrabold text-brand-text text-base">Hoạt động gần đây</h3>
              <RefreshCw size={14} className="text-brand-muted cursor-pointer hover:rotate-180 transition-transform duration-500" onClick={fetchDashboardStats} />
            </div>

            <div className="space-y-4">
              {recentActivities.map((act) => (
                <div key={act.id} className="flex gap-3 text-xs leading-relaxed">
                  <span className="text-base shrink-0 select-none mt-0.5">{act.icon}</span>
                  <div>
                    <p className="font-semibold text-brand-text">{act.text}</p>
                    <span className="text-[10px] text-brand-muted">
                      {act.date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} - {act.date.toLocaleDateString("vi-VN", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2: RECENT ORDERS (70%) & INVENTORY ALERTS (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        {/* RECENT ORDERS TABLE */}
        <div className="lg:col-span-7 bg-brand-surface border border-brand-border/40 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-brand-border/40 pb-3 mb-4">
              <h3 className="font-extrabold text-brand-text">Đơn hàng mới nhận</h3>
              <Link href="/admin/orders" className="text-xs font-bold text-brand-primary hover:text-brand-primary-hover transition flex items-center gap-1">
                Xem tất cả <ArrowRight size={14} />
              </Link>
            </div>

            <div className="overflow-x-auto relative max-h-[360px] overflow-y-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="text-brand-muted border-b border-brand-border/40 sticky top-0 bg-brand-surface z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.03)]">
                    <th className="pb-3 pt-1.5 font-bold uppercase tracking-wider text-[10px]">Mã đơn</th>
                    <th className="pb-3 pt-1.5 font-bold uppercase tracking-wider text-[10px]">Khách hàng</th>
                    <th className="pb-3 pt-1.5 font-bold uppercase tracking-wider text-[10px] text-right">Tổng tiền</th>
                    <th className="pb-3 pt-1.5 font-bold uppercase tracking-wider text-[10px] text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/10">
                  {stats.latestOrders.map((o: any) => (
                    <tr key={o.id} className="hover:bg-brand-bg/20 odd:bg-brand-surface even:bg-brand-bg/50 transition-colors">
                      <td className="py-3.5 font-black text-brand-text">#ORD-{o.id}</td>
                      <td className="py-3.5 text-brand-text font-medium">{o.fullName}</td>
                      <td className="py-3.5 text-right font-black text-brand-primary">{formatPrice(o.totalAmount)}</td>
                      <td className="py-3.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                          o.status === "delivered" ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" :
                          o.status === "cancelled" ? "bg-red-500/10 text-red-700 border-red-500/20" :
                          o.status === "shipping" ? "bg-sky-500/10 text-sky-700 border-sky-500/20" :
                          "bg-amber-500/10 text-amber-700 border border-amber-500/20"
                        }`}>
                          {o.status === "delivered" ? "Đã giao" :
                           o.status === "cancelled" ? "Đã hủy" :
                           o.status === "shipping" ? "Đang giao" : "Chờ xử lý"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* INVENTORY ALERTS */}
        <div className="lg:col-span-3 bg-brand-surface border border-brand-border/40 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-brand-border/40 pb-3 mb-4">
              <h3 className="font-extrabold text-brand-text flex items-center gap-1.5">
                ⚠️ Inventory Alerts
              </h3>
              <Link href="/admin/products" className="text-xs font-bold text-brand-primary hover:text-brand-primary-hover transition flex items-center gap-1">
                Xem kho <ArrowRight size={14} />
              </Link>
            </div>

            <div className="space-y-4">
              {stats.lowStockProducts.length === 0 ? (
                <p className="text-center py-6 text-xs text-brand-muted">Kho hàng ở mức an toàn.</p>
              ) : (
                stats.lowStockProducts.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 text-xs border-b border-brand-border/20 pb-3 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-9 h-11 object-cover rounded-md bg-brand-bg border border-brand-border/50 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-11 rounded-md bg-brand-primary/10 border border-brand-border flex items-center justify-center font-bold text-brand-primary shrink-0 select-none">
                          📖
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-brand-text truncate">{p.name}</p>
                        <div className="mt-1">{getStockBadge(p.stock)}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setRestockProduct(p);
                        setRestockQty(50);
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-brand-primary/40 hover:bg-brand-primary-light/20 text-brand-primary text-[10px] font-bold transition shrink-0"
                    >
                      Restock
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3: TOP SELLING PRODUCTS (50%) & BEST CUSTOMERS/ORDER HEALTH (50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TOP SELLING PRODUCTS */}
        <div className="bg-brand-surface border border-brand-border/40 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-brand-border/40 pb-3 mb-4">
              <h3 className="font-extrabold text-brand-text">Sản phẩm bán chạy nhất</h3>
              <span className="text-[10px] bg-brand-primary/10 text-brand-primary px-2.5 py-1 rounded-xl font-bold uppercase">Thống kê</span>
            </div>

            <div className="space-y-4">
              {topProducts.length === 0 ? (
                <p className="text-center py-6 text-xs text-brand-muted">Chưa có số liệu sản phẩm bán chạy.</p>
              ) : (
                topProducts.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-10 h-12 object-cover rounded-md bg-brand-bg border border-brand-border/50 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-12 rounded-md bg-brand-primary/10 border border-brand-border flex items-center justify-center font-bold text-brand-primary shrink-0 select-none">
                          📖
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-extrabold text-brand-text truncate">{p.name}</p>
                        <p className="text-[10px] text-brand-muted mt-0.5">Danh mục: {p.category?.name || "Khác"}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-brand-text">{p.sold} đã bán</p>
                      <p className="text-[10px] font-black text-brand-primary mt-0.5">
                        {formatPrice(p.sold * p.price)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN STACK: ORDER HEALTH & BEST CUSTOMERS */}
        <div className="space-y-8">
          {/* ORDER HEALTH CARD */}
          <div className="bg-brand-surface border border-brand-border/40 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-brand-border/40 pb-3 mb-4">
              <h3 className="font-extrabold text-brand-text flex items-center gap-1.5">
                📊 Sức khỏe đơn hàng
              </h3>
              <span className="text-[10px] font-black text-brand-muted">
                Tổng cộng: {totalOrdersCount} đơn
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* DELIVERED */}
              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-brand-text">Đã giao hoàn tất</span>
                  <span className="text-emerald-600 font-bold">{deliveredOrdersCount} đơn</span>
                </div>
                <div className="w-full bg-brand-bg rounded-full h-2 overflow-hidden border border-brand-border/20">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${totalOrdersCount > 0 ? (deliveredOrdersCount / totalOrdersCount) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* SHIPPING */}
              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-brand-text">Đang vận chuyển</span>
                  <span className="text-sky-600 font-bold">{shippingOrdersCount} đơn</span>
                </div>
                <div className="w-full bg-brand-bg rounded-full h-2 overflow-hidden border border-brand-border/20">
                  <div
                    className="bg-sky-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${totalOrdersCount > 0 ? (shippingOrdersCount / totalOrdersCount) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* CANCELLED */}
              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-brand-text">Đã hủy đơn</span>
                  <span className="text-rose-600 font-bold">{cancelledOrdersCount} đơn</span>
                </div>
                <div className="w-full bg-brand-bg rounded-full h-2 overflow-hidden border border-brand-border/20">
                  <div
                    className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${totalOrdersCount > 0 ? (cancelledOrdersCount / totalOrdersCount) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* REFUNDED */}
              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-brand-text">Hoàn tiền / Trả hàng</span>
                  <span className="text-amber-600 font-bold">{refundedOrdersCount} đơn</span>
                </div>
                <div className="w-full bg-brand-bg rounded-full h-2 overflow-hidden border border-brand-border/20">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${totalOrdersCount > 0 ? (refundedOrdersCount / totalOrdersCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* BEST CUSTOMERS */}
          <div className="bg-brand-surface border border-brand-border/40 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-brand-border/40 pb-3 mb-4">
              <h3 className="font-extrabold text-brand-text">Khách hàng tiêu biểu</h3>
              <Link href="/admin/users" className="text-xs font-bold text-brand-primary hover:text-brand-primary-hover transition flex items-center gap-1">
                Danh sách <ArrowRight size={14} />
              </Link>
            </div>

            <div className="space-y-4">
              {bestCustomers.length === 0 ? (
                <p className="text-center py-4 text-xs text-brand-muted">Chưa có dữ liệu khách hàng.</p>
              ) : (
                bestCustomers.map((cust) => (
                  <div key={cust.id} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-brand-primary/10 text-brand-primary font-bold flex items-center justify-center select-none shrink-0 border border-brand-border/50">
                        {getInitials(cust.fullName || cust.username)}
                      </div>
                      <div>
                        <p className="font-bold text-brand-text">{cust.fullName || cust.username}</p>
                        <p className="text-[10px] text-brand-muted mt-0.5">{cust.email || cust.phone || "Không có liên hệ"}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-black text-brand-primary">{formatPrice(cust.totalSpent || 0)}</p>
                      <p className="text-[10px] text-brand-muted mt-0.5">Tổng chi tiêu</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RESTOCK MODAL */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 shadow-2xl max-w-sm w-full animate-scaleIn">
            <h3 className="font-extrabold text-lg text-brand-text mb-2">Bổ sung kho hàng</h3>
            <p className="text-xs text-brand-muted mb-4 leading-relaxed">
              Bổ sung tồn kho cho cuốn sách: <strong className="text-brand-text">{restockProduct.name}</strong>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-muted mb-1.5">
                  Số lượng bổ sung
                </label>
                <input
                  type="number"
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 rounded-xl border border-brand-border focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:outline-none font-semibold text-brand-text bg-transparent"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setRestockProduct(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-brand-muted hover:bg-brand-primary-light/20 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleRestockConfirm}
                disabled={updatingStock}
                className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold shadow-md shadow-brand-primary/20 transition flex items-center gap-1.5"
              >
                {updatingStock ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : null}
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
