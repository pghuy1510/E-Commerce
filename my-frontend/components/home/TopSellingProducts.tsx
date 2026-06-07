"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { useEffect, useState } from "react";
import {
  productAPI,
  type BestSellerProduct,
  type Product,
} from "@/lib/api";
import { usePreferences } from "@/lib/i18n";
import ProductCard from "@/components/ProductCard";

import "swiper/css";

type SellingProduct = {
  id: number;
  title: string;
  price: number;
  image?: string;
  author: string;
  oldPrice: number | null;
  discount: string | null;
  hot: boolean;
  stock: number;
};

export default function TopSellingProducts() {
  const [products, setProducts] = useState<SellingProduct[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const { t, translateCategory } = usePreferences();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await productAPI.getTopSelling();

        // MAP DATA from DB -> format UI
        const mapped = data.map((p: BestSellerProduct) => ({
          id: p.id,
          title: p.name,
          price: Number(p.price),
          image: p.image,
          author: p.category?.name || "Unknown",
          oldPrice: null,
          discount: null,
          hot: false,
          stock: p.stock ?? 10,
        }));

        setProducts(mapped);
      } catch (err) {
        console.error("Top selling error:", err);
      }
    };

    fetchData();
  }, []);

  const renderProductCard = (item: SellingProduct) => {
    const mappedProduct = {
      id: item.id,
      name: item.title,
      price: item.price,
      image: item.image,
      stock: item.stock,
      category: {
        id: 0,
        name: item.author,
      },
    } as Product;

    return <ProductCard key={item.id} product={mappedProduct} />;
  };

  return (
    <section className="w-full flex justify-center mt-16 bg-transparent py-16">
      <div className="w-full max-w-[1370px] px-6 md:px-10">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-brand-border">
          {/* HEADER */}
          <div className="flex justify-between items-end mb-8 border-b border-brand-border pb-4">
            <div>
              <h2 className="text-2xl font-bold text-brand-text font-serif italic">
                {t("topSelling.title")}
              </h2>
              <div className="h-[3px] w-[80px] bg-brand-primary mt-2"></div>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="relative overflow-hidden bg-brand-primary text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider group cursor-pointer transition hover:scale-105 active:scale-95 shadow border-none">
              <span className="absolute inset-0 bg-[#8d6338] translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out"></span>
              <span className="relative z-10 transition-colors duration-300">
                {isExpanded ? t("action.showLess") : t("action.exploreMore")}
              </span>
            </button>
          </div>

          {/* CONDITIONAL BODY */}
          {isExpanded ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 animate-fade-in">
              {products.map((item) => renderProductCard(item))}
            </div>
          ) : (
            /* SLIDER */
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
              loop={products.length > 5}>
              {products.map((item) => (
                <SwiperSlide key={item.id} className="h-auto">
                  {renderProductCard(item)}
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </div>
    </section>
  );
}
