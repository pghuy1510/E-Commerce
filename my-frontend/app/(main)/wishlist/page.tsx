"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cartAPI, wishlistAPI } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";

interface WishlistItem {
  id: number;
  product: {
    id: number;
    name: string;
    price: number;
    image: string;
    stock: number;
  };
}

type FancyButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
};

const FancyButton = ({ children, onClick, disabled }: FancyButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="relative overflow-hidden bg-[#eba07a] text-white px-4 py-2 rounded-full text-sm group disabled:cursor-not-allowed disabled:opacity-60">
    <span className="absolute inset-0 bg-yellow-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></span>
    <span className="relative z-10">{children}</span>
  </button>
);

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const userId = 1;

  const router = useRouter();
  const { t, formatPrice } = usePreferences();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const data = await wishlistAPI.get(userId);
      setWishlist(data);
    } catch (err) {
      console.error("Fetch wishlist error:", err);
    }
  };

  const handleRemove = async (productId: number) => {
    await wishlistAPI.remove(userId, productId);
    fetchWishlist();
  };

  const handleAddToCart = async (productId: number) => {
    try {
      await cartAPI.add(productId);
      alert(t("alert.addedToCartShort"));
    } catch (err: any) {
      const status = err?.response?.status as number | undefined;
      const code = err?.code as string | undefined;

      if (status === 401 || code === "AUTH_REQUIRED") {
        alert(t("alert.loginToAddCart"));
        router.push("/login");
        return;
      }
      if (code === "CART_DUPLICATE") {
        alert(t("alert.cartDuplicate"));
        return;
      }

      const message =
        err?.response?.data?.message ||
        err?.message ||
        t("alert.addToCartFailed");
      alert(message);
    }
  };

  return (
    <div className="w-full">
      {/* BANNER */}
      <div className="bg-gradient-to-r from-yellow-600 to-white py-20 text-center">
        <h1 className="text-4xl font-bold text-gray-800">
          {t("label.wishlist")}
        </h1>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-5 text-gray-700 font-semibold border-b pb-4">
          <span>{t("label.product")}</span>

          <span className="text-center">{t("label.price")}</span>

          <span className="text-center">{t("label.stockShort")}</span>

          <span className="text-right">{t("label.subtotal")}</span>

          <span></span>
        </div>

        {wishlist.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-5 items-center py-6 border-b">
            {/* PRODUCT */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleRemove(item.product.id)}
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
              {formatPrice(item.product.price)}
            </span>

            {/* STOCK */}
            <span
              className={`text-center font-medium ${
                item.product.stock > 0 ? "text-green-600" : "text-yellow-500"
              }`}>
              {item.product.stock > 0
                ? t("label.inStock")
                : t("label.outOfStock")}
            </span>

            {/* SUBTOTAL */}
            <span className="text-right text-yellow-600 font-medium">
              {formatPrice(item.product.price)}
            </span>

            {/* ACTION */}
            <div className="flex justify-end">
              <FancyButton
                onClick={() => handleAddToCart(item.product.id)}
                disabled={item.product.stock <= 0}>
                {t("action.addToCart")}
              </FancyButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
