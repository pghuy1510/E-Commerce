"use client";

import { X } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { useState, useEffect } from "react";
import { productAPI, type Product } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";
import ProductCard from "@/components/ProductCard";

import "swiper/css";

export default function ProductSection({
  category,
  title,
  onClose,
}: {
  category: string;
  title: string;
  onClose?: () => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = usePreferences();

  useEffect(() => {
    if (!category) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const data = await productAPI.getByCategory(category);
        setProducts(data);
      } catch (err) {
        console.error("Fetch dynamic products error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category]);

  if (loading) {
    return (
      <section className="w-full flex justify-center mt-16">
        <p className="text-gray-500">{t("label.loading")}</p>
      </section>
    );
  }

  return (
    <section className="w-full flex justify-center mt-16 animate-fadeIn">
      <div className="w-full max-w-[1330px] px-6">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8 border-b border-yellow-100 pb-4">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="group flex items-center justify-center p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-300"
              title={t("deals.coupon.close") || "Close"}>
              <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
          )}
        </div>

        {/* SLIDER */}
        {products.length === 0 ? (
          <p className="text-center py-10 text-gray-500">
            {t("label.noProductsFound")}
          </p>
        ) : (
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
              delay: 3000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            speed={800}
            loop>
            {products.map((item) => (
              <SwiperSlide key={item.id} className="py-2">
                <ProductCard product={item} />
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
    </section>
  );
}
