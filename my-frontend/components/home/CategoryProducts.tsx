"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { useState, useEffect } from "react";
import { productAPI, type Product } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";
import ProductCard from "@/components/ProductCard";

import "swiper/css";

export default function CategoryProducts({ category }: { category: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const { t, translateCategory } = usePreferences();

  useEffect(() => {
    const fetchData = async () => {
      const data = await productAPI.getAll();
      const filtered = data.filter((p) => p.category?.name === category);
      setProducts(filtered.slice(0, 10));
    };

    if (category) fetchData();
  }, [category]);

  if (!category) return null;

  return (
    <section className="relative w-full mt-16">
      {/* BACKGROUND */}
      <div className="absolute inset-0 select-none pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da"
          alt="bg"
          className="w-full h-full object-cover blur-sm scale-110"
        />
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 max-w-[1370px] mx-auto px-6 md:px-10 py-20">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-bold text-white">
            {t("categoryProducts.title", {
              category: translateCategory(category),
            })}
          </h2>
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
            delay: 4000,
            disableOnInteraction: false,
          }}
          loop>
          {products.map((item) => (
            <SwiperSlide key={item.id} className="h-auto">
              <ProductCard product={item} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
