"use client";

import Image from "next/image";
import { X, Minus, Plus } from "lucide-react";
import { useState } from "react";

const initialCart = [
  {
    id: 1,
    name: "Simple Things You To Save Book",
    price: 30,
    quantity: 1,
    img: "/img/book1.png",
  },
  {
    id: 2,
    name: "Qple GPad With Retina Display",
    price: 30,
    quantity: 1,
    img: "/img/book2.png",
  },
  {
    id: 3,
    name: "Flovely And Unicom Erna",
    price: 30,
    quantity: 1,
    img: "/img/book3.png",
  },
];

export default function CartPage() {
  const [cart, setCart] = useState(initialCart);

  const updateQuantity = (id: number, type: "inc" | "dec") => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity:
                type === "inc"
                  ? item.quantity + 1
                  : Math.max(1, item.quantity - 1),
            }
          : item,
      ),
    );
  };

  const removeItem = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  // reusable button
  const FancyButton = ({ children }: { children: React.ReactNode }) => (
    <button className="relative overflow-hidden bg-[#eba07a] text-white px-5 py-2 rounded-full text-sm group">
      <span className="absolute inset-0 bg-yellow-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out"></span>
      <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
        {children}
      </span>
    </button>
  );

  return (
    <div className="w-full">
      {/* BANNER */}
      <div className="bg-gradient-to-r from-yellow-600 to-white py-20 text-center">
        <h1 className="text-4xl font-bold text-gray-800">Cart</h1>
        <p className="text-gray-500 mt-2">Home &gt; Cart</p>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* LEFT */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-4 text-gray-700 font-semibold border-b border-gray-300 pb-4">
            <span>Product</span>
            <span className="text-center">Price</span>
            <span className="text-center">Quantity</span>
            <span className="text-right">Subtotal</span>
          </div>

          {cart.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-4 items-center py-6 border-b border-gray-300">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-gray-400 hover:text-yellow-600">
                  <X size={18} />
                </button>

                <Image src={item.img} alt="" width={60} height={80} />

                <span className="text-gray-800 font-medium">{item.name}</span>
              </div>

              <span className="text-center text-yellow-600 font-medium">
                ${item.price.toFixed(2)}
              </span>

              <div className="flex justify-center">
                <div className="flex items-center border rounded-full px-3 py-1 gap-3">
                  <button onClick={() => updateQuantity(item.id, "dec")}>
                    <Minus size={16} />
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, "inc")}>
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <span className="text-right text-yellow-600 font-medium">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}

          {/* COUPON */}
          <div className="flex justify-between mt-8 gap-4 flex-wrap items-center">
            <div className="flex gap-3">
              <input
                placeholder="Coupon Code"
                className="border border-gray-300 px-4 py-2 rounded-md w-64 outline-none focus:border-yellow-500"
              />
              <FancyButton>Apply</FancyButton>
            </div>

            <FancyButton>Update Cart</FancyButton>
          </div>
        </div>

        {/* RIGHT */}
        <div className="border border-gray-100 rounded-lg p-6 h-fit shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Cart Total</h2>

          <div className="flex justify-between py-3 border-b border-gray-300">
            <span className="text-gray-500">Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between py-3 border-b border-gray-300">
            <span className="text-gray-500">Shipping:</span>
            <span>Free</span>
          </div>

          <div className="flex justify-between py-3 border-b border-gray-300 font-semibold">
            <span>Total:</span>
            <span className="text-yellow-600">${subtotal.toFixed(2)}</span>
          </div>

          <div className="mt-6">
            <button className="w-full relative overflow-hidden bg-[#eba07a] text-white py-3 rounded-full group">
              <span className="absolute inset-0 bg-yellow-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></span>
              <span className="relative z-10">Proceed To Checkout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
