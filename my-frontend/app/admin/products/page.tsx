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
  AlertTriangle
} from "lucide-react";
import Image from "next/image";
import { productAPI, adminAPI, api } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const { formatPrice, translateCategory } = usePreferences();

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
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này không?")) return;
    try {
      await adminAPI.deleteProduct(id);
      alert("Đã xóa sản phẩm thành công!");
      fetchProductsAndCategories();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Không thể xóa sản phẩm lúc này.");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !price || !stock || !categoryId) {
      setFormError("Vui lòng điền đầy đủ tất cả thông tin bắt buộc.");
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
        alert("Đã thêm sản phẩm thành công!");
      } else {
        if (!editingProductId) return;
        await adminAPI.updateProduct(editingProductId, payload);
        alert("Đã cập nhật sản phẩm thành công!");
      }

      setIsModalOpen(false);
      fetchProductsAndCategories();
    } catch (err: any) {
      console.error(err);
      setFormError(err?.response?.data?.message || "Không thể hoàn thành thao tác.");
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
      <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search and filter inputs */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm theo tên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-amber-500 transition placeholder:text-gray-400"
            />
          </div>
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="rounded-2xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-amber-500 transition text-gray-600 font-semibold"
          >
            <option value="all">Tất cả Danh Mục</option>
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
          className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm px-6 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-amber-100 transition shrink-0"
        >
          <Plus size={18} /> Thêm Sản Phẩm Mới
        </button>
      </div>

      {/* PRODUCTS TABLE CARD */}
      <div className="bg-white border border-gray-150 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-40">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-24 text-gray-400 font-medium">
            Không tìm thấy sản phẩm nào phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-150 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="px-6 py-4">Ảnh</th>
                  <th className="px-6 py-4">Tên Sách</th>
                  <th className="px-6 py-4">Danh Mục</th>
                  <th className="px-6 py-4 text-right">Đơn Giá</th>
                  <th className="px-6 py-4 text-center">Tồn Kho</th>
                  <th className="px-6 py-4 text-center">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/30 transition">
                    <td className="px-6 py-4 shrink-0">
                      <div className="w-12 h-16 bg-[#f7f5f2] rounded-xl overflow-hidden border flex items-center justify-center relative">
                        {p.image ? (
                          <Image
                            src={p.image}
                            alt={p.name}
                            fill
                            className="object-contain"
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-gray-300" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 max-w-xs truncate">
                      <div>
                        <p className="font-bold text-gray-900 text-sm truncate">{p.name}</p>
                        <p className="text-[10px] text-gray-400 font-medium">Mã sản phẩm: #{p.id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-600 text-xs uppercase tracking-wide">
                      {p.category ? translateCategory(p.category.name) : "Khác"}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-amber-600">
                      {formatPrice(p.price)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                        p.stock === 0 ? "bg-red-50 text-red-600 border border-red-100" :
                        p.stock <= 10 ? "bg-orange-50 text-orange-600 border border-orange-100" :
                        "bg-green-50 text-green-600 border border-green-100"
                      }`}>
                        {p.stock === 0 ? "Hết hàng" : `Còn ${p.stock}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition"
                          title="Sửa sản phẩm"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                          title="Xóa sản phẩm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-2xl overflow-hidden animate-scaleIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-amber-50/50">
              <h3 className="font-extrabold text-gray-900 text-base">
                {modalMode === "create" ? "Thêm Sản Phẩm Sách Mới" : "Cập Nhật Thông Tin Sách"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 text-xs bg-red-50 text-red-600 border border-red-100 rounded-xl flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tên sản phẩm *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nhập tên sách..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition"
                  />
                </div>

                {/* Category Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Danh mục *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition text-gray-600 font-semibold"
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
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Đơn giá *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1000"
                    placeholder="Nhập đơn giá (VNĐ)..."
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition"
                  />
                </div>

                {/* Stock Quantity */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Số lượng tồn *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Số lượng sách trong kho..."
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              {/* Image URL */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider font-semibold">Link ảnh sản phẩm (Tùy chọn)</label>
                <input
                  type="url"
                  placeholder="Dán link ảnh từ Unsplash, Google Drive, Imgur..."
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mô tả sản phẩm *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Viết nội dung giới thiệu tóm tắt cuốn sách..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition resize-none"
                />
              </div>

              {/* Modal Footer Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={formSubmitting}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-semibold text-gray-600 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white text-sm font-semibold transition flex items-center gap-1.5"
                >
                  {formSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {modalMode === "create" ? "Thêm mới" : "Cập nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
