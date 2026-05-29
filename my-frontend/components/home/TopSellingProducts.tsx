"use client";

import Image from "next/image";
import { Star, Heart, ShoppingCart, Eye, X } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  productAPI,
  cartAPI,
  wishlistAPI,
  type BestSellerProduct,
} from "@/lib/api";
import { usePreferences } from "@/lib/i18n";

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

type ApiError = {
  code?: string;
  message?: string;
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
};

export default function TopSellingProducts() {
  const [products, setProducts] = useState<SellingProduct[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [quickViewProduct, setQuickViewProduct] =
    useState<SellingProduct | null>(null);
  const router = useRouter();
  const userId = 1;
  const { t, formatPrice, translateCategory } = usePreferences();

  const handleWishlist = async (productId: number) => {
    try {
      await wishlistAPI.toggle(userId, productId);
      alert(t("alert.addedToWishlist"));
    } catch (err: unknown) {
      const error = err as ApiError;
      const code = error?.code;
      if (code === "WISHLIST_DUPLICATE") {
        alert(t("alert.wishlistDuplicate"));
        return;
      }
      console.error(err);
    }
  };

  const handleAddToCart = async (productId: number) => {
    try {
      await cartAPI.add(productId);
      alert(t("alert.addedToCart"));
    } catch (err: unknown) {
      const error = err as ApiError;
      const status = error?.response?.status;
      const code = error?.code;

      if (status === 401 || code === "AUTH_REQUIRED") {
        alert(t("alert.loginToAddCart"));
        router.push("/login");
        return;
      }
      if (code === "CART_DUPLICATE") {
        alert(t("alert.cartDuplicate"));
        return;
      }

      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("alert.addToCartFailed");
      console.error(err);
      alert(message);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await productAPI.getTopSelling();

        // 🔥 MAP DATA từ DB → format UI
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
    return (
      <div key={item.id} className="group h-full flex flex-col bg-white rounded-2xl p-4 shadow-sm border border-stone-100 hover:shadow-md transition-all duration-300">
        {/* CARD */}
        <div className="bg-[#eee0d9]/60 rounded-xl p-4 relative overflow-hidden h-[200px] flex items-center justify-center">
          {/* DISCOUNT */}
          {item.discount && (
            <span className="absolute top-3 left-3 bg-orange-400 text-white text-xs px-2 py-1 rounded z-10">
              {item.discount}
            </span>
          )}

          {/* HOT */}
          {item.hot && (
            <span className="absolute top-3 left-3 bg-black text-white text-xs px-2 py-1 rounded z-10">
              {t("label.hot")}
            </span>
          )}

          {/* IMAGE */}
          <div className="flex justify-center relative h-full w-full">
            <button
              onClick={() => setQuickViewProduct(item)}
              className="relative w-[120px] h-[160px] cursor-pointer block">
              <Image
                src={item.image || "/placeholder.png"}
                alt={item.title}
                fill
                sizes="120px"
                className="object-contain transition duration-300 group-hover:scale-105"
              />
            </button>

            {/* HOVER ACTIONS */}
            <div className="absolute right-1 top-1 flex flex-col gap-2 opacity-0 translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
              <button
                type="button"
                onClick={() => handleWishlist(item.id)}
                className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow hover:bg-red-500 hover:text-white transition cursor-pointer">
                <Heart size={14} className="text-stone-600 hover:text-inherit" />
              </button>

              <button
                type="button"
                onClick={() => handleAddToCart(item.id)}
                className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow hover:bg-yellow-600 hover:text-white transition cursor-pointer">
                <ShoppingCart size={14} className="text-stone-600 hover:text-inherit" />
              </button>

              <button
                type="button"
                onClick={() => setQuickViewProduct(item)}
                className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow hover:bg-stone-850 hover:text-white transition cursor-pointer">
                <Eye size={14} className="text-stone-600 hover:text-inherit" />
              </button>
            </div>
          </div>
        </div>

        {/* INFO */}
        <div className="mt-4 flex flex-col gap-1 flex-1">
          <p className="text-xs text-gray-400">
            {item.author === "Unknown"
              ? t("label.unknown")
              : translateCategory(item.author)}
          </p>

          <button
            onClick={() => router.push(`/product/${item.id}`)}
            className="text-left text-sm font-bold text-stone-800 leading-snug line-clamp-2 hover:text-yellow-600 transition cursor-pointer">
            {item.title}
          </button>

          {/* PRICE */}
          <div className="flex items-center gap-2 mt-1">
            <span className="font-bold text-stone-900">
              {formatPrice(item.price)}
            </span>

            {item.oldPrice && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(Number(item.oldPrice))}
              </span>
            )}
          </div>

          {/* RATING */}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-stone-50">
            <span className="text-xs text-gray-400">
              {item.author === "Unknown"
                ? t("label.unknown")
                : translateCategory(item.author)}
            </span>

            <div className="flex gap-0.5 text-orange-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={12} fill="currentColor" stroke="none" />
              ))}
            </div>
          </div>

          {/* BUTTON */}
          <button
            onClick={() => handleAddToCart(item.id)}
            className="relative w-full mt-3 overflow-hidden bg-[#eee0d9] text-yellow-700 text-xs font-semibold py-2 rounded-full group/add cursor-pointer">
            <span className="absolute inset-0 bg-yellow-600 translate-x-[-100%] group-hover/add:translate-x-0 transition-transform duration-300 ease-out"></span>
            <span className="relative z-10 transition-colors duration-300 group-hover/add:text-white">
              {t("action.addToCart")}
            </span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <section className="w-full flex justify-center mt-16">
      <div className="w-full max-w-[1370px] px-6 md:px-10">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8 border-b border-stone-200 pb-4">
          <h2 className="text-2xl font-bold text-stone-900 font-serif italic">
            {t("topSelling.title")}
          </h2>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="relative overflow-hidden bg-[#eba07a] text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider group cursor-pointer transition hover:scale-105 active:scale-95 shadow">
            <span className="absolute inset-0 bg-yellow-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out"></span>
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
              <SwiperSlide key={item.id}>
                {renderProductCard(item)}
              </SwiperSlide>
            ))}
          </Swiper>
        )}

        {/* QUICK VIEW MODAL */}
        {quickViewProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 animate-scale-in text-gray-900">
              <button
                type="button"
                onClick={() => setQuickViewProduct(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition cursor-pointer">
                <X size={20} />
              </button>

              {/* LEFT COLUMN: IMAGE */}
              <div className="w-full md:w-1/2 bg-[#f8f1e7] rounded-2xl p-6 flex items-center justify-center h-[280px]">
                <div className="relative w-[150px] h-[220px] transition-transform duration-500 hover:scale-105">
                  <Image
                    src={quickViewProduct.image || "/placeholder.png"}
                    alt={quickViewProduct.title}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              {/* RIGHT COLUMN: DETAILS */}
              <div className="w-full md:w-1/2 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold tracking-wider text-amber-600 uppercase">
                    {quickViewProduct.author === "Unknown"
                      ? t("label.unknown")
                      : translateCategory(quickViewProduct.author)}
                  </span>
                  <h3 className="text-xl font-bold mt-1 text-stone-900 leading-tight">
                    {quickViewProduct.title}
                  </h3>

                  {/* RATING */}
                  <div className="flex gap-1 text-orange-400 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} fill="currentColor" stroke="none" />
                    ))}
                  </div>

                  <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                    Discover a stellar reading experience. This highly recommended title offers an engaging story, rich background context, and beautifully structured content that is perfect for your collection.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-3 my-4">
                    <span className="text-2xl font-bold text-stone-900">
                      {formatPrice(quickViewProduct.price)}
                    </span>
                    {quickViewProduct.oldPrice && (
                      <span className="text-sm text-gray-400 line-through">
                        {formatPrice(Number(quickViewProduct.oldPrice))}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        handleAddToCart(quickViewProduct.id);
                        setQuickViewProduct(null);
                      }}
                      className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-6 rounded-full text-sm transition-transform active:scale-95 shadow-md flex items-center justify-center gap-2 cursor-pointer">
                      <ShoppingCart size={16} />
                      {t("action.addToCart")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleWishlist(quickViewProduct.id);
                      }}
                      className="p-3 border border-gray-200 hover:bg-red-50 hover:text-red-500 rounded-full transition cursor-pointer">
                      <Heart size={18} className="text-stone-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
