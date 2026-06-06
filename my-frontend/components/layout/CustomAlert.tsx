"use client";

import { useEffect, useState } from "react";
import { usePreferences } from "@/lib/i18n";
import { CheckCircle2, ShoppingCart, AlertTriangle, Bell, X } from "lucide-react";

interface AlertQueueItem {
  id: number;
  message: string;
}

export default function CustomAlert() {
  const { language } = usePreferences();
  const [alerts, setAlerts] = useState<AlertQueueItem[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Save the original alert function
    const originalAlert = window.alert;

    // Override the alert function
    window.alert = (message: string) => {
      console.log("[System Alert]:", message);
      setAlerts((prev) => [...prev, { id: Date.now() + Math.random(), message }]);
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  if (alerts.length === 0) return null;

  const currentAlert = alerts[0];

  const handleClose = () => {
    setAlerts((prev) => prev.slice(1));
  };

  // Determine the best icon based on the message content
  const getAlertIcon = (msg: string) => {
    const text = msg.toLowerCase();
    if (text.includes("cart") || text.includes("giỏ hàng") || text.includes("🛒")) {
      return <ShoppingCart className="w-10 h-10 text-brand-primary animate-bounce" />;
    }
    if (
      text.includes("success") ||
      text.includes("thành công") ||
      text.includes("đăng ký thành công") ||
      text.includes("đặt hàng thành công") ||
      text.includes("đăng nhập thành công")
    ) {
      return <CheckCircle2 className="w-10 h-10 text-emerald-650" />;
    }
    if (
      text.includes("failed") ||
      text.includes("thất bại") ||
      text.includes("lỗi") ||
      text.includes("error") ||
      text.includes("không thể")
    ) {
      return <AlertTriangle className="w-10 h-10 text-rose-500" />;
    }
    return <Bell className="w-10 h-10 text-brand-primary" />;
  };

  // Translate header
  const getHeaderTitle = (msg: string) => {
    const text = msg.toLowerCase();
    if (text.includes("cart") || text.includes("giỏ hàng") || text.includes("🛒")) {
      return language === "vi" ? "Giỏ Hàng" : "Shopping Cart";
    }
    if (text.includes("failed") || text.includes("thất bại") || text.includes("lỗi") || text.includes("error")) {
      return language === "vi" ? "Thông Báo Lỗi" : "Error Notification";
    }
    return language === "vi" ? "Thông Báo Hệ Thống" : "System Notification";
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#3b2f23]/40 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
        onClick={handleClose}
      />
      
      {/* Alert Card */}
      <div className="relative w-full max-w-md bg-brand-surface border-2 border-brand-border rounded-[24px] p-6 shadow-[0_20px_50px_rgba(59,47,35,0.15)] transition-all duration-300 animate-scale-in flex flex-col items-center text-center">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 text-brand-muted hover:text-brand-primary transition duration-200 cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Icon container */}
        <div className="bg-brand-primary-light/30 p-4 rounded-full border border-brand-border mb-4">
          {getAlertIcon(currentAlert.message)}
        </div>

        {/* Title */}
        <h3 className="font-serif-luxury text-xl font-bold text-brand-text mb-2 tracking-tight">
          {getHeaderTitle(currentAlert.message)}
        </h3>

        {/* Message */}
        <p className="text-[15px] text-brand-muted font-medium mb-6 leading-relaxed whitespace-pre-wrap">
          {currentAlert.message}
        </p>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleClose}
          className="w-full h-[46px] bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold rounded-[12px] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border-none shadow-md hover:shadow-lg font-sans"
        >
          {language === "vi" ? "Đồng ý" : "OK"}
        </button>
      </div>
    </div>
  );
}
