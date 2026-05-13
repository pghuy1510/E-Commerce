"use client";

import { useState } from "react";
import { usePreferences } from "@/lib/i18n";

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
  const { t, formatPrice } = usePreferences();

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
    alert(t("alert.orderSuccess"));
  };

  return (
    <div className="w-full">
      {/* BANNER */}
      <div className="bg-gradient-to-r from-yellow-600 to-white py-20 text-center">
        <h1 className="text-4xl font-bold text-gray-800">
          {t("label.checkout")}
        </h1>
        <p className="text-gray-500 mt-2">
          {t("label.home")} &gt; {t("label.checkout")}
        </p>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* LEFT - FORM */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold">{t("label.billingDetails")}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="name"
              placeholder={t("label.fullName")}
              onChange={handleChange}
              className="border border-gray-300 px-4 py-3 rounded-md outline-none focus:border-yellow-500"
            />
            <input
              name="phone"
              placeholder={t("label.phone")}
              onChange={handleChange}
              className="border border-gray-300 px-4 py-3 rounded-md outline-none focus:border-yellow-500"
            />
          </div>

          <input
            name="email"
            placeholder={t("label.email")}
            onChange={handleChange}
            className="w-full border border-gray-300 px-4 py-3 rounded-md outline-none focus:border-yellow-500"
          />

          <input
            name="address"
            placeholder={t("label.address")}
            onChange={handleChange}
            className="w-full border border-gray-300 px-4 py-3 rounded-md outline-none focus:border-yellow-500"
          />

          <textarea
            name="note"
            placeholder={t("label.orderNotesOptional")}
            onChange={handleChange}
            className="w-full border border-gray-300 px-4 py-3 rounded-md outline-none focus:border-yellow-500"
          />
        </div>

        {/* RIGHT - ORDER SUMMARY */}
        <div className="border border-gray-200 rounded-lg p-6 h-fit shadow-sm">
          <h2 className="text-lg font-semibold mb-4">{t("label.yourOrder")}</h2>

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
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* TOTAL */}
          <div className="mt-4 space-y-3">
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-500">{t("label.subtotal")}</span>
              <span>{formatPrice(subtotal)}</span>
            </div>

            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-500">{t("label.shipping")}</span>
              <span>{t("label.free")}</span>
            </div>

            <div className="flex justify-between font-semibold text-lg">
              <span>{t("label.total")}</span>
              <span className="text-yellow-600">{formatPrice(subtotal)}</span>
            </div>
          </div>

          {/* PAYMENT */}
          <div className="mt-6 space-y-3 text-sm">
            <label className="flex gap-2">
              <input type="radio" name="payment" defaultChecked />
              {t("label.paymentCashOnDelivery")}
            </label>
            <label className="flex gap-2">
              <input type="radio" name="payment" />
              {t("label.paymentBankTransfer")}
            </label>
          </div>

          {/* BUTTON */}
          <div className="mt-6">
            <button
              onClick={handleSubmit}
              className="w-full relative overflow-hidden bg-[#eba07a] text-white py-3 rounded-full group">
              <span className="absolute inset-0 bg-yellow-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></span>
              <span className="relative z-10">{t("action.placeOrder")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
