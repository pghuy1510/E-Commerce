"use client";

import { Truck, ShieldCheck, Headphones, Tag } from "lucide-react";
import { usePreferences } from "@/lib/i18n";

export default function ServiceHighlight() {
  const { t } = usePreferences();
  const items = [
    {
      icon: <Truck className="w-7 h-7 text-white" />,
      title: t("service.returnRefundTitle"),
      desc: t("service.returnRefundDesc"),
    },
    {
      icon: <ShieldCheck className="w-7 h-7 text-white" />,
      title: t("service.securePaymentTitle"),
      desc: t("service.securePaymentDesc"),
    },
    {
      icon: <Headphones className="w-7 h-7 text-white" />,
      title: t("service.qualitySupportTitle"),
      desc: t("service.qualitySupportDesc"),
    },
    {
      icon: <Tag className="w-7 h-7 text-white" />,
      title: t("service.dailyOffersTitle"),
      desc: t("service.dailyOffersDesc"),
    },
  ];

  return (
    <section className="w-full flex justify-center mt-10">
      <div className="w-full max-w-7xl bg-[#eee0d9] rounded-xl py-4 px-4 md:px-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 md:divide-x divide-gray-300">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-4 pl-9 pr-4 py-3 group transition-all duration-300 hover:translate-y-[-2px]">
              {/* ICON */}
              <div className="bg-yellow-600 p-5 rounded-lg shadow-sm group-hover:scale-105 transition">
                {item.icon}
              </div>

              {/* TEXT */}
              <div>
                {/* title to + đậm */}
                <h4 className="font-semibold text-lg text-gray-900 group-hover:text-yellow-500 transition">
                  {item.title}
                </h4>

                {/* desc nhỏ giữ nguyên */}
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
