"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, ShoppingCart, Plus, Minus, Check } from "lucide-react";
import { useQuickView } from "./QuickViewContext";
import { usePreferences } from "@/lib/i18n";
import { cartAPI, type Product } from "@/lib/api";

type QuickViewModalProps = {
  productId: number;
  onClose: () => void;
};

export default function QuickViewModal({ productId, onClose }: QuickViewModalProps) {
  const router = useRouter();
  const { t, formatPrice, translateCategory } = usePreferences();
  const { getProductDetails } = useQuickView();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);

  // Variant & Quantity States
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [addingCart, setAddingCart] = useState<boolean>(false);
  const [buyingNow, setBuyingNow] = useState<boolean>(false);

  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  // Fetch product on open
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getProductDetails(productId);
        setProduct(data);

        // Pre-select default variant or fallback
        if (data.type === "variable" && data.variants && data.variants.length > 0) {
          let targetVariant = data.variants.find(
            (v: any) => v.id === data.defaultVariant?.id && v.isActive && v.stock > 0
          );

          // Fallback 1: First active in-stock variant
          if (!targetVariant) {
            targetVariant = data.variants.find((v: any) => v.isActive && v.stock > 0);
          }

          // Fallback 2: First active variant (even if out of stock)
          if (!targetVariant) {
            targetVariant = data.variants.find((v: any) => v.isActive);
          }

          // Fallback 3: First variant
          if (!targetVariant) {
            targetVariant = data.variants[0];
          }

          if (targetVariant) {
            setSelectedVariant(targetVariant);
            setSelectedOptions(targetVariant.options || {});
          }
        }
      } catch (err: any) {
        console.error("Quick View load error:", err);
        setError("Không thể tải thông tin sản phẩm.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, getProductDetails]);

  // Handle option click
  const handleSelectOption = (optionName: string, optionValue: string) => {
    const nextOptions = { ...selectedOptions, [optionName]: optionValue };
    setSelectedOptions(nextOptions);

    if (product?.variants) {
      const match = product.variants.find((v) => {
        return Object.keys(nextOptions).every((key) => v.options[key] === nextOptions[key]);
      });
      setSelectedVariant(match || null);
      // Reset quantity if it exceeds matched variant stock
      if (match && quantity > match.stock) {
        setQuantity(Math.max(1, match.stock));
      }
    }
  };

  // Cart addition logic
  const handleAddToCart = async (redirect = false) => {
    if (!product) return;
    
    // Ensure all options are selected for variable product
    if (product.type === "variable") {
      const allSelected = product.options?.every((opt) => !!selectedOptions[opt.name]);
      if (!allSelected || !selectedVariant) {
        alert(t("label.selectRequiredOptions"));
        return;
      }
    }

    try {
      if (redirect) setBuyingNow(true);
      else setAddingCart(true);

      const targetVariantId = product.type === "variable" ? selectedVariant?.id : undefined;
      await cartAPI.add(product.id, quantity, targetVariantId);
      
      if (redirect) {
        onClose();
        router.push("/cart");
      } else {
        alert(t("alert.addedToCartShort"));
        onClose();
      }
    } catch (err: any) {
      const status = err?.response?.status as number | undefined;
      const code = err?.code as string | undefined;

      if (status === 401 || code === "AUTH_REQUIRED") {
        alert(t("alert.loginToAddCart"));
        router.push("/login");
        return;
      }

      if (code === "CART_DUPLICATE") {
        if (redirect) {
          onClose();
          router.push("/cart");
          return;
        }
        alert(t("alert.cartDuplicate"));
        onClose();
        return;
      }

      console.error(err);
      alert(err?.response?.data?.message || err?.message || "Lỗi khi thêm vào giỏ hàng");
    } finally {
      setAddingCart(false);
      setBuyingNow(false);
    }
  };

  // Compile selected option summary string
  const getSelectedSummary = () => {
    if (!product || product.type !== "variable" || Object.keys(selectedOptions).length === 0) {
      return "";
    }
    return Object.entries(selectedOptions)
      .map(([key, val]) => val)
      .join(" • ");
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-6 transition-opacity duration-300"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-neutral-100 flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh] animate-scale-up"
      >
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          type="button"
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 border border-neutral-200 text-neutral-600 hover:text-black hover:bg-white hover:shadow transition duration-200"
        >
          <X size={18} />
        </button>

        {loading ? (
          <SkeletonLoader />
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-red-500 min-h-[300px]">
            <p className="font-semibold text-lg">{error}</p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-brand-primary text-white rounded-xl text-sm font-semibold hover:bg-brand-primary-hover transition"
            >
              Đóng
            </button>
          </div>
        ) : product ? (
          <>
            {/* LEFT SIDE: PRODUCT IMAGE */}
            <div className="w-full md:w-1/2 relative bg-brand-surface border-r border-[#eadfcc]/60 flex items-center justify-center p-6 aspect-square md:aspect-auto">
              <div className="relative w-full h-full min-h-[260px] md:min-h-[400px]">
                <Image
                  src={
                    (product.type === "variable" && selectedVariant?.image) ||
                    product.image ||
                    "/placeholder.png"
                  }
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover rounded-2xl"
                  priority
                />
              </div>
            </div>

            {/* RIGHT SIDE: PRODUCT DETAILS */}
            <div className="w-full md:w-1/2 p-6 md:p-8 overflow-y-auto flex flex-col justify-between">
              <div>
                {/* Category */}
                <p className="text-xs text-brand-muted font-bold uppercase tracking-wider mb-1">
                  {product.category?.name
                    ? translateCategory(product.category.name)
                    : t("label.categoryFallback")}
                </p>

                {/* Title */}
                <h2 className="text-2xl font-bold text-neutral-900 leading-snug mb-3">
                  {product.name}
                </h2>

                {/* PRICE */}
                <div className="mb-4">
                  {product.type === "variable" ? (
                    <div className="flex flex-col">
                      {selectedVariant ? (
                        <span className="text-3xl font-extrabold text-brand-primary">
                          {formatPrice(selectedVariant.price)}
                        </span>
                      ) : (
                        <span className="text-3xl font-extrabold text-brand-primary">
                          {product.maxPrice && product.maxPrice > product.price
                            ? `${formatPrice(product.price)} - ${formatPrice(product.maxPrice)}`
                            : formatPrice(product.price)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-3xl font-extrabold text-brand-primary">
                      {formatPrice(product.price)}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-neutral-500 text-sm leading-relaxed mb-6 line-clamp-3 md:line-clamp-4">
                  {product.description}
                </p>

                {/* OPTIONS SELECTION */}
                {product.type === "variable" && product.options && product.options.map((opt) => (
                  <div key={opt.id} className="mb-4">
                    <p className="text-sm font-semibold text-neutral-800 mb-2">{opt.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {opt.values.map((val) => {
                        const isSelected = selectedOptions[opt.name] === val;
                        return (
                          <button
                            key={val}
                            onClick={() => handleSelectOption(opt.name, val)}
                            type="button"
                            className={`px-4 py-1.5 text-xs font-semibold rounded-xl border transition duration-200 cursor-pointer flex items-center gap-1 ${
                              isSelected
                                ? "bg-brand-primary border-brand-primary text-white shadow-sm"
                                : "bg-white border-brand-primary-light text-brand-primary hover:border-brand-primary hover:bg-brand-surface"
                            }`}
                          >
                            {isSelected && <Check size={12} />}
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Selected Variant Summary */}
                {product.type === "variable" && getSelectedSummary() && (
                  <p className="text-xs font-semibold text-brand-muted mt-2 bg-brand-surface px-3 py-1.5 rounded-lg border border-[#eadfcc]/30 w-fit">
                    {t("label.selectedVariantSummary", { summary: getSelectedSummary() })}
                  </p>
                )}

                {/* STOCK STATUS */}
                <div className="mt-4 flex items-center gap-2 text-xs">
                  <span className="font-semibold text-neutral-500">
                    {t("label.availability")}
                  </span>

                  {product.type === "variable" ? (
                    selectedVariant ? (
                      selectedVariant.stock > 0 ? (
                        <span className="text-green-600 font-bold bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200">
                          {t("label.inStockWithCount", { count: selectedVariant.stock })}
                        </span>
                      ) : (
                        <span className="text-red-500 font-bold bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                          {t("label.outOfStock")}
                        </span>
                      )
                    ) : (
                      <span className="text-amber-500 font-bold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        Vui lòng chọn đầy đủ tùy chọn
                      </span>
                    )
                  ) : product.stock > 0 ? (
                    <span className="text-green-600 font-bold bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200">
                      {t("label.inStockWithCount", { count: product.stock })}
                    </span>
                  ) : (
                    <span className="text-red-500 font-bold bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                      {t("label.outOfStock")}
                    </span>
                  )}
                </div>
              </div>

              {/* FOOTER QUANTITY & ACTIONS */}
              <div className="mt-6 pt-4 border-t border-neutral-100 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-neutral-700">
                    {t("label.quantity")}
                  </span>
                  
                  <div className="flex items-center border border-brand-primary-light rounded-xl px-3 py-1.5 bg-white gap-4">
                    <button
                      type="button"
                      onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                      disabled={
                        product.type === "variable"
                          ? !selectedVariant || selectedVariant.stock <= 0
                          : product.stock <= 0
                      }
                      className="text-neutral-500 hover:text-neutral-900 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Minus size={14} />
                    </button>

                    <span className="text-sm font-bold text-neutral-800 w-4 text-center">
                      {quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((prev) =>
                          Math.min(selectedVariant ? selectedVariant.stock : product.stock, prev + 1)
                        )
                      }
                      disabled={
                        product.type === "variable"
                          ? !selectedVariant || selectedVariant.stock <= 0
                          : product.stock <= 0
                      }
                      className="text-neutral-500 hover:text-neutral-900 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  {/* ADD TO CART */}
                  <button
                    onClick={() => handleAddToCart(false)}
                    type="button"
                    disabled={
                      addingCart ||
                      (product.type === "variable"
                        ? !selectedVariant || selectedVariant.stock <= 0
                        : product.stock <= 0)
                    }
                    className="flex items-center justify-center gap-2 bg-brand-surface border border-brand-primary text-brand-primary hover:bg-[#eadfcc]/40 transition h-12 rounded-xl text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 shadow-sm"
                  >
                    {addingCart ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-primary border-b-transparent"></div>
                    ) : (
                      <ShoppingCart size={16} />
                    )}
                    {t("action.addToCart")}
                  </button>

                  {/* BUY NOW */}
                  <button
                    onClick={() => handleAddToCart(true)}
                    type="button"
                    disabled={
                      buyingNow ||
                      (product.type === "variable"
                        ? !selectedVariant || selectedVariant.stock <= 0
                        : product.stock <= 0)
                    }
                    className="flex items-center justify-center bg-brand-primary text-white hover:bg-[#8d6338] transition h-12 rounded-xl text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 shadow-sm"
                  >
                    {buyingNow ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-b-transparent"></div>
                    ) : null}
                    {t("action.buyNow")}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-[400px] w-full">
      {/* Image Skeleton */}
      <div className="w-full md:w-1/2 p-6 flex items-center justify-center bg-neutral-50 border-r border-neutral-100">
        <div className="w-full h-full min-h-[260px] md:min-h-[360px] bg-neutral-200 rounded-2xl animate-pulse"></div>
      </div>
      {/* Details Skeleton */}
      <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="h-3 bg-neutral-200 rounded-full w-24 animate-pulse"></div>
          <div className="h-7 bg-neutral-200 rounded-xl w-3/4 animate-pulse"></div>
          <div className="h-8 bg-neutral-200 rounded-xl w-1/3 animate-pulse"></div>
          <div className="space-y-2 pt-2">
            <div className="h-3 bg-neutral-200 rounded-full w-full animate-pulse"></div>
            <div className="h-3 bg-neutral-200 rounded-full w-5/6 animate-pulse"></div>
            <div className="h-3 bg-neutral-200 rounded-full w-4/6 animate-pulse"></div>
          </div>
          <div className="space-y-3 pt-4">
            <div className="h-4 bg-neutral-200 rounded-full w-16 animate-pulse"></div>
            <div className="flex gap-2">
              <div className="h-8 bg-neutral-200 rounded-xl w-14 animate-pulse"></div>
              <div className="h-8 bg-neutral-200 rounded-xl w-14 animate-pulse"></div>
              <div className="h-8 bg-neutral-200 rounded-xl w-14 animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="space-y-4 pt-6 border-t border-neutral-100">
          <div className="flex justify-between">
            <div className="h-4 bg-neutral-200 rounded-full w-16 animate-pulse"></div>
            <div className="h-8 bg-neutral-200 rounded-xl w-24 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <div className="h-12 bg-neutral-200 rounded-xl animate-pulse"></div>
            <div className="h-12 bg-neutral-200 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
