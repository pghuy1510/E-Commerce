"use client";

import { useEffect, useState } from "react";
import { usePreferences } from "@/lib/i18n";
import { ShieldCheck, X } from "lucide-react";

export default function CookieConsent() {
  const { language } = usePreferences();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent-accepted");
    if (!consent) {
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent-accepted", "true");
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie-consent-accepted", "declined");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:max-w-md bg-white/95 backdrop-blur-sm border border-amber-100 shadow-2xl rounded-3xl p-5 md:p-6 z-50 animate-in fade-in slide-in-from-bottom-8 duration-300">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-sm">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="font-extrabold text-sm text-gray-900 tracking-tight">
            {language === "vi" ? "Chính sách Cookie & Quyền riêng tư" : "Cookie & Privacy Policy"}
          </h4>
          <p className="text-xs text-gray-500 leading-relaxed font-medium">
            {language === "vi"
              ? "Chúng tôi sử dụng cookie để cải thiện trải nghiệm duyệt web của bạn, hiển thị nội dung cá nhân hóa và phân tích lưu lượng truy cập. Bằng cách nhấp vào \"Đồng ý tất cả\", bạn đồng ý với việc sử dụng cookie của chúng tôi."
              : "We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking \"Accept All\", you consent to our use of cookies."}
          </p>
        </div>
        <button
          type="button"
          onClick={handleDecline}
          className="text-gray-400 hover:text-gray-600 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={handleDecline}
          className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 transition cursor-pointer"
        >
          {language === "vi" ? "Từ chối" : "Decline"}
        </button>
        <button
          type="button"
          onClick={handleAccept}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-full text-xs font-bold shadow-md hover:shadow-lg transition focus:outline-none cursor-pointer"
        >
          {language === "vi" ? "Đồng ý tất cả" : "Accept All"}
        </button>
      </div>
    </div>
  );
}
