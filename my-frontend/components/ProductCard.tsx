"use client";

import Image from "next/image";
import { Eye, Heart, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePreferences } from "@/lib/i18n";
import {
  cartAPI,
  wishlistAPI,
  type BestSellerProduct,
  type Product,
} from "@/lib/api";

type BadgeTone = "amber" | "emerald" | "gray";

type ProductCardProps = {
  product: Product | BestSellerProduct;
  badge?: string;
  badgeTone?: BadgeTone;
  showSold?: boolean;
};

const BADGE_STYLES: Record<BadgeTone, string> = {
  amber: "bg-brand-primary text-white",
  emerald: "bg-emerald-600 text-white",
  gray: "bg-gray-700 text-white",
};

export default function ProductCard({
  product,
  badge,
  badgeTone = "amber",
  showSold = false,
}: ProductCardProps) {
  const router = useRouter();
  const { t, formatPrice, translateCategory } = usePreferences();
  const userId = 1;

  const handleWishlist = async () => {
    try {
      await wishlistAPI.toggle(userId, product.id);
      alert(t("alert.addedToWishlist"));
    } catch (err: any) {
      const code = err?.code as string | undefined;
      if (code === "WISHLIST_DUPLICATE") {
        alert(t("alert.wishlistDuplicate"));
        return;
      }
      console.error(err);
    }
  };

  const handleAddToCart = async () => {
    try {
      await cartAPI.add(product.id);
      alert(t("alert.addedToCart"));
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
      console.error(err);
      alert(message);
    }
  };

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-[16px] border border-neutral-100 bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.05)] transition-all duration-500 ease-out hover:-translate-y-[6px] hover:border-brand-primary/40 hover:shadow-xl">
      {/* IMAGE AREA */}
      <div className="relative mb-3 group/image-wrapper">
        <div className="relative w-full aspect-square overflow-hidden rounded-[12px] bg-brand-surface border border-[#eadfcc] flex items-center justify-center">
          {badge && (
            <span
              className={`absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-xs font-semibold ${BADGE_STYLES[badgeTone]}`}>
              {badge}
            </span>
          )}

          <button
            type="button"
            onClick={() => router.push(`/product/${product.id}`)}
            className="relative block w-full h-full">
            <Image
              src={product.image || "/placeholder.png"}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover rounded-[12px] transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
          </button>
        </div>

        {/* ACTION ICONS - SLIDES IN ON HOVER */}
        <div className="absolute right-[-14px] top-8 z-20 flex flex-col gap-2 opacity-0 invisible translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:visible group-hover:translate-x-0">
          <button
            type="button"
            onClick={handleWishlist}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[#eadfcc] shadow-sm hover:shadow-md hover:bg-[#a7794a] hover:text-white hover:border-[#a7794a] transition-all duration-300 cursor-pointer text-brand-muted">
            <Heart size={15} />
          </button>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[#eadfcc] shadow-sm hover:shadow-md hover:bg-[#a7794a] hover:text-white hover:border-[#a7794a] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer text-brand-muted">
            <ShoppingCart size={15} />
          </button>

          <button
            type="button"
            onClick={() => router.push(`/product/${product.id}`)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[#eadfcc] shadow-sm hover:shadow-md hover:bg-[#a7794a] hover:text-white hover:border-[#a7794a] transition-all duration-300 cursor-pointer text-brand-muted">
            <Eye size={15} />
          </button>
        </div>
      </div>

      {/* INFO SECTION */}
      <div className="flex flex-1 flex-col mt-2">
        {/* Category */}
        <p className="text-xs text-brand-muted font-medium uppercase tracking-wider">
          {product.category?.name
            ? translateCategory(product.category.name)
            : t("label.categoryFallback")}
        </p>

        {/* Title */}
        <button
          type="button"
          onClick={() => router.push(`/product/${product.id}`)}
          className="mt-1.5 text-left text-[16px] font-semibold text-brand-text line-clamp-2 leading-snug hover:text-brand-primary transition-colors cursor-pointer block w-full">
          {product.name}
        </button>

        {/* PRICE + ADD TO CART ROW */}
        <div className="flex items-end justify-between mt-3">
          <span className="text-[18px] font-bold text-brand-primary">
            {formatPrice(product.price)}
          </span>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className="h-8 min-w-[82px] px-3 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-brand-primary text-white transition-all duration-300 hover:bg-brand-primary-hover hover:shadow-md hover:-translate-y-0.5 flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-60 border-none">
            {t("action.addShort")}
          </button>
        </div>
      </div>
    </div>
  );
}
