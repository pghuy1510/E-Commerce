"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cartAPI, wishlistAPI } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";
import PageHero from "@/components/layout/PageHero";

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
    className="w-36 h-11 bg-brand-primary hover:bg-[#8d6338] text-white text-sm font-semibold rounded-[12px] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 border-none shadow-sm">
    {children}
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
    <div className="w-full bg-white">
      <PageHero
        variant="default"
        title={t("label.wishlist")}
        breadcrumbs={[{ label: t("label.wishlist") }]}
        centered={true}
      />

      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-5 text-brand-text font-semibold border-b border-brand-primary-light pb-4">
          <span>{t("label.product")}</span>

          <span className="text-center">{t("label.price")}</span>

          <span className="text-center">{t("label.stockShort")}</span>

          <span className="text-right">{t("label.subtotal")}</span>

          <span></span>
        </div>

        {wishlist.length === 0 && (
          <p className="py-10 text-brand-muted text-center col-span-5">{t("label.wishlistEmpty") || "Danh sách yêu thích trống."}</p>
        )}

        {wishlist.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-5 items-center py-6 border-b border-brand-primary-light">
            {/* PRODUCT */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => handleRemove(item.product.id)}
                className="text-brand-muted hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors relative z-10"
                aria-label="Xóa khỏi danh sách yêu thích">
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

                <span className="font-medium group-hover:text-brand-primary transition text-brand-text">
                  {item.product.name}
                </span>
              </Link>
            </div>

            {/* PRICE */}
            <span className="text-center text-brand-primary font-medium">
              {formatPrice(item.product.price)}
            </span>

            {/* STOCK */}
            <span
              className={`text-center font-medium ${
                item.product.stock > 0 ? "text-green-600" : "text-red-500"
              }`}>
              {item.product.stock > 0
                ? t("label.inStock")
                : t("label.outOfStock")}
            </span>

            {/* SUBTOTAL */}
            <span className="text-right text-brand-primary font-medium">
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
