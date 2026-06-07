"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { Star, Heart, Minus, Plus, ShoppingCart, Eye, CheckCircle } from "lucide-react";

import { productAPI, type Product, wishlistAPI, cartAPI, reviewsAPI, orderAPI } from "@/lib/api";
import { getBrowserToken } from "@/lib/auth-token";
import { usePreferences } from "@/lib/i18n";
import ProductCard from "@/components/ProductCard";

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
  const [eligibleOrders, setEligibleOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [userRating, setUserRating] = useState<number>(5);
  const [userComment, setUserComment] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

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
        setEligibleOrders([]);
        setSelectedOrderId(null);

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
          .slice(0, 8);

        setRelatedProducts(related);
        setSummary(sumData);
        setReviews(listData);

        const token = getBrowserToken();
        if (token) {
          setIsLoggedIn(true);
          try {
            const ordersList = await orderAPI.list();
            const filtered = (ordersList || []).filter((order: any) => {
              const isDelivered = order.status === "delivered";
              const hasProduct = order.items?.some((item: any) => Number(item.productId) === prodId);
              return isDelivered && hasProduct;
            });
            setEligibleOrders(filtered);
            if (filtered.length > 0) {
              setSelectedOrderId(filtered[0].id);
            }
          } catch (err) {
            console.error("Failed to load orders for eligibility:", err);
          }
        } else {
          setIsLoggedIn(false);
        }
      } catch (err) {
        console.error("Fetch product error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [idParam]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userComment.trim()) {
      alert("Vui lòng nhập nội dung nhận xét.");
      return;
    }

    try {
      setSubmittingReview(true);
      const prodId = Number(idParam);
      await reviewsAPI.create({
        productId: prodId,
        orderId: selectedOrderId || undefined,
        rating: userRating,
        comment: userComment.trim(),
      });

      alert("Gửi đánh giá thành công! Xin cảm ơn nhận xét của bạn.");
      setUserComment("");
      setUserRating(5);

      const [sumData, listData] = await Promise.all([
        reviewsAPI.getSummary(prodId).catch(() => summary),
        reviewsAPI.getByProduct(prodId).catch(() => reviews),
      ]);
      setSummary(sumData);
      setReviews(listData);

      if (selectedOrderId) {
        const remaining = eligibleOrders.filter((order) => order.id !== selectedOrderId);
        setEligibleOrders(remaining);
        setSelectedOrderId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err: any) {
      console.error("Submit review error:", err);
      alert(err?.response?.data?.message || "Gửi đánh giá thất bại. Vui lòng thử lại sau.");
    } finally {
      setSubmittingReview(false);
    }
  };

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
      <div className="bg-gradient-to-r from-brand-primary-light/40 to-brand-surface py-20 text-center">
        <h1 className="text-4xl font-bold text-brand-text">
          {t("label.shopDetails")}
        </h1>
        <p className="text-brand-muted mt-2">
          {t("label.home")} &gt; {t("label.shopDetails")}
        </p>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* IMAGE */}
        <div>
          <div className="bg-brand-primary-light/40 rounded-3xl p-10 flex justify-center">
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
          <p className="text-sm text-brand-primary font-semibold uppercase mb-2">
            {product.category?.name
              ? translateCategory(product.category.name)
              : t("topRating.categoryFallback")}
          </p>

          {/* NAME */}
          <h1 className="text-4xl font-bold text-gray-900 leading-tight">
            {product.name}
          </h1>

          {/* RATING */}
          <div className="flex items-center gap-1.5 text-brand-secondary mt-4">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={18}
                  fill={star <= Math.round(summary.average) ? "currentColor" : "none"}
                  className={star <= Math.round(summary.average) ? "text-brand-secondary" : "text-brand-primary-light"}
                />
              ))}
            </div>
            <span className="text-sm font-bold text-brand-text ml-1">
              {summary.average} / 5
            </span>
            <span className="text-brand-muted text-sm">
              ({summary.count} đánh giá)
            </span>
          </div>

          {/* PRICE */}
          <p className="text-4xl font-bold text-brand-primary mt-6">
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

            <div className="flex items-center border border-brand-primary-light rounded-[12px] w-fit px-4 py-2 bg-white gap-5">
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
              className="flex items-center gap-2 bg-brand-primary hover:bg-[#8d6338] transition-all duration-300 text-white h-11 px-8 rounded-[12px] text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 border-none shadow-md cursor-pointer">
              <ShoppingCart size={18} />
              {t("action.addToCart")}
            </button>

            {/* WISHLIST */}
            <button
              onClick={() => product && handleWishlistById(product.id)}
              className="border border-brand-primary-light hover:border-brand-primary hover:bg-brand-surface transition px-5 py-3 rounded-[12px] text-brand-primary h-11 flex items-center justify-center cursor-pointer bg-white">
              <Heart size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* REVIEWS SECTION */}
      <div className="max-w-7xl mx-auto px-6 py-16 border-t border-gray-200">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Đánh giá từ khách hàng</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Summary Breakdown & Review Form */}
          <div className="space-y-8 self-start">
            {/* Summary Breakdown */}
            <div className="bg-brand-surface border border-brand-primary-light rounded-3xl p-8 space-y-6">
              <div className="text-center space-y-2">
                <p className="text-5xl font-black text-brand-primary">{summary.average}</p>
                <div className="flex justify-center gap-1 text-brand-secondary">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={22}
                      fill={star <= Math.round(summary.average) ? "currentColor" : "none"}
                      className={star <= Math.round(summary.average) ? "text-brand-secondary" : "text-brand-primary-light"}
                    />
                  ))}
                </div>
                <p className="text-sm font-semibold text-brand-muted">{summary.count} nhận xét từ người mua</p>
              </div>

              {/* Distribution bars */}
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = summary.distribution[star.toString()] || 0;
                  const percent = summary.count > 0 ? (count / summary.count) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-3 text-sm">
                      <span className="w-3 font-semibold text-brand-muted">{star}</span>
                      <Star size={14} className="text-brand-secondary fill-brand-secondary shrink-0" />
                      <div className="flex-1 h-2 bg-brand-primary-light rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-secondary rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="w-8 text-right font-medium text-brand-muted">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Write a Review Card */}
            <div className="bg-white border border-gray-200 rounded-3xl p-8 space-y-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900">Viết đánh giá của bạn</h3>
              
              {!isLoggedIn ? (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500">Vui lòng đăng nhập để đánh giá sản phẩm này.</p>
                  <Link
                    href="/login"
                    className="mt-4 inline-flex items-center justify-center bg-brand-primary hover:bg-[#8d6338] text-white text-xs font-bold px-6 py-2.5 rounded-xl transition cursor-pointer"
                  >
                    Đăng nhập ngay
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4 text-left">
                  {/* Order Selection */}
                  {eligibleOrders.length > 0 ? (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                        Chọn đơn hàng liên kết (Nhận nhãn "Đã mua hàng")
                      </label>
                      <select
                        value={selectedOrderId || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedOrderId(val ? Number(val) : null);
                        }}
                        className="w-full h-11 px-4 rounded-xl border border-gray-300 bg-gray-50 outline-none text-sm font-medium focus:border-brand-primary transition"
                      >
                        <option value="">-- Đánh giá tự do (Không liên kết đơn hàng) --</option>
                        {eligibleOrders.map((order) => (
                          <option key={order.id} value={order.id}>
                            Mã đơn: #ORD-{order.id} ({new Date(order.created_at).toLocaleDateString("vi-VN")})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 text-xs leading-relaxed mb-2">
                      <p className="font-semibold">Bạn đang đánh giá tự do (Chưa mua sản phẩm hoặc đơn hàng chưa được giao).</p>
                      <p className="mt-1 text-gray-500">
                        Đánh giá của bạn sẽ không có nhãn <span className="font-semibold">Đã mua hàng</span>.
                      </p>
                    </div>
                  )}

                  {/* Star Rating Selector */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                      Đánh giá chất lượng
                    </label>
                    <div className="flex items-center gap-1.5 text-brand-secondary">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setUserRating(star)}
                          className="p-1 hover:scale-110 transition focus:outline-none cursor-pointer"
                        >
                          <Star
                            size={28}
                            fill={star <= userRating ? "currentColor" : "none"}
                            className={star <= userRating ? "text-brand-secondary" : "text-gray-300"}
                          />
                        </button>
                      ))}
                      <span className="text-sm font-bold text-gray-700 ml-2">
                        {userRating === 5 ? "Rất tốt" : userRating === 4 ? "Tốt" : userRating === 3 ? "Bình thường" : userRating === 2 ? "Tệ" : "Rất tệ"}
                      </span>
                    </div>
                  </div>

                  {/* Comment Box */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                      Nhận xét chi tiết
                    </label>
                    <textarea
                      rows={4}
                      value={userComment}
                      onChange={(e) => setUserComment(e.target.value)}
                      placeholder="Hãy chia sẻ trải nghiệm thực tế của bạn về sản phẩm này..."
                      className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 outline-none text-sm leading-relaxed resize-none focus:border-brand-primary transition"
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full flex items-center justify-center bg-brand-primary hover:bg-[#8d6338] transition text-white h-11 rounded-xl text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed border-none shadow-md cursor-pointer"
                  >
                    {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
                  </button>
                </form>
              )}
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
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition duration-300">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-brand-text">{rev.user?.fullName || rev.user?.username}</p>
                          {rev.isVerifiedPurchase && (
                            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 font-semibold text-[10px] px-2 py-0.5 rounded-full border border-green-100">
                              <CheckCircle size={10} className="fill-green-600 text-white" /> Đã mua hàng
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-brand-secondary mt-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={14}
                              fill={star <= rev.rating ? "currentColor" : "none"}
                              className={star <= rev.rating ? "text-brand-secondary" : "text-brand-primary-light"}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-brand-muted">
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
            <p className="text-brand-primary font-semibold uppercase tracking-wider">
              {t("label.recommendation")}
            </p>
            <h2 className="text-4xl font-bold text-gray-900 mt-2">
              {t("label.relatedProducts")}
            </h2>
          </div>
        </div>

        {relatedProducts.length === 0 ? (
          <p className="text-brand-muted">{t("productDetails.noRelated")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
