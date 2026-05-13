"use client";

import { useState } from "react";
import { usePreferences } from "@/lib/i18n";

import HeroSlider from "@/components/home/HeroSlider";
import ServiceHighlight from "@/components/home/ServiceHighlight";
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

  return (
    <main className="bg-gray-100 min-h-screen">
      {/* HERO SLIDER */}
      <HeroSlider />

      {/* SERVICE */}
      <ServiceHighlight />

      {/* FEATURED */}
      <FeaturedProducts />

      {/* CATEGORY */}
      <TopCategories onHoverCategory={setCategory} />

      {/* DYNAMIC PRODUCT */}
      {category && (
        <ProductSection
          category={category}
          title={t("categoryProducts.title", {
            category: translateCategory(category),
          })}
        />
      )}

      <TopSellingProducts />

      <ParallaxBanner />

      <TopRatingProducts />

      {/* OTHER SECTIONS */}
      <TopProducts />
    </main>
  );
}
