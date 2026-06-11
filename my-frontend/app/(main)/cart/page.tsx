"use client";

import Image from "next/image";
import Link from "next/link";
import { X, Minus, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cartAPI } from "@/lib/api";
import { getBrowserToken, setAuthToken } from "@/lib/auth-token";
import { normalizeCartItems } from "@/lib/cart";
import { usePreferences } from "@/lib/i18n";
import { isTokenExpired } from "@/lib/jwt";
import { calculateCartSubtotal } from "@/lib/money";
import PageHero from "@/components/layout/PageHero";

interface CartItem {
  id: number;
  quantity: number;
  price: number;
  product?: {
    id: number;
    name: string;
    price: number;
    image: string;
    stock: number;
  };
  variant?: {
    id: number;
    sku: string;
    name: string;
    price: number;
    stock: number;
    image?: string;
  } | null;
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { t, formatPrice } = usePreferences();
  const { data: session, status } = useSession();

  // 🔥 load cart
  const fetchCart = useCallback(async () => {
    const currentToken = getBrowserToken();
    if (!currentToken) {
      const sessionToken = session?.backendAccessToken;
      if (sessionToken && !isTokenExpired(sessionToken)) {
        setAuthToken(sessionToken);
      }
    }

    try {
      const res = await cartAPI.get();
      setCart(normalizeCartItems(res.data));
    } catch (err: any) {
      console.error("Fetch cart error:", err);
    } finally {
      setLoading(false);
    }
  }, [session?.backendAccessToken]);

  useEffect(() => {
    void fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    const handleCartUpdated = async () => {
      await fetchCart();
    };

    window.addEventListener("cart-updated", handleCartUpdated);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdated);
    };
  }, [fetchCart]);

  // 🔄 update quantity
  const updateQuantity = async (
    productId: number,
    variantId: number | undefined,
    type: "inc" | "dec",
    currentQty: number,
  ) => {
    const newQty = type === "inc" ? currentQty + 1 : currentQty - 1;

    if (newQty < 1) return;

    try {
      await cartAPI.update(productId, newQty, variantId);
      void fetchCart();
    } catch (err: any) {
      console.error("Update cart error:", err);
      alert(err?.response?.data?.message || err?.message || "Không thể cập nhật số lượng lúc này.");
    }
  };

  // ❌ remove item
  const removeItem = async (productId: number, variantId?: number) => {
    try {
      await cartAPI.remove(productId, variantId);
      void fetchCart();
    } catch (err: any) {
      console.error("Remove error:", err);
    }
  };

  // subtotal
  const subtotal = calculateCartSubtotal(cart);

  if (loading) {
    return <p className="text-center py-10">{t("label.loadingCart")}</p>;
  }

  return (
    <div className="w-full bg-white">
      {/* BANNER */}
      <PageHero
        variant="checkout"
        currentStep="cart"
        title={t("nav.cart")}
        breadcrumbs={[{ label: t("nav.cart") }]}
        centered={true}
      />

      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* LEFT */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-4 text-brand-text font-semibold border-b border-brand-primary-light pb-4">
            <span>{t("label.product")}</span>
            <span className="text-center">{t("label.price")}</span>
            <span className="text-center">{t("label.quantity")}</span>
            <span className="text-right">{t("label.subtotal")}</span>
          </div>

          {cart.length === 0 && (
            <p className="py-10 text-brand-muted">{t("label.cartEmpty")}</p>
          )}

          {cart.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-4 items-center py-6 border-b border-brand-primary-light">
              {/* PRODUCT */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => item.product && removeItem(item.product.id, item.variant?.id)}
                  className="text-brand-muted hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors relative z-10"
                  aria-label="Xóa sản phẩm">
                  <X size={18} />
                </button>

                {/* CLICK PRODUCT */}
                {item.product ? (
                  <Link
                    href={`/product/${item.product.id}`}
                    className="flex items-center gap-4 group">
                    <Image
                      src={(item.variant && item.variant.image) || item.product.image || "/placeholder.png"}
                      alt={item.product.name}
                      width={60}
                      height={80}
                    />

                    <div className="flex flex-col">
                      <span className="font-medium group-hover:text-brand-primary transition text-brand-text">
                        {item.product.name}
                      </span>
                      {item.variant && (
                        <span className="text-xs text-brand-muted mt-1 font-semibold">
                          Format: {item.variant.name}
                        </span>
                      )}
                      {item.variant ? (
                        item.variant.stock === 0 ? (
                          <span className="text-xs font-semibold text-red-500 mt-1">Hết hàng</span>
                        ) : item.quantity > item.variant.stock ? (
                          <span className="text-xs font-semibold text-red-500 mt-1">Không đủ hàng (Tồn: {item.variant.stock})</span>
                        ) : item.variant.stock < 5 ? (
                          <span className="text-xs text-orange-500 mt-1">Chỉ còn {item.variant.stock} sản phẩm</span>
                        ) : null
                      ) : (
                        item.product.stock === 0 ? (
                          <span className="text-xs font-semibold text-red-500 mt-1">Hết hàng</span>
                        ) : item.quantity > item.product.stock ? (
                          <span className="text-xs font-semibold text-red-500 mt-1">Không đủ hàng (Tồn: {item.product.stock})</span>
                        ) : item.product.stock < 5 ? (
                          <span className="text-xs text-orange-500 mt-1">Chỉ còn {item.product.stock} sản phẩm</span>
                        ) : null
                      )}
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-center gap-4">
                    <Image
                      src="/placeholder.png"
                      alt={t("label.product")}
                      width={60}
                      height={80}
                    />

                    <span className="font-medium text-brand-muted">
                      {t("label.product")}
                    </span>
                  </div>
                )}
              </div>

              {/* PRICE */}
              <span className="text-center text-brand-primary font-medium">
                {formatPrice(item.price)}
              </span>

              {/* QUANTITY */}
              <div className="flex justify-center">
                <div className="flex items-center border border-brand-primary-light bg-white rounded-[12px] px-3 py-1 gap-3">
                  <button
                    disabled={item.quantity <= 1}
                    onClick={() =>
                      item.product &&
                      updateQuantity(item.product.id, item.variant?.id, "dec", item.quantity)
                    }
                    className="disabled:opacity-30 disabled:cursor-not-allowed text-brand-text hover:text-brand-primary">
                    <Minus size={16} />
                  </button>

                  <span className="font-semibold text-brand-text">{item.quantity}</span>

                  <button
                    disabled={item.product ? item.quantity >= (item.variant ? item.variant.stock : item.product.stock) : false}
                    onClick={() =>
                      item.product &&
                      updateQuantity(item.product.id, item.variant?.id, "inc", item.quantity)
                    }
                    className="disabled:opacity-30 disabled:cursor-not-allowed text-brand-text hover:text-brand-primary">
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* SUBTOTAL */}
              <span className="text-right text-brand-primary font-medium">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        {/* RIGHT */}
        <div className="bg-brand-surface border border-brand-primary-light rounded-2xl p-6 h-fit shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-brand-text">
            {t("cart.cartTotalTitle")}
          </h2>

          <div className="flex justify-between py-3 border-b border-brand-primary-light text-brand-text">
            <span>{t("label.subtotal")}:</span>
            <span>{formatPrice(subtotal)}</span>
          </div>

          <div className="flex justify-between py-3 border-b border-brand-primary-light text-brand-text">
            <span>{t("label.shipping")}:</span>
            <span>{t("label.free")}</span>
          </div>

          <div className="flex justify-between py-3 font-semibold text-brand-text">
            <span>{t("label.total")}:</span>
            <span className="text-brand-primary text-lg">{formatPrice(subtotal)}</span>
          </div>

          <div className="mt-6">
            <button
              onClick={() => router.push("/checkout")}
              disabled={cart.length === 0}
              className={`w-full text-white h-11 font-semibold rounded-[12px] transition duration-300 flex items-center justify-center cursor-pointer border-none shadow-sm ${
                cart.length === 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-brand-primary hover:bg-[#8d6338]"
              }`}>
              {t("action.proceedToCheckout")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
