"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  BookOpen,
  ShoppingBag,
  Undo2,
  Users,
  Home,
  ChevronRight,
  ShieldCheck,
  Menu,
  X,
  Loader2,
  Ticket
} from "lucide-react";
import { userProfileAPI } from "@/lib/api";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const profile = await userProfileAPI.get();
        if (profile.role === "admin") {
          setIsAdmin(true);
        } else {
          alert("Bạn không có quyền truy cập trang quản trị!");
          router.push("/");
        }
      } catch (err) {
        console.error(err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    checkAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
          <p className="text-gray-500 font-semibold">Đang xác thực quyền Admin...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const menuItems = [
    { label: "Tổng Quan", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Sản Phẩm", href: "/admin/products", icon: BookOpen },
    { label: "Đơn Hàng", href: "/admin/orders", icon: ShoppingBag },
    { label: "Khách Hàng", href: "/admin/users", icon: Users },
    { label: "Yêu Cầu Trả Hàng", href: "/admin/returns", icon: Undo2 },
    { label: "Khuyến Mãi", href: "/admin/promotions", icon: Ticket },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex text-gray-800">
      {/* SIDEBAR FOR DESKTOP */}
      <aside className="w-64 border-r border-brand-border/40 bg-brand-surface hidden lg:flex flex-col justify-between shrink-0 h-screen sticky top-0">
        <div>
          {/* LOGO AREA */}
          <div className="p-6 border-b border-brand-border/40 flex items-center gap-2.5">
            <div className="bg-brand-primary text-white p-2 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-brand-text block leading-tight">E-Commerce</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-brand-primary block">Dashboard</span>
            </div>
          </div>

          {/* MENU LINKS */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 group ${
                    isActive
                      ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
                      : "text-brand-muted hover:bg-brand-primary-light/20 hover:text-brand-primary"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 transition-all duration-200 ${isActive ? "text-white opacity-100" : "text-brand-muted group-hover:text-brand-primary opacity-80 group-hover:opacity-100"}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-white" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* BOTTOM ACTION */}
        <div className="p-4 border-t border-brand-border/40 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm text-brand-muted hover:bg-brand-primary-light/20 hover:text-brand-primary transition group"
          >
            <Home className="w-5 h-5 text-brand-muted group-hover:text-brand-primary transition-colors opacity-80 group-hover:opacity-100" />
            <span>Về Trang Chủ Shop</span>
          </Link>
        </div>
      </aside>

      {/* MOBILE SIDEBAR MODAL */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-64 bg-brand-surface flex flex-col justify-between h-full border-r border-brand-border/40 relative z-10 animate-slideRight">
            <div>
              <div className="p-6 border-b border-brand-border/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-6 h-6 text-brand-primary" />
                  <span className="font-extrabold text-base text-brand-text">E-Commerce Admin</span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-1 rounded-full hover:bg-brand-primary-light/20">
                  <X className="w-5 h-5 text-brand-muted" />
                </button>
              </div>

              <nav className="p-4 space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition ${
                        isActive 
                          ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/10" 
                          : "text-brand-muted hover:bg-brand-primary-light/20 hover:text-brand-primary"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-brand-muted"}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="p-4 border-t border-brand-border/40">
              <Link
                href="/"
                className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm text-brand-muted hover:bg-brand-primary-light/20 hover:text-brand-primary transition group"
              >
                <Home className="w-5 h-5 text-brand-muted group-hover:text-brand-primary transition-colors" />
                <span>Về Trang Chủ Shop</span>
              </Link>
            </div>
          </div>
          <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/40" />
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* MOBILE HEADER */}
        <header className="h-16 border-b border-brand-border/40 bg-brand-surface flex items-center justify-between px-6 lg:px-10 shrink-0 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 rounded-full hover:bg-brand-primary-light/20 lg:hidden text-brand-muted"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="font-extrabold text-brand-text tracking-tight capitalize text-lg">
              {pathname === "/admin/dashboard" && "Hệ thống quản trị"}
              {pathname === "/admin/products" && "Quản lý sản phẩm"}
              {pathname === "/admin/orders" && "Quản lý đơn hàng"}
              {pathname === "/admin/users" && "Quản lý khách hàng"}
              {pathname === "/admin/returns" && "Quản lý trả hàng"}
              {pathname === "/admin/promotions" && "Quản lý khuyến mãi"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-brand-primary uppercase tracking-wider">Quản trị viên</span>
              <span className="text-sm font-bold text-brand-text">Admin Account</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center font-bold text-brand-primary">
              AD
            </div>
          </div>
        </header>

        {/* WORKSPACE */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
