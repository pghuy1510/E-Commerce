"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { Star, Heart, Minus, Plus, ShoppingCart, Eye, CheckCircle } from "lucide-react";

import { productAPI, type Product, wishlistAPI, cartAPI, reviewsAPI } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";

export default function ProductDetailPage() {
  const params = useParams();
  const idParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    average: 5,
    count: 0,
    distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
  });
  const { t, formatPrice, translateCategory } = usePreferences();

  const userId = 1;

  useEffect(() => {
    if (!idParam) {
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setProduct(null);
        setRelatedProducts([]);

        const prodId = Number(idParam);
        const data = await productAPI.getById(prodId);
        setProduct(data);

        // Fetch related products and reviews in parallel
        const [allProducts, sumData, listData] = await Promise.all([
          productAPI.getAll(),
          reviewsAPI.getSummary(prodId).catch(() => ({
            average: 5,
            count: 0,
            distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
          })),
          reviewsAPI.getByProduct(prodId).catch(() => []),
        ]);

        const related = allProducts
          .filter(
            (item: Product) =>
              item.id !== data.id && item.category?.id === data.category?.id,
          )
          .slice(0, 4);

        setRelatedProducts(related);
        setSummary(sumData);
        setReviews(listData);
      } catch (err) {
        console.error("Fetch product error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [idParam]);

  const handleAddToCartById = async (productId: number, qty = 1) => {
    try {
      await cartAPI.add(productId, qty);
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

      console.error("Add cart error:", err);
    }
  };

  const handleWishlistById = async (productId: number) => {
    try {
      await wishlistAPI.toggle(userId, productId);
      alert(t("alert.addedToWishlist"));
    } catch (err: any) {
      const code = err?.code as string | undefined;
      if (code === "WISHLIST_DUPLICATE") {
        alert(t("alert.wishlistDuplicate"));
        return;
      }
      console.error("Wishlist error:", err);
    }
  };

  if (loading) {
    return (
      <div className="py-40 text-center text-gray-500">
        {t("label.loadingProduct")}
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-40 text-center text-red-500">
        {t("label.productNotFound")}
      </div>
    );
  }

  const qrAmount = product.price * quantity;

  return (
    <div className="w-full">
      {/* BANNER */}
      <div className="bg-gradient-to-r from-yellow-100 to-white py-20 text-center">
        <h1 className="text-4xl font-bold text-gray-800">
          {t("label.shopDetails")}
        </h1>
        <p className="text-gray-500 mt-2">
          {t("label.home")} &gt; {t("label.shopDetails")}
        </p>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* IMAGE */}
        <div>
          <div className="bg-[#f5f1ee] rounded-3xl p-10 flex justify-center">
            <Image
              src={product.image || "/placeholder.png"}
              alt={product.name}
              width={380}
              height={480}
              className="object-contain hover:scale-105 transition duration-300"
            />
          </div>
        </div>

        {/* INFO */}
        <div>
          {/* CATEGORY */}
          <p className="text-sm text-yellow-600 font-semibold uppercase mb-2">
            {product.category?.name
              ? translateCategory(product.category.name)
              : t("topRating.categoryFallback")}
          </p>

          {/* NAME */}
          <h1 className="text-4xl font-bold text-gray-900 leading-tight">
            {product.name}
          </h1>

          {/* RATING */}
          <div className="flex items-center gap-1.5 text-orange-400 mt-4">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={18}
                  fill={star <= Math.round(summary.average) ? "currentColor" : "none"}
                  className={star <= Math.round(summary.average) ? "text-amber-500" : "text-gray-300"}
                />
              ))}
            </div>
            <span className="text-sm font-bold text-gray-800 ml-1">
              {summary.average} / 5
            </span>
            <span className="text-gray-400 text-sm">
              ({summary.count} đánh giá)
            </span>
          </div>

          {/* PRICE */}
          <p className="text-4xl font-bold text-yellow-600 mt-6">
            {formatPrice(product.price)}
          </p>

          {/* DESCRIPTION */}
          <p className="text-gray-600 mt-6 leading-8">{product.description}</p>

          {/* STOCK */}
          <div className="mt-6 flex items-center gap-2">
            <span className="font-semibold text-gray-800">
              {t("label.availability")}
            </span>

            {product.stock > 0 ? (
              <span className="text-green-600 font-medium">
                {t("label.inStockWithCount", { count: product.stock })}
              </span>
            ) : (
              <span className="text-red-500 font-medium">
                {t("label.outOfStock")}
              </span>
            )}
          </div>

          {/* QUANTITY */}
          <div className="mt-8">
            <p className="font-semibold mb-3">{t("label.quantity")}</p>

            <div className="flex items-center border border-gray-300 rounded-full w-fit px-4 py-2 gap-5">
              <button
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}>
                <Minus size={16} />
              </button>

              <span className="font-semibold">{quantity}</span>

              <button
                onClick={() => setQuantity((prev) => Math.min(product.stock, prev + 1))}>
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex flex-wrap gap-4 mt-10">
            {/* ADD CART */}
            <button
              onClick={() =>
                product && handleAddToCartById(product.id, quantity)
              }
              disabled={product.stock <= 0}
              className="flex items-center gap-2 bg-[#eba07a] hover:bg-yellow-600 transition text-white px-8 py-4 rounded-full disabled:opacity-50">
              <ShoppingCart size={18} />
              {t("action.addToCart")}
            </button>

            {/* WISHLIST */}
            <button
              onClick={() => product && handleWishlistById(product.id)}
              className="border border-gray-300 hover:border-yellow-600 hover:bg-yellow-600 hover:text-white transition px-5 py-4 rounded-full">
              <Heart size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* REVIEWS SECTION */}
      <div className="max-w-7xl mx-auto px-6 py-16 border-t border-gray-200">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Đánh giá từ khách hàng</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Summary Breakdown */}
          <div className="bg-amber-50/40 border border-amber-100 rounded-3xl p-8 space-y-6 self-start">
            <div className="text-center space-y-2">
              <p className="text-5xl font-black text-amber-600">{summary.average}</p>
              <div className="flex justify-center gap-1 text-amber-500">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={22}
                    fill={star <= Math.round(summary.average) ? "currentColor" : "none"}
                    className={star <= Math.round(summary.average) ? "text-amber-500" : "text-gray-300"}
                  />
                ))}
              </div>
              <p className="text-sm font-semibold text-gray-500">{summary.count} nhận xét từ người mua</p>
            </div>

            {/* Distribution bars */}
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = summary.distribution[star.toString()] || 0;
                const percent = summary.count > 0 ? (count / summary.count) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-3 text-sm">
                    <span className="w-3 font-semibold text-gray-600">{star}</span>
                    <Star size={14} className="text-amber-500 fill-amber-500 shrink-0" />
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-medium text-gray-400">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-6">
            {reviews.length === 0 ? (
              <div className="text-center py-12 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                <p className="text-gray-400 font-medium">Chưa có đánh giá nào cho sản phẩm này.</p>
                <p className="text-xs text-gray-400 mt-1">Hãy mua sản phẩm để trở thành người đầu tiên đánh giá!</p>
              </div>
            ) : (
              <div className="space-y-6 divide-y divide-gray-100">
                {reviews.map((rev, idx) => (
                  <div key={rev.id} className={`pt-6 ${idx === 0 ? "pt-0" : ""}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900">{rev.user?.fullName || rev.user?.username}</p>
                          {rev.isVerifiedPurchase && (
                            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 font-semibold text-[10px] px-2 py-0.5 rounded-full border border-green-100">
                              <CheckCircle size={10} className="fill-green-600 text-white" /> Đã mua hàng
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-amber-500 mt-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={14}
                              fill={star <= rev.rating ? "currentColor" : "none"}
                              className={star <= rev.rating ? "text-amber-500" : "text-gray-300"}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-gray-400">
                        {new Date(rev.createdAt).toLocaleDateString("vi-VN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    <p className="text-gray-700 text-sm mt-3.5 leading-relaxed">{rev.comment}</p>

                    {rev.images && rev.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {rev.images.map((img: string, i: number) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={i} src={img} alt="review media" className="w-20 h-20 object-cover rounded-2xl border border-gray-100 hover:shadow-md transition" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RELATED PRODUCTS */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-yellow-600 font-semibold uppercase tracking-wider">
              {t("label.recommendation")}
            </p>
            <h2 className="text-4xl font-bold text-gray-900 mt-2">
              {t("label.relatedProducts")}
            </h2>
          </div>
        </div>

        {relatedProducts.length === 0 ? (
          <p className="text-gray-500">{t("productDetails.noRelated")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {relatedProducts.map((item) => (
              <div
                key={item.id}
                className="group border border-gray-200 rounded-3xl overflow-hidden hover:shadow-2xl transition duration-300 bg-white">
                {/* IMAGE */}
                <div className="relative bg-[#f8f5f2] p-6 h-[300px] flex items-center justify-center overflow-hidden">
                  <Image
                    src={item.image || "/placeholder.png"}
                    alt={item.name}
                    width={180}
                    height={240}
                    className="object-contain group-hover:scale-105 transition duration-300"
                  />

                  {/* ACTIONS */}
                  <div className="absolute right-4 top-4 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => handleWishlistById(item.id)}
                      className="bg-white shadow-md p-3 rounded-full hover:bg-yellow-500 hover:text-white transition">
                      <Heart size={18} />
                    </button>

                    <Link
                      href={`/product/${item.id}`}
                      className="bg-white shadow-md p-3 rounded-full hover:bg-yellow-500 hover:text-white transition">
                      <Eye size={18} />
                    </Link>
                  </div>
                </div>

                {/* INFO */}
                <div className="p-6">
                  <p className="text-sm text-yellow-600 font-medium uppercase">
                    {item.category?.name
                      ? translateCategory(item.category.name)
                      : t("topRating.categoryFallback")}
                  </p>

                  <Link href={`/product/${item.id}`}>
                    <h3 className="text-xl font-bold text-gray-900 mt-2 hover:text-yellow-600 transition line-clamp-1">
                      {item.name}
                    </h3>
                  </Link>

                  {/* RATING */}
                  <div className="flex items-center gap-1 text-orange-400 mt-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={15} fill="currentColor" />
                    ))}
                  </div>

                  {/* PRICE */}
                  <div className="flex items-center justify-between mt-5">
                    <p className="text-2xl font-bold text-yellow-600">
                      {formatPrice(item.price)}
                    </p>

                    <button
                      onClick={() => handleAddToCartById(item.id, 1)}
                      className="bg-[#eba07a] hover:bg-yellow-600 text-white p-3 rounded-full transition">
                      <ShoppingCart size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
