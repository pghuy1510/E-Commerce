"use client";

import { useState, useEffect } from "react";
import { usePreferences } from "@/lib/i18n";
import { dealAPI, type Deal } from "@/lib/api";

import HeroSlider from "@/components/home/HeroSlider";
import ServiceHighlight from "@/components/home/ServiceHighlight";
import HomeFlashSaleBanner from "@/components/home/HomeFlashSaleBanner";
import TopCategories from "@/components/home/TopCategories";
import TopProducts from "@/components/home/TopProducts";
import ParallaxBanner from "@/components/home/ParallaxBanner";
import TopRatingProducts from "@/components/home/TopRatingProducts";
import TopSellingProducts from "@/components/home/TopSellingProducts";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import ProductSection from "@/components/home/ProductSection";

export default function Home() {
  const [category, setCategory] = useState<string | null>(null);
  const { t, translateCategory } = usePreferences();

  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [serverTime, setServerTime] = useState<string>("");
  const [loadingDeal, setLoadingDeal] = useState(true);

  useEffect(() => {
    dealAPI.getActiveDeal()
      .then((res) => {
        if (res && res.deal) {
          setActiveDeal(res.deal);
          setServerTime(res.serverTime);
        }
      })
      .catch((err) => console.error("Lỗi khi lấy thông tin Flash Sale trang chủ:", err))
      .finally(() => setLoadingDeal(false));
  }, []);

  return (
    <main className="bg-[#f7f3ec] min-h-screen">
      {/* HERO SLIDER */}
      <HeroSlider />

      {/* SERVICE */}
      <ServiceHighlight />

      {/* FLASH SALE BANNER */}
      {!loadingDeal && activeDeal && (
        <HomeFlashSaleBanner deal={activeDeal} serverTime={serverTime} />
      )}

      {/* FEATURED */}
      <FeaturedProducts />

      {/* CATEGORY */}
      <TopCategories
        activeCategory={category as any}
        onSelectCategory={setCategory}
      />

      {/* DYNAMIC PRODUCT */}
      {category && (
        <ProductSection
          category={category}
          title={t("categoryProducts.title", {
            category: translateCategory(category),
          })}
          onClose={() => setCategory(null)}
        />
      )}

      <TopSellingProducts />

      <ParallaxBanner />

      <TopRatingProducts />

      <TopProducts />
    </main>
  );
}

