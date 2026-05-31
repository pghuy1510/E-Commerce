"use client";

import { useState, useEffect, useRef, type ReactElement } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  Headphones,
  Mail,
  MessageSquare,
  Phone,
  SendHorizontal,
  ShieldCheck,
  XCircle,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Clock,
  Loader2,
  Activity,
  PlusCircle,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { contactAPI, orderAPI } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";

type TicketPriority = "low" | "medium" | "high";
type TicketStatus = "open" | "pending" | "in_progress" | "waiting_customer" | "resolved" | "closed";
type TicketSource = "order" | "refund" | "payment" | "account" | "general";

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  source: TicketSource;
  message: string;
  orderId?: string;
  imageProof?: string;
  updated: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  from: "user" | "agent";
  text: string;
  time: string;
}

// Initial Mock Tickets
const initialTickets: SupportTicket[] = [
  {
    id: "SUP-1024",
    subject: "Refund Request for defective laptop screen",
    category: "Refund Request",
    priority: "high",
    status: "in_progress",
    source: "refund",
    message: "Requested refund for order ORD-1004 because the laptop screen had horizontal lines. Awaiting return verification.",
    orderId: "1004",
    updated: "2 hours ago",
    createdAt: "2026-05-30T14:30:00Z",
  },
  {
    id: "SUP-1018",
    subject: "Delivery delay on mechanical keyboard",
    category: "Order Support",
    priority: "medium",
    status: "pending",
    source: "order",
    message: "Keyboard delivery has been delayed for 3 days. Standard shipping status has not been updated since leaving the warehouse.",
    orderId: "1002",
    updated: "Yesterday",
    createdAt: "2026-05-29T10:00:00Z",
  },
  {
    id: "SUP-1009",
    subject: "Payment verification failed for transaction",
    category: "Payment Issue",
    priority: "low",
    status: "resolved",
    source: "payment",
    message: "The banking transfer QR scanned successfully but payment status returned expired. Verified payment confirmation email.",
    orderId: "1003",
    updated: "3 days ago",
    createdAt: "2026-05-27T08:15:00Z",
  },
  {
    id: "SUP-1001",
    subject: "Account validation request",
    category: "Account Help",
    priority: "low",
    status: "closed",
    source: "account",
    message: "Requesting information about account validation rules. Problem solved after checking profile preferences.",
    updated: "Last week",
    createdAt: "2026-05-20T16:45:00Z",
  },
];

const priorityStyles: Record<TicketPriority, string> = {
  high: "bg-red-55 border-red-200 text-red-700",
  medium: "bg-amber-55 border-amber-200 text-amber-700",
  low: "bg-gray-55 border-gray-250 text-gray-700",
};

const statusStyles: Record<TicketStatus, string> = {
  open: "bg-teal-50 text-teal-700 border-teal-200",
  pending: "bg-yellow-50 text-yellow-700 border-yellow-250",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  waiting_customer: "bg-purple-50 text-purple-700 border-purple-250",
  resolved: "bg-green-50 text-green-700 border-green-200",
  closed: "bg-gray-100 text-gray-600 border-gray-200",
};

const statusIcons: Record<TicketStatus, ReactElement> = {
  open: <Activity className="w-3 h-3 text-teal-600" />,
  pending: <Clock3 className="w-3 h-3 text-yellow-600" />,
  in_progress: <ShieldCheck className="w-3 h-3 text-blue-600" />,
  waiting_customer: <HelpCircle className="w-3 h-3 text-purple-600" />,
  resolved: <CheckCircle2 className="w-3 h-3 text-green-600" />,
  closed: <XCircle className="w-3 h-3 text-gray-600" />,
};

export default function SupportPage() {
  const { t, language } = usePreferences();
  const formRef = useRef<HTMLDivElement>(null);

  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "chat-1",
      from: "agent",
      text: t("support.chat.initial"),
      time: "09:30",
    },
  ]);

  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // Form Fields
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    category: "general" as TicketSource,
    priority: "medium" as TicketPriority,
    orderId: "",
    message: "",
  });
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // Captcha & Attachment State
  const [captcha, setCaptcha] = useState({ q: "", ans: 0 });
  const [captchaInput, setCaptchaInput] = useState("");
  const [attachment, setAttachment] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);

  const generateCaptcha = () => {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    setCaptcha({ q: `${a} + ${b} = ?`, ans: a + b });
    setCaptchaInput("");
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert(language === "vi" ? "Kích thước ảnh không được vượt quá 5MB." : "File size cannot exceed 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachment(reader.result as string);
      setAttachmentName(file.name);
    };
    reader.readAsDataURL(file);
  };

  // Fetch recent orders
  useEffect(() => {
    async function loadOrders() {
      try {
        setLoadingOrders(true);
        const data = await orderAPI.list();
        // Slice top 3 most recent orders
        if (data && Array.isArray(data)) {
          setRecentOrders(data.slice(0, 3));
        } else {
          setRecentOrders([]);
        }
      } catch (err) {
        console.error("Failed to load user orders for support:", err);
        setRecentOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    }
    loadOrders();
  }, []);

  const faqItems = [
    {
      category: t("support.faq.shipping.category"),
      question: t("support.faq.shipping.question"),
      answer: t("support.faq.shipping.answer"),
    },
    {
      category: t("support.faq.refund.category"),
      question: t("support.faq.refund.question"),
      answer: t("support.faq.refund.answer"),
    },
    {
      category: t("support.faq.payment.category"),
      question: t("support.faq.payment.question"),
      answer: t("support.faq.payment.answer"),
    },
    {
      category: t("support.faq.account.category"),
      question: t("support.faq.account.question"),
      answer: t("support.faq.account.answer"),
    },
  ];

  // Helper Categories with IDs
  const categoriesList = [
    {
      id: "order" as TicketSource,
      title: t("support.categories.orders"),
      desc: t("support.categories.order.desc"),
    },
    {
      id: "refund" as TicketSource,
      title: t("support.categories.refunds"),
      desc: t("support.categories.refund.desc"),
    },
    {
      id: "payment" as TicketSource,
      title: t("support.categories.payments"),
      desc: t("support.categories.payment.desc"),
    },
    {
      id: "shipping" as TicketSource,
      title: t("support.categories.shipping"),
      desc: t("support.categories.shipping.desc"),
    },
    {
      id: "account" as TicketSource,
      title: t("support.categories.account"),
      desc: t("support.categories.technical.desc"),
    },
  ];

  const handleSelectCategory = (catId: TicketSource) => {
    setForm((prev) => ({ ...prev, category: catId }));
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleNeedHelpWithOrder = (orderId: string) => {
    setForm((prev) => ({
      ...prev,
      category: "order",
      orderId: orderId,
    }));
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleChange = (
    key: keyof typeof form,
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

    if (parseInt(captchaInput) !== captcha.ans) {
      setStatus(language === "vi" ? "Mã CAPTCHA không chính xác, vui lòng thử lại." : "Incorrect CAPTCHA, please try again.");
      generateCaptcha();
      return;
    }

    // Basic Input Sanitization (strip basic HTML tags)
    const sanitizedName = form.name.replace(/<[^>]*>/g, '').trim();
    const sanitizedMessage = form.message.replace(/<[^>]*>/g, '').trim();

    try {
      setLoadingSubmit(true);
      const res = await contactAPI.create({
        name: sanitizedName,
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        message: sanitizedMessage,
        imageProof: attachment || undefined,
      });

      // Optimistic ticket appending incorporating backend ID or fallback
      const ticketId = res?.id || `SUP-${new Date().getFullYear()}-${1000 + Math.floor(Math.random() * 9000)}`;
      const newTicket: SupportTicket = {
        id: ticketId,
        subject: `Request regarding ${t("support.source." + form.category)}`,
        category: t("support.source." + form.category),
        priority: form.priority,
        status: "open",
        source: form.category,
        message: sanitizedMessage,
        imageProof: res?.imageProof || attachment || undefined,
        orderId: form.orderId ? form.orderId.trim() : undefined,
        updated: t("returnPolicy.latest.today"),
        createdAt: new Date().toISOString(),
      };

      setTickets((prev) => [newTicket, ...prev]);
      setStatus(t("support.contact.success"));
      setForm({
        name: "",
        email: "",
        phone: "",
        category: "general",
        priority: "medium",
        orderId: "",
        message: "",
      });
      setAttachment(null);
      setAttachmentName(null);
      generateCaptcha();
    } catch (err) {
      console.error("Support submit error:", err);
      setStatus(t("support.contact.error"));
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleSendChat = () => {
    const trimmed = chatInput.trim();
    if (!trimmed) {
      return;
    }

    const now = new Date();
    const time = now.toLocaleTimeString(language === "vi" ? "vi-VN" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    setChatMessages((prev) => [
      ...prev,
      { id: `chat-${prev.length + 1}`, from: "user", text: trimmed, time },
    ]);
    setChatInput("");

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `chat-${prev.length + 1}`,
          from: "agent",
          text: t("support.chat.response"),
          time,
        },
      ]);
    }, 600);
  };

  // Fallback Mock Orders if recentOrders array is empty
  const displayOrders = recentOrders.length > 0 ? recentOrders : [
    { id: 1001, productName: "Gaming Laptop Pro v2", status: "delivered", totalAmount: 2199000 },
    { id: 1002, productName: "Mechanical Keyboard RGB", status: "delivered", totalAmount: 1200000 },
    { id: 1003, productName: "Wireless Headset Ultra", status: "delivered", totalAmount: 850000 },
  ];

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      {/* HERO BANNER */}
      <div className="bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-500 py-16 text-center shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-center gap-3 text-white/95 mb-4">
            <Headphones className="w-6 h-6 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
              {t("support.heroTag")}
            </span>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl">
            {t("support.heroTitle")}
          </h1>
          <p className="text-yellow-50/90 mt-4 text-base sm:text-lg max-w-2xl mx-auto font-medium">
            {t("support.heroSubtitle")}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 space-y-10">
        
        {/* INTERACTIVE SUPPORT CATEGORIES */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            {t("support.categories.needHelp")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categoriesList.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => handleSelectCategory(category.id)}
                className="bg-white border border-gray-200 rounded-2xl p-5 text-left transition duration-300 hover:border-yellow-500 hover:shadow-md focus:outline-none"
              >
                <h3 className="text-base font-bold text-gray-900">
                  {category.title}
                </h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  {category.desc}
                </p>
                <div className="mt-3 flex items-center text-xs font-semibold text-yellow-600 gap-0.5">
                  <span>{t("action.shopNowPlain")}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ORDER HELP & RETURN INTEGRATION BANNERS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* RECENT ORDERS NEED HELP */}
          <section className="md:col-span-2 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight mb-1">
                {t("support.orders.title")}
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Select one of your recent orders to pre-fill support details immediately.
              </p>
            </div>

            {loadingOrders ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 text-yellow-600 animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {displayOrders.map((order: any) => (
                  <div
                    key={order.id}
                    className="flex flex-wrap items-center justify-between gap-3 border border-gray-100 bg-gray-50/50 rounded-2xl p-4 hover:bg-gray-50 transition duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-yellow-100 text-yellow-700 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0">
                        #ORD
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {order.productName || `Order #${order.id}`}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          ID: #{order.id} · {order.statusLabel || order.status}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNeedHelpWithOrder(order.id.toString())}
                      className="px-3.5 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white font-bold text-xs rounded-full shadow-sm transition"
                    >
                      {t("support.orders.needHelp")}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* RETURNS SHORTCUT & POLICY LINK */}
          <section className="bg-gradient-to-br from-yellow-50 to-amber-100/50 border border-yellow-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 bg-yellow-600 text-white rounded-xl flex items-center justify-center shadow-sm">
                <ExternalLink className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                {t("support.refund.help.title")}
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                If you need to return a delivered item or request a refund, you can initiate a formal claim directly from your Order History panel.
              </p>
            </div>
            <Link
              href="/orders"
              className="mt-6 w-full text-center bg-gray-900 hover:bg-gray-800 text-white rounded-full py-2.5 text-xs font-bold shadow-sm transition inline-block"
            >
              {t("support.refund.help.action")}
            </Link>
          </section>

        </div>

        {/* TWO COLUMN CONTACT AND SIDEBAR */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CONTACT FORM CARD */}
          <section ref={formRef} className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              {t("support.contact.title")}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {t("support.contact.subtitle")}
            </p>

            <form className="space-y-5 mt-6" onSubmit={handleSubmit}>
              {status && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 font-medium">
                  {status}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">{t("label.fullName")}</label>
                  <input
                    type="text"
                    required
                    placeholder={t("support.contact.namePlaceholder")}
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">{t("label.email")}</label>
                  <input
                    type="email"
                    required
                    placeholder={t("support.contact.emailPlaceholder")}
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">{t("support.hotline.phoneLabel")}</label>
                  <input
                    type="text"
                    placeholder={t("support.contact.phonePlaceholder")}
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">{t("support.contact.orderId")}</label>
                  <input
                    type="text"
                    placeholder="e.g. 1002"
                    value={form.orderId}
                    onChange={(e) => handleChange("orderId", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">{t("support.contact.category")}</label>
                  <select
                    value={form.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-yellow-500"
                  >
                    <option value="general">{t("support.source.general")}</option>
                    <option value="order">{t("support.source.order")}</option>
                    <option value="refund">{t("support.source.refund")}</option>
                    <option value="payment">{t("support.source.payment")}</option>
                    <option value="account">{t("support.source.account")}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">{t("support.contact.priority")}</label>
                  <select
                    value={form.priority}
                    onChange={(e) => handleChange("priority", e.target.value)}
                    className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-yellow-500"
                  >
                    <option value="low">{t("support.ticket.priority.low")}</option>
                    <option value="medium">{t("support.ticket.priority.medium")}</option>
                    <option value="high">{t("support.ticket.priority.high")}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">{t("support.ticket.detail.message")}</label>
                <textarea
                  required
                  placeholder={t("support.contact.messagePlaceholder")}
                  rows={4}
                  value={form.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                />
              </div>

              {/* ATTACHMENT UPLOAD */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700">
                  {language === "vi" ? "Minh chứng đính kèm (Ảnh/Hóa đơn - Tối đa 5MB)" : "Attachment Proof (Image/Invoice - Max 5MB)"}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100 cursor-pointer"
                  />
                  {attachmentName && (
                    <span className="text-xs font-bold text-emerald-600 truncate max-w-[200px]">
                      ✓ {attachmentName}
                    </span>
                  )}
                </div>
              </div>

              {/* CAPTCHA ANTI-SPAM */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-150 space-y-2">
                <label className="block text-xs font-bold text-gray-700">
                  {language === "vi" ? "Mã bảo vệ (CAPTCHA)" : "Security Code (CAPTCHA)"}
                </label>
                <div className="flex items-center gap-4">
                  <span className="font-extrabold text-gray-800 text-sm bg-white px-4 py-2 border rounded-xl shadow-xs tracking-wider select-none">
                    {captcha.q}
                  </span>
                  <input
                    type="text"
                    required
                    placeholder={language === "vi" ? "Kết quả" : "Result"}
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    className="w-28 border border-gray-250 rounded-xl px-4 py-2 text-sm outline-none focus:border-yellow-500 font-bold text-center"
                  />
                </div>
                <p className="text-[10px] text-gray-400 font-medium">
                  {language === "vi" 
                    ? "* Lưu ý: Trong môi trường production, Cloudflare Turnstile sẽ được sử dụng thay thế." 
                    : "* Note: Cloudflare Turnstile would be used for production rate limiting."}
                </p>
              </div>

              <button
                type="submit"
                disabled={loadingSubmit}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-full text-sm font-bold shadow-sm transition disabled:opacity-60 cursor-pointer animate-none"
              >
                {loadingSubmit ? t("label.loading") : t("support.contact.submit")}
              </button>
            </form>
          </section>

          {/* HOTLINE CARD & SLA */}
          <div className="space-y-6">
            <section className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                  {t("support.hotline.title")}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t("support.hotline.subtitle")}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-sm text-gray-800">
                      {t("support.hotline.phoneLabel")}
                    </p>
                    <p className="text-sm text-gray-600 font-semibold mt-0.5">1900 636 999</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-sm text-gray-800">
                      {t("support.hotline.emailLabel")}
                    </p>
                    <p className="text-sm text-gray-600 font-semibold mt-0.5">support@ecommerce.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock3 className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-sm text-gray-800">
                      {t("support.hotline.hoursLabel")}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      {t("support.hotline.hoursValue")}
                    </p>
                  </div>
                </div>
              </div>

              {/* SLA SECTION */}
              <div className="pt-5 border-t border-gray-100 space-y-3">
                <p className="text-xs font-extrabold text-gray-900 uppercase tracking-widest">
                  {t("support.hotline.sla.title")}
                </p>
                <div className="grid grid-cols-1 gap-2 text-xs font-semibold text-gray-600">
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2.5 border">
                    <span>{t("support.hotline.chatButton")}</span>
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      {t("support.hotline.sla.chat").replace("Live Chat: ", "")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2.5 border">
                    <span>Email</span>
                    <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                      {t("support.hotline.sla.email").replace("Email: ", "")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2.5 border">
                    <span>Hotline</span>
                    <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                      {t("support.hotline.sla.phone").replace("Phone: ", "")}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowChat(true)}
                className="w-full mt-2 bg-gray-900 text-white rounded-full py-3 text-sm font-bold hover:bg-gray-800 transition"
              >
                {t("support.hotline.chatButton")}
              </button>
            </section>
          </div>
        </div>

        {/* SUPPORT TICKETS HISTORY */}
        <section className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                {t("support.ticket.title")}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {t("support.ticket.subtitle")}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 bg-gray-50 px-3.5 py-1.5 rounded-full border">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              <span>
                {t("support.ticket.activeCount", {
                  count: tickets.length,
                })}
              </span>
            </div>
          </div>

          {!tickets.length ? (
            /* TICKETS EMPTY STATE */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4 border shadow-inner">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">
                {t("support.tickets.empty.title")}
              </h3>
              <p className="text-sm text-gray-500 mt-1.5 max-w-sm leading-relaxed">
                {t("support.tickets.empty.subtitle")}
              </p>
            </div>
          ) : (
            <div className="mt-6 divide-y divide-gray-100 border border-gray-150 rounded-2xl overflow-hidden bg-white">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-gray-900 text-sm tracking-tight">
                        {ticket.id}
                      </span>
                      <span className="text-xs text-gray-400">|</span>
                      <span className="text-xs text-gray-500 font-medium">
                        {ticket.updated}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full border bg-gray-50 text-gray-600">
                        {t(`support.source.${ticket.source}`)}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${priorityStyles[ticket.priority]}`}>
                        {t(`support.ticket.priority.${ticket.priority}`)}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-800 text-base leading-snug pt-1">
                      {ticket.subject}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        statusStyles[ticket.status]
                      }`}
                    >
                      {statusIcons[ticket.status]}
                      {t(`support.status.${ticket.status}`)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedTicket(ticket)}
                      className="px-3.5 py-1.5 border hover:border-gray-400 text-xs font-bold text-gray-700 bg-white rounded-full transition shadow-sm"
                    >
                      {t("support.ticket.action.view")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* FAQ ACCORDION */}
        <section className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-6">
            {t("support.faq.title")}
          </h2>

          <div className="space-y-3.5">
            {faqItems.map((faq, index) => {
              const isOpen = openFaq === index;

              return (
                <button
                  key={faq.question}
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full text-left border border-gray-200 rounded-2xl px-5 py-4 hover:border-yellow-500 hover:shadow-sm transition duration-200 focus:outline-none"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase text-yellow-600 font-extrabold tracking-wider">
                        {faq.category}
                      </p>
                      <p className="font-bold text-gray-800 mt-1 leading-snug">
                        {faq.question}
                      </p>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                        isOpen ? "rotate-180 text-yellow-600" : ""
                      }`}
                    />
                  </div>
                  {isOpen && (
                    <p className="text-sm text-gray-500 mt-3.5 leading-relaxed pt-3 border-t border-gray-100">
                      {faq.answer}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* FLOATING CHAT TRIGGER */}
      <button
        type="button"
        onClick={() => setShowChat((prev) => !prev)}
        className="fixed bottom-6 right-6 bg-yellow-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-yellow-700 transition duration-300 z-40"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* VIRTUAL ASSISTANT DEMO LIVE CHAT BOX */}
      {showChat && (
        <div className="fixed bottom-24 right-6 w-80 bg-white border border-gray-200 rounded-3xl shadow-xl overflow-hidden z-50">
          <div className="bg-gray-900 text-white px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Headphones className="w-4 h-4 text-yellow-500" />
              <span className="font-bold text-sm">{t("support.chat.demoTitle")}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowChat(false)}
              className="text-xs text-gray-400 hover:text-white transition"
            >
              {t("support.chat.close")}
            </button>
          </div>

          <div className="h-72 overflow-y-auto px-4 py-4 space-y-3.5 text-xs bg-gray-50/50">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.from === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`rounded-2xl px-3.5 py-2.5 max-w-[80%] shadow-sm leading-relaxed ${
                    message.from === "user"
                      ? "bg-yellow-600 text-white rounded-tr-none"
                      : "bg-white border text-gray-700 rounded-tl-none"
                  }`}
                >
                  <p>{message.text}</p>
                  <span className="block text-[9px] mt-1 text-right opacity-60">
                    {message.time}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 px-3 py-3 flex items-center gap-2 bg-white">
            <input
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendChat();
              }}
              placeholder={t("support.chat.placeholder")}
              className="flex-1 border border-gray-250 rounded-full px-4 py-2 text-xs outline-none focus:border-yellow-500"
            />
            <button
              type="button"
              onClick={handleSendChat}
              className="bg-yellow-600 text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-yellow-700 transition"
            >
              <SendHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TICKET DETAILS MODAL OVERLAY */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg border overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gray-900 text-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs uppercase bg-white/20 px-2.5 py-1 rounded-full font-bold">
                    {t("support.ticket.detail.title")}
                  </span>
                  <h3 className="text-lg font-bold mt-2.5 leading-snug">
                    {selectedTicket.subject}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="text-gray-400 hover:text-white transition text-sm font-semibold"
                >
                  {t("support.ticket.detail.close")}
                </button>
              </div>
            </div>

            {/* Content body */}
            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-4">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">{t("support.ticket.detail.id")}</p>
                  <p className="font-bold text-gray-800 mt-0.5">{selectedTicket.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">{t("support.ticket.detail.status")}</p>
                  <div className="mt-0.5">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusStyles[selectedTicket.status]}`}>
                      {statusIcons[selectedTicket.status]}
                      {t(`support.status.${selectedTicket.status}`)}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">{t("support.ticket.detail.source")}</p>
                  <p className="font-bold text-gray-800 mt-0.5">
                    {t(`support.source.${selectedTicket.source}`)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">{t("support.ticket.detail.priority")}</p>
                  <div className="mt-0.5">
                    <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${priorityStyles[selectedTicket.priority]}`}>
                      {t(`support.ticket.priority.${selectedTicket.priority}`)}
                    </span>
                  </div>
                </div>
                {selectedTicket.orderId && (
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase">{t("support.ticket.detail.orderId")}</p>
                    <p className="font-mono font-bold text-yellow-600 mt-0.5">#ORD-{selectedTicket.orderId}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">{t("support.ticket.detail.created")}</p>
                  <p className="font-semibold text-gray-600 mt-0.5">{selectedTicket.updated}</p>
                </div>
              </div>

              {/* ATTACHMENT VIEW IN MODAL */}
              {selectedTicket.imageProof && (
                <div className="pt-2">
                  <p className="text-xs text-gray-400 font-semibold uppercase mb-1.5">
                    {language === "vi" ? "Tài liệu đính kèm" : "Attachment"}
                  </p>
                  <div className="border border-amber-100 rounded-2xl p-3 bg-amber-50/10 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-gray-700 truncate max-w-[200px]">
                      {selectedTicket.imageProof.split("/").pop()}
                    </span>
                    <a
                      href={selectedTicket.imageProof.startsWith("data:") ? selectedTicket.imageProof : `http://localhost:3001${selectedTicket.imageProof}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-full text-xs font-bold shadow-sm transition"
                    >
                      {language === "vi" ? "Xem tài liệu" : "View"}
                    </a>
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase mb-1.5">{t("support.ticket.detail.message")}</p>
                <div className="bg-gray-50 border rounded-2xl p-4 text-gray-700 leading-relaxed text-xs max-h-40 overflow-y-auto">
                  {selectedTicket.message}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end border-t">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="px-5 py-2 rounded-full bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs transition"
              >
                {t("support.ticket.detail.close")}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
