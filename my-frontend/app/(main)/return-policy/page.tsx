"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  Clock3,
  DollarSign,
  ImageUp,
  ShieldCheck,
  Truck,
  XCircle,
} from "lucide-react";

import ReturnTimeline from "@/components/services/ReturnTimeline";
import { usePreferences } from "@/lib/i18n";

const orders = [
  {
    id: "ORD-1001",
    label: "#ORD-1001 · Nike Air Max 270",
    items: [
      { id: "ITEM-1", name: "Nike Air Max 270" },
      { id: "ITEM-2", name: "Nike Air Max 270 Gift Box" },
    ],
  },
  {
    id: "ORD-1002",
    label: "#ORD-1002 · Logitech G Pro X",
    items: [{ id: "ITEM-3", name: "Logitech G Pro X" }],
  },
  {
    id: "ORD-1003",
    label: "#ORD-1003 · MacBook Pro M3",
    items: [{ id: "ITEM-4", name: "MacBook Pro M3" }],
  },
];

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  refunded: "bg-blue-100 text-blue-700 border-blue-200",
};

export default function ReturnPolicyPage() {
  const { t } = usePreferences();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const [form, setForm] = useState({
    orderId: orders[0].id,
    orderItemId: orders[0].items[0].id,
    reason: "",
    note: "",
    images: null as FileList | null,
  });

  const policyConditions = [
    {
      title: t("returnPolicy.conditions.window.title"),
      desc: t("returnPolicy.conditions.window.desc"),
    },
    {
      title: t("returnPolicy.conditions.defect.title"),
      desc: t("returnPolicy.conditions.defect.desc"),
    },
    {
      title: t("returnPolicy.conditions.unused.title"),
      desc: t("returnPolicy.conditions.unused.desc"),
    },
    {
      title: t("returnPolicy.conditions.seal.title"),
      desc: t("returnPolicy.conditions.seal.desc"),
    },
  ];

  const faqItems = [
    {
      question: t("returnPolicy.faq.q1"),
      answer: t("returnPolicy.faq.a1"),
    },
    {
      question: t("returnPolicy.faq.q2"),
      answer: t("returnPolicy.faq.a2"),
    },
    {
      question: t("returnPolicy.faq.q3"),
      answer: t("returnPolicy.faq.a3"),
    },
    {
      question: t("returnPolicy.faq.q4"),
      answer: t("returnPolicy.faq.a4"),
    },
  ];

  const returnStatuses = [
    {
      label: t("returnPolicy.status.pending"),
      value: "pending",
      description: t("returnPolicy.status.pendingDesc"),
    },
    {
      label: t("returnPolicy.status.approved"),
      value: "approved",
      description: t("returnPolicy.status.approvedDesc"),
    },
    {
      label: t("returnPolicy.status.rejected"),
      value: "rejected",
      description: t("returnPolicy.status.rejectedDesc"),
    },
    {
      label: t("returnPolicy.status.refunded"),
      value: "refunded",
      description: t("returnPolicy.status.refundedDesc"),
    },
  ];

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === form.orderId),
    [form.orderId],
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitStatus(null);

    if (!form.orderId || !form.orderItemId || !form.reason.trim()) {
      setSubmitStatus(t("returnPolicy.request.validation"));
      return;
    }

    setSubmitStatus(t("returnPolicy.request.success"));
    setForm((prev) => ({
      ...prev,
      reason: "",
      note: "",
      images: null,
    }));
  };

  return (
    <div className="w-full bg-gray-50">
      {/* HERO */}
      <div className="bg-gradient-to-r from-yellow-600 to-white py-16 text-center">
        <div className="flex items-center justify-center gap-3 text-white mb-3">
          <Truck className="w-7 h-7" />
          <span className="text-sm uppercase tracking-widest">
            {t("returnPolicy.heroTag")}
          </span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900">
          {t("returnPolicy.heroTitle")}
        </h1>
        <p className="text-gray-700 mt-3 max-w-2xl mx-auto">
          {t("returnPolicy.heroSubtitle")}
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-14 space-y-14">
        {/* POLICY CONDITIONS */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {policyConditions.map((item) => (
            <div
              key={item.title}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">
                {item.title}
              </h3>
              <p className="text-sm text-gray-600 mt-2">{item.desc}</p>
            </div>
          ))}
        </section>

        {/* TIMELINE + HIGHLIGHTS */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              {t("returnPolicy.timeline.title")}
            </h2>
            <ReturnTimeline />
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {t("returnPolicy.highlights.title")}
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                {t("returnPolicy.highlights.subtitle")}
              </p>
            </div>

            <div className="flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-yellow-600 mt-1" />
              <div>
                <p className="font-medium text-gray-900">
                  {t("returnPolicy.highlights.protected.title")}
                </p>
                <p className="text-sm text-gray-600">
                  {t("returnPolicy.highlights.protected.desc")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock3 className="w-6 h-6 text-yellow-600 mt-1" />
              <div>
                <p className="font-medium text-gray-900">
                  {t("returnPolicy.highlights.fast.title")}
                </p>
                <p className="text-sm text-gray-600">
                  {t("returnPolicy.highlights.fast.desc")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DollarSign className="w-6 h-6 text-yellow-600 mt-1" />
              <div>
                <p className="font-medium text-gray-900">
                  {t("returnPolicy.highlights.refund.title")}
                </p>
                <p className="text-sm text-gray-600">
                  {t("returnPolicy.highlights.refund.desc")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            {t("returnPolicy.faq.title")}
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
                    <span className="font-medium text-gray-900">
                      {faq.question}
                    </span>
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

        {/* REQUEST RETURN */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                {t("returnPolicy.request.title")}
              </h2>
              <p className="text-sm text-gray-600 mt-2">
                {t("returnPolicy.request.subtitle")}
              </p>
            </div>

            {submitStatus && (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                {submitStatus}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("returnPolicy.form.orderLabel")}
                </label>
                <select
                  value={form.orderId}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      orderId: event.target.value,
                      orderItemId:
                        orders.find((order) => order.id === event.target.value)
                          ?.items[0].id ?? "",
                    }))
                  }
                  className="mt-2 w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-yellow-600">
                  {orders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("returnPolicy.form.productLabel")}
                </label>
                <select
                  value={form.orderItemId}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      orderItemId: event.target.value,
                    }))
                  }
                  className="mt-2 w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-yellow-600">
                  {(selectedOrder?.items ?? []).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("returnPolicy.form.reasonLabel")}
                </label>
                <input
                  value={form.reason}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, reason: event.target.value }))
                  }
                  placeholder={t("returnPolicy.form.reasonPlaceholder")}
                  className="mt-2 w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-yellow-600"
                />
              </div>

            <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("returnPolicy.form.noteLabel")}
                </label>
                <textarea
                  rows={4}
                  value={form.note}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, note: event.target.value }))
                  }
                  placeholder={t("returnPolicy.form.notePlaceholder")}
                  className="mt-2 w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-yellow-600"
                />
              </div>

            <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("returnPolicy.form.uploadLabel")}
                </label>
                <label className="mt-2 flex items-center gap-3 border border-dashed border-gray-300 rounded-2xl px-4 py-4 cursor-pointer hover:border-yellow-600 transition">
                  <ImageUp className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm text-gray-600">
                    {form.images?.length
                      ? t("returnPolicy.form.uploadSelected", {
                          count: form.images.length,
                        })
                      : t("returnPolicy.form.uploadPrompt")}
                  </span>
                <input
                  type="file"
                  multiple
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      images: event.target.files,
                    }))
                  }
                  className="hidden"
                />
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white rounded-full py-3 font-semibold transition">
              {t("returnPolicy.form.submit")}
            </button>
          </form>

          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("returnPolicy.status.title")}
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                {t("returnPolicy.status.subtitle")}
              </p>

              <div className="mt-4 space-y-3">
                {returnStatuses.map((status) => (
                  <div
                    key={status.value}
                    className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {status.label}
                      </p>
                      <p className="text-xs text-gray-500">
                        {status.description}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold border rounded-full px-3 py-1 ${statusStyles[status.value]}`}>
                      {status.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("returnPolicy.refund.title")}
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                {t("returnPolicy.refund.subtitle")}
              </p>
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-4">
                <div>
                  <p className="text-sm text-gray-500">
                    {t("returnPolicy.refund.estimatedLabel")}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">$120.00</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock3 className="w-4 h-4" />
                  {t("returnPolicy.refund.eta")}
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("returnPolicy.latest.title")}
              </h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">
                    {t("returnPolicy.latest.requestId")}
                  </span>
                  <span className="font-medium text-gray-900">RR-2026-058</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">
                    {t("returnPolicy.latest.order")}
                  </span>
                  <span className="font-medium text-gray-900">#ORD-1001</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">
                    {t("returnPolicy.latest.status")}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 text-yellow-700 px-3 py-1 text-xs font-semibold">
                    <Clock3 className="w-3 h-3" />
                    {t("returnPolicy.latest.pendingReview")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">
                    {t("returnPolicy.latest.updated")}
                  </span>
                  <span className="font-medium text-gray-900">
                    {t("returnPolicy.latest.today")}
                  </span>
                </div>
                <button
                  type="button"
                  className="mt-2 w-full border border-gray-300 rounded-full py-2 text-sm font-semibold text-gray-700 hover:border-yellow-600 hover:text-yellow-600 transition">
                  {t("returnPolicy.latest.viewHistory")}
                </button>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("returnPolicy.help.title")}
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                {t("returnPolicy.help.subtitle")}
              </p>
              <div className="mt-4 flex items-center gap-3 text-sm text-gray-700">
                <Truck className="w-4 h-4 text-yellow-600" />
                {t("returnPolicy.help.shipping")}
              </div>
              <div className="mt-2 flex items-center gap-3 text-sm text-gray-700">
                <XCircle className="w-4 h-4 text-yellow-600" />
                {t("returnPolicy.help.escalation")}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
