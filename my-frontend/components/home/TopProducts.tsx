"use client";

import Image from "next/image";
import { Star, Heart, ShoppingCart, Eye } from "lucide-react";

export default function TopProducts() {
  const products = [
    {
      id: 1,
      title: "Flovely And Unicorn Erna",
      price: 30,
      oldPrice: 39.99,
      author: "Albert",
      image: "/books/book4.jpg",
    },
    {
      id: 2,
      title: "Qple GPad With Retinay Sispla",
      price: 30,
      oldPrice: 39.99,
      author: "Wilson",
      image: "/books/book2.jpg",
      hot: true,
    },
    {
      id: 3,
      title: "Simple Things You To Save BOOK",
      price: 30,
      oldPrice: 39.99,
      author: "Wilson",
      image: "/books/book5.jpg",
    },
    {
      id: 4,
      title: "How Deal With Very Bad BOOK",
      price: 30,
      oldPrice: 39.99,
      author: "Esther",
      image: "/books/book1.jpg",
      hot: true,
      discount: "-30%",
    },
  ];

  return (
    <section className="w-full max-w-7xl mx-auto px-4 mt-20">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-bold text-[#0b132a]">Readit Top Books</h2>

        <button className="relative overflow-hidden bg-[#eba07a] text-yellow-150 px-5 py-2 rounded-full text-sm group">
          <span className="absolute inset-0 bg-yellow-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out"></span>
          <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
            Explore More →
          </span>
        </button>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* PRODUCTS */}
        <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((item) => (
            <div key={item.id} className="group">
              {/* CARD */}
              <div className="bg-[#eee0d9] rounded-xl p-4 relative overflow-hidden">
                {/* BADGES */}
                {item.hot && (
                  <span className="absolute top-3 left-3 bg-[#0b132a] text-white text-xs px-2 py-1 rounded">
                    Hot
                  </span>
                )}

                {item.discount && (
                  <span className="absolute top-10 left-3 bg-orange-400 text-white text-xs px-2 py-1 rounded">
                    {item.discount}
                  </span>
                )}

                {/* IMAGE */}
                <div className="flex justify-center relative">
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={120}
                    height={160}
                    className="object-contain transition duration-300 group-hover:scale-105"
                  />

                  {/* HOVER ICONS */}
                  <div className="absolute right-1 top-3 flex flex-col gap-2 opacity-0 translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    {/* Wishlist */}
                    <button className="w-8 h-8 flex items-center justify-center bg-[#eee0d9] rounded-full shadow hover:bg-[#c86a3cd0] transition group">
                      <Heart size={14} className="text-gray-600 " />
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
              <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-500">Design Low Book</p>

                <h3 className="text-sm font-semibold text-gray-800 line-clamp-2">
                  {item.title}
                </h3>

                {/* PRICE */}
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">
                    ${item.price.toFixed(2)}
                  </span>
                  {item.oldPrice && (
                    <span className="text-sm text-gray-400 line-through">
                      ${item.oldPrice}
                    </span>
                  )}
                </div>

                {/* AUTHOR + RATING */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{item.author}</span>

                  <div className="flex gap-1 text-orange-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                  </div>
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

        {/* RIGHT BANNER */}
        <div className="bg-[#e99267] rounded-xl p-6 flex flex-col justify-between text-white relative overflow-hidden">
          <div>
            <h3 className="text-2xl font-bold leading-snug">
              Find Your <br /> Next Books!
            </h3>

            <p className="text-sm mt-3 opacity-90">
              And Get Your 25% Discount Now!
            </p>

            <button className="mt-5 bg-white text-[#0b132a] px-5 py-2 rounded-full text-sm font-medium hover:scale-105 transition">
              Shop Now →
            </button>
          </div>

          {/* IMAGE */}
          <div className="mt-6 flex justify-center">
            <Image
              src="/banner-girl.png"
              alt="banner"
              width={180}
              height={180}
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
