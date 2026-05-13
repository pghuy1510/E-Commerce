"use client";

import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { usePreferences } from "@/lib/i18n";

interface Product {
  id: number;
  name: string;
}

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = usePreferences();

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
          setError(t("productList.backendOffline"));
          return;
        }

        setError(t("productList.fetchError", { status: err.response.status }));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2>{t("productList.title")}</h2>
      {loading && <p>{t("productList.loading")}</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && products.length === 0 && (
        <p>{t("productList.empty")}</p>
      )}
      {products.map((p) => (
        <div key={p.id}>{p.name}</div>
      ))}
    </div>
  );
}
