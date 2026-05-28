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
import ProductQr from "@/components/qr/ProductQr";

type BadgeTone = "amber" | "emerald" | "gray";

type ProductCardProps = {
  product: Product | BestSellerProduct;
  badge?: string;
  badgeTone?: BadgeTone;
  showSold?: boolean;
};

const BADGE_STYLES: Record<BadgeTone, string> = {
  amber: "bg-yellow-600 text-white",
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
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-yellow-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative bg-[#f8f1e7] p-4">
        {badge && (
          <span
            className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${BADGE_STYLES[badgeTone]}`}>
            {badge}
          </span>
        )}

        <button
          type="button"
          onClick={() => router.push(`/product/${product.id}`)}
          className="relative block h-48 w-full overflow-hidden rounded-xl bg-white">
          <Image
            src={product.image || "/placeholder.png"}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-contain transition duration-300 group-hover:scale-105"
          />
        </button>

        <div className="absolute right-4 top-4 flex flex-col gap-2 opacity-0 translate-x-2 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
          <button
            type="button"
            onClick={handleWishlist}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow hover:bg-yellow-600 hover:text-white transition">
            <Heart size={16} />
          </button>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow hover:bg-yellow-600 hover:text-white transition disabled:cursor-not-allowed disabled:opacity-60">
            <ShoppingCart size={16} />
          </button>

          <button
            type="button"
            onClick={() => router.push(`/product/${product.id}`)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow hover:bg-gray-800 hover:text-white transition">
            <Eye size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-5 pt-4">
        <p className="text-xs text-gray-500">
          {product.category?.name
            ? translateCategory(product.category.name)
            : t("label.categoryFallback")}
        </p>

        <button
          type="button"
          onClick={() => router.push(`/product/${product.id}`)}
          className="mt-1 text-left text-sm font-semibold text-gray-900 line-clamp-2 hover:text-yellow-700">
          {product.name}
        </button>

        {typeof soldCount === "number" && (
          <p className="mt-1 text-xs text-gray-500">
            {t("label.sold", { count: soldCount })}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <span className="text-base font-semibold text-gray-900">
            {formatPrice(product.price)}
          </span>

          {product.stock > 0 ? (
            <span className="text-xs font-medium text-emerald-600">
              {t("label.inStockWithCount", { count: product.stock })}
            </span>
          ) : (
            <span className="text-xs font-medium text-red-500">
              {t("label.outOfStockShort")}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={product.stock <= 0}
          className="relative mt-4 w-full overflow-hidden rounded-full bg-[#eee0d9] py-2 text-sm font-medium text-yellow-700 transition group disabled:cursor-not-allowed disabled:opacity-60">
          <span className="absolute inset-0 -translate-x-full bg-yellow-600 transition-transform duration-300 group-hover:translate-x-0"></span>
          <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
            {t("action.addToCart")}
          </span>
        </button>

        {product.stock > 0 && (
          <ProductQr
            amount={product.price}
            addInfo={`PROD${product.id}`}
            productName={product.name}
            className="mt-4"
          />
        )}
      </div>
    </div>
  );
}
