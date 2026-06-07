"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { productAPI, categoryAPI, type Product } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";
import ProductCard from "@/components/ProductCard";
import PageHero from "@/components/layout/PageHero";
import { Star } from "lucide-react";

const SidebarTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4">
    <div className="flex items-center gap-2">
      <span className="h-2 w-2 rounded-full bg-brand-primary"></span>
      <h3 className="font-semibold text-brand-text">{children}</h3>
    </div>
    <div className="mt-2 h-[3px] w-12 rounded-full bg-brand-primary"></div>
  </div>
);

function ShopContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [inStock, setInStock] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000000]);
  const [priceInitialized, setPriceInitialized] = useState(false);
  const [sort, setSort] = useState("default");
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [collection, setCollection] = useState<string | null>(null);
  
  const [dbCategories, setDbCategories] = useState<any[]>([]);

  const searchParams = useSearchParams();
  const { t, formatPrice, translateCategory } = usePreferences();

  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [debouncedPriceRange, setDebouncedPriceRange] = useState(priceRange);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPriceRange(priceRange);
    }, 400);
    return () => clearTimeout(timer);
  }, [priceRange]);

  // Load categories list from DB on mount
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const data = await categoryAPI.getAll();
        setDbCategories(data);
      } catch (err) {
        console.error("Lỗi khi tải danh mục:", err);
      }
    };
    fetchCats();
  }, []);

  // Fetch filtered products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const params: any = {
          search: debouncedSearch.trim() || undefined,
          category: categories.length > 0 ? categories[0] : undefined,
          minPrice: priceInitialized ? debouncedPriceRange[0] : undefined,
          maxPrice: priceInitialized ? debouncedPriceRange[1] : undefined,
          inStock: inStock || undefined,
          sortBy: sort !== "default" ? sort : undefined,
          rating: rating || undefined,
        };
        let data = await productAPI.getAll(params);

        // Apply frontend collection filtering/sorting
        if (collection) {
          if (collection === "editors-picks") {
            data = data.slice().sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
          } else if (collection === "favorites") {
            data = data.slice().sort((a: any, b: any) => (b.sold || 0) - (a.sold || 0));
          } else if (collection === "premium") {
            data = data.slice().sort((a: any, b: any) => (b.price || 0) - (a.price || 0));
          } else if (collection === "gifts") {
            data = data.filter((p: any) => (p.rating || 0) >= 4.0);
          } else if (collection === "seasonal") {
            data = data.filter((p: any) => (p.rating || 0) >= 4.0).sort((a: any, b: any) => (b.sold || 0) - (a.sold || 0));
          }
        }

        setProducts(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("shop.loadError"));
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [
    debouncedSearch,
    categories,
    debouncedPriceRange,
    priceInitialized,
    inStock,
    sort,
    rating,
    collection,
    t,
  ]);

  useEffect(() => {
    const query = searchParams.get("search") ?? "";
    const category = searchParams.get("category");
    const sortParam = searchParams.get("sort") ?? "default";
    const collectionParam = searchParams.get("collection");
    setSearch(query);
    setCategories(category ? [category] : []);
    setSort(sortParam);
    setCollection(collectionParam);
  }, [searchParams]);

  const priceBounds = useMemo<[number, number]>(() => {
    return [0, 2000000];
  }, []);

  const uniqueCategories = useMemo(
    () => dbCategories.map((c) => c.name),
    [dbCategories],
  );

  const toggleCategory = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [cat],
    );
  };

  const handleMinPriceChange = (value: number) => {
    const nextMin = Math.min(value, priceRange[1]);
    setPriceRange([nextMin, priceRange[1]]);
    setPriceInitialized(true);
  };

  const handleMaxPriceChange = (value: number) => {
    const nextMax = Math.max(value, priceRange[0]);
    setPriceRange([priceRange[0], nextMax]);
    setPriceInitialized(true);
  };

  const hasActiveFilters =
    search.trim().length > 0 ||
    categories.length > 0 ||
    inStock ||
    sort !== "default" ||
    rating !== undefined ||
    priceInitialized ||
    !!collection;

  const clearFilters = () => {
    setSearch("");
    setCategories([]);
    setInStock(false);
    setSort("default");
    setRating(undefined);
    setPriceRange([0, 2000000]);
    setPriceInitialized(false);
    setCollection(null);
  };

  return (
    <div className="w-full">
      <PageHero
        variant="catalog"
        title={t("nav.shop")}
        eyebrow={t("label.shop")}
        breadcrumbs={[{ label: t("label.shop") }]}
        centered={false}
      />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-16 lg:grid-cols-4">
        <aside className="h-fit space-y-6 rounded-2xl border border-brand-primary-light bg-brand-surface p-6 shadow-sm lg:sticky lg:top-10">
          <div className="flex items-center justify-between">
            <SidebarTitle>{t("label.filters")}</SidebarTitle>
            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="text-xs font-semibold text-brand-muted transition hover:text-brand-primary disabled:cursor-not-allowed disabled:text-gray-300">
              {t("label.clearFilters")}
            </button>
          </div>

          <div className="space-y-6">
            {/* SEARCH */}
            <div className="pb-6 border-b border-brand-primary-light">
              <SidebarTitle>{t("label.search")}</SidebarTitle>
              <input
                placeholder={t("label.searchHere")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-full border border-brand-primary-light px-4 py-2 text-sm outline-none focus:border-brand-primary bg-white text-brand-text"
              />
            </div>

            {/* CATEGORIES */}
            {uniqueCategories.length > 0 && (
              <div className="pb-6 border-b border-brand-primary-light">
                <SidebarTitle>{t("label.categories")}</SidebarTitle>
                <button
                  type="button"
                  onClick={() => setCategories([])}
                  className="mb-3 text-xs font-semibold text-brand-muted hover:text-brand-primary">
                  {t("label.allCategories")}
                </button>
                <div className="space-y-2">
                  {uniqueCategories.map((cat) => (
                    <label key={cat} className="flex gap-2 text-sm cursor-pointer select-none text-brand-text font-medium">
                      <input
                        type="checkbox"
                        checked={categories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                        className="accent-brand-primary"
                      />
                      {translateCategory(cat)}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* PRICE FILTER */}
            <div className="pb-6 border-b border-brand-primary-light">
              <SidebarTitle>{t("label.filterByPrice")}</SidebarTitle>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-brand-muted">
                  {t("label.min")}
                  <input
                    type="number"
                    min={priceBounds[0]}
                    max={priceRange[1]}
                    value={priceRange[0]}
                    onChange={(e) =>
                      handleMinPriceChange(Number(e.target.value))
                    }
                    className="mt-2 w-full rounded-lg border border-brand-primary-light px-3 py-2 text-sm outline-none focus:border-brand-primary bg-white text-brand-text"
                  />
                </label>
                <label className="text-xs text-brand-muted">
                  {t("label.max")}
                  <input
                    type="number"
                    min={priceRange[0]}
                    max={priceBounds[1]}
                    value={priceRange[1]}
                    onChange={(e) =>
                      handleMaxPriceChange(Number(e.target.value))
                    }
                    className="mt-2 w-full rounded-lg border border-brand-primary-light px-3 py-2 text-sm outline-none focus:border-brand-primary bg-white text-brand-text"
                  />
                </label>
              </div>

              <div className="mt-4 space-y-3">
                <input
                  type="range"
                  min={priceBounds[0]}
                  max={priceBounds[1]}
                  value={priceRange[0]}
                  onChange={(e) =>
                    handleMinPriceChange(Number(e.target.value))
                  }
                  className="w-full accent-brand-primary"
                />
                <input
                  type="range"
                  min={priceBounds[0]}
                  max={priceBounds[1]}
                  value={priceRange[1]}
                  onChange={(e) =>
                    handleMaxPriceChange(Number(e.target.value))
                  }
                  className="w-full accent-brand-primary"
                />
                <p className="text-xs text-brand-muted font-semibold mt-1">
                  {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                </p>
              </div>
            </div>

            {/* RATINGS FILTER */}
            <div className="pb-6 border-b border-brand-primary-light">
              <SidebarTitle>Đánh giá khách hàng</SidebarTitle>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <label key={stars} className="flex items-center gap-2 text-sm cursor-pointer select-none text-brand-text font-medium">
                    <input
                      type="radio"
                      name="rating"
                      checked={rating === stars}
                      onChange={() => setRating(stars)}
                      className="accent-brand-primary"
                    />
                    <span className="flex items-center gap-0.5 text-brand-secondary">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          fill={i < stars ? "currentColor" : "none"}
                          className={i < stars ? "text-brand-secondary" : "text-brand-primary-light"}
                        />
                      ))}
                    </span>
                    <span className="text-xs text-brand-muted font-medium">trở lên</span>
                  </label>
                ))}
              </div>
            </div>

            {/* STOCK STATUS */}
            <div className="pb-6">
              <SidebarTitle>{t("label.productStatus")}</SidebarTitle>
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none text-brand-text font-medium">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={() => setInStock(!inStock)}
                  className="accent-brand-primary"
                />
                {t("label.inStockOnly")}
              </label>
            </div>
          </div>
        </aside>

        <section className="lg:col-span-3">
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-brand-primary"></div>
                <p className="mt-4 text-brand-muted">{t("label.loadingProducts")}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-brand-primary-light bg-brand-surface px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-brand-text font-semibold">
                  {t("label.showingCount", { count: products.length })}
                </p>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-brand-muted font-medium">
                    {t("label.sort")}
                  </span>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="rounded-full border border-brand-primary-light px-4 py-2 text-sm outline-none focus:border-brand-primary font-medium bg-white text-brand-text">
                    <option value="default">{t("label.sortDefault")}</option>
                    <option value="newest">{t("nav.newArrivals")}</option>
                    <option value="price-asc">{t("label.sortPriceAsc")}</option>
                    <option value="price-desc">{t("label.sortPriceDesc")}</option>
                    <option value="best-selling">{t("nav.bestSellers")}</option>
                    <option value="top-rated">{t("nav.topRated")}</option>
                    <option value="trending">{t("nav.trending")}</option>
                    <option value="limited-edition">{t("nav.limitedEdition")}</option>
                  </select>
                </div>
              </div>

              {products.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center shadow-sm">
                  <p className="text-gray-500 font-medium">{t("label.noProductsFound")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {products.map((item) => (
                    <ProductCard key={item.id} product={item} />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full bg-gray-50 min-h-screen">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <p className="text-sm text-gray-500">Loading products...</p>
          </div>
        </div>
      }>
      <ShopContent />
    </Suspense>
  );
}
