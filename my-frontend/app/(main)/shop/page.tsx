"use client";

import Image from "next/image";
import { useState } from "react";

/* TYPE */
type Product = {
  id: number;
  name: string;
  price: number;
  rating: number;
  category: string;
  stock: boolean;
  img: string;
};

/* DATA */
const productsData: Product[] = [
  {
    id: 1,
    name: "Simple Things You Save BOOK",
    price: 30,
    rating: 5,
    category: "book",
    stock: true,
    img: "/img/book1.png",
  },
  {
    id: 2,
    name: "How Deal With Very Bad BOOK",
    price: 39,
    rating: 4,
    category: "book",
    stock: true,
    img: "/img/book2.png",
  },
  {
    id: 3,
    name: "The Hidden Mystery Behind",
    price: 50,
    rating: 3,
    category: "story",
    stock: true,
    img: "/img/book3.png",
  },
  {
    id: 4,
    name: "Flovely And Unicom Erna",
    price: 19,
    rating: 2,
    category: "kids",
    stock: false,
    img: "/img/book4.png",
  },
];

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
  const [search, setSearch] = useState<string>("");
  const [inStock, setInStock] = useState<boolean>(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [price, setPrice] = useState<[number, number]>([0, 100]);
  const [sort, setSort] = useState<string>("default");
  const [ratingFilter, setRatingFilter] = useState<number>(0);

  const toggleCategory = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  let filtered = productsData.filter((item) => {
    return (
      item.name.toLowerCase().includes(search.toLowerCase()) &&
      (inStock ? item.stock : true) &&
      (categories.length ? categories.includes(item.category) : true) &&
      item.price >= price[0] &&
      item.price <= price[1] &&
      (ratingFilter ? item.rating >= ratingFilter : true)
    );
  });

  if (sort === "price-asc") filtered.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") filtered.sort((a, b) => b.price - a.price);

  const renderStars = (num: number) => "⭐".repeat(num);

  return (
    <div className="w-full">
      {/* BANNER */}
      <div className="bg-gradient-to-r from-yellow-600 to-white py-20 text-center">
        <h1 className="text-4xl font-bold text-gray-800">Shop Default</h1>
        <p className="text-gray-500 mt-2">Home &gt; Shop Default</p>
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
          <div className="pb-5 border-b border-gray-300">
            <SidebarTitle>Categories</SidebarTitle>
            <div className="space-y-2">
              {["book", "story", "kids"].map((cat) => (
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
              max={100}
              value={price[1]}
              onChange={(e) => setPrice([0, Number(e.target.value)])}
              className="w-full accent-yellow-600"
            />
            <p className="text-sm mt-2 text-gray-500">
              ${price[0]} - ${price[1]}
            </p>
          </div>

          {/* REVIEW */}
          <div>
            <SidebarTitle>By Review</SidebarTitle>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => (
                <label key={star} className="flex gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="rating"
                    onChange={() => setRatingFilter(star)}
                    className="accent-yellow-600"
                  />
                  <span className="text-yellow-500">{renderStars(star)}</span>
                  <span className="text-gray-500 text-sm">& up</span>
                </label>
              ))}
            </div>

            <button
              onClick={() => setRatingFilter(0)}
              className="text-sm text-gray-400 mt-3 hover:text-yellow-600">
              Clear filter
            </button>
          </div>
        </div>

        {/* PRODUCTS */}
        <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-6 border border-gray-300 p-4 rounded-md">
            <p className="text-gray-500">Showing {filtered.length} products</p>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded outline-none focus:border-yellow-500">
              <option value="default">Default</option>
              <option value="price-asc">Price ↑</option>
              <option value="price-desc">Price ↓</option>
            </select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-[#f5eaea] border border-gray-300 p-4 rounded-lg text-center hover:-translate-y-1 hover:shadow-md transition duration-300">
                <Image
                  src={item.img}
                  alt={item.name}
                  width={150}
                  height={200}
                  className="mx-auto"
                />

                <h3 className="mt-3 font-medium">{item.name}</h3>

                <p className="text-yellow-500 text-sm">
                  {renderStars(item.rating)}
                </p>

                <p className="text-yellow-600 font-semibold">${item.price}</p>

                <button className="mt-3 w-full relative overflow-hidden bg-[#eba07a] text-white py-2 rounded-full group">
                  <span className="absolute inset-0 bg-yellow-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></span>
                  <span className="relative z-10">Add To Cart</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
