import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api",
});

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image?: string;
  category: {
    id: number;
    name: string;
  };
}

export const productAPI = {
  getAll: async (): Promise<Product[]> => {
    const response = await api.get("/products");
    return response.data;
  },

  getById: async (id: number): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  getByCategory: async (category: string): Promise<Product[]> => {
    const response = await api.get(`/products/category/${category}`);
    return response.data;
  },
  getTopSelling: async (): Promise<Product[]> => {
    const res = await api.get("/products/top-selling");

    // vì getRawAndEntities trả dạng đặc biệt
    return res.data.entities;
  },
};

export const wishlistAPI = {
  toggle: async (userId: number, productId: number) => {
    return api.post(`/wishlist/${userId}/${productId}`);
  },

  get: async (userId: number) => {
    const res = await api.get(`/wishlist/${userId}`);
    return res.data;
  },

  remove: async (userId: number, productId: number) => {
    return api.delete(`/wishlist/${userId}/${productId}`);
  },
};

export const cartAPI = {
  add: async (productId: number, quantity = 1) => {
    return api.post("/cart/add", {
      productId,
      quantity,
    });
  },

  get: async () => {
    return api.get("/cart");
  },

  remove: async (productId: number) => {
    return api.delete("/cart/remove", {
      data: { productId },
    });
  },

  update: async (productId: number, quantity: number) => {
    return api.patch("/cart/update", {
      productId,
      quantity,
    });
  },
};