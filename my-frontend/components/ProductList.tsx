"use client";

import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";

interface Product {
  id: number;
  name: string;
}

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

    axios
      .get<Product[]>(`${apiBase}/products`, { timeout: 5000 })
      .then((res) => {
        setProducts(res.data);
        setError(null);
      })
      .catch((err: AxiosError) => {
        if (!err.response) {
          setError(
            "Khong ket noi duoc backend. Hay chay my-backend o cong 3001.",
          );
          return;
        }

        setError(`Khong the tai san pham (HTTP ${err.response.status}).`);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2>Danh sách sản phẩm</h2>
      {loading && <p>Dang tai...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && products.length === 0 && (
        <p>Chua co san pham nao.</p>
      )}
      {products.map((p) => (
        <div key={p.id}>{p.name}</div>
      ))}
    </div>
  );
}
