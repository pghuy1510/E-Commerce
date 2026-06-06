"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Loader2,
  X,
  AlertTriangle,
  ShoppingBag
} from "lucide-react";
import Image from "next/image";
import { productAPI, adminAPI, api } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";
import AdminEmptyState from "@/components/admin/AdminEmptyState";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const { formatPrice, translateCategory, language } = usePreferences();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  // Form Fields State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [image, setImage] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchProductsAndCategories();
  }, []);

  const fetchProductsAndCategories = async () => {
    try {
      setLoading(true);
      const [prodData, catRes] = await Promise.all([
        productAPI.getAll(),
        api.get("/categories"),
      ]);
      setProducts(prodData);
      setCategories(catRes.data);
      if (catRes.data.length > 0 && !categoryId) {
        setCategoryId(catRes.data[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setEditingProductId(null);
    setName("");
    setDescription("");
    setPrice("");
    setStock("");
    setImage("");
    if (categories.length > 0) {
      setCategoryId(categories[0].id.toString());
    }
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: any) => {
    setModalMode("edit");
    setEditingProductId(product.id);
    setName(product.name);
    setDescription(product.description || "");
    setPrice(product.price.toString());
    setStock(product.stock.toString());
    setImage(product.image || "");
    setCategoryId(product.category?.id?.toString() || "");
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm(language === "vi" ? "Bạn có chắc chắn muốn xóa sản phẩm này không?" : "Are you sure you want to delete this product?")) return;
    try {
      await adminAPI.deleteProduct(id);
      alert(language === "vi" ? "Đã xóa sản phẩm thành công!" : "Product deleted successfully!");
      fetchProductsAndCategories();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || (language === "vi" ? "Không thể xóa sản phẩm lúc này." : "Cannot delete product at this time."));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !price || !stock || !categoryId) {
      setFormError(language === "vi" ? "Vui lòng điền đầy đủ tất cả thông tin bắt buộc." : "Please fill in all required fields.");
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      stock: parseInt(stock),
      image: image.trim() || undefined,
      categoryId: parseInt(categoryId),
    };

    try {
      setFormSubmitting(true);
      setFormError(null);

      if (modalMode === "create") {
        await adminAPI.createProduct(payload);
        alert(language === "vi" ? "Đã thêm sản phẩm thành công!" : "Product added successfully!");
      } else {
        if (!editingProductId) return;
        await adminAPI.updateProduct(editingProductId, payload);
        alert(language === "vi" ? "Đã cập nhật sản phẩm thành công!" : "Product updated successfully!");
      }

      setIsModalOpen(false);
      fetchProductsAndCategories();
    } catch (err: any) {
      console.error(err);
      setFormError(err?.response?.data?.message || (language === "vi" ? "Không thể hoàn thành thao tác." : "Failed to complete operation."));
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategoryFilter === "all" || 
      (p.category && p.category.id.toString() === selectedCategoryFilter);

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* ACTIONS ROW */}
      <div className="bg-brand-surface border border-brand-border/40 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search and filter inputs */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted w-4 h-4" />
            <input
              type="text"
              placeholder={language === "vi" ? "Tìm kiếm sản phẩm theo tên..." : "Search products by name..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-brand-border/30 bg-brand-bg/50 pl-10 pr-4 py-2.5 text-sm text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary focus:bg-brand-bg transition-all duration-200 placeholder:text-brand-muted"
            />
          </div>
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="rounded-2xl border border-brand-border/30 bg-brand-bg/50 px-4 py-2.5 text-sm text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition font-semibold"
          >
            <option value="all">{language === "vi" ? "Tất cả Danh Mục" : "All Categories"}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {translateCategory(c.name)}
              </option>
            ))}
          </select>
        </div>

        {/* Add Product Button */}
        <button
          onClick={handleOpenCreateModal}
          className="bg-brand-primary hover:bg-brand-primary-hover hover:-translate-y-0.5 text-white font-semibold text-sm px-6 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg shadow-brand-primary/10 transition duration-300 shrink-0 cursor-pointer"
        >
          <Plus size={18} /> {language === "vi" ? "Thêm Sản Phẩm Mới" : "Add New Product"}
        </button>
      </div>

      {/* PRODUCTS TABLE CARD */}
      <div className="bg-brand-surface border border-brand-border/40 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-40">
            <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <AdminEmptyState
            icon={ShoppingBag}
            title={language === "vi" ? "Không tìm thấy sản phẩm" : "No products found"}
            description={language === "vi" ? "Không tìm thấy cuốn sách nào khớp với từ khóa tìm kiếm hoặc danh mục đã chọn." : "No books match your search term or selected category."}
          />
        ) : (
          <div className="overflow-x-auto relative max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-brand-surface/95 backdrop-blur-sm border-b border-brand-border/40 text-brand-muted font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.03)]">
                  <th className="px-6 py-4">{language === "vi" ? "Ảnh" : "Image"}</th>
                  <th className="px-6 py-4">{language === "vi" ? "Tên Sách" : "Book Title"}</th>
                  <th className="px-6 py-4">{language === "vi" ? "Danh Mục" : "Category"}</th>
                  <th className="px-6 py-4 text-right">{language === "vi" ? "Đơn Giá" : "Price"}</th>
                  <th className="px-6 py-4 text-center">{language === "vi" ? "Tồn Kho" : "Stock"}</th>
                  <th className="px-6 py-4 text-center">{language === "vi" ? "Hành Động" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/10">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-brand-bg/20 odd:bg-brand-surface even:bg-brand-bg/50 transition">
                    <td className="px-6 py-4 shrink-0">
                      <div className="w-12 h-16 bg-brand-bg rounded-xl overflow-hidden border border-brand-border/20 flex items-center justify-center relative">
                        {p.image ? (
                          <Image
                            src={p.image}
                            alt={p.name}
                            fill
                            className="object-contain"
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-brand-muted" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-brand-text max-w-xs truncate">
                      <div>
                        <p className="font-bold text-brand-text text-sm truncate">{p.name}</p>
                        <p className="text-[10px] text-brand-muted font-medium">
                          {language === "vi" ? `Mã sản phẩm: #${p.id}` : `Product ID: #${p.id}`}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-brand-muted text-xs uppercase tracking-wide">
                      {p.category ? translateCategory(p.category.name) : (language === "vi" ? "Khác" : "Other")}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-brand-primary">
                      {formatPrice(p.price)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
                        p.stock === 0 ? "bg-status-danger-bg text-status-danger-text border-status-danger-border" :
                        p.stock <= 10 ? "bg-status-warning-bg text-status-warning-text border-status-warning-border" :
                        "bg-status-success-bg text-status-success-text border-status-success-border"
                      }`}>
                        {p.stock === 0 ? (language === "vi" ? "Hết hàng" : "Out of stock") : (language === "vi" ? `Còn ${p.stock}` : `${p.stock} left`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="p-2 text-brand-muted hover:text-brand-primary hover:bg-brand-primary-light/20 rounded-xl transition cursor-pointer"
                          title={language === "vi" ? "Sửa sản phẩm" : "Edit product"}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-2 text-brand-muted hover:text-status-danger-text hover:bg-status-danger-bg/40 rounded-xl transition cursor-pointer"
                          title={language === "vi" ? "Xóa sản phẩm" : "Delete product"}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-fadeIn">
          <div className="bg-brand-surface rounded-3xl border border-brand-border shadow-2xl ring-1 ring-brand-border/20 w-full max-w-2xl overflow-hidden animate-scaleIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border/40 bg-brand-primary-light/10">
              <h3 className="font-extrabold text-brand-text text-base">
                {modalMode === "create" 
                  ? (language === "vi" ? "Thêm Sản Phẩm Sách Mới" : "Add New Book Product") 
                  : (language === "vi" ? "Cập Nhật Thông Tin Sách" : "Update Book Details")}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-brand-primary-light/20 text-brand-muted hover:text-brand-primary transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="p-3 text-xs bg-status-danger-bg text-status-danger-text border border-status-danger-border rounded-xl flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">
                    {language === "vi" ? "Tên sản phẩm *" : "Product Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={language === "vi" ? "Nhập tên sách..." : "Enter book name..."}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition"
                  />
                </div>

                {/* Category Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">
                    {language === "vi" ? "Danh mục *" : "Category *"}
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition font-semibold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {translateCategory(c.name)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">
                    {language === "vi" ? "Đơn giá *" : "Price *"}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1000"
                    placeholder={language === "vi" ? "Nhập đơn giá (VNĐ)..." : "Enter price (VND)..."}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition"
                  />
                </div>

                {/* Stock Quantity */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">
                    {language === "vi" ? "Số lượng tồn *" : "Stock Quantity *"}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder={language === "vi" ? "Số lượng sách trong kho..." : "Stock quantity in warehouse..."}
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition"
                  />
                </div>
              </div>

              {/* Image URL */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">
                  {language === "vi" ? "Link ảnh sản phẩm (Tùy chọn)" : "Product Image URL (Optional)"}
                </label>
                <input
                  type="url"
                  placeholder={language === "vi" ? "Dán link ảnh từ Unsplash, Google Drive, Imgur..." : "Paste image link from Unsplash, Google Drive, Imgur..."}
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">
                  {language === "vi" ? "Mô tả sản phẩm *" : "Product Description *"}
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder={language === "vi" ? "Viết nội dung giới thiệu tóm tắt cuốn sách..." : "Write a summary description of the book..."}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition resize-none"
                />
              </div>

              {/* Modal Footer Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-brand-border/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={formSubmitting}
                  className="px-5 py-2.5 rounded-xl border border-brand-border hover:bg-brand-bg text-sm font-semibold text-brand-muted transition cursor-pointer"
                >
                  {language === "vi" ? "Hủy bỏ" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover disabled:bg-brand-primary-light text-white text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {formSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {modalMode === "create" 
                    ? (language === "vi" ? "Thêm mới" : "Add New") 
                    : (language === "vi" ? "Cập nhật" : "Update")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
