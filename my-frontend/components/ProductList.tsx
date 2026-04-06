"use client";

import { useEffect, useState } from "react";
import axios from "axios";

interface Product {
  id: number;
  name: string;
}

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    axios
      .get<Product[]>("http://localhost:3001/api/products")
      .then((res) => {
        console.log(res.data); // dữ liệu từ NestJS
        setProducts(res.data);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <h2>Danh sách sản phẩm</h2>
      {products.map((p) => (
        <div key={p.id}>{p.name}</div>
      ))}
    </div>
  );
}
