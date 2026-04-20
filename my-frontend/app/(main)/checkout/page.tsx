"use client";

import { useState } from "react";

const cartItems = [
  { id: 1, name: "Simple Things You Save BOOK", price: 30, quantity: 1 },
  { id: 2, name: "How Deal With Very Bad BOOK", price: 39, quantity: 1 },
];

export default function CheckoutPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    note: "",
  });

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  // button reusable
  const FancyButton = ({ children }: { children: React.ReactNode }) => (
    <button className="w-full relative overflow-hidden bg-[#eba07a] text-white py-3 rounded-full group">
      <span className="absolute inset-0 bg-yellow-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></span>
      <span className="relative z-10">{children}</span>
    </button>
  );

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    console.log("ORDER:", form, cartItems);
    alert("Đặt hàng thành công 🚀");
  };

  return (
    <div className="w-full">
      {/* BANNER */}
      <div className="bg-gradient-to-r from-yellow-600 to-white py-20 text-center">
        <h1 className="text-4xl font-bold text-gray-800">Checkout</h1>
        <p className="text-gray-500 mt-2">Home &gt; Checkout</p>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* LEFT - FORM */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold">Billing Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="name"
              placeholder="Full Name"
              onChange={handleChange}
              className="border border-gray-300 px-4 py-3 rounded-md outline-none focus:border-yellow-500"
            />
            <input
              name="phone"
              placeholder="Phone"
              onChange={handleChange}
              className="border border-gray-300 px-4 py-3 rounded-md outline-none focus:border-yellow-500"
            />
          </div>

          <input
            name="email"
            placeholder="Email"
            onChange={handleChange}
            className="w-full border border-gray-300 px-4 py-3 rounded-md outline-none focus:border-yellow-500"
          />

          <input
            name="address"
            placeholder="Address"
            onChange={handleChange}
            className="w-full border border-gray-300 px-4 py-3 rounded-md outline-none focus:border-yellow-500"
          />

          <textarea
            name="note"
            placeholder="Order Notes (optional)"
            onChange={handleChange}
            className="w-full border border-gray-300 px-4 py-3 rounded-md outline-none focus:border-yellow-500"
          />
        </div>

        {/* RIGHT - ORDER SUMMARY */}
        <div className="border border-gray-200 rounded-lg p-6 h-fit shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Your Order</h2>

          {/* ITEMS */}
          <div className="space-y-3">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex justify-between text-sm border-b border-gray-100 pb-2">
                <span>
                  {item.name} x {item.quantity}
                </span>
                <span className="text-yellow-600">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* TOTAL */}
          <div className="mt-4 space-y-3">
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-500">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-500">Shipping</span>
              <span>Free</span>
            </div>

            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span className="text-yellow-600">${subtotal.toFixed(2)}</span>
            </div>
          </div>

          {/* PAYMENT */}
          <div className="mt-6 space-y-3 text-sm">
            <label className="flex gap-2">
              <input type="radio" name="payment" defaultChecked />
              Cash on Delivery
            </label>
            <label className="flex gap-2">
              <input type="radio" name="payment" />
              Bank Transfer
            </label>
          </div>

          {/* BUTTON */}
          <div className="mt-6">
            <button
              onClick={handleSubmit}
              className="w-full relative overflow-hidden bg-[#eba07a] text-white py-3 rounded-full group">
              <span className="absolute inset-0 bg-yellow-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></span>
              <span className="relative z-10">Place Order</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
