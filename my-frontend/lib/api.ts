import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api",
});

function getBrowserToken(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  // Prefer native cookie parsing (works even if js-cookie isn't bundled here)
  const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
  if (match?.[1]) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }

  try {
    // Lazy import to avoid breaking server-side imports
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Cookies = require("js-cookie") as typeof import("js-cookie");
    return Cookies.get("token");
  } catch {
    return undefined;
  }
}

api.interceptors.request.use((config) => {
  const token = getBrowserToken();

  const debug = process.env.NEXT_PUBLIC_DEBUG_AUTH === "true";
  if (debug) {
    // don't log token value
    // eslint-disable-next-line no-console
    console.debug("[api] request", {
      url: config.url,
      method: config.method,
      hasToken: Boolean(token),
    });
  }

  if (!token) {
    return config;
  }

  // Axios v1+ may use AxiosHeaders (has .set)
  config.headers = config.headers ?? {};
  const headersAny = config.headers as any;
  if (typeof headersAny.set === "function") {
    headersAny.set("Authorization", `Bearer ${token}`);
  } else {
    headersAny.Authorization = `Bearer ${token}`;
  }

  return config;
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
