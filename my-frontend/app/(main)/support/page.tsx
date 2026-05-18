"use client";

import { useState } from "react";
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
} from "lucide-react";
import { contactAPI } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  processing: "bg-blue-100 text-blue-700 border-blue-200",
  resolved: "bg-green-100 text-green-700 border-green-200",
  closed: "bg-gray-100 text-gray-600 border-gray-200",
};

const statusIcons: Record<string, JSX.Element> = {
  pending: <Clock3 className="w-3 h-3" />,
  processing: <ShieldCheck className="w-3 h-3" />,
  resolved: <CheckCircle2 className="w-3 h-3" />,
  closed: <XCircle className="w-3 h-3" />,
};

type ChatMessage = {
  id: string;
  from: "user" | "agent";
  text: string;
  time: string;
};

export default function SupportPage() {
  const { t, language } = usePreferences();
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

  const categories = [
    {
      title: t("support.categories.order.title"),
      desc: t("support.categories.order.desc"),
    },
    {
      title: t("support.categories.refund.title"),
      desc: t("support.categories.refund.desc"),
    },
    {
      title: t("support.categories.payment.title"),
      desc: t("support.categories.payment.desc"),
    },
    {
      title: t("support.categories.shipping.title"),
      desc: t("support.categories.shipping.desc"),
    },
    {
      title: t("support.categories.technical.title"),
      desc: t("support.categories.technical.desc"),
    },
  ];

  const ticketStatuses = [
    {
      id: "SUP-1024",
      subject: t("support.ticket.subject.refund"),
      status: "processing",
      updated: t("support.ticket.updated.hoursAgo", { count: 2 }),
    },
    {
      id: "SUP-1018",
      subject: t("support.ticket.subject.delivery"),
      status: "pending",
      updated: t("support.ticket.updated.yesterday"),
    },
    {
      id: "SUP-1009",
      subject: t("support.ticket.subject.paymentFailed"),
      status: "resolved",
      updated: t("support.ticket.updated.daysAgo", { count: 3 }),
    },
    {
      id: "SUP-1001",
      subject: t("support.ticket.subject.account"),
      status: "closed",
      updated: t("support.ticket.updated.lastWeek"),
    },
  ];

  const statusLabels: Record<string, string> = {
    pending: t("support.status.pending"),
    processing: t("support.status.processing"),
    resolved: t("support.status.resolved"),
    closed: t("support.status.closed"),
  };

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
      setStatus(t("support.contact.validation"));
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

      setStatus(t("support.contact.success"));
      setForm({
        name: "",
        email: "",
        phone: "",
        message: "",
      });
    } catch (err) {
      console.error("Support submit error:", err);
      setStatus(t("support.contact.error"));
    } finally {
      setLoading(false);
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

  return (
    <div className="w-full bg-gray-50">
      {/* HERO */}
      <div className="bg-gradient-to-r from-yellow-600 to-white py-16 text-center">
        <div className="flex items-center justify-center gap-3 text-white mb-3">
          <Headphones className="w-7 h-7" />
          <span className="text-sm uppercase tracking-widest">
            {t("support.heroTag")}
          </span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900">
          {t("support.heroTitle")}
        </h1>
        <p className="text-gray-700 mt-3 max-w-2xl mx-auto">
          {t("support.heroSubtitle")}
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-14 space-y-12">
        {/* SUPPORT CATEGORIES */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          {categories.map((category) => (
            <div
              key={category.title}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">
                {category.title}
              </h3>
              <p className="text-sm text-gray-600 mt-2">{category.desc}</p>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* CONTACT FORM */}
          <section className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900">
              {t("support.contact.title")}
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              {t("support.contact.subtitle")}
            </p>

            <form className="space-y-4 mt-6" onSubmit={handleSubmit}>
              {status && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  {status}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder={t("support.contact.namePlaceholder")}
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="w-full border rounded-xl px-4 py-3 outline-none focus:border-yellow-600"
                />
                <input
                  type="email"
                  placeholder={t("support.contact.emailPlaceholder")}
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full border rounded-xl px-4 py-3 outline-none focus:border-yellow-600"
                />
              </div>

              <input
                type="text"
                placeholder={t("support.contact.phonePlaceholder")}
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="w-full border rounded-xl px-4 py-3 outline-none focus:border-yellow-600"
              />

              <textarea
                placeholder={t("support.contact.messagePlaceholder")}
                rows={5}
                value={form.message}
                onChange={(e) => handleChange("message", e.target.value)}
                className="w-full border rounded-xl px-4 py-3 outline-none focus:border-yellow-600"
              />

              <button
                type="submit"
                disabled={loading}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-full transition">
                {loading ? t("label.loading") : t("support.contact.submit")}
              </button>
            </form>
          </section>

          {/* HOTLINE CARD */}
          <section className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-5">
            <h2 className="text-2xl font-semibold text-gray-900">
              {t("support.hotline.title")}
            </h2>
            <p className="text-sm text-gray-600">
              {t("support.hotline.subtitle")}
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-yellow-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">
                    {t("support.hotline.phoneLabel")}
                  </p>
                  <p className="text-sm text-gray-600">1900 636 999</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-yellow-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">
                    {t("support.hotline.emailLabel")}
                  </p>
                  <p className="text-sm text-gray-600">support@ecommerce.com</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock3 className="w-5 h-5 text-yellow-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">
                    {t("support.hotline.hoursLabel")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("support.hotline.hoursValue")}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowChat(true)}
              className="w-full mt-2 bg-gray-900 text-white rounded-full py-3 font-semibold hover:bg-gray-800 transition">
              {t("support.hotline.chatButton")}
            </button>
          </section>
        </div>

        {/* FAQ */}
        <section className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            {t("support.faq.title")}
          </h2>

          <div className="space-y-3">
            {faqItems.map((faq, index) => {
              const isOpen = openFaq === index;

              return (
                <button
                  key={faq.question}
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full text-left border border-gray-200 rounded-2xl px-5 py-4 hover:border-yellow-600 transition">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase text-yellow-600 font-semibold">
                        {faq.category}
                      </p>
                      <p className="font-medium text-gray-900 mt-1">
                        {faq.question}
                      </p>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-500 transition ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                  {isOpen && (
                    <p className="text-sm text-gray-600 mt-3">{faq.answer}</p>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* TICKET STATUS */}
        <section className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                {t("support.ticket.title")}
              </h2>
              <p className="text-sm text-gray-600 mt-2">
                {t("support.ticket.subtitle")}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MessageSquare className="w-4 h-4" />
              {t("support.ticket.activeCount", {
                count: ticketStatuses.length,
              })}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {ticketStatuses.map((ticket) => (
              <div
                key={ticket.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-gray-200 rounded-2xl px-4 py-3">
                <div>
                  <p className="font-semibold text-gray-900">
                    {ticket.subject}
                  </p>
                  <p className="text-sm text-gray-600">
                    {ticket.id} · {ticket.updated}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${
                    statusStyles[ticket.status]
                  }`}>
                  {statusIcons[ticket.status]}
                  {statusLabels[ticket.status] ?? ticket.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* FLOATING CHAT */}
      <button
        type="button"
        onClick={() => setShowChat((prev) => !prev)}
        className="fixed bottom-6 right-6 bg-yellow-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-yellow-700 transition">
        <MessageSquare className="w-6 h-6" />
      </button>

      {showChat && (
        <div className="fixed bottom-24 right-6 w-80 bg-white border border-gray-200 rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Headphones className="w-4 h-4" />
              <span className="font-semibold">{t("support.chat.title")}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowChat(false)}
              className="text-sm text-gray-300 hover:text-white">
              {t("support.chat.close")}
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto px-4 py-3 space-y-3 text-sm">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.from === "user" ? "justify-end" : "justify-start"
                }`}>
                <div
                  className={`rounded-2xl px-3 py-2 max-w-[80%] ${
                    message.from === "user"
                      ? "bg-yellow-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}>
                  <p>{message.text}</p>
                  <span className="block text-[10px] mt-1 opacity-70">
                    {message.time}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 px-3 py-3 flex items-center gap-2">
            <input
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder={t("support.chat.placeholder")}
              className="flex-1 border border-gray-200 rounded-full px-3 py-2 text-sm outline-none focus:border-yellow-600"
            />
            <button
              type="button"
              onClick={handleSendChat}
              className="bg-yellow-600 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-yellow-700 transition">
              <SendHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
