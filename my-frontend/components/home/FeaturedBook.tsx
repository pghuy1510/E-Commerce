"use client";

import Image from "next/image";
import { Star, Heart, ShoppingCart, Eye } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { useState, useEffect } from "react";
import { productAPI, type Product } from "@/lib/api";

import "swiper/css";

export default function FeaturedBooks() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productAPI.getAll();
        // Limit to 6 featured products
        setProducts(data.slice(0, 6));
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load products",
        );
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <section className="w-full flex justify-center mt-16">
        <div className="w-full max-w-7xl px-4 md:px-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
              <p className="mt-4 text-gray-500">Loading featured books...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full flex justify-center mt-16">
        <div className="w-full max-w-7xl px-4 md:px-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Error loading featured books: {error}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full flex justify-center mt-16">
      <div className="w-full max-w-7xl px-4 md:px-6">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Featured Books</h2>

          <button className="relative overflow-hidden bg-[#eba07a] text-yellow-150 px-5 py-2 rounded-full text-sm group">
            <span className="absolute inset-0 bg-yellow-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out"></span>
            <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
              Explore More →
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
                    <div className="w-[120px] h-[160px] bg-gray-200 rounded flex items-center justify-center overflow-hidden">
                      <div className="text-center">
                        <p className="text-xs text-gray-400">No Image</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {item.name.substring(0, 15)}...
                        </p>
                      </div>
                    </div>

                    {/* HOVER ACTIONS */}
                    <div className="absolute right-1 top-3 flex flex-col gap-2 opacity-0 translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      {/* Wishlist */}
                      <button className="w-8 h-8 flex items-center justify-center bg-[#eee0d9] rounded-full shadow hover:bg-[#c86a3cd0] transition group">
                        <Heart size={14} className="text-gray-600" />
                      </button>

                      {/* Add to cart */}
                      <button className="w-8 h-8 flex items-center justify-center bg-[#eee0d9] rounded-full shadow hover:bg-[#c86a3cd0] transition group">
                        <ShoppingCart size={14} className="text-gray-600" />
                      </button>

                      {/* View detail */}
                      <button className="w-8 h-8 flex items-center justify-center bg-[#eee0d9] rounded-full shadow hover:bg-[#c86a3cd0] transition group">
                        <Eye size={14} className="text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
                {/* INFO */}
                <div className="mt-4 space-y-1">
                  <p className="text-xs text-gray-500">
                    {item.category?.name || "Books"}
                  </p>

                  <h3 className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">
                    {item.name}
                  </h3>

                  {/* PRICE */}
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>

                  {/* RATING */}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      In Stock: {item.stock}
                    </span>

                    <div className="flex gap-1 text-orange-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill="currentColor" />
                      ))}
                    </div>
                  </div>

                  {/* BUTTON */}
                  <button
                    disabled={item.stock <= 0}
                    className="relative w-full mt-3 overflow-hidden bg-[#eee0d9] text-yellow-600 text-sm py-2 rounded-full group disabled:opacity-50 disabled:cursor-not-allowed">
                    <span className="absolute inset-0 bg-yellow-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out"></span>
                    <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
                      {item.stock > 0 ? "Add To Cart" : "Out of Stock"}
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
