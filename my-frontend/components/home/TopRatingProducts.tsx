"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Star, Heart, ShoppingCart, Eye, X } from "lucide-react";
import { productAPI, cartAPI, wishlistAPI, type Product } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";

/* Extend type để tránh lỗi TS */
type ProductWithRating = Product & {
  rating: number;
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

export default function TopRatingBooks() {
  const [products, setProducts] = useState<ProductWithRating[]>([]);
  const [quickViewProduct, setQuickViewProduct] =
    useState<ProductWithRating | null>(null);
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
        const data = await productAPI.getAll();

        const sorted: ProductWithRating[] = data
          .map((p) => ({
            ...p,
            rating: 4.5 + Math.random() * 0.5,
          }))
          .sort((a, b) => b.rating - a.rating);

        setProducts(sorted);
      } catch (err) {
        console.error("Top rating error:", err);
      }
    };

    fetchData();
  }, []);

  const displayedProducts = products.slice(0, 8);

  return (
    <section className="w-full mt-20 bg-transparent py-16">
      <div className="max-w-[1370px] mx-auto px-6 md:px-10">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-brand-border">
          {/* HEADER */}
          <div className="flex justify-between items-end mb-8 border-b border-brand-border pb-4">
            <div>
              <h2 className="text-2xl font-bold text-brand-text font-serif italic">
                {t("topRating.title")}
              </h2>
              <div className="h-[3px] w-[80px] bg-brand-primary mt-2"></div>
            </div>

            <button
              type="button"
              onClick={() => router.push("/shop")}
              className="relative overflow-hidden bg-brand-primary text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider group cursor-pointer transition hover:scale-105 active:scale-95 shadow border-none">
              <span className="absolute inset-0 bg-[#8d6338] translate-x-[-100%] group-hover:translate-x-0 transition duration-300"></span>
              <span className="relative z-10">
                {t("action.viewMoreBooks")}
              </span>
            </button>
          </div>

          {/* GRID: 4 Rows of 2 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {displayedProducts.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-5 flex justify-between items-center border border-brand-border hover:border-brand-primary/50 shadow-xs hover:shadow-md transition-all duration-300 group">
                
                {/* LEFT (Image + Info) */}
                <div className="flex items-center gap-5">
                  {/* IMAGE */}
                  <button
                    type="button"
                    onClick={() => router.push(`/product/${item.id}`)}
                    className="relative w-[85px] h-[115px] bg-brand-surface rounded-2xl flex items-center justify-center p-2 border border-brand-border/40 overflow-hidden cursor-pointer shadow-xs shrink-0">
                    <Image
                      src={item.image || "/placeholder.png"}
                      alt={item.name}
                      fill
                      sizes="85px"
                      className="object-contain transition-transform duration-500 group-hover:scale-105"
                    />
                  </button>

                  {/* INFO */}
                  <div className="flex flex-col">
                    {/* Category */}
                    <p className="text-[12px] text-brand-primary font-semibold uppercase tracking-wider">
                      {item.category?.name
                        ? translateCategory(item.category.name)
                        : t("topRating.categoryFallback")}
                    </p>

                    {/* Title */}
                    <button
                      type="button"
                      onClick={() => router.push(`/product/${item.id}`)}
                      className="text-left text-base font-bold text-brand-text leading-snug line-clamp-2 hover:text-brand-primary transition cursor-pointer mt-1 min-h-[44px] block w-full">
                      {item.name}
                    </button>

                    {/* Price with brand border accent */}
                    <div className="mt-1 flex items-center border-l-2 border-brand-primary pl-2 h-5">
                      <span className="text-[16px] font-bold text-brand-text">
                        {formatPrice(item.price)}
                      </span>
                    </div>

                    {/* Stock / Availability */}
                    <div className="text-[12px] text-brand-muted font-medium mt-1">
                      {item.stock > 0 ? (
                        t("label.stock", { count: item.stock })
                      ) : (
                        <span className="text-red-500 font-medium">{t("label.outOfStockShort")}</span>
                      )}
                    </div>

                    {/* Stars */}
                    <div className="flex gap-0.5 text-brand-stars mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          fill={i < Math.round(item.rating) ? "currentColor" : "none"}
                          stroke="none"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT (Action icons top-right & Add to Cart button bottom-right) */}
                <div className="flex flex-col items-end justify-between h-full min-h-[110px] shrink-0 pl-4">
                  {/* ACTION ICONS */}
                  <div className="flex gap-2 opacity-0 invisible translate-x-[16px] transition-all duration-300 group-hover:opacity-100 group-hover:visible group-hover:translate-x-0">
                    {/* Wishlist */}
                    <button
                      type="button"
                      onClick={() => handleWishlist(item.id)}
                      className="w-8 h-8 flex items-center justify-center border border-brand-border rounded-full shadow-xs bg-white text-brand-muted hover:bg-brand-primary hover:text-white hover:border-brand-primary transition cursor-pointer">
                      <Heart size={14} />
                    </button>

                    {/* Add to Cart icon */}
                    <button
                      type="button"
                      onClick={() => handleAddToCart(item.id)}
                      disabled={item.stock <= 0}
                      className="w-8 h-8 flex items-center justify-center border border-brand-border rounded-full shadow-xs bg-white text-brand-muted hover:bg-brand-primary hover:text-white hover:border-brand-primary transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-60">
                      <ShoppingCart size={14} />
                    </button>

                    {/* Quick View (Eye) */}
                    <button
                      type="button"
                      onClick={() => setQuickViewProduct(item)}
                      className="w-8 h-8 flex items-center justify-center border border-brand-border rounded-full shadow-xs bg-white text-brand-muted hover:bg-brand-primary hover:text-white hover:border-brand-primary transition cursor-pointer">
                      <Eye size={14} />
                    </button>
                  </div>

                  {/* PROMINENT ADD TO CART BUTTON */}
                  <button
                    type="button"
                    onClick={() => handleAddToCart(item.id)}
                    disabled={item.stock <= 0}
                    className="w-32 h-[38px] bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold rounded-full transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 border-none shadow-xs">
                    <ShoppingCart size={13} />
                    <span>{t("action.addToCart")}</span>
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>
      </div>

      {/* QUICK VIEW MODAL */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in animate-scale-in">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 text-brand-text border border-brand-border">
            <button
              type="button"
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-4 right-4 text-brand-muted hover:text-brand-primary transition cursor-pointer">
              <X size={20} />
            </button>

            {/* LEFT COLUMN: IMAGE */}
            <div className="w-full md:w-1/2 bg-brand-surface rounded-2xl p-6 flex items-center justify-center h-[280px] border border-brand-border/30">
              <div className="relative w-[150px] h-[220px] transition-transform duration-500 hover:scale-105">
                <Image
                  src={quickViewProduct.image || "/placeholder.png"}
                  alt={quickViewProduct.name}
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            {/* RIGHT COLUMN: DETAILS */}
            <div className="w-full md:w-1/2 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold tracking-wider text-brand-primary uppercase">
                  {quickViewProduct.category?.name
                    ? translateCategory(quickViewProduct.category.name)
                    : t("topRating.categoryFallback")}
                </span>
                <h3 className="text-xl font-bold mt-1 text-brand-text leading-tight">
                  {quickViewProduct.name}
                </h3>

                {/* RATING */}
                <div className="flex gap-1 text-brand-stars mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      fill={i < Math.round(quickViewProduct.rating) ? "currentColor" : "none"}
                      stroke="none"
                    />
                  ))}
                </div>

                <p className="text-xs text-brand-muted mt-3 leading-relaxed">
                  Experience reading excellence with this highly-rated customer favorite. Features premium production value, highly engaging context, and is widely recommended by our readers.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 my-4">
                  <span className="text-2xl font-bold text-brand-text">
                    {formatPrice(quickViewProduct.price)}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      handleAddToCart(quickViewProduct.id);
                      setQuickViewProduct(null);
                    }}
                    disabled={quickViewProduct.stock <= 0}
                    className="flex-1 h-11 bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold rounded-full text-sm transition-transform active:scale-95 shadow-md flex items-center justify-center gap-2 cursor-pointer border-none disabled:cursor-not-allowed disabled:opacity-60">
                    <ShoppingCart size={16} />
                    {t("action.addToCart")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleWishlist(quickViewProduct.id);
                    }}
                    className="p-3 border border-brand-border hover:bg-brand-surface rounded-full transition cursor-pointer bg-white text-brand-muted hover:text-brand-primary hover:border-brand-primary">
                    <Heart size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
