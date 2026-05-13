"use client";

import Image from "next/image";
import Link from "next/link";
import { X, Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cartAPI } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";

interface CartItem {
  id: number;
  quantity: number;
  price: number;
  product: {
    id: number;
    name: string;
    price: number;
    image: string;
  };
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { t, formatPrice } = usePreferences();

  // 🔥 load cart từ backend
  const fetchCart = async () => {
    try {
      const res = await cartAPI.get();
      setCart(res.data.items || []);
    } catch (err: any) {
      const status = err?.response?.status as number | undefined;
      const code = err?.code as string | undefined;

      if (status === 401 || code === "AUTH_REQUIRED") {
        router.push("/login");
        return;
      }

      console.error("Fetch cart error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // 🔄 update quantity
  const updateQuantity = async (
    productId: number,
    type: "inc" | "dec",
    currentQty: number,
  ) => {
    const newQty = type === "inc" ? currentQty + 1 : currentQty - 1;

    if (newQty < 1) return;

    try {
      await cartAPI.update(productId, newQty);
      fetchCart();
    } catch (err: any) {
      const status = err?.response?.status as number | undefined;
      const code = err?.code as string | undefined;

      if (status === 401 || code === "AUTH_REQUIRED") {
        router.push("/login");
        return;
      }

      console.error("Update cart error:", err);
    }
  };

  // ❌ remove item
  const removeItem = async (productId: number) => {
    try {
      await cartAPI.remove(productId);
      fetchCart();
    } catch (err: any) {
      const status = err?.response?.status as number | undefined;
      const code = err?.code as string | undefined;

      if (status === 401 || code === "AUTH_REQUIRED") {
        router.push("/login");
        return;
      }

      console.error("Remove error:", err);
    }
  };

  // subtotal
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  if (loading) {
    return <p className="text-center py-10">{t("label.loadingCart")}</p>;
  }

  return (
    <div className="w-full">
      {/* BANNER */}
      <div className="bg-gradient-to-r from-yellow-600 to-white py-20 text-center">
        <h1 className="text-4xl font-bold text-gray-800">{t("nav.cart")}</h1>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* LEFT */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-4 text-gray-700 font-semibold border-b pb-4">
            <span>{t("label.product")}</span>
            <span className="text-center">{t("label.price")}</span>
            <span className="text-center">{t("label.quantity")}</span>
            <span className="text-right">{t("label.subtotal")}</span>
          </div>

          {cart.length === 0 && (
            <p className="py-10 text-gray-500">{t("label.cartEmpty")}</p>
          )}

          {cart.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-4 items-center py-6 border-b">
              {/* PRODUCT */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="text-gray-400 hover:text-yellow-600">
                  <X size={18} />
                </button>

                {/* CLICK PRODUCT */}
                <Link
                  href={`/product/${item.product.id}`}
                  className="flex items-center gap-4 group">
                  <Image
                    src={item.product.image || "/placeholder.png"}
                    alt={item.product.name}
                    width={60}
                    height={80}
                  />

                  <span className="font-medium group-hover:text-yellow-600 transition">
                    {item.product.name}
                  </span>
                </Link>
              </div>

              {/* PRICE */}
              <span className="text-center text-yellow-600 font-medium">
                {formatPrice(item.price)}
              </span>

              {/* QUANTITY */}
              <div className="flex justify-center">
                <div className="flex items-center border rounded-full px-3 py-1 gap-3">
                  <button
                    onClick={() =>
                      updateQuantity(item.product.id, "dec", item.quantity)
                    }>
                    <Minus size={16} />
                  </button>

                  <span>{item.quantity}</span>

                  <button
                    onClick={() =>
                      updateQuantity(item.product.id, "inc", item.quantity)
                    }>
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* SUBTOTAL */}
              <span className="text-right text-yellow-600 font-medium">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        {/* RIGHT */}
        <div className="border rounded-lg p-6 h-fit shadow-sm">
          <h2 className="text-lg font-semibold mb-4">
            {t("cart.cartTotalTitle")}
          </h2>

          <div className="flex justify-between py-3 border-b">
            <span>{t("label.subtotal")}:</span>
            <span>{formatPrice(subtotal)}</span>
          </div>

          <div className="flex justify-between py-3 border-b">
            <span>{t("label.shipping")}:</span>
            <span>{t("label.free")}</span>
          </div>

          <div className="flex justify-between py-3 font-semibold">
            <span>{t("label.total")}:</span>
            <span className="text-yellow-600">{formatPrice(subtotal)}</span>
          </div>

          <div className="mt-6">
            <button className="w-full bg-[#eba07a] text-white py-3 rounded-full hover:bg-yellow-600 transition">
              {t("action.proceedToCheckout")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
