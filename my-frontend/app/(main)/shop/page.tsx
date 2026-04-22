"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { productAPI, type Product } from "@/lib/api";

/* TITLE */
const SidebarTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4">
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 bg-yellow-600 rounded-full"></span>
      <h3 className="font-semibold text-gray-800">{children}</h3>
    </div>
    <div className="h-[3px] w-12 mt-2 bg-gradient-to-r from-yellow-600 to-transparent rounded-full"></div>
  </div>
);

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const [inStock, setInStock] = useState<boolean>(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [price, setPrice] = useState<[number, number]>([0, 1000]);
  const [sort, setSort] = useState<string>("default");
  const [ratingFilter, setRatingFilter] = useState<number>(0);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productAPI.getAll();
        setProducts(data);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load products",
        );
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const toggleCategory = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  // Get unique categories from products
  const uniqueCategories = [
    ...new Set(products.map((p) => p.category?.name).filter(Boolean)),
  ];

  let filtered = products.filter((item) => {
    return (
      item.name.toLowerCase().includes(search.toLowerCase()) &&
      (inStock ? item.stock > 0 : true) &&
      (categories.length
        ? categories.includes(item.category?.name || "")
        : true) &&
      item.price >= price[0] &&
      item.price <= price[1]
    );
  });

  if (sort === "price-asc") filtered.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") filtered.sort((a, b) => b.price - a.price);

  const renderStars = (num: number) => "⭐".repeat(Math.min(num, 5));

  return (
    <div className="w-full">
      {/* BANNER */}
      <div className="bg-gradient-to-r from-yellow-600 to-white py-20 text-center">
        <h1 className="text-4xl font-bold text-gray-800">Shop</h1>
        <p className="text-gray-500 mt-2">Home &gt; Shop</p>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* SIDEBAR */}
        <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-300 h-fit sticky top-10">
          {/* SEARCH */}
          <div className="pb-5 border-b border-gray-300">
            <SidebarTitle>Search</SidebarTitle>
            <input
              placeholder="Search here"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 px-4 py-2 rounded-md outline-none focus:border-yellow-500"
            />
          </div>

          {/* CATEGORY */}
          {uniqueCategories.length > 0 && (
            <div className="pb-5 border-b border-gray-300">
              <SidebarTitle>Categories</SidebarTitle>
              <div className="space-y-2">
                {uniqueCategories.map((cat) => (
                  <label key={cat} className="flex gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      onChange={() => toggleCategory(cat)}
                      className="accent-yellow-600"
                    />
                    {cat}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STOCK */}
          <div className="pb-5 border-b border-gray-300">
            <SidebarTitle>Product Status</SidebarTitle>
            <label className="flex gap-2">
              <input
                type="checkbox"
                checked={inStock}
                onChange={() => setInStock(!inStock)}
                className="accent-yellow-600"
              />
              In Stock Only
            </label>
          </div>

          {/* PRICE */}
          <div className="pb-5 border-b border-gray-300">
            <SidebarTitle>Filter By Price</SidebarTitle>
            <input
              type="range"
              min={0}
              max={1000}
              value={price[1]}
              onChange={(e) => setPrice([0, Number(e.target.value)])}
              className="w-full accent-yellow-600"
            />
            <p className="text-sm mt-2 text-gray-500">
              ${price[0]} - ${price[1]}
            </p>
          </div>
        </div>

        {/* PRODUCTS */}
        <div className="lg:col-span-3">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
                <p className="mt-4 text-gray-500">Loading products...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6 border border-gray-300 p-4 rounded-md">
                <p className="text-gray-500">
                  Showing {filtered.length} products
                </p>

                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="border border-gray-300 px-3 py-2 rounded outline-none focus:border-yellow-500">
                  <option value="default">Default</option>
                  <option value="price-asc">Price ↑</option>
                  <option value="price-desc">Price ↓</option>
                </select>
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">
                    No products found matching your filters
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {filtered.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#f5eaea] border border-gray-300 p-4 rounded-lg text-center hover:-translate-y-1 hover:shadow-md transition duration-300">
                      <div className="relative w-full h-48 bg-gray-200 rounded flex items-center justify-center mb-3">
                        <p className="text-gray-400">No Image</p>
                      </div>

                      <h3 className="mt-3 font-medium line-clamp-2">
                        {item.name}
                      </h3>

                      <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                        {item.description}
                      </p>

                      <p className="text-yellow-600 font-semibold mt-2">
                        ${item.price.toFixed(2)}
                      </p>

                      <p className="text-sm text-gray-500 mt-1">
                        {item.category?.name || "N/A"}
                      </p>

                      <p className="text-sm text-gray-500 mt-1">
                        {item.stock > 0 ? (
                          <span className="text-green-600">
                            In Stock ({item.stock})
                          </span>
                        ) : (
                          <span className="text-red-600">Out of Stock</span>
                        )}
                      </p>

                      <button
                        disabled={item.stock <= 0}
                        className="mt-3 w-full relative overflow-hidden bg-[#eba07a] text-white py-2 rounded-full group disabled:opacity-50 disabled:cursor-not-allowed">
                        <span className="absolute inset-0 bg-yellow-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></span>
                        <span className="relative z-10">Add To Cart</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
