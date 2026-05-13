"use client";

import Image from "next/image";
import { Star, Heart, ShoppingCart, Eye } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { useState, useEffect } from "react";
import { productAPI, type Product } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";

import "swiper/css";

export default function ProductSection({
  category,
  title,
}: {
  category: string;
  title: string;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, formatPrice, translateCategory } = usePreferences();

  useEffect(() => {
    if (!category) return;

    const fetchProducts = async () => {
      setLoading(true);

      const data = await productAPI.getByCategory(category);

      setProducts(data);
      setLoading(false);
    };

    fetchProducts();
  }, [category]);

  if (loading) {
    return (
      <section className="w-full flex justify-center mt-16">
        <p>{t("label.loading")}</p>
      </section>
    );
  }

  return (
    <section className="w-full flex justify-center mt-16">
      <div className="w-full max-w-[1330px] px-6">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
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
          autoplay={{ delay: 3000 }}
          loop>
          {products.map((item) => (
            <SwiperSlide key={item.id}>
              <div className="group">
                <div className="bg-[#eee0d9] rounded-xl p-4 relative">
                  <div className="flex justify-center">
                    <div className="w-[120px] h-[160px] relative">
                      <Image
                        src={item.image || "/placeholder.png"}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-1">
                  <p className="text-xs text-gray-500">
                    {item.category?.name
                      ? translateCategory(item.category.name)
                      : t("topRating.categoryFallback")}
                  </p>

                  <h3 className="text-sm font-semibold">{item.name}</h3>

                  <div className="font-semibold">{formatPrice(item.price)}</div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
