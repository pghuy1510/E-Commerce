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
  ShoppingBag,
  FileSpreadsheet,
  Upload,
  Download
} from "lucide-react";
import Image from "next/image";
import { productAPI, adminAPI, api } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminConfirmModal from "@/components/admin/AdminConfirmModal";

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

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    type?: "primary" | "danger" | "warning";
    onConfirm: () => void;
  } | null>(null);

  const triggerConfirm = (title: string, message: string, onConfirm: () => void, type: "primary" | "danger" | "warning" = "primary") => {
    setConfirmConfig({ title, message, onConfirm, type });
    setIsConfirmOpen(true);
  };

  // Form Fields State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [image, setImage] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Variable Product Fields State
  const [productType, setProductType] = useState<"simple" | "variable">("simple");
  const [options, setOptions] = useState<Array<{ name: string; values: string[] }>>([]);
  const [variants, setVariants] = useState<Array<{ sku?: string; name: string; price: number; stock: number; image?: string; options: Record<string, string>; isActive?: boolean }>>([]);

  // Excel states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'upsert' | 'create' | 'update'>('upsert');
  const [dryRun, setDryRun] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDownloadTemplate = async () => {
    try {
      const blob = await adminAPI.downloadExcelTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products_template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert(language === 'vi' ? 'Không thể tải file mẫu lúc này.' : 'Cannot download template at this time.');
    }
  };

  const handleExportProducts = async () => {
    try {
      const blob = await adminAPI.exportExcelProducts();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products_export.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert(language === 'vi' ? 'Không thể xuất dữ liệu sản phẩm lúc này.' : 'Cannot export products at this time.');
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;

    try {
      setImportLoading(true);
      setImportResult(null);
      const res = await adminAPI.importExcelProducts(importFile, importMode, dryRun);
      setImportResult(res);
      if (res.success && !dryRun) {
        fetchProductsAndCategories();
      }
    } catch (err: any) {
      console.error(err);
      setImportResult({
        success: false,
        created: 0,
        updated: 0,
        errors: [{ row: 0, message: err?.response?.data?.message || 'Lỗi hệ thống.' }],
      });
    } finally {
      setImportLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setImportFile(file);
      } else {
        alert(language === 'vi' ? 'Chỉ hỗ trợ file Excel (.xlsx, .xls).' : 'Only Excel files are supported (.xlsx, .xls).');
      }
    }
  };

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
    setProductType("simple");
    setOptions([]);
    setVariants([]);
    if (categories.length > 0) {
      setCategoryId(categories[0].id.toString());
    }
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (productSummary: any) => {
    try {
      setFormError(null);
      setLoading(true);
      // Fetch full product details with relations (options, variants)
      const product = await productAPI.getById(productSummary.id);
      
      setModalMode("edit");
      setEditingProductId(product.id);
      setName(product.name);
      setDescription(product.description || "");
      setPrice(product.price.toString());
      setStock(product.stock.toString());
      setImage(product.image || "");
      setCategoryId(product.category?.id?.toString() || "");
      setProductType(product.type || "simple");
      setOptions(product.options || []);
      setVariants(product.variants || []);
      
      setIsModalOpen(true);
    } catch (err: any) {
      console.error(err);
      alert(language === "vi" ? "Không thể tải chi tiết sản phẩm." : "Cannot load product details.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = (id: number) => {
    triggerConfirm(
      language === "vi" ? "Xóa Sản Phẩm" : "Delete Product",
      language === "vi" ? "Bạn có chắc chắn muốn xóa sản phẩm này không?" : "Are you sure you want to delete this product?",
      async () => {
        try {
          await adminAPI.deleteProduct(id);
          alert(language === "vi" ? "Đã xóa sản phẩm thành công!" : "Product deleted successfully!");
          fetchProductsAndCategories();
        } catch (err: any) {
          console.error(err);
          alert(err?.response?.data?.message || (language === "vi" ? "Không thể xóa sản phẩm lúc này." : "Cannot delete product at this time."));
        }
      },
      "danger"
    );
  };

  const handleAddOptionGroup = () => {
    setOptions([...options, { name: "", values: [] }]);
  };

  const handleRemoveOptionGroup = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleUpdateOptionGroupName = (index: number, name: string) => {
    const newOptions = [...options];
    newOptions[index].name = name;
    setOptions(newOptions);
  };

  const handleUpdateOptionGroupValues = (index: number, valStr: string) => {
    const newOptions = [...options];
    newOptions[index].values = valStr.split(",").map(v => v.trim()).filter(Boolean);
    setOptions(newOptions);
  };

  const handleUpdateVariantField = (index: number, field: string, val: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: val };
    setVariants(newVariants);
  };

  const handleGenerateVariants = () => {
    const validOptions = options.filter(o => o.name.trim() && o.values.length > 0);
    if (validOptions.length === 0) {
      alert(language === "vi" ? "Vui lòng thêm ít nhất một thuộc tính có giá trị." : "Please add at least one option with values.");
      return;
    }

    const cartesian = (arrays: any[]): any[] => {
      return arrays.reduce((acc, curr) => {
        return acc.flatMap((d: any) => curr.map((e: any) => [...d, e]));
      }, [[]]);
    };

    const optionKeys = validOptions.map(o => o.name);
    const optionValuesArray = validOptions.map(o => o.values);
    const combinations = cartesian(optionValuesArray);

    const generated = combinations.map((combo, idx) => {
      const variantOptions: Record<string, string> = {};
      combo.forEach((value: string, i: number) => {
        variantOptions[optionKeys[i]] = value;
      });

      const variantName = combo.join(" / ");
      const slugSku = combo.map((v: string) => v.toUpperCase().replace(/\s+/g, "")).join("-");
      const cleanName = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
      const generatedSku = `${cleanName || "BOOK"}-${slugSku}-${idx + 1}`;

      const existing = variants.find(v => {
        return Object.keys(variantOptions).every(k => v.options?.[k] === variantOptions[k]);
      });

      return {
        sku: existing?.sku || generatedSku,
        name: variantName,
        price: existing?.price !== undefined ? existing.price : (parseFloat(price) || 0),
        stock: existing?.stock !== undefined ? existing.stock : (parseInt(stock) || 0),
        image: existing?.image || image.trim() || undefined,
        options: variantOptions,
        isActive: existing?.isActive !== undefined ? existing.isActive : true,
      };
    });

    setVariants(generated);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !categoryId) {
      setFormError(language === "vi" ? "Vui lòng điền đầy đủ tất cả thông tin bắt buộc." : "Please fill in all required fields.");
      return;
    }

    if (productType === "simple" && (!price || !stock)) {
      setFormError(language === "vi" ? "Sản phẩm đơn giản yêu cầu điền giá bán và tồn kho." : "Simple product requires price and stock.");
      return;
    }

    if (productType === "variable") {
      if (options.length === 0 || variants.length === 0) {
        setFormError(language === "vi" ? "Sản phẩm biến thể cần ít nhất một thuộc tính và biến thể." : "Variable product requires at least one option and variant.");
        return;
      }
      const invalidVariant = variants.some(v => !v.sku?.trim());
      if (invalidVariant) {
        setFormError(language === "vi" ? "Vui lòng nhập đầy đủ SKU cho tất cả các biến thể." : "Please enter a valid SKU for all variants.");
        return;
      }
    }

    const payload: any = {
      name: name.trim(),
      description: description.trim(),
      image: image.trim() || undefined,
      categoryId: parseInt(categoryId),
      type: productType,
    };

    if (productType === "variable") {
      payload.options = options.map(o => ({
        name: o.name.trim(),
        values: o.values,
      }));
      payload.variants = variants.map(v => ({
        sku: v.sku?.trim(),
        name: v.name,
        price: Number(v.price) || 0,
        stock: Number(v.stock) || 0,
        image: v.image?.trim() || undefined,
        options: v.options,
        isActive: v.isActive !== false,
      }));
      payload.price = variants.length > 0 ? Math.min(...variants.map(v => v.price)) : 0;
      payload.stock = variants.reduce((sum, v) => sum + v.stock, 0);
    } else {
      payload.price = parseFloat(price);
      payload.stock = parseInt(stock);
    }

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

        {/* Buttons container */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Download Template */}
          <button
            type="button"
            onClick={handleDownloadTemplate}
            title={language === "vi" ? "Tải file mẫu Excel" : "Download Excel Template"}
            className="border border-brand-border/60 hover:bg-brand-bg/50 text-brand-text font-bold text-sm px-4 py-3 rounded-2xl flex items-center justify-center gap-2 transition duration-200 cursor-pointer"
          >
            <FileSpreadsheet size={18} className="text-brand-muted" />
            <span className="hidden sm:inline">{language === "vi" ? "Mẫu Excel" : "Excel Template"}</span>
          </button>

          {/* Export Products */}
          <button
            type="button"
            onClick={handleExportProducts}
            title={language === "vi" ? "Xuất dữ liệu Excel" : "Export to Excel"}
            className="border border-brand-border/60 hover:bg-brand-bg/50 text-brand-text font-bold text-sm px-4 py-3 rounded-2xl flex items-center justify-center gap-2 transition duration-200 cursor-pointer"
          >
            <Download size={18} className="text-brand-muted" />
            <span className="hidden sm:inline">{language === "vi" ? "Xuất Excel" : "Export Excel"}</span>
          </button>

          {/* Import Products */}
          <button
            type="button"
            onClick={() => {
              setImportFile(null);
              setImportResult(null);
              setIsImportModalOpen(true);
            }}
            title={language === "vi" ? "Nhập dữ liệu Excel" : "Import from Excel"}
            className="border border-brand-border/60 hover:bg-brand-bg/50 text-brand-text font-bold text-sm px-4 py-3 rounded-2xl flex items-center justify-center gap-2 transition duration-200 cursor-pointer"
          >
            <Upload size={18} className="text-brand-muted" />
            <span className="hidden sm:inline">{language === "vi" ? "Nhập Excel" : "Import Excel"}</span>
          </button>

          {/* Add Product Button */}
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="bg-brand-primary hover:bg-brand-primary-hover hover:-translate-y-0.5 text-white font-semibold text-sm px-6 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg shadow-brand-primary/10 transition duration-300 cursor-pointer"
          >
            <Plus size={18} /> {language === "vi" ? "Thêm Sản Phẩm" : "Add Product"}
          </button>
        </div>
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
                  ? (language === "vi" ? "Thêm Sản Phẩm Sản Phẩm Mới" : "Add New Book Product") 
                  : (language === "vi" ? "Cập Nhật Thông Tin Sản Phẩm" : "Update Book Details")}
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

                {/* Product Type Selector */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-brand-muted uppercase tracking-wider block mb-1.5">
                    {language === "vi" ? "Loại sản phẩm *" : "Product Type *"}
                  </label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 text-sm text-brand-text font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="productType"
                        value="simple"
                        checked={productType === "simple"}
                        onChange={() => setProductType("simple")}
                        className="accent-brand-primary w-4 h-4"
                      />
                      {language === "vi" ? "Sản phẩm đơn giản (Simple)" : "Simple Product"}
                    </label>
                    <label className="flex items-center gap-2 text-sm text-brand-text font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="productType"
                        value="variable"
                        checked={productType === "variable"}
                        onChange={() => setProductType("variable")}
                        className="accent-brand-primary w-4 h-4"
                      />
                      {language === "vi" ? "Sản phẩm biến thể (Variable)" : "Variable Product"}
                    </label>
                  </div>
                </div>

                {/* Price (Simple Product only) */}
                {productType === "simple" && (
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
                )}

                {/* Stock Quantity (Simple Product only) */}
                {productType === "simple" && (
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
                )}

                {/* Options Section (Variable Product only) */}
                {productType === "variable" && (
                  <div className="space-y-3 border-t border-brand-border/10 pt-4 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-brand-text">
                        {language === "vi" ? "Thuộc tính sản phẩm" : "Product Options"}
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddOptionGroup}
                        className="text-xs font-bold text-brand-primary hover:text-brand-primary-hover flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={14} /> {language === "vi" ? "Thêm thuộc tính" : "Add Option"}
                      </button>
                    </div>

                    {options.map((opt, optIndex) => (
                      <div key={optIndex} className="bg-brand-bg/35 p-4 rounded-2xl space-y-3 relative border border-brand-border/20">
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionGroup(optIndex)}
                          className="absolute top-3 right-3 text-brand-muted hover:text-status-danger-text cursor-pointer p-1 hover:bg-brand-bg/50 rounded-lg transition"
                        >
                          <X size={16} />
                        </button>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pr-6">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">
                              {language === "vi" ? "Tên thuộc tính (Format, Color...)" : "Option Name (Format, Color...)"}
                            </label>
                            <input
                              type="text"
                              required
                              value={opt.name}
                              onChange={(e) => handleUpdateOptionGroupName(optIndex, e.target.value)}
                              placeholder={language === "vi" ? "Ví dụ: Format" : "e.g. Format"}
                              className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2 text-xs text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">
                              {language === "vi" ? "Các giá trị (Cách nhau bằng dấu phẩy)" : "Option Values (Comma separated)"}
                            </label>
                            <input
                              type="text"
                              required
                              value={opt.values.join(", ")}
                              onChange={(e) => handleUpdateOptionGroupValues(optIndex, e.target.value)}
                              placeholder={language === "vi" ? "Ví dụ: Hardcover, Paperback" : "e.g. Hardcover, Paperback"}
                              className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2 text-xs text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Variants Section (Variable Product only) */}
                {productType === "variable" && (
                  <div className="space-y-3 border-t border-brand-border/10 pt-4 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-brand-text">
                        {language === "vi" ? "Danh sách Biến thể" : "Product Variants"}
                      </h4>
                      <button
                        type="button"
                        onClick={handleGenerateVariants}
                        className="text-xs font-bold bg-brand-primary-light/20 text-brand-primary hover:bg-brand-primary-light/35 px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition"
                      >
                        {language === "vi" ? "Tạo biến thể" : "Generate Variants"}
                      </button>
                    </div>

                    {variants.length > 0 ? (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {variants.map((v, vIndex) => (
                          <div key={vIndex} className="bg-brand-bg/15 p-4 rounded-2xl border border-brand-border/10 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-brand-text">
                                {language === "vi" ? `Biến thể: ${v.name}` : `Variant: ${v.name}`}
                              </span>
                              <label className="flex items-center gap-1.5 text-xs text-brand-muted font-bold cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={v.isActive !== false}
                                  onChange={(e) => handleUpdateVariantField(vIndex, "isActive", e.target.checked)}
                                  className="accent-brand-primary w-3.5 h-3.5"
                                />
                                {language === "vi" ? "Đang bán" : "Active"}
                              </label>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-brand-muted uppercase tracking-wider">SKU</label>
                                <input
                                  type="text"
                                  required
                                  value={v.sku || ""}
                                  onChange={(e) => handleUpdateVariantField(vIndex, "sku", e.target.value)}
                                  className="w-full rounded-lg border border-brand-border/30 bg-brand-bg px-2 py-1.5 text-xs text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-brand-muted uppercase tracking-wider">
                                  {language === "vi" ? "Giá bán" : "Price"}
                                </label>
                                <input
                                  type="number"
                                  required
                                  min="0"
                                  value={v.price}
                                  onChange={(e) => handleUpdateVariantField(vIndex, "price", parseFloat(e.target.value) || 0)}
                                  className="w-full rounded-lg border border-brand-border/30 bg-brand-bg px-2 py-1.5 text-xs text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-brand-muted uppercase tracking-wider">
                                  {language === "vi" ? "Tồn kho" : "Stock"}
                                </label>
                                <input
                                  type="number"
                                  required
                                  min="0"
                                  value={v.stock}
                                  onChange={(e) => handleUpdateVariantField(vIndex, "stock", parseInt(e.target.value) || 0)}
                                  className="w-full rounded-lg border border-brand-border/30 bg-brand-bg px-2 py-1.5 text-xs text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-brand-muted uppercase tracking-wider">
                                  {language === "vi" ? "Link ảnh" : "Image URL"}
                                </label>
                                <input
                                  type="text"
                                  value={v.image || ""}
                                  onChange={(e) => handleUpdateVariantField(vIndex, "image", e.target.value)}
                                  placeholder="https://..."
                                  className="w-full rounded-lg border border-brand-border/30 bg-brand-bg px-2 py-1.5 text-xs text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-brand-muted italic py-3 text-center bg-brand-bg/10 rounded-xl">
                        {language === "vi" ? "Chưa có biến thể nào. Thêm thuộc tính phía trên rồi ấn Tạo biến thể." : "No variants generated yet. Add options above and click Generate."}
                      </div>
                    )}
                  </div>
                )}
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

      {/* EXCEL IMPORT MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-fadeIn">
          <div className="bg-brand-surface rounded-3xl border border-brand-border shadow-2xl ring-1 ring-brand-border/20 w-full max-w-xl overflow-hidden animate-scaleIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border/40 bg-brand-primary-light/10">
              <h3 className="font-extrabold text-brand-text text-base">
                {language === "vi" ? "Nhập dữ liệu từ Excel" : "Import from Excel"}
              </h3>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-brand-primary-light/20 text-brand-muted hover:text-brand-primary transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleImportSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Mode & Dry Run Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">
                    {language === "vi" ? "Chế độ nhập *" : "Import Mode *"}
                  </label>
                  <select
                    value={importMode}
                    onChange={(e: any) => setImportMode(e.target.value)}
                    className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition font-semibold"
                  >
                    <option value="upsert">{language === "vi" ? "Thêm mới & Cập nhật" : "Upsert (Create/Update)"}</option>
                    <option value="create">{language === "vi" ? "Chỉ thêm mới" : "Create Only"}</option>
                    <option value="update">{language === "vi" ? "Chỉ cập nhật" : "Update Only"}</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-sm text-brand-text font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dryRun}
                      onChange={(e) => setDryRun(e.target.checked)}
                      className="accent-brand-primary w-4.5 h-4.5 rounded"
                    />
                    <div>
                      <span className="block">{language === "vi" ? "Chạy thử (Dry Run)" : "Dry Run"}</span>
                      <span className="text-[10px] text-brand-muted font-medium block">
                        {language === "vi" ? "Chỉ kiểm tra, không lưu DB" : "Validate only, no DB save"}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('excel-file-picker')?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition duration-300 flex flex-col items-center justify-center gap-3 ${
                  dragActive
                    ? 'border-brand-primary bg-brand-primary-light/10'
                    : 'border-brand-border/60 bg-brand-bg/25 hover:bg-brand-bg/50 hover:border-brand-primary/60'
                }`}
              >
                <input
                  id="excel-file-picker"
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setImportFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <FileSpreadsheet className="w-12 h-12 text-brand-muted/80" />
                <div>
                  <p className="font-bold text-sm text-brand-text">
                    {importFile
                      ? importFile.name
                      : (language === "vi" ? "Kéo thả file Excel vào đây hoặc click để chọn" : "Drag & drop Excel file here or click to browse")}
                  </p>
                  <p className="text-xs text-brand-muted mt-1 font-semibold">
                    {importFile
                      ? `${(importFile.size / 1024).toFixed(1)} KB`
                      : (language === "vi" ? "Hỗ trợ định dạng .xlsx, .xls" : "Supports .xlsx, .xls formats")}
                  </p>
                </div>
              </div>

              {/* Import Results / Errors Report */}
              {importResult && (
                <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
                  importResult.success
                    ? 'bg-status-success-bg/30 text-status-success-text border-status-success-border/50'
                    : 'bg-status-danger-bg/20 text-status-danger-text border-status-danger-border/30'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span>{importResult.success ? (language === "vi" ? "KẾT QUẢ IMPORT THÀNH CÔNG" : "IMPORT SUCCESSFUL") : (language === "vi" ? "IMPORT THẤT BẠI / LỖI DỮ LIỆU" : "IMPORT FAILED / VALIDATION ERRORS")}</span>
                    {dryRun && (
                      <span className="bg-brand-primary/20 text-brand-primary px-2 py-0.5 rounded-lg text-[10px]">DRY RUN</span>
                    )}
                  </div>
                  {importResult.success ? (
                    <div className="space-y-1 font-semibold">
                      <p>• {language === "vi" ? `Đã tạo mới: ${importResult.created} sản phẩm` : `Created: ${importResult.created} products`}</p>
                      <p>• {language === "vi" ? `Đã cập nhật: ${importResult.updated} sản phẩm/biến thể` : `Updated: ${importResult.updated} products/variants`}</p>
                      {dryRun && (
                        <p className="text-brand-primary text-[10px] mt-2 italic font-bold">
                          {language === "vi" ? "* Đây là chạy thử. Không có thay đổi nào được ghi vào cơ sở dữ liệu." : "* This was a dry run. No changes were saved to the database."}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-bold">{language === "vi" ? `Phát hiện ${importResult.errors.length} lỗi trong file:` : `Found ${importResult.errors.length} errors in the file:`}</p>
                      <div className="max-h-[150px] overflow-y-auto space-y-1.5 pr-2 font-medium">
                        {importResult.errors.map((err: any, idx: number) => (
                          <div key={idx} className="flex gap-2">
                            <span className="font-bold text-status-danger-text shrink-0">
                              {err.row > 0 ? (language === "vi" ? `Dòng ${err.row}:` : `Row ${err.row}:`) : ''}
                            </span>
                            <span>{err.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Modal Footer Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-brand-border/10">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  disabled={importLoading}
                  className="px-5 py-2.5 rounded-xl border border-brand-border hover:bg-brand-bg text-sm font-semibold text-brand-muted transition cursor-pointer"
                >
                  {language === "vi" ? "Đóng" : "Close"}
                </button>
                <button
                  type="submit"
                  disabled={importLoading || !importFile}
                  className="px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover disabled:bg-brand-primary-light text-white text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {importLoading && <Loader2 size={16} className="animate-spin" />}
                  {dryRun
                    ? (language === "vi" ? "Kiểm tra file" : "Validate File")
                    : (language === "vi" ? "Bắt đầu Import" : "Start Import")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdminConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmConfig?.onConfirm || (() => {})}
        title={confirmConfig?.title || ""}
        message={confirmConfig?.message || ""}
        type={confirmConfig?.type}
      />
    </div>
  );
}
