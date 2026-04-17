"use client";

import Image from "next/image";
import { Star, Heart, ShoppingCart, Eye } from "lucide-react";

export default function TopRatingBooks() {
  const products = [
    {
      id: 1,
      title: "Simple Things You To Save BOOK",
      price: 30,
      author: "Wilson",
      image: "/books/book5.jpg",
    },
    {
      id: 2,
      title: "How Deal With Very Bad BOOK",
      price: 39,
      author: "Wilson",
      image: "/books/book1.jpg",
    },
    {
      id: 3,
      title: "Qple GPad With Retina Display",
      price: 30,
      author: "Wilson",
      image: "/books/book2.jpg",
    },
    {
      id: 4,
      title: "Flovely And Unicorn Erna",
      price: 19,
      author: "Wilson",
      image: "/books/book4.jpg",
    },
    {
      id: 5,
      title: "Castle In The Sky",
      price: 16,
      author: "Wilson",
      image: "/books/book6.jpg",
    },
    {
      id: 6,
      title: "The Hidden Mystery Behind",
      price: 30,
      author: "Wilson",
      image: "/books/book3.jpg",
    },
  ];

  return (
    <section className="w-full mt-20">
      {/* 🔶 KHUNG NGOÀI */}
      <div className="bg-[#eee0d9] py-16">
        {/* ⚪ KHUNG TRONG */}
        <div className="max-w-6xl mx-auto bg-white rounded-2xl p-8 shadow-sm">
          {/* HEADER */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-semibold text-[#0b132a]">
              Top Rating Books
            </h2>

            <button className="relative overflow-hidden bg-[#eba07a] text-yellow-150 px-5 py-2 rounded-full text-sm group">
              <span className="absolute inset-0 bg-yellow-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out"></span>
              <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
                View More Books →
              </span>
            </button>
          </div>

          {/* GRID */}
          <div className="grid md:grid-cols-2 gap-5">
            {products.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl p-4 flex justify-between items-center border border-gray-100 hover:shadow-md transition">
                {/* LEFT */}
                <div className="flex items-center gap-4">
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={60}
                    height={80}
                    className="rounded object-cover"
                  />

                  <div>
                    <p className="text-xs text-gray-400">Design Low Book</p>

                    <h3 className="text-sm font-semibold text-gray-800">
                      {item.title}
                    </h3>

                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      ${item.price.toFixed(2)}
                    </p>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {item.author}
                      </span>

                      <div className="flex gap-1 text-orange-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} fill="currentColor" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT */}
                <div className="flex flex-col items-end gap-14">
                  {/* ICON */}
                  <div className="flex gap-2">
                    <button className="w-8 h-8 flex items-center justify-center border rounded-full shadow hover:bg-[#c86a3cd0] hover:text-white transition group">
                      <Heart size={14} />
                    </button>

                    <button className="w-8 h-8 flex items-center justify-center border rounded-full shadow hover:bg-[#c86a3cd0] hover:text-white transition group">
                      <ShoppingCart size={14} />
                    </button>

                    <button className="w-8 h-8 flex items-center justify-center border rounded-full shadow hover:bg-[#c86a3cd0] hover:text-white transition group">
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
