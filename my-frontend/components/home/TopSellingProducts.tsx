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
      <div key={item.id} className="group h-full flex flex-col overflow-hidden rounded-[16px] border border-brand-border bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.05)] transition-all duration-300 hover:border-[#a7794a] hover:shadow-xl">
        {/* IMAGE AREA */}
        <div className="relative w-full aspect-square overflow-hidden rounded-[12px] bg-brand-surface border border-[#eadfcc] mb-4 flex items-center justify-center">
          {item.discount && (
            <span className="absolute top-3 left-3 bg-orange-400 text-white text-xs px-2 py-1 rounded z-10">
              {item.discount}
            </span>
          )}

          {item.hot && (
            <span className="absolute top-3 left-3 bg-black text-white text-xs px-2 py-1 rounded z-10">
              {t("label.hot")}
            </span>
          )}

          {/* IMAGE */}
          <button
            type="button"
            onClick={() => setQuickViewProduct(item)}
            className="relative block w-full h-full">
            <Image
              src={item.image || "/placeholder.png"}
              alt={item.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover rounded-[12px] transition-transform duration-300 group-hover:-translate-x-[20px]"
            />
          </button>

          {/* ACTION ICONS - SLIDES IN ON HOVER */}
          <div className="absolute right-3 top-3 z-10 flex flex-col gap-[10px] opacity-0 invisible translate-x-[16px] transition-all duration-300 group-hover:opacity-100 group-hover:visible group-hover:translate-x-0">
            <button
              type="button"
              onClick={() => handleWishlist(item.id)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[#eadfcc] shadow-xs hover:bg-[#a7794a] hover:text-white transition-all duration-300 cursor-pointer text-brand-muted">
              <Heart size={16} />
            </button>

            <button
              type="button"
              onClick={() => handleAddToCart(item.id)}
              disabled={item.stock <= 0}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[#eadfcc] shadow-xs hover:bg-[#a7794a] hover:text-white transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer text-brand-muted">
              <ShoppingCart size={16} />
            </button>

            <button
              type="button"
              onClick={() => setQuickViewProduct(item)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[#eadfcc] shadow-xs hover:bg-[#a7794a] hover:text-white transition-all duration-300 cursor-pointer text-brand-muted">
              <Eye size={16} />
            </button>
          </div>
        </div>

        {/* INFO */}
        <div className="flex flex-1 flex-col mt-3">
          <p className="text-[14px] text-brand-primary font-medium">
            {item.author === "Unknown"
              ? t("label.unknown")
              : translateCategory(item.author)}
          </p>

          <button
            onClick={() => router.push(`/product/${item.id}`)}
            className="text-left text-[18px] font-semibold text-brand-text line-clamp-2 hover:text-brand-primary transition-colors cursor-pointer mt-[6px] leading-snug min-h-[56px] block w-full">
            {item.title}
          </button>

          {/* PRICE */}
          <div className="mt-[10px] flex items-center justify-between border-l-3 border-brand-primary pl-2">
            <span className="text-[18px] font-bold text-brand-text">
              {formatPrice(item.price)}
            </span>

            {item.oldPrice && (
              <span className="text-xs text-brand-muted line-through">
                {formatPrice(Number(item.oldPrice))}
              </span>
            )}
          </div>

          {/* RATING */}
          <div className="mt-[14px] flex items-center justify-between border-t border-brand-border pt-3">
            <span className="text-[14px] text-brand-muted font-medium">
              {item.stock > 0 ? (
                t("label.stock", { count: item.stock })
              ) : (
                <span className="text-red-500 font-medium">{t("label.outOfStockShort")}</span>
              )}
            </span>

            <div className="flex gap-0.5 text-brand-stars">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={12} fill="currentColor" stroke="none" />
              ))}
            </div>
          </div>

          {/* BUTTON */}
          <button
            type="button"
            onClick={() => handleAddToCart(item.id)}
            disabled={item.stock <= 0}
            className="mt-auto w-full h-[44px] bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold rounded-[10px] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 border-none shadow-sm">
            {t("action.addToCart")}
          </button>
        </div>
      </div>
    );
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
                <SwiperSlide key={item.id}>
                  {renderProductCard(item)}
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>

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
              <div className="w-full md:w-1/2 bg-brand-primary-light/30 rounded-2xl p-6 flex items-center justify-center h-[280px]">
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
                  <span className="text-xs font-semibold tracking-wider text-brand-primary uppercase">
                    {quickViewProduct.author === "Unknown"
                      ? t("label.unknown")
                      : translateCategory(quickViewProduct.author)}
                  </span>
                  <h3 className="text-xl font-bold mt-1 text-brand-text leading-tight">
                    {quickViewProduct.title}
                  </h3>

                  {/* RATING */}
                  <div className="flex gap-1 text-brand-secondary mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} fill="currentColor" stroke="none" />
                    ))}
                  </div>

                  <p className="text-xs text-brand-muted mt-3 leading-relaxed">
                    Discover a stellar reading experience. This highly recommended title offers an engaging story, rich background context, and beautifully structured content that is perfect for your collection.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-3 my-4">
                    <span className="text-2xl font-bold text-brand-text">
                      {formatPrice(quickViewProduct.price)}
                    </span>
                    {quickViewProduct.oldPrice && (
                      <span className="text-sm text-brand-muted line-through">
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
                      className="flex-1 h-11 bg-brand-primary hover:bg-[#8d6338] text-white font-semibold rounded-[12px] text-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border-none shadow-md">
                      <ShoppingCart size={16} />
                      {t("action.addToCart")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleWishlist(quickViewProduct.id);
                      }}
                      className="p-3 border border-brand-primary-light hover:bg-red-50 hover:text-red-500 rounded-full transition cursor-pointer">
                      <Heart size={18} className="text-brand-muted" />
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
