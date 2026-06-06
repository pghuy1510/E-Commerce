"use client";

import { useEffect, useState, Fragment } from "react";
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
import AdminEmptyState from "@/components/admin/AdminEmptyState";

export default function AdminPromotionsPage() {
  const { formatPrice, translateCategory, language } = usePreferences();
  
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

  // Home Banner States
  const [dealBannerEnabled, setDealBannerEnabled] = useState(true);
  const [dealBannerUrl, setDealBannerUrl] = useState("");
  const [dealBannerTitle, setDealBannerTitle] = useState("");
  const [dealBannerSubtitle, setDealBannerSubtitle] = useState("");
  const [dealBannerButtonText, setDealBannerButtonText] = useState("");
  const [dealBannerButtonUrl, setDealBannerButtonUrl] = useState("");

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
      alert(language === "vi" ? "Không thể tải thông tin chi tiết coupon." : "Cannot load coupon details.");
    } finally {
      setLoading(false);
    }
  };

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim() || !discountValue) {
      setCouponError(language === "vi" ? "Vui lòng điền mã coupon và giá trị giảm giá." : "Please enter coupon code and discount value.");
      return;
    }
    if (!couponReason.trim()) {
      setCouponError(language === "vi" ? "Vui lòng cung cấp lý do thay đổi để lưu nhật ký audit." : "Please provide a change reason for the audit log.");
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
        alert(language === "vi" ? "Đã cập nhật coupon thành công!" : "Coupon updated successfully!");
      } else {
        await adminAPI.createCoupon(payload);
        alert(language === "vi" ? "Đã tạo mã coupon thành công!" : "Coupon created successfully!");
      }
      setIsCouponModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      setCouponError(err?.response?.data?.message || (language === "vi" ? "Không thể lưu coupon lúc này." : "Cannot save coupon at this time."));
    } finally {
      setCouponSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (id: number) => {
    const reason = prompt(language === "vi" ? "Vui lòng cung cấp lý do xóa/tắt coupon này (Bắt buộc):" : "Please provide a reason to delete/deactivate this coupon (Required):");
    if (reason === null) return;
    if (!reason.trim()) {
      alert(language === "vi" ? "Lý do xóa không được bỏ trống." : "Deletion reason cannot be empty.");
      return;
    }

    try {
      await adminAPI.deleteCoupon(id, reason.trim());
      alert(language === "vi" ? "Đã tắt kích hoạt coupon thành công!" : "Coupon deactivated successfully!");
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || (language === "vi" ? "Không thể xóa coupon." : "Cannot delete coupon."));
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
    setDealBannerEnabled(true);
    setDealBannerUrl("");
    setDealBannerTitle("");
    setDealBannerSubtitle("");
    setDealBannerButtonText("");
    setDealBannerButtonUrl("");
    setIsDealModalOpen(true);
  };

  const handleOpenEditDealModal = async (deal: any) => {
    try {
      setLoading(true);
      const detail = await adminAPI.getDeal(deal.id);
      
      if (detail.isExpired) {
        alert(language === "vi" ? "Sự kiện Flash Sale này đã kết thúc, không thể chỉnh sửa." : "This Flash Sale event has ended and cannot be edited.");
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
      setDealBannerEnabled(detail.bannerEnabled !== undefined ? detail.bannerEnabled : true);
      setDealBannerUrl(detail.bannerUrl || "");
      setDealBannerTitle(detail.bannerTitle || "");
      setDealBannerSubtitle(detail.bannerSubtitle || "");
      setDealBannerButtonText(detail.bannerButtonText || "");
      setDealBannerButtonUrl(detail.bannerButtonUrl || "");
      setIsDealModalOpen(true);
    } catch (err) {
      console.error(err);
      alert(language === "vi" ? "Không thể tải thông tin chi tiết Flash Sale." : "Cannot load Flash Sale details.");
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
      setDealError(language === "vi" ? "Vui lòng nhập tên chương trình và thời gian áp dụng." : "Please enter the event name and duration.");
      return;
    }
    if (!dealReason.trim()) {
      setDealError(language === "vi" ? "Vui lòng nhập lý do thay đổi để lưu nhật ký audit." : "Please enter a change reason for the audit log.");
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
          setDealError(language === "vi" 
            ? `Đơn giá deal (${formatPrice(dealPriceNum)}) cho cuốn "${product.name}" phải nhỏ hơn đơn giá gốc (${formatPrice(product.price)}).`
            : `Deal price (${formatPrice(dealPriceNum)}) for book "${product.name}" must be less than original price (${formatPrice(product.price)}).`
          );
          return;
        }
      }

      // Validation 2: Deal Stock must be greater than or equal to sold count
      if (dealStockNum < soldCount) {
        const name = product 
          ? (language === "vi" ? `cuốn "${product.name}"` : `book "${product.name}"`) 
          : (language === "vi" ? `sản phẩm ID ${productId}` : `product ID ${productId}`);
        setDealError(language === "vi"
          ? `Số lượng deal cho ${name} không được nhỏ hơn số lượng đã bán (${soldCount}).`
          : `Deal stock for ${name} cannot be less than quantity already sold (${soldCount}).`
        );
        return;
      }

      productPayloads.push({
        productId,
        dealPrice: dealPriceNum,
        dealStock: dealStockNum,
      });
    }

    if (productPayloads.length === 0) {
      setDealError(language === "vi" ? "Vui lòng chọn ít nhất một sản phẩm tham gia Flash Sale." : "Please select at least one product for the Flash Sale.");
      return;
    }

    const payload = {
      name: dealName.trim(),
      description: dealDescription.trim() || undefined,
      bannerEnabled: dealBannerEnabled,
      bannerUrl: dealBannerUrl.trim() || undefined,
      bannerTitle: dealBannerTitle.trim() || undefined,
      bannerSubtitle: dealBannerSubtitle.trim() || undefined,
      bannerButtonText: dealBannerButtonText.trim() || undefined,
      bannerButtonUrl: dealBannerButtonUrl.trim() || undefined,
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
        alert(language === "vi" ? "Đã cập nhật sự kiện Flash Sale thành công!" : "Flash Sale event updated successfully!");
      } else {
        await adminAPI.createDeal(payload);
        alert(language === "vi" ? "Đã tạo sự kiện Flash Sale thành công!" : "Flash Sale event created successfully!");
      }
      setIsDealModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      setDealError(err?.response?.data?.message || (language === "vi" ? "Không thể lưu sự kiện Flash Sale." : "Failed to save Flash Sale event."));
    } finally {
      setDealSubmitting(false);
    }
  };

  const handleDeleteDeal = async (id: number) => {
    const reason = prompt(language === "vi" ? "Vui lòng nhập lý do tắt/hủy sự kiện Flash Sale này (Bắt buộc):" : "Please enter a reason to disable/cancel this Flash Sale event (Required):");
    if (reason === null) return;
    if (!reason.trim()) {
      alert(language === "vi" ? "Lý do xóa không được bỏ trống." : "Deletion reason cannot be empty.");
      return;
    }

    try {
      await adminAPI.deleteDeal(id, reason.trim());
      alert(language === "vi" ? "Đã ngưng sự kiện Flash Sale thành công!" : "Flash Sale event successfully suspended!");
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || (language === "vi" ? "Không thể xóa Flash Sale." : "Cannot delete Flash Sale."));
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
      <div className="flex border-b border-brand-border/30">
        <button
          onClick={() => setActiveTab("coupons")}
          className={`px-6 py-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === "coupons"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-brand-muted hover:text-brand-primary"
          }`}
        >
          <Ticket size={16} />
          {language === "vi" ? "Quản Lý Coupons" : "Manage Coupons"}
        </button>
        <button
          onClick={() => setActiveTab("deals")}
          className={`px-6 py-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === "deals"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-brand-muted hover:text-brand-primary"
          }`}
        >
          <Percent size={16} />
          {language === "vi" ? "Quản Lý Flash Sale (Deals)" : "Manage Flash Sales (Deals)"}
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`px-6 py-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === "audit"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-brand-muted hover:text-brand-primary"
          }`}
        >
          <History size={16} />
          {language === "vi" ? "Nhật Ký Audit (Logs)" : "Audit Logs"}
        </button>
      </div>

      {/* ==================== TAB: COUPONS ==================== */}
      {activeTab === "coupons" && (
        <div className="space-y-6">
          {/* ACTION ROW */}
          <div className="bg-brand-surface border border-brand-border/40 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted w-4 h-4" />
              <input
                type="text"
                placeholder={language === "vi" ? "Tìm kiếm coupon theo mã hoặc tên..." : "Search coupons by code or name..."}
                value={couponSearch}
                onChange={(e) => setCouponSearch(e.target.value)}
                className="w-full rounded-2xl border border-brand-border/30 bg-brand-bg/50 pl-10 pr-4 py-2.5 text-sm text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary focus:bg-brand-bg transition-all duration-200 placeholder:text-brand-muted"
              />
            </div>
            <button
              onClick={handleOpenCouponModal}
              className="bg-brand-primary hover:bg-brand-primary-hover hover:-translate-y-0.5 text-white font-semibold text-sm px-6 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg shadow-brand-primary/10 transition duration-300 cursor-pointer"
            >
              <Plus size={18} /> {language === "vi" ? "Thêm Coupon Mới" : "Add New Coupon"}
            </button>
          </div>

          {/* TABLE CONTAINER */}
          <div className="bg-brand-surface border border-brand-border/40 rounded-3xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center py-40">
                <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
              </div>
            ) : filteredCoupons.length === 0 ? (
              <AdminEmptyState
                icon={Ticket}
                title={language === "vi" ? "Không tìm thấy coupon" : "No coupons found"}
                description={language === "vi" ? "Không tìm thấy mã giảm giá nào khớp với từ khóa tìm kiếm hoặc chưa được thiết lập." : "No coupons match the search query or none have been configured."}
              />
            ) : (
              <div className="overflow-x-auto relative max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-brand-surface/95 backdrop-blur-sm border-b border-brand-border/40 text-brand-muted font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.03)]">
                      <th className="px-6 py-4">{language === "vi" ? "Mã Code" : "Promo Code"}</th>
                      <th className="px-6 py-4">{language === "vi" ? "Tên Chiến Dịch" : "Campaign Name"}</th>
                      <th className="px-6 py-4">{language === "vi" ? "Phân Loại" : "Type"}</th>
                      <th className="px-6 py-4 text-right">{language === "vi" ? "Mức Giảm" : "Discount"}</th>
                      <th className="px-6 py-4 text-right">{language === "vi" ? "Đơn Tối Thiểu" : "Min Spend"}</th>
                      <th className="px-6 py-4 text-right">{language === "vi" ? "Giảm Tối Đa" : "Max Discount"}</th>
                      <th className="px-6 py-4 text-center">{language === "vi" ? "Trạng Thái" : "Status"}</th>
                      <th className="px-6 py-4 text-center">{language === "vi" ? "Hạn Sử Dụng" : "Expiration Date"}</th>
                      <th className="px-6 py-4 text-center">{language === "vi" ? "Hành Động" : "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/10">
                    {filteredCoupons.map((c) => {
                      const typeLabel = c.type === "shipping" 
                        ? (language === "vi" ? "Freeship" : "Free Shipping") 
                        : c.type === "shop" 
                        ? (language === "vi" ? "Danh mục" : "Category") 
                        : (language === "vi" ? "Cửa hàng" : "Store-wide");
                      const discountLabel = c.discountType === "percentage" ? `${c.discountValue}%` : formatPrice(c.discountValue);
                      const isExpired = c.expiresAt ? new Date(c.expiresAt).getTime() < Date.now() : false;

                      return (
                        <tr key={c.id} className="hover:bg-brand-bg/20 odd:bg-brand-surface even:bg-brand-bg/50 transition">
                          <td className="px-6 py-4 font-mono font-black text-brand-primary text-xs">
                            <span className="bg-brand-primary/10 px-2.5 py-1 rounded-lg border border-brand-border/20 uppercase tracking-wide">
                              {c.code}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-brand-text text-sm">
                            {c.name || (language === "vi" ? "Mã giảm giá công cộng" : "Public discount code")}
                          </td>
                          <td className="px-6 py-4 font-semibold text-brand-muted text-xs uppercase tracking-wide">
                            {typeLabel}
                          </td>
                          <td className="px-6 py-4 text-right font-extrabold text-rose-600 text-sm">
                            {discountLabel}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-brand-text">
                            {c.minOrder ? formatPrice(c.minOrder) : "—"}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-brand-text">
                            {c.maxDiscount ? formatPrice(c.maxDiscount) : "—"}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
                              !c.isActive ? "bg-brand-bg text-brand-muted border-brand-border/30" :
                              isExpired ? "bg-status-danger-bg text-status-danger-text border-status-danger-border" :
                              "bg-status-success-bg text-status-success-text border-status-success-border"
                            }`}>
                              {!c.isActive ? (language === "vi" ? "Tạm ngưng" : "Suspended") : isExpired ? (language === "vi" ? "Hết hạn" : "Expired") : (language === "vi" ? "Đang chạy" : "Active")}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-xs text-brand-muted font-medium">
                            {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US") : (language === "vi" ? "Vô hạn" : "Unlimited")}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleOpenEditCouponModal(c)}
                              className="p-2 text-brand-muted hover:text-brand-primary hover:bg-brand-primary-light/20 rounded-xl transition cursor-pointer"
                              title={language === "vi" ? "Sửa coupon" : "Edit coupon"}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteCoupon(c.id)}
                              className="p-2 text-brand-muted hover:text-status-danger-text hover:bg-status-danger-bg/40 rounded-xl transition cursor-pointer"
                              title={language === "vi" ? "Xóa coupon" : "Delete coupon"}
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
          <div className="bg-brand-surface border border-brand-border/40 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted w-4 h-4" />
              <input
                type="text"
                placeholder={language === "vi" ? "Tìm kiếm chương trình Flash Sale..." : "Search Flash Sale campaigns..."}
                value={dealSearch}
                onChange={(e) => setDealSearch(e.target.value)}
                className="w-full rounded-2xl border border-brand-border/30 bg-brand-bg/50 pl-10 pr-4 py-2.5 text-sm text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary focus:bg-brand-bg transition-all duration-200 placeholder:text-brand-muted"
              />
            </div>
            <button
              onClick={handleOpenDealModal}
              className="bg-brand-primary hover:bg-brand-primary-hover hover:-translate-y-0.5 text-white font-semibold text-sm px-6 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg shadow-brand-primary/10 transition duration-300 cursor-pointer"
            >
              <Plus size={18} /> {language === "vi" ? "Tạo Flash Sale Mới" : "Create New Flash Sale"}
            </button>
          </div>

          {/* LIST OF DEALS */}
          <div className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-40 bg-brand-surface border border-brand-border/40 rounded-3xl">
                <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
              </div>
            ) : filteredDeals.length === 0 ? (
              <AdminEmptyState
                icon={Percent}
                title={language === "vi" ? "Không tìm thấy Flash Sale" : "No Flash Sales found"}
                description={language === "vi" ? "Không tìm thấy sự kiện Flash Sale nào khớp với từ khóa tìm kiếm hoặc chưa được thiết lập." : "No Flash Sale events match your search query or have not been created yet."}
              />
            ) : (
              filteredDeals.map((deal) => {
                const isUpcoming = new Date(deal.startsAt).getTime() > Date.now();
                const isExpired = new Date(deal.expiresAt).getTime() < Date.now();
                
                return (
                  <div key={deal.id} className="bg-brand-surface border border-brand-border/40 rounded-3xl overflow-hidden shadow-sm hover:scale-[1.01] hover:shadow-xl hover:border-brand-primary/30 transition-all duration-300">
                    {/* Deal Header Row */}
                    <div className="p-6 bg-brand-primary-light/5 border-b border-brand-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-extrabold text-brand-text text-base">{deal.name}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            !deal.isActive ? "bg-brand-bg text-brand-muted border-brand-border/30" :
                            isExpired ? "bg-status-danger-bg text-status-danger-text border-status-danger-border" :
                            isUpcoming ? "bg-status-info-bg text-status-info-text border-status-info-border" :
                            "bg-status-success-bg text-status-success-text border-status-success-border"
                          }`}>
                            {!deal.isActive ? (language === "vi" ? "Tạm tắt" : "Disabled") : isExpired ? (language === "vi" ? "Kết thúc" : "Ended") : isUpcoming ? (language === "vi" ? "Sắp diễn ra" : "Upcoming") : (language === "vi" ? "Đang chạy" : "Active")}
                          </span>
                        </div>
                        <p className="text-xs text-brand-muted font-medium">
                          📅 {language === "vi" ? "Thời gian:" : "Duration:"} {new Date(deal.startsAt).toLocaleString(language === "vi" ? "vi-VN" : "en-US")} - {new Date(deal.expiresAt).toLocaleString(language === "vi" ? "vi-VN" : "en-US")}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {deal.featuredCoupons?.length > 0 && (
                          <div className="flex items-center gap-1.5 bg-brand-primary/10 px-3 py-1.5 rounded-xl border border-brand-border/30 text-xs font-bold text-brand-primary">
                            <Ticket size={14} /> {deal.featuredCoupons.length} {language === "vi" ? "Vouchers liên kết" : "Linked Vouchers"}
                          </div>
                        )}
                        <button
                          disabled={isExpired}
                          onClick={() => handleOpenEditDealModal(deal)}
                          className="p-2.5 text-brand-muted hover:text-brand-primary hover:bg-brand-primary-light/20 rounded-xl transition cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent"
                          title={isExpired ? (language === "vi" ? "Deal đã kết thúc không thể sửa" : "Ended deal cannot be edited") : (language === "vi" ? "Sửa Flash Sale" : "Edit Flash Sale")}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteDeal(deal.id)}
                          className="p-2.5 text-brand-muted hover:text-status-danger-text hover:bg-status-danger-bg/40 rounded-xl transition cursor-pointer"
                          title={language === "vi" ? "Tắt sự kiện Flash Sale" : "Disable Flash Sale event"}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Deal Products Table */}
                    <div className="p-6">
                      {deal.dealProducts?.length === 0 ? (
                        <p className="text-xs text-brand-muted italic">{language === "vi" ? "Không có sản phẩm nào thuộc đợt Flash Sale này." : "No products belong to this Flash Sale event."}</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {deal.dealProducts.map((dp: any) => {
                            const soldPct = dp.dealStock > 0 ? Math.min(100, Math.round((dp.soldCount / dp.dealStock) * 100)) : 0;
                            return (
                              <div key={dp.id} className="bg-brand-surface border border-brand-border/40 rounded-2xl p-4 flex gap-4 hover:scale-[1.01] hover:shadow-md hover:border-brand-primary/30 transition-all duration-300">
                                <div className="w-14 h-20 bg-brand-bg rounded-xl overflow-hidden relative shrink-0 border border-brand-border/20">
                                  <Image
                                    src={dp.product?.image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800"}
                                    alt={dp.product?.name || "Book"}
                                    fill
                                    className="object-contain"
                                  />
                                </div>
                                <div className="flex-1 flex flex-col justify-between min-w-0">
                                  <div>
                                    <h4 className="font-bold text-xs text-brand-text truncate">{dp.product?.name}</h4>
                                    <div className="flex items-baseline gap-2 mt-1">
                                      <span className="text-xs text-rose-600 font-extrabold">{formatPrice(dp.dealPrice)}</span>
                                      <span className="text-[10px] text-brand-muted line-through">{formatPrice(dp.product?.price ?? 0)}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-1 mt-2">
                                    <div className="flex justify-between text-[10px] text-brand-muted font-semibold">
                                      <span>{language === "vi" ? "Đã bán" : "Sold"}: {dp.soldCount}/{dp.dealStock}</span>
                                      <span>{soldPct}%</span>
                                    </div>
                                    <div className="w-full bg-brand-bg border border-brand-border/20 h-1.5 rounded-full overflow-hidden">
                                      <div className="bg-brand-primary h-full rounded-full" style={{ width: `${soldPct}%` }}></div>
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
          <div className="bg-brand-surface border border-brand-border/40 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center w-full sm:w-auto">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">{language === "vi" ? "Loại đối tượng" : "Entity Type"}</span>
                <select
                  value={logsFilterType}
                  onChange={(e) => {
                    setLogsFilterType(e.target.value);
                    setLogsPage(1);
                    fetchAuditLogs(1, e.target.value, logsFilterAction);
                  }}
                  className="bg-brand-bg border border-brand-border/30 rounded-xl px-3.5 py-2 text-xs font-semibold text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition-all duration-200"
                >
                  <option value="">{language === "vi" ? "Tất cả (Coupons & Deals)" : "All (Coupons & Deals)"}</option>
                  <option value="coupon">Coupon</option>
                  <option value="deal">{language === "vi" ? "Deal Flash Sale" : "Flash Sale Deal"}</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">{language === "vi" ? "Hành động" : "Action"}</span>
                <select
                  value={logsFilterAction}
                  onChange={(e) => {
                    setLogsFilterAction(e.target.value);
                    setLogsPage(1);
                    fetchAuditLogs(1, logsFilterType, e.target.value);
                  }}
                  className="bg-brand-bg border border-brand-border/30 rounded-xl px-3.5 py-2 text-xs font-semibold text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition-all duration-200"
                >
                  <option value="">{language === "vi" ? "Tất cả hành động" : "All Actions"}</option>
                  <option value="create">{language === "vi" ? "Tạo mới (create)" : "Create (create)"}</option>
                  <option value="update">{language === "vi" ? "Cập nhật (update)" : "Update (update)"}</option>
                  <option value="deactivate">{language === "vi" ? "Tắt kích hoạt (deactivate)" : "Deactivate (deactivate)"}</option>
                </select>
              </div>
            </div>
            <button
              onClick={() => fetchAuditLogs(1, logsFilterType, logsFilterAction)}
              className="px-4 py-2 bg-brand-bg border border-brand-border/30 text-brand-text hover:bg-brand-surface rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-end cursor-pointer"
            >
              {language === "vi" ? "Tải lại" : "Reload"}
            </button>
          </div>

          {/* AUDIT LOG TABLE */}
          <div className="bg-brand-surface border border-brand-border/40 rounded-3xl overflow-hidden shadow-sm">
            {logsLoading ? (
              <div className="flex items-center justify-center py-40">
                <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <AdminEmptyState
                icon={History}
                title={language === "vi" ? "Không có nhật ký" : "No logs found"}
                description={language === "vi" ? "Không tìm thấy nhật ký audit log nào phù hợp với bộ lọc hiện tại." : "No audit logs found matching the current filters."}
              />
            ) : (
              <div>
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-brand-surface/95 backdrop-blur-sm border-b border-brand-border/40 text-brand-muted font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.03)]">
                      <th className="px-6 py-4 w-12 text-center">ID</th>
                      <th className="px-6 py-4">{language === "vi" ? "Thời gian" : "Time"}</th>
                      <th className="px-6 py-4">{language === "vi" ? "Người thực hiện" : "Performed By"}</th>
                      <th className="px-6 py-4">{language === "vi" ? "Hành động" : "Action"}</th>
                      <th className="px-6 py-4">{language === "vi" ? "Đối tượng" : "Target"}</th>
                      <th className="px-6 py-4">{language === "vi" ? "Lý do thay đổi" : "Change Reason"}</th>
                      <th className="px-6 py-4 text-center w-24">{language === "vi" ? "Chi tiết" : "Details"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/10">
                    {logs.map((log) => {
                      const isExpanded = expandedLogId === log.id;
                      return (
                        <Fragment key={log.id}>
                          <tr className="hover:bg-brand-bg/20 odd:bg-brand-surface even:bg-brand-bg/50 transition items-center">
                            <td className="px-6 py-4 text-center font-mono text-xs text-brand-muted font-bold">#{log.id}</td>
                            <td className="px-6 py-4 text-xs text-brand-muted font-medium whitespace-nowrap">
                              {new Date(log.createdAt).toLocaleString(language === "vi" ? "vi-VN" : "en-US")}
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-brand-text text-xs">@{log.performedBy || `Admin-${log.adminId}`}</span>
                              {log.ipAddress && (
                                <span className="block text-[9px] font-mono text-brand-muted">IP: {log.ipAddress}</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                                log.action === "create" ? "bg-status-success-bg text-status-success-text border-status-success-border" :
                                log.action === "update" ? "bg-status-info-bg text-status-info-text border-status-info-border" :
                                "bg-status-danger-bg text-status-danger-text border-status-danger-border"
                              }`}>
                                {log.action === "create" && (language === "vi" ? "Tạo mới" : "Create")}
                                {log.action === "update" && (language === "vi" ? "Cập nhật" : "Update")}
                                {log.action === "deactivate" && (language === "vi" ? "Tắt bỏ" : "Deactivate")}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-brand-primary text-xs uppercase bg-brand-primary/10 px-2 py-0.5 rounded border border-brand-border/20 font-mono">
                                {log.entityType}
                              </span>
                              <span className="font-semibold text-brand-muted text-xs ml-1.5 font-mono">#{log.entityId}</span>
                            </td>
                            <td className="px-6 py-4 text-xs text-brand-text font-medium leading-relaxed max-w-sm">
                              {log.reason || (language === "vi" ? "Không ghi chú lý do" : "No reason provided")}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                className="p-1 hover:bg-brand-primary/10 rounded-lg text-brand-muted hover:text-brand-primary transition flex items-center justify-center mx-auto cursor-pointer"
                              >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-brand-bg/30">
                              <td colSpan={7} className="px-8 py-4 border-t border-b border-brand-border/10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {log.oldValue && (
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block">{language === "vi" ? "Dữ liệu Cũ (Old Value)" : "Old Value Data"}</span>
                                      <pre className="text-xs font-mono bg-brand-bg border border-brand-border/30 p-3.5 rounded-2xl text-brand-text overflow-auto max-h-48 shadow-inner custom-scrollbar">
                                        {JSON.stringify(log.oldValue, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                  {log.newValue && (
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block">{language === "vi" ? "Dữ liệu Mới (New Value)" : "New Value Data"}</span>
                                      <pre className="text-xs font-mono bg-brand-bg border border-brand-border/30 p-3.5 rounded-2xl text-brand-text overflow-auto max-h-48 shadow-inner custom-scrollbar">
                                        {JSON.stringify(log.newValue, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>

                {/* PAGINATION */}
                {logsTotalPages > 1 && (
                  <div className="flex items-center justify-between p-6 border-t border-brand-border/10">
                    <span className="text-xs text-brand-muted font-medium">
                      {language === "vi" 
                        ? `Hiển thị trang ${logsPage}/${logsTotalPages} (Tổng cộng ${logsTotal} dòng nhật ký)` 
                        : `Showing page ${logsPage}/${logsTotalPages} (Total ${logsTotal} log entries)`}
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={logsPage === 1}
                        onClick={() => handleLogsPageChange(logsPage - 1)}
                        className="px-3.5 py-1.5 text-xs font-bold border border-brand-border bg-brand-surface text-brand-text hover:bg-brand-bg rounded-xl transition disabled:opacity-40 cursor-pointer"
                      >
                        {language === "vi" ? "Trang trước" : "Previous"}
                      </button>
                      <button
                        disabled={logsPage === logsTotalPages}
                        onClick={() => handleLogsPageChange(logsPage + 1)}
                        className="px-3.5 py-1.5 text-xs font-bold border border-brand-border bg-brand-surface text-brand-text hover:bg-brand-bg rounded-xl transition disabled:opacity-40 cursor-pointer"
                      >
                        {language === "vi" ? "Trang sau" : "Next"}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-fadeIn">
          <div className="bg-brand-surface rounded-3xl border border-brand-border shadow-2xl ring-1 ring-brand-border/20 w-full max-w-2xl overflow-hidden animate-scaleIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border/40 bg-brand-primary-light/10">
              <h3 className="font-extrabold text-brand-text text-base">
                {editingCouponId !== null 
                  ? (language === "vi" ? "Cập Nhật Coupon / Voucher" : "Update Coupon / Voucher") 
                  : (language === "vi" ? "Thêm Mới Coupon / Voucher" : "Add New Coupon / Voucher")}
              </h3>
              <button
                onClick={() => setIsCouponModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-brand-primary-light/20 text-brand-muted hover:text-brand-primary transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCouponSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {couponError && (
                <div className="p-3 text-xs bg-status-danger-bg text-status-danger-text border border-status-danger-border rounded-xl flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{couponError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Coupon Code */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">{language === "vi" ? "Mã Coupon *" : "Coupon Code *"}</label>
                  <input
                    type="text"
                    required
                    disabled={editingCouponId !== null && !canEditCouponCode}
                    placeholder={language === "vi" ? "Ví dụ: SACHHE30" : "e.g. SACHHE30"}
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition font-mono uppercase disabled:bg-brand-bg/50 disabled:text-brand-muted"
                  />
                  {editingCouponId !== null && !canEditCouponCode && (
                    <span className="text-[10px] text-brand-primary font-bold block mt-1">
                      {language === "vi" ? "⚠️ Khóa sửa mã do coupon đã được nhận/sử dụng." : "⚠️ Code locked because coupon has been claimed/used."}
                    </span>
                  )}
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">{language === "vi" ? "Tên chương trình" : "Campaign Name"}</label>
                  <input
                    type="text"
                    placeholder={language === "vi" ? "Mô tả ngắn cho người dùng" : "Short description for users"}
                    value={couponName}
                    onChange={(e) => setCouponName(e.target.value)}
                    className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition"
                  />
                </div>

                {/* Type */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">{language === "vi" ? "Phân loại" : "Type"}</label>
                  <select
                    value={couponType}
                    onChange={(e) => setCouponType(e.target.value as any)}
                    className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition font-semibold"
                  >
                    <option value="platform">{language === "vi" ? "Voucher Cửa Hàng (Platform)" : "Store Voucher (Platform)"}</option>
                    <option value="shop">{language === "vi" ? "Voucher Danh Mục (Shop)" : "Category Voucher (Shop)"}</option>
                    <option value="shipping">{language === "vi" ? "Voucher Vận Chuyển (Freeship)" : "Shipping Voucher (Freeship)"}</option>
                  </select>
                </div>

                {/* Discount Type */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">{language === "vi" ? "Hình thức giảm" : "Discount Type"}</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition font-semibold"
                  >
                    <option value="percentage">{language === "vi" ? "Giảm theo %" : "Percentage Discount (%)"}</option>
                    <option value="fixed">{language === "vi" ? "Giảm số tiền cố định (VNĐ)" : "Fixed Amount Discount (VND)"}</option>
                  </select>
                </div>

                {/* Discount Value */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">{language === "vi" ? "Giá trị giảm *" : "Discount Value *"}</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder={discountType === "percentage" ? (language === "vi" ? "Nhập % giảm (ví dụ: 10)" : "Enter % discount (e.g. 10)") : (language === "vi" ? "Nhập số tiền giảm (ví dụ: 20000)" : "Enter discount amount (e.g. 20000)")}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition"
                  />
                </div>

                {/* Min Order */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">{language === "vi" ? "Đơn hàng tối thiểu" : "Minimum Spend"}</label>
                  <input
                    type="number"
                    min="0"
                    placeholder={language === "vi" ? "Không giới hạn" : "Unlimited"}
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value)}
                    className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition"
                  />
                </div>

                {/* Max Discount */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">{language === "vi" ? "Mức giảm tối đa" : "Maximum Discount"}</label>
                  <input
                    type="number"
                    min="0"
                    placeholder={language === "vi" ? "Không giới hạn" : "Unlimited"}
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition"
                  />
                </div>

                {/* Category ID (only shows if type is "shop") */}
                {couponType === "shop" && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">{language === "vi" ? "Danh mục sản phẩm áp dụng" : "Applicable Category"}</label>
                    <select
                      value={couponCategoryId}
                      onChange={(e) => setCouponCategoryId(e.target.value)}
                      className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition font-semibold"
                    >
                      <option value="">{language === "vi" ? "Chọn danh mục" : "Select Category"}</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{translateCategory(c.name)}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Starts At */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">{language === "vi" ? "Thời gian bắt đầu" : "Start Time"}</label>
                  <input
                    type="datetime-local"
                    value={couponStartsAt}
                    onChange={(e) => setCouponStartsAt(e.target.value)}
                    className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition font-semibold"
                  />
                </div>

                {/* Expires At */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">{language === "vi" ? "Thời gian kết thúc" : "End Time"}</label>
                  <input
                    type="datetime-local"
                    value={couponExpiresAt}
                    onChange={(e) => setCouponExpiresAt(e.target.value)}
                    className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition font-semibold"
                  />
                </div>

                {/* Audit Reason Field */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">{language === "vi" ? "Lý do thay đổi / Lý do tạo *" : "Reason for change / creation *"}</label>
                  <input
                    type="text"
                    required
                    placeholder={language === "vi" ? "Mô tả lý do thay đổi cho hệ thống audit log..." : "Describe reason for audit log..."}
                    value={couponReason}
                    onChange={(e) => setCouponReason(e.target.value)}
                    className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition font-medium"
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
                  className="w-4 h-4 text-brand-primary border-brand-border/40 rounded focus:ring-brand-primary/30"
                />
                <label htmlFor="couponIsActive" className="text-xs font-bold text-brand-text select-none cursor-pointer">
                  {language === "vi" ? "Kích hoạt Coupon ngay lập tức" : "Activate Coupon immediately"}
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-brand-border/10">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  disabled={couponSubmitting}
                  className="px-5 py-2.5 rounded-xl border border-brand-border hover:bg-brand-bg text-sm font-semibold text-brand-muted transition cursor-pointer"
                >
                  {language === "vi" ? "Hủy bỏ" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={couponSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover disabled:bg-brand-primary-light text-white text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {couponSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {editingCouponId !== null 
                    ? (language === "vi" ? "Lưu Thay Đổi" : "Save Changes") 
                    : (language === "vi" ? "Tạo Coupon" : "Create Coupon")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ADD DEAL ==================== */}
      {isDealModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-fadeIn">
          <div className="bg-brand-surface rounded-3xl border border-brand-border shadow-2xl ring-1 ring-brand-border/20 w-full max-w-4xl overflow-hidden animate-scaleIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border/40 bg-brand-primary-light/10">
              <h3 className="font-extrabold text-brand-text text-base">
                {editingDealId !== null 
                  ? (language === "vi" ? "Cập Nhật Sự Kiện Flash Sale" : "Update Flash Sale Event") 
                  : (language === "vi" ? "Tạo Sự Kiện Flash Sale Mới" : "Create New Flash Sale Event")}
              </h3>
              <button
                onClick={() => setIsDealModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-brand-primary-light/20 text-brand-muted hover:text-brand-primary transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleDealSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {dealError && (
                <div className="p-3 text-xs bg-status-danger-bg text-status-danger-text border border-status-danger-border rounded-xl flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{dealError}</span>
                </div>
              )}

              {/* Deal Info Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">{language === "vi" ? "Tên sự kiện *" : "Event Name *"}</label>
                  <input
                    type="text"
                    required
                    placeholder={language === "vi" ? "Ví dụ: Siêu Sale Sách Hè 2026" : "e.g. Summer Book Flash Sale 2026"}
                    value={dealName}
                    onChange={(e) => setDealName(e.target.value)}
                    className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">{language === "vi" ? "Mô tả chi tiết" : "Detailed Description"}</label>
                  <input
                    type="text"
                    placeholder={language === "vi" ? "Ví dụ: Giảm giá cực sâu tới 50% tất cả các mặt hàng sách hot" : "e.g. Up to 50% off on all popular books"}
                    value={dealDescription}
                    onChange={(e) => setDealDescription(e.target.value)}
                    className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">{language === "vi" ? "Thời gian bắt đầu *" : "Start Time *"}</label>
                  <input
                    type="datetime-local"
                    required
                    value={dealStartsAt}
                    onChange={(e) => setDealStartsAt(e.target.value)}
                    className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">{language === "vi" ? "Thời gian kết thúc *" : "End Time *"}</label>
                  <input
                    type="datetime-local"
                    required
                    value={dealExpiresAt}
                    onChange={(e) => setDealExpiresAt(e.target.value)}
                    className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition font-semibold"
                  />
                </div>
              </div>

              {/* Homepage Banner Config Section */}
              <div className="bg-brand-primary-light/5 p-5 rounded-3xl border border-brand-border/30 space-y-4">
                <h4 className="font-extrabold text-sm text-brand-primary flex items-center gap-1.5">
                  🖼️ {language === "vi" ? "Cấu Hình Banner Quảng Cáo Trên Trang Chủ (Homepage Banner)" : "Homepage Banner Configuration"}
                </h4>
                
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="dealBannerEnabled"
                    checked={dealBannerEnabled}
                    onChange={(e) => setDealBannerEnabled(e.target.checked)}
                    className="w-4 h-4 text-brand-primary border-brand-border/40 rounded focus:ring-brand-primary/30 cursor-pointer"
                  />
                  <label htmlFor="dealBannerEnabled" className="text-xs font-bold text-brand-text select-none cursor-pointer">
                    {language === "vi" ? "Hiển thị banner cho Deal này lên trang chủ khi Deal đang kích hoạt" : "Display banner for this Deal on homepage when active"}
                  </label>
                </div>

                {dealBannerEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">{language === "vi" ? "Đường dẫn hình ảnh Banner (URL)" : "Banner Image Path (URL)"}</label>
                      <input
                        type="text"
                        placeholder={language === "vi" ? "Ví dụ: /img/sale.jpg hoặc link ảnh online HTTPS" : "e.g. /img/sale.jpg or HTTPS online image link"}
                        value={dealBannerUrl}
                        onChange={(e) => setDealBannerUrl(e.target.value)}
                        className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">{language === "vi" ? "Tiêu đề Banner (Marketing)" : "Banner Title (Marketing)"}</label>
                      <input
                        type="text"
                        placeholder={language === "vi" ? "Để trống sẽ mặc định dùng Tên sự kiện" : "Leave empty to default to Event Name"}
                        value={dealBannerTitle}
                        onChange={(e) => setDealBannerTitle(e.target.value)}
                        className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">{language === "vi" ? "Mô tả ngắn Banner (Marketing)" : "Banner Subtitle (Marketing)"}</label>
                      <input
                        type="text"
                        placeholder={language === "vi" ? "Để trống sẽ mặc định dùng Mô tả chi tiết" : "Leave empty to default to Detailed Description"}
                        value={dealBannerSubtitle}
                        onChange={(e) => setDealBannerSubtitle(e.target.value)}
                        className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">{language === "vi" ? "Chữ hiển thị trên Nút (CTA Button Text)" : "Button Text (CTA Button Text)"}</label>
                      <input
                        type="text"
                        placeholder={language === "vi" ? "Ví dụ: SĂN DEAL NGAY" : "e.g. SHOP NOW"}
                        value={dealBannerButtonText}
                        onChange={(e) => setDealBannerButtonText(e.target.value)}
                        className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition font-medium"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">{language === "vi" ? "Đường dẫn khi click vào Nút (CTA Button Link)" : "Button Action Link (CTA Button Link)"}</label>
                      <input
                        type="text"
                        placeholder={language === "vi" ? "Ví dụ: /deals hoặc link chi tiết deal. Nhập link tuyệt đối (http/https) hoặc link tương đối (/)" : "e.g. /deals or deal details link. Enter absolute (http/https) or relative (/) link"}
                        value={dealBannerButtonUrl}
                        onChange={(e) => setDealBannerButtonUrl(e.target.value)}
                        className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Linked Coupons Multi-selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-brand-muted uppercase tracking-wider block">{language === "vi" ? "Vouchers nổi bật đi kèm sự kiện (Featured Coupons)" : "Featured Coupons Included in Event"}</label>
                {coupons.length === 0 ? (
                  <p className="text-xs text-brand-muted italic">{language === "vi" ? "Chưa có Coupon nào được tạo. Vui lòng tạo coupon trước ở tab quản lý coupon." : "No coupons created yet. Please create a coupon in the Coupon Management tab first."}</p>
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
                              ? "bg-brand-primary border-brand-primary text-white"
                              : "bg-brand-bg border-brand-border/30 text-brand-text hover:border-brand-primary"
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
                    <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">{language === "vi" ? "Chọn sản phẩm tham gia Flash Sale *" : "Select Products for Flash Sale *"}</label>
                    {editingDealId !== null && !canEditDealProducts && (
                      <span className="text-[10px] text-brand-primary font-bold block">
                        {language === "vi" ? "⚠️ Đã khóa thêm/bớt sản phẩm hoặc sửa giá do sự kiện đã có người đặt mua." : "⚠️ Locked product changes/prices as purchases have already occurred."}
                      </span>
                    )}
                  </div>
                  <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted w-3.5 h-3.5" />
                    <input
                      type="text"
                      placeholder={language === "vi" ? "Tìm sách tham gia..." : "Search books to include..."}
                      value={dealProductSearch}
                      onChange={(e) => setDealProductSearch(e.target.value)}
                      className="w-full rounded-xl border border-brand-border/30 bg-brand-bg pl-8 pr-3 py-1.5 text-xs text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition"
                    />
                  </div>
                </div>

                <div className="border border-brand-border/30 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-brand-bg border-b border-brand-border/40 text-brand-muted font-bold uppercase text-[9px] tracking-wider sticky top-0 z-10">
                        <th className="px-4 py-3 text-center w-12">{language === "vi" ? "Chọn" : "Select"}</th>
                        <th className="px-4 py-3">{language === "vi" ? "Tên Sách" : "Book Title"}</th>
                        <th className="px-4 py-3 text-right">{language === "vi" ? "Đơn Giá Gốc" : "Original Price"}</th>
                        <th className="px-4 py-3">{language === "vi" ? "Đơn Giá Deal (VNĐ)" : "Deal Price (VND)"}</th>
                        <th className="px-4 py-3">{language === "vi" ? "Số Lượng Deal / Đã bán" : "Deal Stock / Sold"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/10">
                      {filteredDealProductsSelector.map((p) => {
                        const isChecked = selectedProductsMap[p.id] !== undefined;
                        const info = selectedProductsMap[p.id];
                        const soldCount = info?.soldCount || 0;

                        return (
                          <tr key={p.id} className={`hover:bg-brand-bg/20 transition ${isChecked ? "bg-brand-primary/5" : ""}`}>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={editingDealId !== null && !canEditDealProducts}
                                onChange={(e) => handleProductCheckChange(p.id, e.target.checked, p.price)}
                                className="w-4 h-4 text-brand-primary border-brand-border/40 rounded focus:ring-brand-primary/30 cursor-pointer disabled:opacity-40"
                              />
                            </td>
                            <td className="px-4 py-3 font-semibold text-brand-text">
                              <p className="font-bold text-brand-text text-xs truncate max-w-xs">{p.name}</p>
                              <p className="text-[9px] text-brand-muted">{language === "vi" ? `Kho hàng gốc: ${p.stock} cuốn` : `Original stock: ${p.stock} units`}</p>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-brand-muted">
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
                                placeholder={language === "vi" ? "Ví dụ: 120000" : "e.g. 120000"}
                                className="w-28 rounded-lg border border-brand-border/30 bg-brand-bg px-2 py-1 text-xs text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary disabled:bg-brand-bg/50 disabled:text-brand-muted font-bold transition"
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
                                  placeholder={language === "vi" ? "Ví dụ: 20" : "e.g. 20"}
                                  className="w-24 rounded-lg border border-brand-border/30 bg-brand-bg px-2 py-1 text-xs text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary disabled:bg-brand-bg/50 font-bold transition"
                                />
                                {soldCount > 0 && (
                                  <span className="text-[10px] text-status-danger-text bg-status-danger-bg px-2 py-0.5 border border-status-danger-border rounded font-black shrink-0">
                                    {language === "vi" ? "Đã bán" : "Sold"}: {soldCount}
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
                <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">{language === "vi" ? "Lý do thay đổi / Lý do tạo *" : "Reason for change / creation *"}</label>
                <input
                  type="text"
                  required
                  placeholder={language === "vi" ? "Mô tả lý do thực hiện hành động này để lưu nhật ký audit log..." : "Describe reason for this action to save in audit log..."}
                  value={dealReason}
                  onChange={(e) => setDealReason(e.target.value)}
                  className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition font-medium"
                />
              </div>

              {/* Active switch */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="dealIsActive"
                  checked={dealIsActive}
                  onChange={(e) => setDealIsActive(e.target.checked)}
                  className="w-4 h-4 text-brand-primary border-brand-border/40 rounded focus:ring-brand-primary/30"
                />
                <label htmlFor="dealIsActive" className="text-xs font-bold text-brand-text select-none cursor-pointer">
                  {language === "vi" ? "Kích hoạt sự kiện Flash Sale ngay lập tức" : "Activate Flash Sale event immediately"}
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-brand-border/10">
                <button
                  type="button"
                  onClick={() => setIsDealModalOpen(false)}
                  disabled={dealSubmitting}
                  className="px-5 py-2.5 rounded-xl border border-brand-border hover:bg-brand-bg text-sm font-semibold text-brand-muted transition cursor-pointer"
                >
                  {language === "vi" ? "Hủy bỏ" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={dealSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover disabled:bg-brand-primary-light text-white text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {dealSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {editingDealId !== null 
                    ? (language === "vi" ? "Lưu Thay Đổi" : "Save Changes") 
                    : (language === "vi" ? "Tạo Sự Kiện Flash Sale" : "Create Flash Sale Event")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
