"use client";

import Image from "next/image";
import { Star, Heart, ShoppingCart, Eye } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { productAPI, type Product } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";

import "swiper/css";

export default function CategoryProducts({ category }: { category: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const router = useRouter();
  const { t, formatPrice, translateCategory } = usePreferences();

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
      {/* BACKGROUND giống TopCategories */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da"
          alt="bg"
          fill
          className="object-cover blur-sm scale-110"
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
            <SwiperSlide key={item.id}>
              <div className="group">
                {/* CARD */}
                <div className="bg-white/90 backdrop-blur rounded-xl p-4 relative overflow-hidden shadow-md hover:shadow-xl transition duration-300">
                  {/* IMAGE */}
                  <div className="flex justify-center relative">
                    <Image
                      src={
                        item.image && item.image !== ""
                          ? item.image
                          : "/placeholder.png"
                      }
                      alt={item.name}
                      width={120}
                      height={160}
                      className="object-contain group-hover:scale-105 transition duration-300"
                    />

                    {/* ACTION */}
                    <div className="absolute right-1 top-3 flex flex-col gap-2 opacity-0 translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition">
                      <button className="w-8 h-8 bg-white rounded-full shadow flex items-center justify-center hover:bg-brand-primary hover:text-white transition">
                        <Heart size={14} />
                      </button>
                      <button className="w-8 h-8 bg-white rounded-full shadow flex items-center justify-center hover:bg-brand-primary hover:text-white transition">
                        <ShoppingCart size={14} />
                      </button>
                      <button
                        onClick={() => router.push(`/product/${item.id}`)}
                        className="w-8 h-8 bg-white rounded-full shadow flex items-center justify-center hover:bg-brand-primary hover:text-white transition">
                        <Eye size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* INFO */}
                <div className="mt-4 space-y-1 text-white">
                  <p className="text-xs text-gray-300">
                    {item.category?.name
                      ? translateCategory(item.category.name)
                      : t("topRating.categoryFallback")}
                  </p>

                  <h3 className="text-sm font-semibold line-clamp-2">
                    {item.name}
                  </h3>

                  <div className="font-semibold text-brand-primary-light">
                    {formatPrice(item.price)}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-300">
                      {t("label.stock", { count: item.stock })}
                    </span>

                    <div className="flex text-brand-stars">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill="currentColor" />
                      ))}
                    </div>
                  </div>

                  <button className="w-full mt-2 bg-white/90 text-brand-primary py-2 rounded-full hover:bg-brand-primary hover:text-white transition">
                    {t("action.addToCart")}
                  </button>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
