"use client";

import Image from "next/image";
import { Eye, Heart, ShoppingCart, Star } from "lucide-react";
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

  const soldCount = showSold && "sold" in product ? product.sold : undefined;

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-[16px] border border-brand-border bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.05)] transition-all duration-300 hover:border-[#a7794a] hover:shadow-xl">
      {/* IMAGE AREA */}
      <div className="relative w-full aspect-square overflow-hidden rounded-[12px] bg-brand-surface border border-[#eadfcc] mb-4 flex items-center justify-center">
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
            className="object-cover rounded-[12px] transition-transform duration-300 group-hover:-translate-x-[20px]"
          />
        </button>

        {/* ACTION ICONS - SLIDES IN ON HOVER */}
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-[10px] opacity-0 invisible translate-x-[16px] transition-all duration-300 group-hover:opacity-100 group-hover:visible group-hover:translate-x-0">
          <button
            type="button"
            onClick={handleWishlist}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[#eadfcc] shadow-xs hover:bg-[#a7794a] hover:text-white transition-all duration-300 cursor-pointer text-brand-muted">
            <Heart size={16} />
          </button>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[#eadfcc] shadow-xs hover:bg-[#a7794a] hover:text-white transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer text-brand-muted">
            <ShoppingCart size={16} />
          </button>

          <button
            type="button"
            onClick={() => router.push(`/product/${product.id}`)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[#eadfcc] shadow-xs hover:bg-[#a7794a] hover:text-white transition-all duration-300 cursor-pointer text-brand-muted">
            <Eye size={16} />
          </button>
        </div>
      </div>

      {/* INFO SECTION */}
      <div className="flex flex-1 flex-col mt-3">
        {/* Category: 14px font-medium color #a7794a */}
        <p className="text-[14px] text-brand-primary font-medium">
          {product.category?.name
            ? translateCategory(product.category.name)
            : t("label.categoryFallback")}
        </p>

        {/* Title: 18px font-semibold color #2f2a24, margin-top: 6px */}
        <button
          type="button"
          onClick={() => router.push(`/product/${product.id}`)}
          className="mt-[6px] text-left text-[18px] font-semibold text-brand-text line-clamp-2 hover:text-brand-primary transition-colors cursor-pointer leading-snug min-h-[56px] block w-full">
          {product.name}
        </button>

        {/* Price: 18px font-bold color #2f2a24, margin-top: 10px, left accent line 3px solid #a7794a, padding-left 8px */}
        <div className="mt-[10px] flex items-center justify-between border-l-3 border-brand-primary pl-2">
          <span className="text-[18px] font-bold text-brand-text">
            {formatPrice(product.price)}
          </span>
        </div>

        {/* Rating section: margin-top: 14px, star color #f0a044 */}
        <div className="mt-[14px] flex items-center justify-between border-t border-brand-border pt-3">
          <span className="text-[14px] text-brand-muted font-medium">
            {typeof soldCount === "number" ? (
              t("label.sold", { count: soldCount })
            ) : product.stock > 0 ? (
              t("label.stock", { count: product.stock })
            ) : (
              <span className="text-red-500 font-medium">{t("label.outOfStockShort")}</span>
            )}
          </span>

          <div className="flex gap-0.5 text-brand-stars">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={12} fill="currentColor" stroke="none" />
            ))}
          </div>
        </div>

        {/* Button: margin-top: auto */}
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={product.stock <= 0}
          className="mt-auto w-full h-[44px] bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold rounded-[10px] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 border-none shadow-sm">
          {t("action.addToCart")}
        </button>
      </div>
    </div>
  );
}
