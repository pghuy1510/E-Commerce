"use client";

import Image from "next/image";
import { Star, Heart, ShoppingCart, Eye } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { productAPI, type Product } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";
import ProductCard from "@/components/ProductCard";

import "swiper/css";

export default function FeaturedBooks() {
  const [products, setProducts] = useState<Product[]>([]);
  const router = useRouter();
  const { t } = usePreferences();

  useEffect(() => {
    const fetchData = async () => {
      const data = await productAPI.getAll();
      setProducts(data.slice(0, 6));
    };

    fetchData();
  }, []);

  return (
    <section className="w-full flex justify-center mt-16 bg-transparent py-16">
      <div className="w-full max-w-[1370px] px-6 md:px-10">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-brand-border">
          {/* HEADER */}
          <div className="flex justify-between items-end mb-8 border-b border-brand-border pb-4">
            <div>
              <h2 className="text-2xl font-bold text-brand-text font-serif italic">
                {t("featured.title")}
              </h2>
              <div className="h-[3px] w-[80px] bg-brand-primary mt-2"></div>
            </div>

            <button
              onClick={() => router.push("/shop?category=Accessories")}
              className="relative overflow-hidden bg-brand-primary text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider group cursor-pointer transition hover:scale-105 active:scale-95 shadow border-none">
              <span className="absolute inset-0 bg-brand-primary-hover translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out"></span>
              <span className="relative z-10 transition-colors duration-300">
                {t("action.exploreMore")}
              </span>
            </button>
          </div>

          {/* SLIDER */}
          <Swiper
            modules={[Autoplay]}
            spaceBetween={20}
            slidesPerView={2}
            breakpoints={{
              640: { slidesPerView: 3 },
              768: { slidesPerView: 4 },
              1024: { slidesPerView: 5 },
            }}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            speed={800}
            loop>
            {products.map((item) => (
              <SwiperSlide key={item.id}>
                <ProductCard product={item} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
