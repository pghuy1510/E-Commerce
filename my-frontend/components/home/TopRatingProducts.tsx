"use client";

import Image from "next/image";
import { Star, Heart, ShoppingCart, Eye, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { productAPI, cartAPI, wishlistAPI, type Product } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";

/*  Extend type để tránh lỗi TS */
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
            rating: 4.5 + Math.random() * 0.5, // Giữ rating cao từ 4.5 -> 5.0 cho rating books
          }))
          .sort((a, b) => b.rating - a.rating);

        setProducts(sorted);
      } catch (err) {
        console.error("Top rating error:", err);
      }
    };

    fetchData();
  }, []);

  const displayedProducts = products.slice(0, 6);

  return (
    <section className="w-full mt-20">
      <div className="bg-[#eee0d9]/40 py-16">
        <div className="max-w-[1300px] mx-auto bg-white rounded-3xl p-8 shadow-sm border border-stone-100">
          {/* HEADER */}
          <div className="flex justify-between items-center mb-8 border-b border-stone-100 pb-4">
            <h2 className="text-2xl font-bold text-stone-900 font-serif italic">
              {t("topRating.title")}
            </h2>

            <button
              type="button"
              onClick={() => router.push("/shop")}
              className="relative overflow-hidden bg-[#eba07a] text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider group cursor-pointer transition hover:scale-105 active:scale-95 shadow">
              <span className="absolute inset-0 bg-yellow-600 translate-x-[-100%] group-hover:translate-x-0 transition duration-300"></span>
              <span className="relative z-10">
                {t("action.viewMoreBooks")}
              </span>
            </button>
          </div>

          {/* GRID */}
          <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
            {displayedProducts.map((item) => (
              <div
                key={item.id}
                className="bg-stone-50/50 rounded-2xl p-5 flex justify-between items-center border border-stone-100 hover:shadow-md transition-all duration-300 group">
                {/* LEFT */}
                <div className="flex items-center gap-5">
                  <button
                    onClick={() => setQuickViewProduct(item)}
                    className="relative w-[80px] h-[110px] bg-white rounded-lg flex items-center justify-center p-2 border border-stone-100 overflow-hidden cursor-pointer shadow-sm">
                    <Image
                      src={item.image || "/placeholder.png"}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-contain transition-transform duration-500 group-hover:scale-105"
                    />
                  </button>

                  <div>
                    <p className="text-xs text-gray-400">
                      {item.category?.name
                        ? translateCategory(item.category.name)
                        : t("topRating.categoryFallback")}
                    </p>

                    {/* TITLE */}
                    <button
                      onClick={() => router.push(`/product/${item.id}`)}
                      className="text-left text-base font-bold text-stone-800 leading-snug line-clamp-1 hover:text-yellow-600 transition cursor-pointer mt-0.5">
                      {item.name}
                    </button>

                    {/* PRICE */}
                    <p className="text-sm font-semibold text-stone-900 mt-1">
                      {formatPrice(item.price)}
                    </p>

                    {/* STOCK */}
                    <div className="text-xs text-gray-400 mt-0.5">
                      {t("label.stock", { count: item.stock })}
                    </div>

                    {/* ⭐ RATING */}
                    <div className="flex gap-0.5 text-orange-400 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          fill={i < Math.round(item.rating) ? "currentColor" : "none"}
                          stroke="currentColor"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT */}
                <div className="flex flex-col items-end justify-between h-full min-h-[110px]">
                  {/* ACTIONS */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleWishlist(item.id)}
                      className="w-8 h-8 flex items-center justify-center border border-stone-200 rounded-full shadow-sm bg-white hover:bg-red-500 hover:text-white hover:border-red-500 transition cursor-pointer text-stone-600">
                      <Heart size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(item.id)}
                      className="w-8 h-8 flex items-center justify-center border border-stone-200 rounded-full shadow-sm bg-white hover:bg-yellow-600 hover:text-white hover:border-yellow-600 transition cursor-pointer text-stone-600">
                      <ShoppingCart size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setQuickViewProduct(item)}
                      className="w-8 h-8 flex items-center justify-center border border-stone-200 rounded-full shadow-sm bg-white hover:bg-stone-800 hover:text-white hover:border-stone-800 transition cursor-pointer text-stone-600">
                      <Eye size={14} />
                    </button>
                  </div>

                  {/* BOTTOM BUTTON */}
                  <button
                    type="button"
                    onClick={() => handleAddToCart(item.id)}
                    className="relative overflow-hidden bg-[#eee0d9] text-yellow-700 text-xs font-semibold px-4 py-2 rounded-full group/add cursor-pointer w-28 text-center shadow-sm">
                    <span className="absolute inset-0 bg-yellow-600 translate-x-[-100%] group-hover/add:translate-x-0 transition-transform duration-300 ease-out"></span>
                    <span className="relative z-10 transition-colors duration-300 group-hover/add:text-white">
                      {t("action.addToCart")}
                    </span>
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
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 text-gray-900">
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
                  alt={quickViewProduct.name}
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            {/* RIGHT COLUMN: DETAILS */}
            <div className="w-full md:w-1/2 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold tracking-wider text-amber-600 uppercase">
                  {quickViewProduct.category?.name
                    ? translateCategory(quickViewProduct.category.name)
                    : t("topRating.categoryFallback")}
                </span>
                <h3 className="text-xl font-bold mt-1 text-stone-900 leading-tight">
                  {quickViewProduct.name}
                </h3>

                {/* RATING */}
                <div className="flex gap-1 text-orange-400 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      fill={i < Math.round(quickViewProduct.rating) ? "currentColor" : "none"}
                      stroke="currentColor"
                    />
                  ))}
                </div>

                <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                  Experience reading excellence with this highly-rated customer favorite. Features premium production value, highly engaging context, and is widely recommended by our readers.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 my-4">
                  <span className="text-2xl font-bold text-stone-900">
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
    </section>
  );
}
