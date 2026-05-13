"use client";

import Image from "next/image";
import Link from "next/link";

const products = [
  {
    id: 1,
    name: "Nike Air Max",
    price: 120,
    image: "/products/shoe1.jpg",
  },
  {
    id: 2,
    name: "iPhone 15",
    price: 999,
    image: "/products/phone1.jpg",
  },
  {
    id: 3,
    name: "MacBook Pro",
    price: 1999,
    image: "/products/laptop1.jpg",
  },
];

export default function NewArrivalsPage() {
  return (
    <div className="px-10 py-12">
      <h1 className="text-4xl font-bold mb-10">New Arrivals</h1>

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

              <p className="text-yellow-600 font-bold mt-2">${product.price}</p>

              <Link
                href={`/product/${product.id}`}
                className="inline-block mt-4 bg-yellow-600 text-white px-5 py-2 rounded-full hover:bg-yellow-700 transition">
                View Product
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
