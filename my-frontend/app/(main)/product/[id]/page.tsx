"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { Star, Heart, Minus, Plus, ShoppingCart, Eye } from "lucide-react";

import { productAPI, type Product, wishlistAPI, cartAPI } from "@/lib/api";

export default function ProductDetailPage() {
  const params = useParams();
  const idParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  const userId = 1;

  useEffect(() => {
    if (!idParam) {
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setProduct(null);
        setRelatedProducts([]);

        const data = await productAPI.getById(Number(idParam));
        setProduct(data);

        const allProducts = await productAPI.getAll();
        const related = allProducts
          .filter(
            (item: Product) =>
              item.id !== data.id && item.category?.id === data.category?.id,
          )
          .slice(0, 4);

        setRelatedProducts(related);
      } catch (err) {
        console.error("Fetch product error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [idParam]);

  const handleAddToCartById = async (productId: number, qty = 1) => {
    try {
      await cartAPI.add(productId, qty);
      alert("Added to cart");
    } catch (err: any) {
      const status = err?.response?.status as number | undefined;
      const code = err?.code as string | undefined;

      if (status === 401 || code === "AUTH_REQUIRED") {
        alert("Vui lòng đăng nhập để thêm vào giỏ hàng.");
        router.push("/login");
        return;
      }
      if (code === "CART_DUPLICATE") {
        alert("Sản phẩm đã có trong giỏ hàng.");
        return;
      }

      console.error("Add cart error:", err);
    }
  };

  const handleWishlistById = async (productId: number) => {
    try {
      await wishlistAPI.toggle(userId, productId);
      alert("Added to wishlist");
    } catch (err: any) {
      const code = err?.code as string | undefined;
      if (code === "WISHLIST_DUPLICATE") {
        alert("Sản phẩm đã có trong wishlist.");
        return;
      }
      console.error("Wishlist error:", err);
    }
  };

  if (loading) {
    return (
      <div className="py-40 text-center text-gray-500">Loading product...</div>
    );
  }

  if (!product) {
    return (
      <div className="py-40 text-center text-red-500">Product not found</div>
    );
  }

  return (
    <div className="w-full">
      {/* BANNER */}
      <div className="bg-gradient-to-r from-yellow-100 to-white py-20 text-center">
        <h1 className="text-4xl font-bold text-gray-800">Shop Details</h1>
        <p className="text-gray-500 mt-2">Home &gt; Shop Details</p>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* IMAGE */}
        <div>
          <div className="bg-[#f5f1ee] rounded-3xl p-10 flex justify-center">
            <Image
              src={product.image || "/placeholder.png"}
              alt={product.name}
              width={380}
              height={480}
              className="object-contain hover:scale-105 transition duration-300"
            />
          </div>
        </div>

        {/* INFO */}
        <div>
          {/* CATEGORY */}
          <p className="text-sm text-yellow-600 font-semibold uppercase mb-2">
            {product.category?.name}
          </p>

          {/* NAME */}
          <h1 className="text-4xl font-bold text-gray-900 leading-tight">
            {product.name}
          </h1>

          {/* RATING */}
          <div className="flex items-center gap-1 text-orange-400 mt-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={18} fill="currentColor" />
            ))}

            <span className="text-gray-500 text-sm ml-2">
              (5 Customer Reviews)
            </span>
          </div>

          {/* PRICE */}
          <p className="text-4xl font-bold text-yellow-600 mt-6">
            ${product.price.toFixed(2)}
          </p>

          {/* DESCRIPTION */}
          <p className="text-gray-600 mt-6 leading-8">{product.description}</p>

          {/* STOCK */}
          <div className="mt-6 flex items-center gap-2">
            <span className="font-semibold text-gray-800">Availability:</span>

            {product.stock > 0 ? (
              <span className="text-green-600 font-medium">
                In Stock ({product.stock})
              </span>
            ) : (
              <span className="text-red-500 font-medium">Out Of Stock</span>
            )}
          </div>

          {/* QUANTITY */}
          <div className="mt-8">
            <p className="font-semibold mb-3">Quantity</p>

            <div className="flex items-center border border-gray-300 rounded-full w-fit px-4 py-2 gap-5">
              <button
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}>
                <Minus size={16} />
              </button>

              <span className="font-semibold">{quantity}</span>

              <button onClick={() => setQuantity((prev) => prev + 1)}>
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex flex-wrap gap-4 mt-10">
            {/* ADD CART */}
            <button
              onClick={() => product && handleAddToCartById(product.id, quantity)}
              disabled={product.stock <= 0}
              className="flex items-center gap-2 bg-[#eba07a] hover:bg-yellow-600 transition text-white px-8 py-4 rounded-full disabled:opacity-50">
              <ShoppingCart size={18} />
              Add To Cart
            </button>

            {/* WISHLIST */}
            <button
              onClick={() => product && handleWishlistById(product.id)}
              className="border border-gray-300 hover:border-yellow-600 hover:bg-yellow-600 hover:text-white transition px-5 py-4 rounded-full">
              <Heart size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* RELATED PRODUCTS */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-yellow-600 font-semibold uppercase tracking-wider">
              Recommendation
            </p>
            <h2 className="text-4xl font-bold text-gray-900 mt-2">
              Related Products
            </h2>
          </div>
        </div>

        {relatedProducts.length === 0 ? (
          <p className="text-gray-500">No related products found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {relatedProducts.map((item) => (
              <div
                key={item.id}
                className="group border border-gray-200 rounded-3xl overflow-hidden hover:shadow-2xl transition duration-300 bg-white">
                {/* IMAGE */}
                <div className="relative bg-[#f8f5f2] p-6 h-[300px] flex items-center justify-center overflow-hidden">
                  <Image
                    src={item.image || "/placeholder.png"}
                    alt={item.name}
                    width={180}
                    height={240}
                    className="object-contain group-hover:scale-105 transition duration-300"
                  />

                  {/* ACTIONS */}
                  <div className="absolute right-4 top-4 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => handleWishlistById(item.id)}
                      className="bg-white shadow-md p-3 rounded-full hover:bg-yellow-500 hover:text-white transition">
                      <Heart size={18} />
                    </button>

                    <Link
                      href={`/product/${item.id}`}
                      className="bg-white shadow-md p-3 rounded-full hover:bg-yellow-500 hover:text-white transition">
                      <Eye size={18} />
                    </Link>
                  </div>
                </div>

                {/* INFO */}
                <div className="p-6">
                  <p className="text-sm text-yellow-600 font-medium uppercase">
                    {item.category?.name}
                  </p>

                  <Link href={`/product/${item.id}`}>
                    <h3 className="text-xl font-bold text-gray-900 mt-2 hover:text-yellow-600 transition line-clamp-1">
                      {item.name}
                    </h3>
                  </Link>

                  {/* RATING */}
                  <div className="flex items-center gap-1 text-orange-400 mt-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={15} fill="currentColor" />
                    ))}
                  </div>

                  {/* PRICE */}
                  <div className="flex items-center justify-between mt-5">
                    <p className="text-2xl font-bold text-yellow-600">
                      ${item.price.toFixed(2)}
                    </p>

                    <button
                      onClick={() => handleAddToCartById(item.id, 1)}
                      className="bg-[#eba07a] hover:bg-yellow-600 text-white p-3 rounded-full transition">
                      <ShoppingCart size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
