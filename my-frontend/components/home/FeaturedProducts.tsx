"use client";

import Image from "next/image";
import { Star, Heart, ShoppingCart, Eye } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { productAPI, type Product, wishlistAPI, cartAPI } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";

import "swiper/css";

export default function FeaturedBooks() {
  const [products, setProducts] = useState<Product[]>([]);
  const router = useRouter();
  const { t, formatPrice, translateCategory } = usePreferences();

  const userId = 1;

  const handleWishlist = async (productId: number) => {
    try {
      await wishlistAPI.toggle(userId, productId);
      alert(t("alert.addedToWishlist"));
    } catch (err: any) {
      const code = err?.code as string | undefined;
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
    } catch (err: any) {
      const status = err?.response?.status as number | undefined;
      const code = err?.code as string | undefined;

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
        err?.response?.data?.message ||
        err?.message ||
        t("alert.addToCartFailed");
      console.error(err);
      alert(message);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const data = await productAPI.getAll();
      setProducts(data.slice(0, 6));
    };

    fetchData();
  }, []);

  return (
    <section className="w-full flex justify-center mt-16">
      <div className="w-full max-w-[1370px] px-6 md:px-10">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {t("featured.title")}
          </h2>

          <button className="relative overflow-hidden bg-[#eba07a] text-yellow-150 px-5 py-2 rounded-full text-sm group">
            <span className="absolute inset-0 bg-yellow-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out"></span>
            <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
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
              <div className="group">
                {/* CARD */}
                <div className="bg-[#eee0d9] rounded-xl p-4 relative group overflow-hidden">
                  {/* IMAGE */}
                  <div className="flex justify-center relative">
                    <Image
                      src={item.image || "/placeholder.png"}
                      alt={item.name}
                      width={120}
                      height={160}
                      className="object-contain group-hover:scale-105 transition duration-300"
                    />

                    {/* HOVER ACTIONS */}
                    <div className="absolute right-1 top-3 flex flex-col gap-2 opacity-0 translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      <button
                        onClick={() => handleWishlist(item.id)}
                        className="w-8 h-8 flex items-center justify-center bg-[#f3e4d8] rounded-full shadow hover:bg-yellow-600 transition">
                        <Heart size={14} className="text-gray-700" />
                      </button>

                      <button
                        onClick={() => handleAddToCart(item.id)}
                        className="w-8 h-8 flex items-center justify-center bg-[#eee0d9] rounded-full shadow hover:bg-yellow-600 hover:text-white transition">
                        <ShoppingCart size={14} />
                      </button>

                      <button
                        onClick={() => router.push(`/product/${item.id}`)}
                        className="w-8 h-8 flex items-center justify-center bg-[#eee0d9] rounded-full shadow hover:bg-[#c86a3cd0] transition">
                        <Eye size={14} className="text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* INFO */}
                <div className="mt-4 space-y-1">
                  <p className="text-xs text-gray-500">
                    {item.category?.name
                      ? translateCategory(item.category.name)
                      : t("topRating.categoryFallback")}
                  </p>

                  <h3 className="text-sm font-semibold text-gray-800 leading-snug">
                    {item.name}
                  </h3>

                  {/* PRICE */}
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {formatPrice(item.price)}
                    </span>
                  </div>

                  {/* STOCK + RATING */}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {t("label.stock", { count: item.stock })}
                    </span>

                    <div className="flex gap-1 text-orange-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill="currentColor" />
                      ))}
                    </div>
                  </div>

                  {/* BUTTON */}
                  <button
                    onClick={() => handleAddToCart(item.id)}
                    className="relative w-full mt-3 overflow-hidden bg-[#eee0d9] text-yellow-600 text-sm py-2 rounded-full group">
                    <span className="absolute inset-0 bg-yellow-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out"></span>
                    <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
                      {t("action.addToCart")}
                    </span>
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
