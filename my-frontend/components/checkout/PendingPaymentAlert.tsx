"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { paymentAPI } from "@/lib/api";
import { CreditCard, X, Bell } from "lucide-react";
import { usePreferences } from "@/lib/i18n";

interface PendingPaymentData {
  paymentId: number;
  checkoutUrl: string;
  expiresAt: number;
  lastCheckedAt: number;
}

const pruneDismissFlags = (currentPaymentId: number) => {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("dismiss_") && key !== `dismiss_${currentPaymentId}`) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    console.error("Pruning dismiss flags failed:", err);
  }
};

export default function PendingPaymentAlert() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = usePreferences();

  const [visible, setVisible] = useState(false);
  const [slideIn, setSlideIn] = useState(false);
  const [paymentData, setPaymentData] = useState<PendingPaymentData | null>(null);

  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stateRef = useRef<{ visible: boolean; paymentData: PendingPaymentData | null }>({
    visible: false,
    paymentData: null,
  });

  useEffect(() => {
    stateRef.current = { visible, paymentData };
  }, [visible, paymentData]);

  const isExcludedPage =
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/order-success") ||
    pathname.startsWith("/order-failed");

  // Helper to check status in backend
  const verifyStatus = async (data: PendingPaymentData) => {
    if (document.hidden) return true; // skip checks if tab is hidden but keep current state

    try {
      const res = await paymentAPI.getStatus(data.paymentId);

      if (
        res.paymentStatus === "paid" ||
        res.paymentStatus === "failed" ||
        res.orderStatus === "cancelled"
      ) {
        localStorage.removeItem("pending_payment");
        localStorage.removeItem(`dismiss_${data.paymentId}`);
        setVisible(false);
        setSlideIn(false);
        return false;
      }

      const expiresAt = res.qr?.expiredAt ? new Date(res.qr.expiredAt).getTime() : data.expiresAt;
      if (Date.now() > expiresAt) {
        localStorage.removeItem("pending_payment");
        localStorage.removeItem(`dismiss_${data.paymentId}`);
        setVisible(false);
        setSlideIn(false);
        return false;
      }

      const updatedData = {
        ...data,
        lastCheckedAt: Date.now(),
        expiresAt,
      };
      localStorage.setItem("pending_payment", JSON.stringify(updatedData));
      setPaymentData(updatedData);
      return true;
    } catch (err) {
      console.warn("Verify check failed (network/backend error), preserving state:", err);
      return true; // Keep banner on network error
    }
  };

  // Helper to load state from Local Storage
  const loadState = async () => {
    const stored = localStorage.getItem("pending_payment");
    if (!stored) {
      setVisible(false);
      setSlideIn(false);
      return;
    }

    try {
      const data: PendingPaymentData = JSON.parse(stored);

      // Local expiration check
      if (Date.now() > data.expiresAt) {
        localStorage.removeItem("pending_payment");
        localStorage.removeItem(`dismiss_${data.paymentId}`);
        setVisible(false);
        setSlideIn(false);
        return;
      }

      // Prune old dismiss flags to save space
      pruneDismissFlags(data.paymentId);

      // Check if permanently dismissed
      const isDismissed = localStorage.getItem(`dismiss_${data.paymentId}`) === "true";
      if (isDismissed) {
        setVisible(false);
        setSlideIn(false);
        return;
      }

      setPaymentData(data);

      const timeSinceLastCheck = Date.now() - (data.lastCheckedAt || 0);

      // Throttle: If last checked within 60s, show immediately but schedule background verify in 1.5s
      if (timeSinceLastCheck <= 60000) {
        setVisible(true);
        setTimeout(() => setSlideIn(true), 100);
        
        // Background verify pass
        setTimeout(() => {
          if (stateRef.current.visible && stateRef.current.paymentData) {
            void verifyStatus(stateRef.current.paymentData);
          }
        }, 1500);
      } else {
        // Force immediate API verify before showing
        const isValid = await verifyStatus(data);
        if (isValid) {
          setVisible(true);
          setTimeout(() => setSlideIn(true), 100);
        }
      }
    } catch (e) {
      console.error("Failed to parse pending payment state:", e);
    }
  };

  // 1. Initial Load & Route Watch
  useEffect(() => {
    if (isExcludedPage) {
      setVisible(false);
      setSlideIn(false);
      return;
    }

    void loadState();
  }, [pathname, isExcludedPage]);

  // 2. Storage event synchronization (Across multiple tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "pending_payment") {
        void loadState();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // 3. Tab Visibility Change Watcher
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && stateRef.current.visible && stateRef.current.paymentData) {
        // Focus regained -> instant verify check
        void verifyStatus(stateRef.current.paymentData);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // 4. Safe recursive setTimeout status polling
  useEffect(() => {
    if (!visible || !paymentData) {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
      return;
    }

    const runPoll = async () => {
      if (stateRef.current.visible && stateRef.current.paymentData) {
        const stillPending = await verifyStatus(stateRef.current.paymentData);
        if (stillPending && stateRef.current.visible) {
          pollingTimeoutRef.current = setTimeout(runPoll, 30000);
        }
      }
    };

    pollingTimeoutRef.current = setTimeout(runPoll, 30000);

    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
    };
  }, [visible, paymentData]);

  const handleDismiss = () => {
    if (!paymentData) return;
    localStorage.setItem(`dismiss_${paymentData.paymentId}`, "true");
    setSlideIn(false);
    setTimeout(() => setVisible(false), 300);
  };

  const handleNavigateToPayment = () => {
    if (!paymentData) return;
    router.push(paymentData.checkoutUrl);
  };

  if (!visible || !paymentData) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-[9999] max-w-sm w-full transition-all duration-500 ease-out transform ${
        slideIn ? "translate-y-0 opacity-100 scale-100" : "translate-y-10 opacity-0 scale-95"
      }`}
    >
      <div className="relative overflow-hidden rounded-2xl border border-brand-border bg-brand-surface/95 backdrop-blur-xl p-5 shadow-2xl flex gap-4">
        {/* Pulsing indicator background gradient */}
        <div className="absolute top-0 left-0 w-2 h-full bg-brand-primary" />

        {/* Icon container */}
        <div className="flex-shrink-0 mt-1">
          <div className="relative w-10 h-10 rounded-full bg-brand-primary-light flex items-center justify-center text-brand-primary">
            <CreditCard className="w-5 h-5" />
            <span className="absolute top-0 right-0 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary/60 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-primary"></span>
            </span>
          </div>
        </div>

        {/* Text and Actions */}
        <div className="flex-1 space-y-3">
          <div>
            <h4 className="font-bold text-brand-text text-sm flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-brand-primary" />
              Đơn hàng chờ thanh toán
            </h4>
            <p className="text-xs text-brand-muted mt-1 leading-relaxed">
              Bạn vẫn còn một đơn hàng chưa hoàn tất thanh toán. Vui lòng thanh toán trước khi liên kết hết hạn.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleNavigateToPayment}
              className="flex-1 px-4 py-2 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold text-xs transition duration-200 active:scale-95 shadow-sm shadow-brand-primary/20"
            >
              Thanh toán ngay
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2 rounded-xl border border-brand-border hover:bg-brand-primary-light/30 text-brand-muted font-medium text-xs transition duration-200"
            >
              Để sau
            </button>
          </div>
        </div>

        {/* X Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-brand-muted hover:text-brand-text transition duration-150"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
