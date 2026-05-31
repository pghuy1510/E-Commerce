"use client";

import { useState } from "react";
import {
  ChevronDown,
  Clock3,
  DollarSign,
  ShieldCheck,
  Truck,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  MessageSquare
} from "lucide-react";

import ReturnTimeline from "@/components/services/ReturnTimeline";
import { usePreferences } from "@/lib/i18n";

export default function ReturnPolicyPage() {
  const { t } = usePreferences();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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

        {/* ELIGIBLE & NON-RETURNABLE PRODUCTS */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-green-50 rounded-2xl text-green-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Sản phẩm đủ điều kiện đổi trả
              </h2>
            </div>
            <ul className="space-y-4 text-sm text-gray-600">
              <li className="flex gap-2">
                <span className="text-green-500 font-bold">•</span>
                <span>Sản phẩm bị lỗi kỹ thuật hoặc hư hỏng do lỗi từ nhà sản xuất.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-500 font-bold">•</span>
                <span>Sản phẩm bị giao sai quy cách, sai màu sắc, kích thước so với đơn đặt hàng.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-500 font-bold">•</span>
                <span>Sản phẩm còn nguyên mới, chưa qua sử dụng, còn đầy đủ tem nhãn và niêm phong của nhà sản xuất.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-500 font-bold">•</span>
                <span>Hộp và bao bì sản phẩm phải còn nguyên vẹn, không có dấu hiệu móp méo nghiêm trọng.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-50 rounded-2xl text-red-600">
                <XCircle className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Sản phẩm không hỗ trợ đổi trả
              </h2>
            </div>
            <ul className="space-y-4 text-sm text-gray-600">
              <li className="flex gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span>Sản phẩm thuộc chương trình thanh lý hàng tồn kho, giảm giá sâu (được gắn nhãn Final Sale).</span>
              </li>
              <li className="flex gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span>Sản phẩm thuộc ngành hàng đồ lót, đồ mặc nhà, sản phẩm vệ sinh cá nhân khi đã tháo niêm phong.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span>Sản phẩm bị hư hỏng do tác động vật lý của khách hàng (làm rơi vỡ, trầy xước, giặt ủi sai quy cách).</span>
              </li>
              <li className="flex gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span>Yêu cầu đổi trả gửi trễ sau 7 ngày kể từ khi đơn hàng được đánh dấu giao thành công.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* SUPPORT CONTACT INFORMATION */}
        <section className="bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900">Bạn cần hỗ trợ thêm?</h2>
            <p className="text-sm text-gray-600 max-w-xl">
              Đội ngũ chăm sóc khách hàng của chúng tôi sẵn sàng hỗ trợ giải đáp mọi thắc mắc về quy trình đổi trả hàng và hoàn tiền 24/7.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-shrink-0">
            <div className="bg-white border border-gray-150 rounded-2xl p-4 flex items-center gap-3">
              <Phone className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Hotline</p>
                <p className="text-xs font-bold text-gray-800">1900 636 999</p>
              </div>
            </div>
            <div className="bg-white border border-gray-150 rounded-2xl p-4 flex items-center gap-3">
              <Mail className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Email hỗ trợ</p>
                <p className="text-xs font-bold text-gray-800 font-mono">support@ecommerce.com</p>
              </div>
            </div>
            <div className="bg-white border border-gray-150 rounded-2xl p-4 flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Trực tuyến</p>
                <p className="text-xs font-bold text-gray-800">Live chat 24/7</p>
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

      </div>
    </div>
  );
}
