"use client";

import Image from "next/image";
import { X } from "lucide-react";

const wishlist = [
  {
    id: 1,
    name: "Simple Things You To Save Book",
    price: 30,
    stock: true,
    img: "/img/book1.png",
  },
  {
    id: 2,
    name: "Qple GPad With Retina Display",
    price: 39,
    stock: true,
    img: "/img/book2.png",
  },
  {
    id: 3,
    name: "Flovely And Unicom Erna",
    price: 19,
    stock: false,
    img: "/img/book3.png",
  },
];

// 🔥 button giống cart
const FancyButton = ({ children }: { children: React.ReactNode }) => (
  <button className="relative overflow-hidden bg-[#eba07a] text-white px-4 py-2 rounded-full text-sm group">
    <span className="absolute inset-0 bg-yellow-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out"></span>
    <span className="relative z-10">{children}</span>
  </button>
);

export default function WishlistPage() {
  return (
    <div className="w-full">
      {/* BANNER */}
      <div className="bg-gradient-to-r from-yellow-600 to-white py-20 text-center">
        <h1 className="text-4xl font-bold text-gray-800">Wishlist</h1>
        <p className="text-gray-500 mt-2">Home &gt; Wishlist</p>
      </div>

      {/* TABLE */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="w-full">
          {/* HEADER */}
          <div className="grid grid-cols-5 text-gray-700 font-semibold border-b border-gray-300 pb-4">
            <span>Product</span>
            <span className="text-center">Price</span>
            <span className="text-center">Stock</span>
            <span className="text-right">Subtotal</span>
            <span></span>
          </div>

          {/* LIST */}
          {wishlist.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-5 items-center py-6 border-b border-gray-300">
              {/* PRODUCT */}
              <div className="flex items-center gap-4">
                <button className="text-gray-400 hover:text-yellow-600">
                  <X size={18} />
                </button>

                <Image src={item.img} alt="" width={60} height={80} />

                <span className="text-gray-800 font-medium">{item.name}</span>
              </div>

              {/* PRICE */}
              <span className="text-center text-yellow-600 font-medium">
                ${item.price.toFixed(2)}
              </span>

              {/* STOCK */}
              <span
                className={`text-center font-medium ${
                  item.stock ? "text-green-600" : "text-yellow-500"
                }`}>
                {item.stock ? "In Stock" : "Out Of Stock"}
              </span>

              {/* SUBTOTAL */}
              <span className="text-right text-yellow-600 font-medium">
                ${(item.price * 1).toFixed(2)}
              </span>

              {/* ACTION */}
              <div className="flex justify-end">
                <FancyButton>Add To Cart</FancyButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
