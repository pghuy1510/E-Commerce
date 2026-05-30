"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Trash2,
  Loader2,
  X,
  AlertTriangle,
  Ticket,
  Percent,
  Calendar,
  Layers,
  Check,
  ShoppingBag
} from "lucide-react";
import Image from "next/image";
import { adminAPI, productAPI, api, type Coupon, type Deal, type DealProduct } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";

export default function AdminPromotionsPage() {
  const { formatPrice, translateCategory } = usePreferences();
  
  // Tab State: "coupons" | "deals"
  const [activeTab, setActiveTab] = useState<"coupons" | "deals">("coupons");
  const [loading, setLoading] = useState(true);

  // Data States
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Search Terms
  const [couponSearch, setCouponSearch] = useState("");
  const [dealSearch, setDealSearch] = useState("");

  // Coupon Modal State
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponName, setCouponName] = useState("");
  const [couponType, setCouponType] = useState<"platform" | "shop" | "shipping">("platform");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [couponStartsAt, setCouponStartsAt] = useState("");
  const [couponExpiresAt, setCouponExpiresAt] = useState("");
  const [couponCategoryId, setCouponCategoryId] = useState("");
  const [couponIsActive, setCouponIsActive] = useState(true);
  const [couponSubmitting, setCouponSubmitting] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Deal Modal State
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [dealName, setDealName] = useState("");
  const [dealDescription, setDealDescription] = useState("");
  const [dealStartsAt, setDealStartsAt] = useState("");
  const [dealExpiresAt, setDealExpiresAt] = useState("");
  const [dealIsActive, setDealIsActive] = useState(true);
  const [selectedFeaturedCouponIds, setSelectedFeaturedCouponIds] = useState<number[]>([]);
  const [selectedProductsMap, setSelectedProductsMap] = useState<Record<number, { dealPrice: string; dealStock: string }>>({});
  const [dealProductSearch, setDealProductSearch] = useState("");
  const [dealSubmitting, setDealSubmitting] = useState(false);
  const [dealError, setDealError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [couponsData, dealsData, productsData, catRes] = await Promise.all([
        adminAPI.listCoupons().catch(() => []),
        adminAPI.listDeals().catch(() => []),
        productAPI.getAll().catch(() => []),
        api.get("/categories").catch(() => ({ data: [] })),
      ]);
      setCoupons(couponsData);
      setDeals(dealsData);
      setProducts(productsData);
      setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- COUPON ACTIONS ---
  const handleOpenCouponModal = () => {
    setCouponCode("");
    setCouponName("");
    setCouponType("platform");
    setDiscountType("percentage");
    setDiscountValue("");
    setMinOrder("");
    setMaxDiscount("");
    setCouponStartsAt("");
    setCouponExpiresAt("");
    setCouponCategoryId("");
    setCouponIsActive(true);
    setCouponError(null);
    setIsCouponModalOpen(true);
  };

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim() || !discountValue) {
      setCouponError("Vui lòng điền mã coupon và giá trị giảm giá.");
      return;
    }

    const payload = {
      code: couponCode.trim().toUpperCase(),
      name: couponName.trim() || undefined,
      type: couponType,
      discountType,
      discountValue: parseFloat(discountValue),
      minOrder: minOrder ? parseFloat(minOrder) : null,
      maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
      categoryId: couponCategoryId ? parseInt(couponCategoryId) : null,
      startsAt: couponStartsAt ? new Date(couponStartsAt).toISOString() : null,
      expiresAt: couponExpiresAt ? new Date(couponExpiresAt).toISOString() : null,
      isActive: couponIsActive,
    };

    try {
      setCouponSubmitting(true);
      setCouponError(null);
      await adminAPI.createCoupon(payload);
      alert("Đã tạo mã coupon thành công!");
      setIsCouponModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      setCouponError(err?.response?.data?.message || "Không thể tạo coupon lúc này.");
    } finally {
      setCouponSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa coupon này?")) return;
    try {
      await adminAPI.deleteCoupon(id);
      alert("Đã xóa coupon thành công!");
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Không thể xóa coupon.");
    }
  };

  // --- DEAL ACTIONS ---
  const handleOpenDealModal = () => {
    setDealName("");
    setDealDescription("");
    
    // Set default startsAt to now, expiresAt to 7 days later
    const now = new Date();
    const tzoffset = now.getTimezoneOffset() * 60000;
    const localNow = new Date(now.getTime() - tzoffset).toISOString().slice(0, 16);
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 - tzoffset).toISOString().slice(0, 16);
    
    setDealStartsAt(localNow);
    setDealExpiresAt(sevenDays);
    setDealIsActive(true);
    setSelectedFeaturedCouponIds([]);
    setSelectedProductsMap({});
    setDealProductSearch("");
    setDealError(null);
    setIsDealModalOpen(true);
  };

  const toggleFeaturedCoupon = (id: number) => {
    setSelectedFeaturedCouponIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleProductCheckChange = (productId: number, checked: boolean, defaultPrice: number) => {
    setSelectedProductsMap((prev) => {
      const next = { ...prev };
      if (checked) {
        // Set default deal price as 80% of original price
        const defaultDealPrice = Math.round(defaultPrice * 0.8).toString();
        next[productId] = { dealPrice: defaultDealPrice, dealStock: "50" };
      } else {
        delete next[productId];
      }
      return next;
    });
  };

  const handleProductDealValueChange = (productId: number, field: "dealPrice" | "dealStock", val: string) => {
    setSelectedProductsMap((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: val,
      },
    }));
  };

  const handleDealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealName.trim() || !dealStartsAt || !dealExpiresAt) {
      setDealError("Vui lòng nhập tên chương trình và thời gian áp dụng.");
      return;
    }

    const productPayloads = Object.entries(selectedProductsMap).map(([prodId, info]) => ({
      productId: parseInt(prodId),
      dealPrice: parseFloat(info.dealPrice || "0"),
      dealStock: parseInt(info.dealStock || "0"),
    }));

    if (productPayloads.length === 0) {
      setDealError("Vui lòng chọn ít nhất một sản phẩm tham gia Flash Sale.");
      return;
    }

    const payload = {
      name: dealName.trim(),
      description: dealDescription.trim() || undefined,
      startsAt: new Date(dealStartsAt).toISOString(),
      expiresAt: new Date(dealExpiresAt).toISOString(),
      isActive: dealIsActive,
      featuredCouponIds: selectedFeaturedCouponIds,
      products: productPayloads,
    };

    try {
      setDealSubmitting(true);
      setDealError(null);
      await adminAPI.createDeal(payload);
      alert("Đã tạo sự kiện Flash Sale thành công!");
      setIsDealModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      setDealError(err?.response?.data?.message || "Không thể tạo sự kiện Flash Sale.");
    } finally {
      setDealSubmitting(false);
    }
  };

  const handleDeleteDeal = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sự kiện Flash Sale này?")) return;
    try {
      await adminAPI.deleteDeal(id);
      alert("Đã xóa Flash Sale thành công!");
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Không thể xóa Flash Sale.");
    }
  };

  // --- FILTERS ---
  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(couponSearch.toLowerCase()) ||
      (c.name && c.name.toLowerCase().includes(couponSearch.toLowerCase()))
  );

  const filteredDeals = deals.filter(
    (d) =>
      d.name.toLowerCase().includes(dealSearch.toLowerCase()) ||
      (d.description && d.description.toLowerCase().includes(dealSearch.toLowerCase()))
  );

  const filteredDealProductsSelector = products.filter((p) =>
    p.name.toLowerCase().includes(dealProductSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* TABS CONTAINER */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("coupons")}
          className={`px-6 py-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === "coupons"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Ticket size={16} />
          Quản Lý Coupons
        </button>
        <button
          onClick={() => setActiveTab("deals")}
          className={`px-6 py-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === "deals"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Percent size={16} />
          Quản Lý Flash Sale (Deals)
        </button>
      </div>

      {/* LOADING INDICATOR */}
      {loading ? (
        <div className="flex items-center justify-center py-40 bg-white rounded-3xl border border-gray-100">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* ==================== TAB: COUPONS ==================== */}
          {activeTab === "coupons" && (
            <div className="space-y-6">
              {/* ACTION ROW */}
              <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-lg">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm coupon theo mã hoặc tên..."
                    value={couponSearch}
                    onChange={(e) => setCouponSearch(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-amber-500 transition placeholder:text-gray-400"
                  />
                </div>
                <button
                  onClick={handleOpenCouponModal}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm px-6 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-amber-100 transition cursor-pointer"
                >
                  <Plus size={18} /> Thêm Coupon Mới
                </button>
              </div>

              {/* TABLE CONTAINER */}
              <div className="bg-white border border-gray-150 rounded-3xl overflow-hidden shadow-sm">
                {filteredCoupons.length === 0 ? (
                  <div className="text-center py-24 text-gray-400 font-medium">
                    Không tìm thấy coupon nào.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-150 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                          <th className="px-6 py-4">Mã Code</th>
                          <th className="px-6 py-4">Tên Chiến Dịch</th>
                          <th className="px-6 py-4">Phân Loại</th>
                          <th className="px-6 py-4 text-right">Mức Giảm</th>
                          <th className="px-6 py-4 text-right">Đơn Tối Thiểu</th>
                          <th className="px-6 py-4 text-right">Giảm Tối Đa</th>
                          <th className="px-6 py-4 text-center">Trạng Thái</th>
                          <th className="px-6 py-4 text-center">Hạn Sử Dụng</th>
                          <th className="px-6 py-4 text-center">Hành Động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredCoupons.map((c) => {
                          const typeLabel = c.type === "shipping" ? "Freeship" : c.type === "shop" ? "Danh mục" : "Cửa hàng";
                          const discountLabel = c.discountType === "percentage" ? `${c.discountValue}%` : formatPrice(c.discountValue);
                          const isExpired = c.expiresAt ? new Date(c.expiresAt).getTime() < Date.now() : false;

                          return (
                            <tr key={c.id} className="hover:bg-gray-50/30 transition">
                              <td className="px-6 py-4 font-mono font-black text-amber-700 text-xs">
                                <span className="bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 uppercase tracking-wide">
                                  {c.code}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-bold text-gray-900 text-sm">
                                {c.name || "Mã giảm giá công cộng"}
                              </td>
                              <td className="px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wide">
                                {typeLabel}
                              </td>
                              <td className="px-6 py-4 text-right font-extrabold text-rose-600 text-sm">
                                {discountLabel}
                              </td>
                              <td className="px-6 py-4 text-right font-semibold text-gray-600">
                                {c.minOrder ? formatPrice(c.minOrder) : "—"}
                              </td>
                              <td className="px-6 py-4 text-right font-semibold text-gray-600">
                                {c.maxDiscount ? formatPrice(c.maxDiscount) : "—"}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                                  !c.isActive ? "bg-gray-100 text-gray-400" :
                                  isExpired ? "bg-red-50 text-red-500 border border-red-100" :
                                  "bg-green-50 text-green-600 border border-green-100"
                                }`}>
                                  {!c.isActive ? "Tạm ngưng" : isExpired ? "Hết hạn" : "Đang chạy"}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center text-xs text-gray-500 font-medium">
                                {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("vi-VN") : "Vô hạn"}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => handleDeleteCoupon(c.id)}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                                  title="Xóa coupon"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== TAB: DEALS ==================== */}
          {activeTab === "deals" && (
            <div className="space-y-6">
              {/* ACTION ROW */}
              <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-lg">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm chương trình Flash Sale..."
                    value={dealSearch}
                    onChange={(e) => setDealSearch(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-amber-500 transition placeholder:text-gray-400"
                  />
                </div>
                <button
                  onClick={handleOpenDealModal}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm px-6 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-amber-100 transition cursor-pointer"
                >
                  <Plus size={18} /> Tạo Flash Sale Mới
                </button>
              </div>

              {/* LIST OF DEALS */}
              <div className="space-y-6">
                {filteredDeals.length === 0 ? (
                  <div className="bg-white text-center py-24 text-gray-400 border border-gray-150 rounded-3xl font-medium">
                    Không tìm thấy sự kiện Flash Sale nào.
                  </div>
                ) : (
                  filteredDeals.map((deal) => {
                    const isUpcoming = new Date(deal.startsAt).getTime() > Date.now();
                    const isExpired = new Date(deal.expiresAt).getTime() < Date.now();
                    
                    return (
                      <div key={deal.id} className="bg-white border border-gray-150 rounded-3xl overflow-hidden shadow-sm">
                        {/* Deal Header Row */}
                        <div className="p-6 bg-gray-50/50 border-b border-gray-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-extrabold text-gray-900 text-base">{deal.name}</h3>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                !deal.isActive ? "bg-gray-100 text-gray-400" :
                                isExpired ? "bg-rose-50 text-rose-600 border border-rose-100" :
                                isUpcoming ? "bg-amber-50 text-amber-600 border border-amber-100" :
                                "bg-green-50 text-green-600 border border-green-100"
                              }`}>
                                {!deal.isActive ? "Tạm tắt" : isExpired ? "Kết thúc" : isUpcoming ? "Sắp diễn ra" : "Đang chạy"}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 font-medium">
                              📅 Thời gian: {new Date(deal.startsAt).toLocaleString("vi-VN")} - {new Date(deal.expiresAt).toLocaleString("vi-VN")}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            {deal.featuredCoupons?.length > 0 && (
                              <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100 text-xs font-bold text-amber-800">
                                <Ticket size={14} /> {deal.featuredCoupons.length} Vouchers liên kết
                              </div>
                            )}
                            <button
                              onClick={() => handleDeleteDeal(deal.id)}
                              className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                              title="Xóa Flash Sale"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Deal Products Table */}
                        <div className="p-6">
                          {deal.dealProducts?.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">Không có sản phẩm nào thuộc đợt Flash Sale này.</p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {deal.dealProducts.map((dp: any) => {
                                const soldPct = Math.min(100, Math.round((dp.soldCount / dp.dealStock) * 100));
                                return (
                                  <div key={dp.id} className="border border-gray-100 rounded-2xl p-4 flex gap-4 bg-gray-50/20">
                                    <div className="w-14 h-20 bg-[#f7f5f2] rounded-xl overflow-hidden relative shrink-0 border">
                                      <Image
                                        src={dp.product?.image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800"}
                                        alt={dp.product?.name || "Book"}
                                        fill
                                        className="object-contain"
                                      />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between min-w-0">
                                      <div>
                                        <h4 className="font-bold text-xs text-gray-900 truncate">{dp.product?.name}</h4>
                                        <div className="flex items-baseline gap-2 mt-1">
                                          <span className="text-xs text-rose-600 font-extrabold">{formatPrice(dp.dealPrice)}</span>
                                          <span className="text-[10px] text-gray-400 line-through">{formatPrice(dp.product?.price ?? 0)}</span>
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-1 mt-2">
                                        <div className="flex justify-between text-[10px] text-gray-500 font-semibold">
                                          <span>Đã bán: {dp.soldCount}/{dp.dealStock}</span>
                                          <span>{soldPct}%</span>
                                        </div>
                                        <div className="w-full bg-gray-150 h-1.5 rounded-full overflow-hidden">
                                          <div className="bg-amber-500 h-full rounded-full" style={{ width: `${soldPct}%` }}></div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ==================== MODAL: ADD COUPON ==================== */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-2xl overflow-hidden animate-scaleIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-amber-50/50">
              <h3 className="font-extrabold text-gray-900 text-base">Thêm Mới Coupon / Voucher</h3>
              <button
                onClick={() => setIsCouponModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCouponSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {couponError && (
                <div className="p-3 text-xs bg-red-50 text-red-600 border border-red-100 rounded-xl flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{couponError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Coupon Code */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mã Coupon *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: SACHHE30"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition font-mono uppercase"
                  />
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tên chương trình</label>
                  <input
                    type="text"
                    placeholder="Mô tả ngắn cho người dùng"
                    value={couponName}
                    onChange={(e) => setCouponName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition"
                  />
                </div>

                {/* Type */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phân loại</label>
                  <select
                    value={couponType}
                    onChange={(e) => setCouponType(e.target.value as any)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition text-gray-600 font-semibold"
                  >
                    <option value="platform">Voucher Cửa Hàng (Platform)</option>
                    <option value="shop">Voucher Danh Mục (Shop)</option>
                    <option value="shipping">Voucher Vận Chuyển (Freeship)</option>
                  </select>
                </div>

                {/* Discount Type */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Hình thức giảm</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition text-gray-600 font-semibold"
                  >
                    <option value="percentage">Giảm theo %</option>
                    <option value="fixed">Giảm số tiền cố định (VNĐ)</option>
                  </select>
                </div>

                {/* Discount Value */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Giá trị giảm *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder={discountType === "percentage" ? "Nhập % giảm (ví dụ: 10)" : "Nhập số tiền giảm (ví dụ: 20000)"}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition"
                  />
                </div>

                {/* Min Order */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Đơn hàng tối thiểu</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Không giới hạn"
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition"
                  />
                </div>

                {/* Max Discount */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mức giảm tối đa</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Không giới hạn"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition"
                  />
                </div>

                {/* Category ID (only shows if type is "shop") */}
                {couponType === "shop" && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Danh mục sản phẩm áp dụng</label>
                    <select
                      value={couponCategoryId}
                      onChange={(e) => setCouponCategoryId(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition text-gray-600 font-semibold"
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{translateCategory(c.name)}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Starts At */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Thời gian bắt đầu</label>
                  <input
                    type="datetime-local"
                    value={couponStartsAt}
                    onChange={(e) => setCouponStartsAt(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition text-gray-600 font-semibold"
                  />
                </div>

                {/* Expires At */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Thời gian kết thúc</label>
                  <input
                    type="datetime-local"
                    value={couponExpiresAt}
                    onChange={(e) => setCouponExpiresAt(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition text-gray-600 font-semibold"
                  />
                </div>
              </div>

              {/* Active Switch */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="couponIsActive"
                  checked={couponIsActive}
                  onChange={(e) => setCouponIsActive(e.target.checked)}
                  className="w-4 h-4 text-amber-500 border-gray-300 rounded focus:ring-amber-400"
                />
                <label htmlFor="couponIsActive" className="text-xs font-bold text-gray-700 select-none cursor-pointer">
                  Kích hoạt Coupon ngay lập tức
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  disabled={couponSubmitting}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-semibold text-gray-600 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={couponSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {couponSubmitting && <Loader2 size={16} className="animate-spin" />}
                  Tạo Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ADD DEAL ==================== */}
      {isDealModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-4xl overflow-hidden animate-scaleIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-amber-50/50">
              <h3 className="font-extrabold text-gray-900 text-base">Tạo Sự Kiện Flash Sale Mới</h3>
              <button
                onClick={() => setIsDealModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleDealSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {dealError && (
                <div className="p-3 text-xs bg-red-50 text-red-600 border border-red-100 rounded-xl flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{dealError}</span>
                </div>
              )}

              {/* Deal Info Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tên sự kiện *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Siêu Sale Sách Hè 2026"
                    value={dealName}
                    onChange={(e) => setDealName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mô tả chi tiết</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Giảm giá cực sâu tới 50% tất cả các mặt hàng sách hot"
                    value={dealDescription}
                    onChange={(e) => setDealDescription(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Thời gian bắt đầu *</label>
                  <input
                    type="datetime-local"
                    required
                    value={dealStartsAt}
                    onChange={(e) => setDealStartsAt(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition text-gray-600 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Thời gian kết thúc *</label>
                  <input
                    type="datetime-local"
                    required
                    value={dealExpiresAt}
                    onChange={(e) => setDealExpiresAt(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition text-gray-600 font-semibold"
                  />
                </div>
              </div>

              {/* Linked Coupons Multi-selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Vouchers nổi bật đi kèm sự kiện (Featured Coupons)</label>
                {coupons.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Chưa có Coupon nào được tạo. Vui lòng tạo coupon trước ở tab quản lý coupon.</p>
                ) : (
                  <div className="flex flex-wrap gap-2.5">
                    {coupons.map((cp) => {
                      const isSelected = selectedFeaturedCouponIds.includes(cp.id);
                      return (
                        <button
                          key={cp.id}
                          type="button"
                          onClick={() => toggleFeaturedCoupon(cp.id)}
                          className={`px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition flex items-center gap-1 cursor-pointer ${
                            isSelected
                              ? "bg-amber-500 border-amber-500 text-white"
                              : "bg-white border-gray-200 text-gray-600 hover:border-amber-400"
                          }`}
                        >
                          {isSelected && <Check size={12} />}
                          {cp.code}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Products Selector Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chọn sản phẩm tham gia Flash Sale *</label>
                  <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                    <input
                      type="text"
                      placeholder="Tìm sách tham gia..."
                      value={dealProductSearch}
                      onChange={(e) => setDealProductSearch(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 pl-8 pr-3 py-1.5 text-xs outline-none focus:border-amber-500 transition"
                    />
                  </div>
                </div>

                <div className="border border-gray-150 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-150 text-gray-500 font-bold uppercase text-[9px] tracking-wider sticky top-0 z-10">
                        <th className="px-4 py-3 text-center">Chọn</th>
                        <th className="px-4 py-3">Tên Sách</th>
                        <th className="px-4 py-3 text-right">Đơn Giá Gốc</th>
                        <th className="px-4 py-3">Đơn Giá Deal (VNĐ)</th>
                        <th className="px-4 py-3">Số Lượng Deal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredDealProductsSelector.map((p) => {
                        const isChecked = selectedProductsMap[p.id] !== undefined;
                        const info = selectedProductsMap[p.id];

                        return (
                          <tr key={p.id} className={`hover:bg-gray-50/20 transition ${isChecked ? "bg-amber-50/10" : ""}`}>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => handleProductCheckChange(p.id, e.target.checked, p.price)}
                                className="w-4 h-4 text-amber-500 border-gray-300 rounded focus:ring-amber-400 cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-800">
                              <p className="font-bold text-gray-800 text-xs truncate max-w-xs">{p.name}</p>
                              <p className="text-[9px] text-gray-400">Kho: {p.stock} sản phẩm</p>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-gray-600">
                              {formatPrice(p.price)}
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                disabled={!isChecked}
                                min="0"
                                required={isChecked}
                                value={info?.dealPrice ?? ""}
                                onChange={(e) => handleProductDealValueChange(p.id, "dealPrice", e.target.value)}
                                placeholder="Ví dụ: 120000"
                                className="w-28 rounded-lg border border-gray-200 px-2 py-1 text-xs outline-none focus:border-amber-500 disabled:bg-gray-100"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                disabled={!isChecked}
                                min="1"
                                required={isChecked}
                                value={info?.dealStock ?? ""}
                                onChange={(e) => handleProductDealValueChange(p.id, "dealStock", e.target.value)}
                                placeholder="Ví dụ: 20"
                                className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-xs outline-none focus:border-amber-500 disabled:bg-gray-100"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Active switch */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="dealIsActive"
                  checked={dealIsActive}
                  onChange={(e) => setDealIsActive(e.target.checked)}
                  className="w-4 h-4 text-amber-500 border-gray-300 rounded focus:ring-amber-400"
                />
                <label htmlFor="dealIsActive" className="text-xs font-bold text-gray-700 select-none cursor-pointer">
                  Kích hoạt sự kiện Flash Sale ngay lập tức
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsDealModalOpen(false)}
                  disabled={dealSubmitting}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-semibold text-gray-600 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={dealSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {dealSubmitting && <Loader2 size={16} className="animate-spin" />}
                  Tạo Sự Kiện Flash Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
