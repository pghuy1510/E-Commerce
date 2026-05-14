"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { productAPI, type Product } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";

export default function NewArrivalsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { formatPrice } = usePreferences();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await productAPI.getNewArrivals(12);
        setProducts(data);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load new arrivals.",
        );
        console.error("New arrivals error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="px-10 py-12">
      <h1 className="text-4xl font-bold mb-10">New Arrivals</h1>

      {error && (
        <div className="mb-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-red-600">
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
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No new arrivals found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              className="border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition">
              <Image
                src={product.image || "/placeholder.png"}
                alt={product.name}
                width={400}
                height={300}
                className="w-full h-[260px] object-cover"
              />

              <div className="p-5">
                <h2 className="text-lg font-semibold">{product.name}</h2>

                <p className="text-yellow-600 font-bold mt-2">
                  {formatPrice(product.price)}
                </p>

                <Link
                  href={`/product/${product.id}`}
                  className="inline-block mt-4 bg-yellow-600 text-white px-5 py-2 rounded-full hover:bg-yellow-700 transition">
                  View Product
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
