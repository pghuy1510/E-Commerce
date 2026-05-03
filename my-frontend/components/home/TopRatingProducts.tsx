"use client";

import Image from "next/image";
import { Star, Heart, ShoppingCart, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { productAPI, type Product } from "@/lib/api";

/*  Extend type để tránh lỗi TS */
type ProductWithRating = Product & {
  rating: number;
};

export default function TopRatingBooks() {
  const [products, setProducts] = useState<ProductWithRating[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await productAPI.getAll();

      const sorted: ProductWithRating[] = data
        .map((p) => ({
          ...p,
          rating: Math.random() * 5, // fake rating tạm
        }))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 6);

      setProducts(sorted);
    };

    fetchData();
  }, []);

  return (
    <section className="w-full mt-20">
      <div className="bg-[#eee0d9] py-16">
        <div className="max-w-[1300px] mx-auto bg-white rounded-2xl p-8 shadow-sm">
          {/* HEADER */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-[#0b132a]">
              Product Suggestions
            </h2>

            <button className="relative overflow-hidden bg-[#eba07a] px-5 py-2 rounded-full text-sm group">
              <span className="absolute inset-0 bg-yellow-600 translate-x-[-100%] group-hover:translate-x-0 transition duration-300"></span>
              <span className="relative z-10 group-hover:text-white">
                View More Books →
              </span>
            </button>
          </div>

          {/* GRID */}
          <div className="grid md:grid-cols-2 gap-6">
            {products.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl p-5 flex justify-between items-center border border-gray-100 hover:shadow-md transition">
                {/* LEFT */}
                <div className="flex items-center gap-5">
                  <Image
                    src={item.image || "/placeholder.png"}
                    alt={item.name}
                    width={80}
                    height={110}
                    className="rounded object-cover"
                  />

                  <div>
                    <p className="text-xs text-gray-400">
                      {item.category?.name || "Category"}
                    </p>

                    {/* TITLE */}
                    <h3 className="text-base font-bold text-gray-900 leading-snug">
                      {item.name}
                    </h3>

                    {/* PRICE */}
                    <p className="text-base text-gray-500 mt-1">
                      ${item.price.toFixed(2)}
                    </p>

                    {/* STOCK */}
                    <div className="text-xs text-gray-400 mt-1">
                      Stock: {item.stock}
                    </div>

                    {/* ⭐ RATING */}
                    <div className="flex gap-1 text-orange-400 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          fill={
                            i < Math.round(item.rating)
                              ? "currentColor"
                              : "none"
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT */}
                <div className="flex flex-col items-end gap-10">
                  {/* ICON */}
                  <div className="flex gap-2">
                    <button className="w-8 h-8 flex items-center justify-center border rounded-full shadow hover:bg-[#c86a3cd0] hover:text-white transition">
                      <Heart size={14} />
                    </button>

                    <button className="w-8 h-8 flex items-center justify-center border rounded-full shadow hover:bg-[#c86a3cd0] hover:text-white transition">
                      <ShoppingCart size={14} />
                    </button>

                    <button className="w-8 h-8 flex items-center justify-center border rounded-full shadow hover:bg-[#c86a3cd0] hover:text-white transition">
                      <Eye size={14} />
                    </button>
                  </div>

                  {/* BUTTON */}
                  <button className="relative w-full mt-3 overflow-hidden bg-[#eee0d9] text-yellow-600 text-sm py-2 rounded-full group">
                    <span className="absolute inset-0 bg-yellow-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out"></span>
                    <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
                      Add To Cart
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
