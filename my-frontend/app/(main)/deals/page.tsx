"use client";

import { useState } from "react";
import {
  BadgePercent,
  CalendarClock,
  Gift,
  Sparkles,
  Tag,
  TrendingUp,
} from "lucide-react";
import DealCountdown from "@/components/services/DealCountdown";
import { usePreferences } from "@/lib/i18n";

const flashSales = [
  {
    id: "flash-1",
    name: "Nike Air Max 270",
    price: "$180",
    discount: "-30%",
    sold: 72,
    stock: 100,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "flash-2",
    name: "Apple Watch Series 9",
    price: "$399",
    discount: "-25%",
    sold: 46,
    stock: 60,
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "flash-3",
    name: "Sony WH-1000XM5",
    price: "$299",
    discount: "-20%",
    sold: 63,
    stock: 80,
    image:
      "https://images.unsplash.com/photo-1518441902113-f5c08d74d451?q=80&w=800&auto=format&fit=crop",
  },
];

const discountProducts = [
  {
    id: "deal-1",
    name: "Keychron K6 Keyboard",
    price: "$90",
    discount: "15%",
    image:
      "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "deal-2",
    name: "Logitech G Pro X",
    price: "$120",
    discount: "20%",
    image:
      "https://images.unsplash.com/photo-1527814050087-3793815479db?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "deal-3",
    name: "MacBook Pro M3",
    price: "$2,199",
    discount: "10%",
    image:
      "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "deal-4",
    name: "iPhone 15 Pro",
    price: "$1,399",
    discount: "8%",
    image:
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=800&auto=format&fit=crop",
  },
];

const coupons = [
  { code: "DEAL10", discount: "10%", expires: "2026-06-01" },
  { code: "WEEKEND15", discount: "15%", expires: "2026-06-05" },
  { code: "FLASH20", discount: "20%", expires: "2026-06-10" },
];

export default function DealsPage() {
  const { t } = usePreferences();
  const [showCoupon, setShowCoupon] = useState(true);
  const dealCategories = [
    t("deals.categories.hotDeals"),
    t("deals.categories.bestSeller"),
    t("deals.categories.newArrival"),
    t("deals.categories.limitedOffer"),
    t("deals.categories.weekendSale"),
  ];
  const personalizedSections = [
    {
      title: t("deals.personalized.recentlyViewed"),
      icon: CalendarClock,
      items: discountProducts.slice(0, 3),
    },
    {
      title: t("deals.personalized.recommended"),
      icon: Sparkles,
      items: discountProducts.slice(1, 4),
    },
    {
      title: t("deals.personalized.trending"),
      icon: TrendingUp,
      items: discountProducts.slice(0, 3),
    },
  ];

  return (
    <div className="w-full bg-gray-50">
      {/* HERO */}
      <div className="bg-gradient-to-r from-yellow-600 to-white py-16 text-center">
        <div className="flex items-center justify-center gap-3 text-white mb-3">
          <Tag className="w-7 h-7" />
          <span className="text-sm uppercase tracking-widest">
            {t("deals.heroTag")}
          </span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900">
          {t("deals.heroTitle")}
        </h1>
        <p className="text-gray-700 mt-3 max-w-2xl mx-auto">
          {t("deals.heroSubtitle")}
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-14 space-y-12">
        {/* DEAL CATEGORIES */}
        <section className="flex flex-wrap gap-3">
          {dealCategories.map((category) => (
            <span
              key={category}
              className="px-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700">
              {category}
            </span>
          ))}
        </section>

        {/* BIG BANNERS */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-sm text-yellow-600 font-semibold uppercase">
                {t("deals.banner.limitedOfferTag")}
              </p>
              <h2 className="text-3xl font-bold text-gray-900 mt-2">
                {t("deals.banner.weekendTitle")}
              </h2>
              <p className="text-gray-600 mt-2">
                {t("deals.banner.weekendSubtitle")}
              </p>
            </div>
            <button className="px-6 py-3 rounded-full bg-yellow-600 text-white font-semibold hover:bg-yellow-700 transition">
              {t("deals.banner.shopNow")}
            </button>
          </div>
          <div className="bg-gray-900 rounded-3xl p-8 text-white flex flex-col justify-between shadow-sm">
            <div>
              <p className="text-xs uppercase text-yellow-300">
                {t("deals.banner.memberTag")}
              </p>
              <h3 className="text-2xl font-semibold mt-2">
                {t("deals.banner.memberTitle")}
              </h3>
              <p className="text-sm text-gray-300 mt-2">
                {t("deals.banner.memberSubtitle")}
              </p>
            </div>
            <button className="mt-6 px-5 py-2 rounded-full bg-yellow-600 text-white font-semibold hover:bg-yellow-500 transition">
              {t("deals.banner.unlockNow")}
            </button>
          </div>
        </section>

        {/* FLASH SALE */}
        <section className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-yellow-600 font-semibold">
                <BadgePercent className="w-5 h-5" />
                {t("deals.flashSale.title")}
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mt-2">
                {t("deals.flashSale.endsIn")}
              </h2>
            </div>
            <DealCountdown target="2026-06-01T23:59:59" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {flashSales.map((item) => {
              const soldPercent = Math.min(
                Math.round((item.sold / item.stock) * 100),
                100,
              );

              return (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="relative">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-48 object-cover"
                    />
                    <span className="absolute top-3 left-3 bg-yellow-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {item.discount}
                    </span>
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.price}</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          {t("deals.flashSale.soldLabel", { count: item.sold })}
                        </span>
                        <span>{soldPercent}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className="h-full bg-yellow-600"
                          style={{ width: `${soldPercent}%` }}
                        />
                      </div>
                    </div>
                    <button className="mt-2 w-full rounded-full border border-gray-300 py-2 text-sm font-semibold text-gray-700 hover:border-yellow-600 hover:text-yellow-600 transition">
                      {t("deals.flashSale.grabDeal")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* DISCOUNT PRODUCTS */}
        <section className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">
              {t("deals.discount.title")}
            </h2>
            <button className="text-sm text-yellow-600 font-semibold">
              {t("deals.discount.viewAll")}
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {discountProducts.map((product) => (
              <div
                key={product.id}
                className="border border-gray-200 rounded-2xl overflow-hidden">
                <div className="relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-40 object-cover"
                  />
                  <span className="absolute top-3 left-3 bg-gray-900 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    -{product.discount}
                  </span>
                </div>
                <div className="p-4 space-y-2">
                  <p className="font-semibold text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-600">{product.price}</p>
                  <button className="w-full rounded-full border border-gray-300 py-2 text-sm font-semibold text-gray-700 hover:border-yellow-600 hover:text-yellow-600 transition">
                    {t("deals.discount.addToCart")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PERSONALIZED DEALS */}
        {personalizedSections.map((section) => {
          const Icon = section.icon;

          return (
            <section
              key={section.title}
              className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-2 text-gray-900">
                <Icon className="w-5 h-5 text-yellow-600" />
                <h2 className="text-2xl font-semibold">{section.title}</h2>
              </div>

              <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
                {section.items.map((product) => (
                  <div
                    key={`${section.title}-${product.id}`}
                    className="min-w-[220px] border border-gray-200 rounded-2xl overflow-hidden bg-white">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-4 space-y-2">
                      <p className="font-semibold text-gray-900">
                        {product.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Gift className="w-3 h-3 text-yellow-600" />
                        {t("deals.personalized.offLabel", {
                          discount: product.discount,
                        })}
                      </div>
                      <p className="text-sm text-gray-600">{product.price}</p>
                      <button className="w-full rounded-full border border-gray-300 py-2 text-xs font-semibold text-gray-700 hover:border-yellow-600 hover:text-yellow-600 transition">
                        {t("deals.personalized.viewDeal")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* COUPON POPUP */}
      {showCoupon && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-2 text-yellow-600 font-semibold">
              <Gift className="w-5 h-5" />
              {t("deals.coupon.title")}
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mt-2">
              {t("deals.coupon.headline")}
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              {t("deals.coupon.subtitle")}
            </p>

            <div className="mt-4 space-y-3">
              {coupons.map((coupon) => (
                <div
                  key={coupon.code}
                  className="border border-gray-200 rounded-2xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{coupon.code}</p>
                    <p className="text-xs text-gray-500">
                      {t("deals.coupon.offExpires", {
                        discount: coupon.discount,
                        date: coupon.expires,
                      })}
                    </p>
                  </div>
                  <button className="text-sm text-yellow-600 font-semibold">
                    {t("deals.coupon.copy")}
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button className="flex-1 bg-yellow-600 text-white rounded-full py-3 font-semibold hover:bg-yellow-700 transition">
                {t("deals.coupon.apply")}
              </button>
              <button
                className="flex-1 border border-gray-300 rounded-full py-3 font-semibold text-gray-700 hover:border-yellow-600 hover:text-yellow-600 transition"
                onClick={() => setShowCoupon(false)}>
                {t("deals.coupon.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
