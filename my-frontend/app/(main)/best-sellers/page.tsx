"use client";

import Image from "next/image";

const products = [
  {
    id: 1,
    name: "Adidas Ultraboost",
    sold: 320,
    image: "/products/shoe2.jpg",
  },
  {
    id: 2,
    name: "Samsung S23",
    sold: 210,
    image: "/products/phone2.jpg",
  },
  {
    id: 3,
    name: "Keychron K6",
    sold: 180,
    image: "/products/keyboard1.jpg",
  },
];

export default function BestSellersPage() {
  return (
    <div className="px-10 py-12">
      <h1 className="text-4xl font-bold mb-10">Best Sellers</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {products.map((product) => (
          <div
            key={product.id}
            className="border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition">
            <Image
              src={product.image}
              alt={product.name}
              width={400}
              height={300}
              className="w-full h-[260px] object-cover"
            />

            <div className="p-5">
              <h2 className="text-lg font-semibold">{product.name}</h2>

              <p className="text-yellow-600 font-medium mt-2">
                Sold: {product.sold}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
