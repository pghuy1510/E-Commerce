"use client";

import { useState } from "react";
import { contactAPI } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";
import { Mail, Phone, MapPin } from "lucide-react";
import PageHero from "@/components/layout/PageHero";

export default function ContactPage() {
  const { t, language } = usePreferences();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleChange = (
    key: "name" | "email" | "phone" | "message",
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus(null);

    if (!form.name || !form.email || !form.message) {
      setStatus(language === "vi" ? "Vui lòng nhập tên, email và lời nhắn." : "Please fill in your name, email, and message.");
      return;
    }

    try {
      setLoading(true);
      await contactAPI.create({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        message: form.message.trim(),
      });

      setStatus(language === "vi" ? "Tin nhắn của bạn đã được gửi thành công!" : "Your message has been sent. We'll get back to you soon!");
      setForm({
        name: "",
        email: "",
        phone: "",
        message: "",
      });
    } catch (err) {
      console.error("Contact submit error:", err);
      setStatus(language === "vi" ? "Không thể gửi tin nhắn. Vui lòng thử lại sau." : "Failed to send message. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-brand-bg min-h-screen pb-16">
      <PageHero
        variant="default"
        title={t("nav.contact")}
        description={language === "vi" ? "Chúng tôi luôn sẵn sàng hỗ trợ bạn. Hãy liên hệ bất cứ lúc nào." : "We are here to help you. Get in touch with us anytime."}
        breadcrumbs={[{ label: t("nav.contact") }]}
        centered={true}
        className="mb-12"
      />

      <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-10">
        {/* INFO */}
        <div className="space-y-6">
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm flex items-start gap-4">
            <div className="bg-brand-primary-light/40 text-brand-primary p-3 rounded-xl border border-brand-border">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-text mb-1">{language === "vi" ? "Số điện thoại" : "Phone"}</h2>
              <p className="text-brand-muted font-medium">+84 971 599 019</p>
            </div>
          </div>

          <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm flex items-start gap-4">
            <div className="bg-brand-primary-light/40 text-brand-primary p-3 rounded-xl border border-brand-border">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-text mb-1">Email</h2>
              <p className="text-brand-muted font-medium">ecommerce@gmail.com</p>
            </div>
          </div>

          <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm flex items-start gap-4">
            <div className="bg-brand-primary-light/40 text-brand-primary p-3 rounded-xl border border-brand-border">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-text mb-1">{language === "vi" ? "Địa chỉ" : "Address"}</h2>
              <p className="text-brand-muted font-medium">Bac Giang, Vietnam</p>
            </div>
          </div>
        </div>

        {/* FORM */}
        <form className="space-y-5 bg-brand-surface border border-brand-border rounded-3xl p-6 md:p-8 shadow-sm" onSubmit={handleSubmit}>
          {status && (
            <div className="rounded-xl border border-brand-border bg-brand-bg/50 px-4 py-3 text-sm text-brand-text font-medium">
              {status}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-brand-text">{language === "vi" ? "Họ và tên" : "Your Name"}</label>
            <input
              type="text"
              placeholder={language === "vi" ? "Nhập họ và tên" : "Your Name"}
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full border border-brand-border bg-brand-surface text-brand-text rounded-xl px-4 py-3 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-brand-text">Email</label>
            <input
              type="email"
              placeholder={language === "vi" ? "Nhập địa chỉ email" : "Your Email"}
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full border border-brand-border bg-brand-surface text-brand-text rounded-xl px-4 py-3 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-brand-text">{language === "vi" ? "Số điện thoại (tuỳ chọn)" : "Phone (optional)"}</label>
            <input
              type="text"
              placeholder={language === "vi" ? "Nhập số điện thoại" : "Phone (optional)"}
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="w-full border border-brand-border bg-brand-surface text-brand-text rounded-xl px-4 py-3 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-brand-text">{language === "vi" ? "Lời nhắn" : "Your Message"}</label>
            <textarea
              placeholder={language === "vi" ? "Nhập nội dung lời nhắn..." : "Your Message"}
              rows={6}
              value={form.message}
              onChange={(e) => handleChange("message", e.target.value)}
              className="w-full border border-brand-border bg-brand-surface text-brand-text rounded-xl px-4 py-3 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white px-6 py-3 rounded-full text-sm font-bold shadow-md hover:shadow-lg transition disabled:opacity-60 cursor-pointer">
            {loading ? (language === "vi" ? "Đang gửi..." : "Sending...") : (language === "vi" ? "Gửi tin nhắn" : "Send Message")}
          </button>
        </form>
      </div>
    </div>
  );
}
