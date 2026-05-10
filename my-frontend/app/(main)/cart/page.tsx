"use client";

import Image from "next/image";
import { X, Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cartAPI } from "@/lib/api";

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

  // 💰 subtotal
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const FancyButton = ({ children }: { children: React.ReactNode }) => (
    <button className="relative overflow-hidden bg-[#eba07a] text-white px-5 py-2 rounded-full text-sm group">
      <span className="absolute inset-0 bg-yellow-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></span>
      <span className="relative z-10">{children}</span>
    </button>
  );

  if (loading) return <p className="text-center py-10">Loading cart...</p>;

  return (
    <div className="w-full">
      {/* BANNER */}
      <div className="bg-gradient-to-r from-yellow-600 to-white py-20 text-center">
        <h1 className="text-4xl font-bold text-gray-800">Cart</h1>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* LEFT */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-4 text-gray-700 font-semibold border-b pb-4">
            <span>Product</span>
            <span className="text-center">Price</span>
            <span className="text-center">Quantity</span>
            <span className="text-right">Subtotal</span>
          </div>

          {cart.length === 0 && (
            <p className="py-10 text-gray-500">Cart is empty</p>
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

                <Image
                  src={item.product.image || "/placeholder.png"}
                  alt=""
                  width={60}
                  height={80}
                />

                <span className="font-medium">{item.product.name}</span>
              </div>

              {/* PRICE */}
              <span className="text-center text-yellow-600 font-medium">
                ${item.price.toFixed(2)}
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
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* RIGHT */}
        <div className="border rounded-lg p-6 h-fit shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Cart Total</h2>

          <div className="flex justify-between py-3 border-b">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between py-3 border-b">
            <span>Shipping:</span>
            <span>Free</span>
          </div>

          <div className="flex justify-between py-3 font-semibold">
            <span>Total:</span>
            <span className="text-yellow-600">${subtotal.toFixed(2)}</span>
          </div>

          <div className="mt-6">
            <button className="w-full bg-[#eba07a] text-white py-3 rounded-full hover:bg-yellow-600 transition">
              Proceed To Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
