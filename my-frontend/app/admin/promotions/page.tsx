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
  ShoppingBag,
  Edit,
  History,
  Info,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import Image from "next/image";
import { adminAPI, productAPI, api, type Coupon, type Deal, type DealProduct } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";

export default function AdminPromotionsPage() {
  const { formatPrice, translateCategory } = usePreferences();
  
  // Tab State: "coupons" | "deals" | "audit"
  const [activeTab, setActiveTab] = useState<"coupons" | "deals" | "audit">("coupons");
  const [loading, setLoading] = useState(true);

  // Edit mode States
  const [editingCouponId, setEditingCouponId] = useState<number | null>(null);
  const [editingDealId, setEditingDealId] = useState<number | null>(null);
  const [canEditCouponCode, setCanEditCouponCode] = useState(true);
  const [canEditDealProducts, setCanEditDealProducts] = useState(true);
  const [canEditDealPrices, setCanEditDealPrices] = useState(true);

  const toLocalDateTimeString = (isoString?: string | null) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
  };

  // Data States
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Search Terms
  const [couponSearch, setCouponSearch] = useState("");
  const [dealSearch, setDealSearch] = useState("");

  // Coupon Form State
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
  const [couponReason, setCouponReason] = useState("");
  const [couponSubmitting, setCouponSubmitting] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Deal Form State
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [dealName, setDealName] = useState("");
  const [dealDescription, setDealDescription] = useState("");
  const [dealStartsAt, setDealStartsAt] = useState("");
  const [dealExpiresAt, setDealExpiresAt] = useState("");
  const [dealIsActive, setDealIsActive] = useState(true);
  const [dealReason, setDealReason] = useState("");
  const [selectedFeaturedCouponIds, setSelectedFeaturedCouponIds] = useState<number[]>([]);
  // Record map mapping productId -> deal config
  const [selectedProductsMap, setSelectedProductsMap] = useState<Record<number, { dealPrice: string; dealStock: string; soldCount?: number }>>({});
  const [dealProductSearch, setDealProductSearch] = useState("");
  const [dealSubmitting, setDealSubmitting] = useState(false);
  const [dealError, setDealError] = useState<string | null>(null);

  // Audit Logs State
  const [logs, setLogs] = useState<any[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsLimit] = useState(12);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [logsFilterType, setLogsFilterType] = useState("");
  const [logsFilterAction, setLogsFilterAction] = useState("");
  const [logsLoading, setLogsLoading] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  useEffect(() => {
    if (activeTab === "audit") {
      fetchAuditLogs(1, logsFilterType, logsFilterAction);
    } else {
      fetchData();
    }
  }, [activeTab]);

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

  const fetchAuditLogs = async (page = 1, type = logsFilterType, action = logsFilterAction) => {
    try {
      setLogsLoading(true);
      const res = await adminAPI.getPromotionLogs({
        page,
        limit: logsLimit,
        entityType: type || undefined,
        action: action || undefined,
      });
      setLogs(res.logs || []);
      setLogsTotal(res.total || 0);
      setLogsTotalPages(res.totalPages || 1);
      setLogsPage(res.page || 1);
    } catch (err) {
      console.error("Failed to fetch promotion audit logs", err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleLogsPageChange = (newPage: number) => {
    setLogsPage(newPage);
    fetchAuditLogs(newPage, logsFilterType, logsFilterAction);
  };

  // --- COUPON ACTIONS ---
  const handleOpenCouponModal = () => {
    setEditingCouponId(null);
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
    setCouponReason("");
    setCanEditCouponCode(true);
    setCouponError(null);
    setIsCouponModalOpen(true);
  };

  const handleOpenEditCouponModal = async (coupon: Coupon) => {
    try {
      setLoading(true);
      const detail = await adminAPI.getCoupon(coupon.id);
      setEditingCouponId(detail.id);
      setCouponCode(detail.code);
      setCouponName(detail.name || "");
      setCouponType(detail.type);
      setDiscountType(detail.discountType);
      setDiscountValue(detail.discountValue.toString());
      setMinOrder(detail.minOrder ? detail.minOrder.toString() : "");
      setMaxDiscount(detail.maxDiscount ? detail.maxDiscount.toString() : "");
      setCouponStartsAt(toLocalDateTimeString(detail.startsAt));
      setCouponExpiresAt(toLocalDateTimeString(detail.expiresAt));
      setCouponCategoryId(detail.categoryId ? detail.categoryId.toString() : "");
      setCouponIsActive(detail.isActive);
      setCanEditCouponCode(detail.canEditCode);
      setCouponReason("");
      setCouponError(null);
      setIsCouponModalOpen(true);
    } catch (err) {
      console.error(err);
      alert("Không thể tải thông tin chi tiết coupon.");
    } finally {
      setLoading(false);
    }
  };

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim() || !discountValue) {
      setCouponError("Vui lòng điền mã coupon và giá trị giảm giá.");
      return;
    }
    if (!couponReason.trim()) {
      setCouponError("Vui lòng cung cấp lý do thay đổi để lưu nhật ký audit.");
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
      reason: couponReason.trim(),
    };

    try {
      setCouponSubmitting(true);
      setCouponError(null);
      if (editingCouponId !== null) {
        await adminAPI.updateCoupon(editingCouponId, payload);
        alert("Đã cập nhật coupon thành công!");
      } else {
        await adminAPI.createCoupon(payload);
        alert("Đã tạo mã coupon thành công!");
      }
      setIsCouponModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      setCouponError(err?.response?.data?.message || "Không thể lưu coupon lúc này.");
    } finally {
      setCouponSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (id: number) => {
    const reason = prompt("Vui lòng cung cấp lý do xóa/tắt coupon này (Bắt buộc):");
    if (reason === null) return;
    if (!reason.trim()) {
      alert("Lý do xóa không được bỏ trống.");
      return;
    }

    try {
      await adminAPI.deleteCoupon(id, reason.trim());
      alert("Đã tắt kích hoạt coupon thành công!");
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Không thể xóa coupon.");
    }
  };

  // --- DEAL ACTIONS ---
  const handleOpenDealModal = () => {
    setEditingDealId(null);
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
    setDealReason("");
    setSelectedFeaturedCouponIds([]);
    setSelectedProductsMap({});
    setCanEditDealProducts(true);
    setCanEditDealPrices(true);
    setDealProductSearch("");
    setDealError(null);
    setIsDealModalOpen(true);
  };

  const handleOpenEditDealModal = async (deal: any) => {
    try {
      setLoading(true);
      const detail = await adminAPI.getDeal(deal.id);
      
      if (detail.isExpired) {
        alert("Sự kiện Flash Sale này đã kết thúc, không thể chỉnh sửa.");
        return;
      }

      setEditingDealId(detail.id);
      setDealName(detail.name);
      setDealDescription(detail.description || "");
      setDealStartsAt(toLocalDateTimeString(detail.startsAt));
      setDealExpiresAt(toLocalDateTimeString(detail.expiresAt));
      setDealIsActive(detail.isActive);
      setSelectedFeaturedCouponIds(detail.featuredCoupons ? detail.featuredCoupons.map((c: any) => c.id) : []);
      setDealReason("");
      
      const map: Record<number, { dealPrice: string; dealStock: string; soldCount?: number }> = {};
      if (detail.dealProducts) {
        for (const dp of detail.dealProducts) {
          map[dp.productId] = {
            dealPrice: dp.dealPrice.toString(),
            dealStock: dp.dealStock.toString(),
            soldCount: dp.soldCount || 0,
          };
        }
      }
      setSelectedProductsMap(map);
      setCanEditDealProducts(detail.canEditProducts);
      setCanEditDealPrices(detail.canEditPrices);
      setDealProductSearch("");
      setDealError(null);
      setIsDealModalOpen(true);
    } catch (err) {
      console.error(err);
      alert("Không thể tải thông tin chi tiết Flash Sale.");
    } finally {
      setLoading(false);
    }
  };

  const toggleFeaturedCoupon = (id: number) => {
    setSelectedFeaturedCouponIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleProductCheckChange = (productId: number, checked: boolean, defaultPrice: number) => {
    if (editingDealId !== null && !canEditDealProducts) {
      return; // blocked by constraint
    }
    setSelectedProductsMap((prev) => {
      const next = { ...prev };
      if (checked) {
        // Set default deal price as 80% of original price
        const defaultDealPrice = Math.round(defaultPrice * 0.8).toString();
        next[productId] = { dealPrice: defaultDealPrice, dealStock: "50", soldCount: 0 };
      } else {
        delete next[productId];
      }
      return next;
    });
  };

  const handleProductDealValueChange = (productId: number, field: "dealPrice" | "dealStock", val: string) => {
    if (field === "dealPrice" && editingDealId !== null && !canEditDealPrices) {
      return; // blocked by constraint
    }
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
    if (!dealReason.trim()) {
      setDealError("Vui lòng nhập lý do thay đổi để lưu nhật ký audit.");
      return;
    }

    const productPayloads: any[] = [];
    
    // Front-end validations for prices & stock constraints
    for (const [prodId, info] of Object.entries(selectedProductsMap)) {
      const productId = parseInt(prodId);
      const product = products.find((p) => p.id === productId);

      const dealPriceNum = parseFloat(info.dealPrice || "0");
      const dealStockNum = parseInt(info.dealStock || "0");
      const soldCount = info.soldCount || 0;

      if (product) {
        // Validation 1: Price must be less than original price
        if (dealPriceNum >= product.price) {
          setDealError(`Đơn giá deal (${formatPrice(dealPriceNum)}) cho cuốn "${product.name}" phải nhỏ hơn đơn giá gốc (${formatPrice(product.price)}).`);
          return;
        }
      }

      // Validation 2: Deal Stock must be greater than or equal to sold count
      if (dealStockNum < soldCount) {
        const name = product ? `cuốn "${product.name}"` : `sản phẩm ID ${productId}`;
        setDealError(`Số lượng deal cho ${name} không được nhỏ hơn số lượng đã bán (${soldCount}).`);
        return;
      }

      productPayloads.push({
        productId,
        dealPrice: dealPriceNum,
        dealStock: dealStockNum,
      });
    }

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
      reason: dealReason.trim(),
    };

    try {
      setDealSubmitting(true);
      setDealError(null);
      if (editingDealId !== null) {
        await adminAPI.updateDeal(editingDealId, payload);
        alert("Đã cập nhật sự kiện Flash Sale thành công!");
      } else {
        await adminAPI.createDeal(payload);
        alert("Đã tạo sự kiện Flash Sale thành công!");
      }
      setIsDealModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      setDealError(err?.response?.data?.message || "Không thể lưu sự kiện Flash Sale.");
    } finally {
      setDealSubmitting(false);
    }
  };

  const handleDeleteDeal = async (id: number) => {
    const reason = prompt("Vui lòng nhập lý do tắt/hủy sự kiện Flash Sale này (Bắt buộc):");
    if (reason === null) return;
    if (!reason.trim()) {
      alert("Lý do xóa không được bỏ trống.");
      return;
    }

    try {
      await adminAPI.deleteDeal(id, reason.trim());
      alert("Đã ngưng sự kiện Flash Sale thành công!");
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Không thể xóa Flash Sale.");
    }
  };

  // --- FILTER & UTILS ---
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
        <button
          onClick={() => setActiveTab("audit")}
          className={`px-6 py-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === "audit"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <History size={16} />
          Nhật Ký Audit (Logs)
        </button>
      </div>

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
            {loading ? (
              <div className="flex items-center justify-center py-40">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              </div>
            ) : filteredCoupons.length === 0 ? (
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
                      <th className="px-6 py-4 text-center">Trạng Thế</th>
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
                              onClick={() => handleOpenEditCouponModal(c)}
                              className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition cursor-pointer"
                              title="Sửa coupon"
                            >
                              <Edit size={16} />
                            </button>
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
            {loading ? (
              <div className="flex items-center justify-center py-40 bg-white border border-gray-150 rounded-3xl">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              </div>
            ) : filteredDeals.length === 0 ? (
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
                          disabled={isExpired}
                          onClick={() => handleOpenEditDealModal(deal)}
                          className="p-2.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent"
                          title={isExpired ? "Deal đã kết thúc không thể sửa" : "Sửa Flash Sale"}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteDeal(deal.id)}
                          className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                          title="Tắt sự kiện Flash Sale"
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
                            const soldPct = dp.dealStock > 0 ? Math.min(100, Math.round((dp.soldCount / dp.dealStock) * 100)) : 0;
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

      {/* ==================== TAB: AUDIT LOGS ==================== */}
      {activeTab === "audit" && (
        <div className="space-y-6">
          {/* FILTER ROW */}
          <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center w-full sm:w-auto">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Loại đối tượng</span>
                <select
                  value={logsFilterType}
                  onChange={(e) => {
                    setLogsFilterType(e.target.value);
                    setLogsPage(1);
                    fetchAuditLogs(1, e.target.value, logsFilterAction);
                  }}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-700 outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="">Tất cả (Coupons & Deals)</option>
                  <option value="coupon">Coupon</option>
                  <option value="deal">Deal Flash Sale</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Hành động</span>
                <select
                  value={logsFilterAction}
                  onChange={(e) => {
                    setLogsFilterAction(e.target.value);
                    setLogsPage(1);
                    fetchAuditLogs(1, logsFilterType, e.target.value);
                  }}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-700 outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="">Tất cả hành động</option>
                  <option value="create">Tạo mới (create)</option>
                  <option value="update">Cập nhật (update)</option>
                  <option value="deactivate">Tắt kích hoạt (deactivate)</option>
                </select>
              </div>
            </div>
            <button
              onClick={() => fetchAuditLogs(1, logsFilterType, logsFilterAction)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-end"
            >
              Tải lại
            </button>
          </div>

          {/* AUDIT LOG TABLE */}
          <div className="bg-white border border-gray-150 rounded-3xl overflow-hidden shadow-sm">
            {logsLoading ? (
              <div className="flex items-center justify-center py-40">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-24 text-gray-400 font-medium">
                Không tìm thấy nhật ký audit log nào phù hợp.
              </div>
            ) : (
              <div>
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-150 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                      <th className="px-6 py-4 w-12 text-center">ID</th>
                      <th className="px-6 py-4">Thời gian</th>
                      <th className="px-6 py-4">Người thực hiện</th>
                      <th className="px-6 py-4">Hành động</th>
                      <th className="px-6 py-4">Đối tượng</th>
                      <th className="px-6 py-4">Lý do thay đổi</th>
                      <th className="px-6 py-4 text-center w-24">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.map((log) => {
                      const isExpanded = expandedLogId === log.id;
                      return (
                        <>
                          <tr key={log.id} className="hover:bg-gray-50/20 transition items-center">
                            <td className="px-6 py-4 text-center font-mono text-xs text-gray-400 font-bold">#{log.id}</td>
                            <td className="px-6 py-4 text-xs text-gray-500 font-medium whitespace-nowrap">
                              {new Date(log.createdAt).toLocaleString("vi-VN")}
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-gray-800 text-xs">@{log.performedBy || `Admin-${log.adminId}`}</span>
                              {log.ipAddress && (
                                <span className="block text-[9px] font-mono text-gray-400">IP: {log.ipAddress}</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                log.action === "create" ? "bg-green-50 text-green-700 border border-green-100" :
                                log.action === "update" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                                "bg-red-50 text-red-700 border border-red-100"
                              }`}>
                                {log.action === "create" && "Tạo mới"}
                                {log.action === "update" && "Cập nhật"}
                                {log.action === "deactivate" && "Tắt bỏ"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-gray-700 text-xs uppercase bg-gray-50 px-2 py-0.5 rounded border font-mono">
                                {log.entityType}
                              </span>
                              <span className="font-semibold text-gray-500 text-xs ml-1.5 font-mono">#{log.entityId}</span>
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-600 font-medium leading-relaxed max-w-sm">
                              {log.reason || "Không ghi chú lý do"}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition flex items-center justify-center mx-auto"
                              >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={7} className="px-8 py-4 bg-gray-50/50 border-y border-gray-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {log.oldValue && (
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Dữ liệu Cũ (Old Value)</span>
                                      <pre className="text-[10px] bg-white border border-gray-200 p-3 rounded-2xl font-mono text-gray-600 overflow-x-auto max-h-48 overflow-y-auto shadow-inner">
                                        {JSON.stringify(log.oldValue, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                  {log.newValue && (
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Dữ liệu Mới (New Value)</span>
                                      <pre className="text-[10px] bg-white border border-gray-200 p-3 rounded-2xl font-mono text-gray-600 overflow-x-auto max-h-48 overflow-y-auto shadow-inner">
                                        {JSON.stringify(log.newValue, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>

                {/* PAGINATION */}
                {logsTotalPages > 1 && (
                  <div className="flex items-center justify-between p-6 border-t border-gray-100">
                    <span className="text-xs text-gray-500 font-medium">
                      Hiển thị trang {logsPage}/{logsTotalPages} (Tổng cộng {logsTotal} dòng nhật ký)
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={logsPage === 1}
                        onClick={() => handleLogsPageChange(logsPage - 1)}
                        className="px-3.5 py-1.5 text-xs font-bold border rounded-xl hover:bg-gray-50 transition disabled:opacity-40"
                      >
                        Trang trước
                      </button>
                      <button
                        disabled={logsPage === logsTotalPages}
                        onClick={() => handleLogsPageChange(logsPage + 1)}
                        className="px-3.5 py-1.5 text-xs font-bold border rounded-xl hover:bg-gray-50 transition disabled:opacity-40"
                      >
                        Trang sau
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== MODAL: ADD COUPON ==================== */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-2xl overflow-hidden animate-scaleIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-amber-50/50">
              <h3 className="font-extrabold text-gray-900 text-base">
                {editingCouponId !== null ? "Cập Nhật Coupon / Voucher" : "Thêm Mới Coupon / Voucher"}
              </h3>
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
                    disabled={editingCouponId !== null && !canEditCouponCode}
                    placeholder="Ví dụ: SACHHE30"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition font-mono uppercase disabled:bg-gray-150 disabled:text-gray-400"
                  />
                  {editingCouponId !== null && !canEditCouponCode && (
                    <span className="text-[10px] text-amber-600 font-bold block mt-1">
                      ⚠️ Khóa sửa mã do coupon đã được nhận/sử dụng.
                    </span>
                  )}
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

                {/* Audit Reason Field */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lý do thay đổi / Lý do tạo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Mô tả lý do thay đổi cho hệ thống audit log..."
                    value={couponReason}
                    onChange={(e) => setCouponReason(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition font-medium"
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
                  {editingCouponId !== null ? "Lưu Thay Đổi" : "Tạo Coupon"}
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
              <h3 className="font-extrabold text-gray-900 text-base">
                {editingDealId !== null ? "Cập Nhật Sự Kiện Flash Sale" : "Tạo Sự Kiện Flash Sale Mới"}
              </h3>
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chọn sản phẩm tham gia Flash Sale *</label>
                    {editingDealId !== null && !canEditDealProducts && (
                      <span className="text-[10px] text-amber-600 font-bold block">
                        ⚠️ Đã khóa thêm/bớt sản phẩm hoặc sửa giá do sự kiện đã có người đặt mua.
                      </span>
                    )}
                  </div>
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
                        <th className="px-4 py-3 text-center w-12">Chọn</th>
                        <th className="px-4 py-3">Tên Sách</th>
                        <th className="px-4 py-3 text-right">Đơn Giá Gốc</th>
                        <th className="px-4 py-3">Đơn Giá Deal (VNĐ)</th>
                        <th className="px-4 py-3">Số Lượng Deal / Đã bán</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredDealProductsSelector.map((p) => {
                        const isChecked = selectedProductsMap[p.id] !== undefined;
                        const info = selectedProductsMap[p.id];
                        const soldCount = info?.soldCount || 0;

                        return (
                          <tr key={p.id} className={`hover:bg-gray-50/20 transition ${isChecked ? "bg-amber-50/10" : ""}`}>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={editingDealId !== null && !canEditDealProducts}
                                onChange={(e) => handleProductCheckChange(p.id, e.target.checked, p.price)}
                                className="w-4 h-4 text-amber-500 border-gray-300 rounded focus:ring-amber-400 cursor-pointer disabled:opacity-40"
                              />
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-800">
                              <p className="font-bold text-gray-800 text-xs truncate max-w-xs">{p.name}</p>
                              <p className="text-[9px] text-gray-400">Kho hàng gốc: {p.stock} cuốn</p>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-gray-600">
                              {formatPrice(p.price)}
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                disabled={!isChecked || (editingDealId !== null && !canEditDealPrices)}
                                min="0"
                                required={isChecked}
                                value={info?.dealPrice ?? ""}
                                onChange={(e) => handleProductDealValueChange(p.id, "dealPrice", e.target.value)}
                                placeholder="Ví dụ: 120000"
                                className="w-28 rounded-lg border border-gray-200 px-2 py-1 text-xs outline-none focus:border-amber-500 disabled:bg-gray-150 disabled:text-gray-400 font-bold"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  disabled={!isChecked}
                                  min={soldCount || 1}
                                  required={isChecked}
                                  value={info?.dealStock ?? ""}
                                  onChange={(e) => handleProductDealValueChange(p.id, "dealStock", e.target.value)}
                                  placeholder="Ví dụ: 20"
                                  className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-xs outline-none focus:border-amber-500 disabled:bg-gray-150 font-bold"
                                />
                                {soldCount > 0 && (
                                  <span className="text-[10px] text-rose-600 bg-rose-50 px-2 py-0.5 border border-rose-100 rounded font-black shrink-0">
                                    Đã bán: {soldCount}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Audit Reason Field */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lý do thay đổi / Lý do tạo *</label>
                <input
                  type="text"
                  required
                  placeholder="Mô tả lý do thực hiện hành động này để lưu nhật ký audit log..."
                  value={dealReason}
                  onChange={(e) => setDealReason(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition font-medium"
                />
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
                  {editingDealId !== null ? "Lưu Thay Đổi" : "Tạo Sự Kiện Flash Sale"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
