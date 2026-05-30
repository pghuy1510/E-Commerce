"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgePercent,
  CalendarClock,
  Gift,
  Sparkles,
  Tag,
  TrendingUp,
  Ticket,
  Check,
  Copy,
  ShoppingCart
} from "lucide-react";
import DealCountdown from "@/components/services/DealCountdown";
import { usePreferences } from "@/lib/i18n";
import { dealAPI, cartAPI, emitCartUpdated, type Deal, type DealProduct, type Coupon } from "@/lib/api";

export default function DealsPage() {
  const router = useRouter();
  const { t, formatPrice } = usePreferences();
  
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [dealProducts, setDealProducts] = useState<DealProduct[]>([]);
  const [featuredCoupons, setFeaturedCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [addingProduct, setAddingProduct] = useState<number | null>(null);

  // Load Active Deal and associated data
  useEffect(() => {
    const fetchDealData = async () => {
      try {
        setLoading(true);
        const res = await dealAPI.getActiveDeal();
        if (res && res.deal) {
          setActiveDeal(res.deal);
          setFeaturedCoupons(res.featuredCoupons ?? []);
          
          // Load deal products
          const productsRes = await dealAPI.getDealProducts(res.deal.id);
          setDealProducts(productsRes ?? []);
        }
      } catch (err) {
        console.error("Lỗi khi tải thông tin Deal:", err);
      } finally {
        setLoading(false);
      }
    };
    void fetchDealData();
  }, []);

  // Save coupon code and redirect to checkout
  const handleSaveCoupon = (code: string) => {
    localStorage.setItem("selectedCouponCode", code);
    setCopiedCoupon(code);
    setToastMsg(`Đã lưu mã giảm giá ${code}! Đang chuyển hướng đến trang thanh toán...`);
    
    setTimeout(() => {
      setCopiedCoupon(null);
      setToastMsg(null);
      router.push("/checkout");
    }, 1500);
  };

  // Add deal product to cart
  const handleGrabDeal = async (productId: number) => {
    try {
      setAddingProduct(productId);
      setToastMsg("Đang thêm sản phẩm giảm giá vào giỏ hàng...");
      await cartAPI.add(productId, 1);
      emitCartUpdated();
      setToastMsg("Đã thêm vào giỏ hàng thành công! Đang chuyển hướng đến giỏ hàng...");
      
      setTimeout(() => {
        setToastMsg(null);
        setAddingProduct(null);
        router.push("/cart");
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setToastMsg(err?.message || "Sản phẩm đã có trong giỏ hàng hoặc hết hàng.");
      setTimeout(() => {
        setToastMsg(null);
        setAddingProduct(null);
      }, 2500);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 mt-4 font-medium">Đang tải sự kiện Flash Sale...</p>
      </div>
    );
  }

  if (!activeDeal) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center p-6">
        <div className="bg-amber-100 p-4 rounded-full mb-4">
          <CalendarClock className="w-12 h-12 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Không có sự kiện Flash Sale nào đang diễn ra</h2>
        <p className="text-gray-600 mt-2 max-w-md">
          Chương trình ưu đãi Flash Sale hiện đã kết thúc. Vui lòng quay lại sau để đón chờ các đợt giảm giá siêu khủng tiếp theo nhé!
        </p>
        <button
          onClick={() => router.push("/shop")}
          className="mt-6 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-full font-semibold transition shadow-sm"
        >
          Khám phá cửa hàng
        </button>
      </div>
    );
  }

  const dealCategories = [
    "Hot Deals",
    "Best Seller",
    "New Arrival",
    "Limited Offer",
    "Weekend Sale",
  ];

  return (
    <div className="w-full bg-gray-50 min-h-screen relative pb-16">
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-gray-800 text-sm font-medium animate-bounce max-w-sm text-center">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* HERO */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-100 py-16 text-center text-white px-6 shadow-inner">
        <div className="flex items-center justify-center gap-3 text-amber-200 mb-3">
          <Tag className="w-6 h-6 animate-pulse" />
          <span className="text-sm uppercase tracking-widest font-bold">
            SỰ KIỆN KHUYẾN MÃI NỔI BẬT
          </span>
        </div>
        <h1 className="text-4xl font-extrabold text-gray-950 tracking-tight md:text-5xl">
          {activeDeal.name}
        </h1>
        <p className="text-gray-900 font-medium mt-3 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
          {activeDeal.description || "Hàng loạt sản phẩm đang giảm giá sập sàn, nhanh tay số lượng có hạn!"}
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-12">
        {/* DEAL CATEGORIES & COUNTDOWN */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white border border-amber-100 p-6 rounded-3xl shadow-sm">
          <div className="flex flex-wrap gap-2.5">
            {dealCategories.map((category) => (
              <span
                key={category}
                className="px-4 py-2 rounded-full border border-gray-100 bg-gray-50 text-xs font-bold text-gray-600"
              >
                {category}
              </span>
            ))}
          </div>
          
          <div className="flex items-center gap-4 shrink-0 bg-amber-50 px-5 py-3 rounded-2xl border border-amber-100">
            <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5 uppercase">
              <BadgePercent className="w-4 h-4 text-amber-600 animate-spin-slow" />
              Kết thúc sau:
            </div>
            <DealCountdown target={activeDeal.expiresAt} />
          </div>
        </section>

        {/* FEATURED COUPONS SECTION */}
        {featuredCoupons.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <Ticket className="w-6 h-6 text-amber-600" />
              <h2 className="text-2xl font-bold text-gray-900">Mã giảm giá đơn hàng nổi bật</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredCoupons.map((coupon) => {
                const discountText = coupon.discountType === "percentage"
                  ? `${coupon.discountValue}%`
                  : formatPrice(coupon.discountValue);
                const minOrderText = coupon.minOrder
                  ? `Đơn tối thiểu ${formatPrice(coupon.minOrder)}`
                  : "Không giới hạn đơn tối thiểu";
                const isSaved = copiedCoupon === coupon.code;
                const isShipping = coupon.type === "shipping";

                return (
                  <div
                    key={coupon.code}
                    className={`bg-white border rounded-3xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all duration-300 ${
                      isSaved ? "border-amber-500 ring-2 ring-amber-200" : "border-amber-100 hover:border-amber-300"
                    }`}
                  >
                    {/* Semi-circle design to simulate real ticket */}
                    <div className="absolute top-1/2 -left-3 w-6 h-6 bg-gray-50 rounded-full border-r border-amber-100 -translate-y-1/2"></div>
                    <div className="absolute top-1/2 -right-3 w-6 h-6 bg-gray-50 rounded-full border-l border-amber-100 -translate-y-1/2"></div>

                    <div className="space-y-3 pl-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-black text-amber-800 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200 tracking-wider">
                          {coupon.code}
                        </span>
                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                          {isShipping ? "Freeship" : "Giảm giá"}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="text-3xl font-extrabold text-gray-900">
                          {isShipping ? "Freeship" : `Giảm ${discountText}`}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium">{minOrderText}</p>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-dashed border-gray-100 flex items-center justify-between pl-2">
                      <span className="text-[11px] font-semibold text-gray-400">
                        {coupon.expiresAt
                          ? `Hạn: ${new Date(coupon.expiresAt).toLocaleDateString("vi-VN")}`
                          : "Không giới hạn HSD"}
                      </span>
                      <button
                        onClick={() => handleSaveCoupon(coupon.code)}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isSaved
                            ? "bg-amber-600 text-white"
                            : "bg-amber-500 text-white hover:bg-amber-600 shadow-sm"
                        }`}
                      >
                        {isSaved ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Đã Lưu
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Lưu Mã
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* FLASH SALE PRODUCTS */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-amber-600" />
            <h2 className="text-2xl font-bold text-gray-900">Danh sách sản phẩm Flash Sale</h2>
          </div>

          {dealProducts.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center text-gray-500 font-medium shadow-sm">
              Không có sản phẩm nào thuộc chương trình Flash Sale này.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {dealProducts.map((dp) => {
                const product = dp.product;
                const originalPrice = Number(product.price);
                const dealPrice = Number(dp.dealPrice);
                
                // Calculate discount percent
                const discountPercent = Math.round(((originalPrice - dealPrice) / originalPrice) * 100);
                
                // Calculate progress
                const soldPercent = Math.min(
                  Math.round((dp.soldCount / dp.dealStock) * 100),
                  100
                );
                
                const isOutOfStock = dp.dealStock - dp.soldCount <= 0 || product.stock <= 0;

                return (
                  <div
                    key={dp.id}
                    className="bg-white border border-amber-100 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition duration-300"
                  >
                    <div className="relative bg-gray-100">
                      <img
                        src={product.image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop"}
                        alt={product.name}
                        className="w-full h-56 object-cover"
                      />
                      <span className="absolute top-4 left-4 bg-rose-600 text-white text-xs font-black px-3.5 py-1.5 rounded-2xl shadow-md">
                        -{discountPercent}% OFF
                      </span>
                    </div>

                    <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <h3 className="font-bold text-gray-900 text-base line-clamp-1">{product.name}</h3>
                        
                        {/* Prices */}
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-extrabold text-rose-600">
                            {formatPrice(dealPrice)}
                          </span>
                          <span className="text-xs text-gray-400 line-through">
                            {formatPrice(originalPrice)}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="space-y-1.5 pt-2">
                          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                            <span>Đã bán {dp.soldCount}/{dp.dealStock}</span>
                            <span>{soldPercent}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden border border-gray-50">
                            <div
                              className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-500"
                              style={{ width: `${soldPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleGrabDeal(product.id)}
                        disabled={isOutOfStock || addingProduct !== null}
                        className={`mt-4 w-full rounded-2xl py-3 text-sm font-bold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer ${
                          isOutOfStock
                            ? "bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-amber-500 text-white hover:bg-amber-600"
                        }`}
                      >
                        {isOutOfStock ? (
                          "HẾT LƯỢT GIẢM GIÁ"
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4" />
                            MUA NGAY DEAL
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
