"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { productAPI, type Product } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";
import ProductCard from "@/components/ProductCard";

const SidebarTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4">
    <div className="flex items-center gap-2">
      <span className="h-2 w-2 rounded-full bg-yellow-600"></span>
      <h3 className="font-semibold text-gray-800">{children}</h3>
    </div>
    <div className="mt-2 h-[3px] w-12 rounded-full bg-gradient-to-r from-yellow-600 to-transparent"></div>
  </div>
);

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [inStock, setInStock] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [priceInitialized, setPriceInitialized] = useState(false);
  const [sort, setSort] = useState("default");
  const searchParams = useSearchParams();
  const { t, formatPrice, translateCategory } = usePreferences();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productAPI.getAll();
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
  }, [t]);

  useEffect(() => {
    const query = searchParams.get("search") ?? "";
    const category = searchParams.get("category");
    setSearch(query);
    setCategories(category ? [category] : []);
  }, [searchParams]);

  const priceBounds = useMemo<[number, number]>(() => {
    if (!products.length) {
      return [0, 0];
    }
    const prices = products
      .map((item) => item.price)
      .filter((value) => Number.isFinite(value));
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return [min, max];
  }, [products]);

  useEffect(() => {
    if (!products.length) return;
    if (!priceInitialized) {
      setPriceRange(priceBounds);
      setPriceInitialized(true);
      return;
    }

    setPriceRange(([min, max]) => [
      Math.min(Math.max(min, priceBounds[0]), priceBounds[1]),
      Math.min(Math.max(max, priceBounds[0]), priceBounds[1]),
    ]);
  }, [priceBounds, priceInitialized, products.length]);

  const uniqueCategories = useMemo(
    () =>
      [
        ...new Set(products.map((p) => p.category?.name).filter(Boolean)),
      ] as string[],
    [products],
  );

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return products.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        (item.description ?? "").toLowerCase().includes(normalizedSearch);

      const matchesCategory =
        categories.length === 0 ||
        categories.includes(item.category?.name ?? "");

      const matchesStock = !inStock || item.stock > 0;

      const matchesPrice =
        !priceInitialized ||
        (item.price >= priceRange[0] && item.price <= priceRange[1]);

      return matchesSearch && matchesCategory && matchesStock && matchesPrice;
    });
  }, [categories, inStock, priceInitialized, priceRange, products, search]);

  const sortedProducts = useMemo(() => {
    const items = [...filteredProducts];
    if (sort === "price-asc") {
      items.sort((a, b) => a.price - b.price);
    }
    if (sort === "price-desc") {
      items.sort((a, b) => b.price - a.price);
    }
    return items;
  }, [filteredProducts, sort]);

  const toggleCategory = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const handleMinPriceChange = (value: number) => {
    const nextMin = Math.min(value, priceRange[1]);
    setPriceRange([nextMin, priceRange[1]]);
  };

  const handleMaxPriceChange = (value: number) => {
    const nextMax = Math.max(value, priceRange[0]);
    setPriceRange([priceRange[0], nextMax]);
  };

  const hasActiveFilters =
    search.trim().length > 0 ||
    categories.length > 0 ||
    inStock ||
    sort !== "default" ||
    (priceInitialized &&
      (priceRange[0] !== priceBounds[0] || priceRange[1] !== priceBounds[1]));

  const clearFilters = () => {
    setSearch("");
    setCategories([]);
    setInStock(false);
    setSort("default");
    if (products.length) {
      setPriceRange(priceBounds);
      setPriceInitialized(true);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-gradient-to-r from-yellow-600/90 via-yellow-100 to-white py-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-yellow-700">
            {t("label.shop")}
          </p>
          <h1 className="text-4xl font-bold text-gray-900">
            {t("nav.shop")}
          </h1>
          <p className="text-sm text-gray-600">
            {t("label.home")} / {t("label.shop")}
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-16 lg:grid-cols-4">
        <aside className="h-fit space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:sticky lg:top-10">
          <div className="flex items-center justify-between">
            <SidebarTitle>{t("label.filters")}</SidebarTitle>
            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="text-xs font-semibold text-gray-500 transition hover:text-yellow-600 disabled:cursor-not-allowed disabled:text-gray-300">
              {t("label.clearFilters")}
            </button>
          </div>

          <div className="space-y-6">
            <div className="pb-6 border-b border-gray-200">
              <SidebarTitle>{t("label.search")}</SidebarTitle>
              <input
                placeholder={t("label.searchHere")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-yellow-500"
              />
            </div>

            {uniqueCategories.length > 0 && (
              <div className="pb-6 border-b border-gray-200">
                <SidebarTitle>{t("label.categories")}</SidebarTitle>
                <button
                  type="button"
                  onClick={() => setCategories([])}
                  className="mb-3 text-xs font-semibold text-gray-500 hover:text-yellow-600">
                  {t("label.allCategories")}
                </button>
                <div className="space-y-2">
                  {uniqueCategories.map((cat) => (
                    <label key={cat} className="flex gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={categories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                        className="accent-yellow-600"
                      />
                      {translateCategory(cat)}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="pb-6 border-b border-gray-200">
              <SidebarTitle>{t("label.filterByPrice")}</SidebarTitle>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-gray-500">
                  {t("label.min")}
                  <input
                    type="number"
                    min={priceBounds[0]}
                    max={priceRange[1]}
                    value={priceRange[0]}
                    onChange={(e) =>
                      handleMinPriceChange(Number(e.target.value))
                    }
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-yellow-500"
                  />
                </label>
                <label className="text-xs text-gray-500">
                  {t("label.max")}
                  <input
                    type="number"
                    min={priceRange[0]}
                    max={priceBounds[1]}
                    value={priceRange[1]}
                    onChange={(e) =>
                      handleMaxPriceChange(Number(e.target.value))
                    }
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-yellow-500"
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
                  className="w-full accent-yellow-600"
                />
                <input
                  type="range"
                  min={priceBounds[0]}
                  max={priceBounds[1]}
                  value={priceRange[1]}
                  onChange={(e) =>
                    handleMaxPriceChange(Number(e.target.value))
                  }
                  className="w-full accent-yellow-600"
                />
                <p className="text-xs text-gray-500">
                  {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                </p>
              </div>
            </div>

            <div className="pb-6 border-b border-gray-200">
              <SidebarTitle>{t("label.productStatus")}</SidebarTitle>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={() => setInStock(!inStock)}
                  className="accent-yellow-600"
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
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-yellow-600"></div>
                <p className="mt-4 text-gray-500">{t("label.loadingProducts")}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-600">
                  {t("label.showingCount", { count: sortedProducts.length })}
                </p>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">
                    {t("label.sort")}
                  </span>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="rounded-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-yellow-500">
                    <option value="default">{t("label.sortDefault")}</option>
                    <option value="price-asc">{t("label.sortPriceAsc")}</option>
                    <option value="price-desc">{t("label.sortPriceDesc")}</option>
                  </select>
                </div>
              </div>

              {sortedProducts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
                  <p className="text-gray-500">{t("label.noProductsFound")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {sortedProducts.map((item) => (
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
