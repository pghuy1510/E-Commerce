import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api",
});

export function getBrowserToken(): string | undefined {
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

function requireAuthToken(): string {
  const token = getBrowserToken();
  if (token) {
    return token;
  }

  const err = new Error("Vui lòng đăng nhập để tiếp tục.");
  (err as any).code = "AUTH_REQUIRED";
  throw err;
}

const CART_UPDATED_EVENT = "cart-updated";
const WISHLIST_UPDATED_EVENT = "wishlist-updated";

export function emitCartUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CART_UPDATED_EVENT));
  }
}

export function emitWishlistUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(WISHLIST_UPDATED_EVENT));
  }
}

function createDuplicateError(message: string, code: string): Error {
  const err = new Error(message);
  (err as any).code = code;
  return err;
}

function hasProductIdMatch(item: any, productId: number): boolean {
  if (item?.product?.id != null) {
    return item.product.id === productId;
  }
  if (item?.productId != null) {
    return item.productId === productId;
  }
  return item?.id === productId;
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error?.response?.status === 401) {
      try {
        document.cookie = "token=; Max-Age=0; path=/";
      } catch {}
      try {
        localStorage.removeItem("username");
      } catch {}
    }

    return Promise.reject(error);
  },
);

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

export interface BestSellerProduct extends Product {
  sold: number;
}

export interface UserProfile {
  username: string;
  email?: string | null;
  fullName?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string | null;
}

export interface UserAddress {
  province?: string;
  district?: string;
  ward?: string;
  detail?: string;
}

export interface UserBank {
  id: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
}

export interface ContactPayload {
  name: string;
  email: string;
  phone?: string;
  message: string;
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
  getNewArrivals: async (limit = 12): Promise<Product[]> => {
    const response = await api.get("/products/new-arrivals", {
      params: { limit },
    });
    return response.data;
  },
  getTopSelling: async (): Promise<BestSellerProduct[]> => {
    const res = await api.get("/products/top-selling");
    return res.data;
  },
};

export const wishlistAPI = {
  toggle: async (userId: number, productId: number) => {
    const list = await wishlistAPI.get(userId);
    const items = Array.isArray(list) ? list : (list?.items ?? []);
    const exists = items.some((item: any) =>
      hasProductIdMatch(item, productId),
    );
    if (exists) {
      throw createDuplicateError(
        "Sản phẩm đã có trong wishlist.",
        "WISHLIST_DUPLICATE",
      );
    }

    const res = await api.post(`/wishlist/${userId}/${productId}`);
    emitWishlistUpdated();
    return res;
  },

  get: async (userId: number) => {
    const res = await api.get(`/wishlist/${userId}`);
    return res.data;
  },

  remove: async (userId: number, productId: number) => {
    const res = await api.delete(`/wishlist/${userId}/${productId}`);
    emitWishlistUpdated();
    return res;
  },
};

export const cartAPI = {
  add: async (productId: number, quantity = 1) => {
    requireAuthToken();
    const current = await api.get("/cart");
    const items = current.data?.items ?? [];
    const exists = items.some((item: any) =>
      hasProductIdMatch(item, productId),
    );
    if (exists) {
      throw createDuplicateError(
        "Sản phẩm đã có trong giỏ hàng.",
        "CART_DUPLICATE",
      );
    }

    const res = await api.post("/cart/add", {
      productId,
      quantity,
    });
    emitCartUpdated();
    return res;
  },

  get: async () => {
    requireAuthToken();
    return api.get("/cart");
  },

  remove: async (productId: number) => {
    requireAuthToken();
    const res = await api.delete("/cart/remove", {
      data: { productId },
    });
    emitCartUpdated();
    return res;
  },

  update: async (productId: number, quantity: number) => {
    requireAuthToken();
    const res = await api.patch("/cart/update", {
      productId,
      quantity,
    });
    emitCartUpdated();
    return res;
  },
};

export const userProfileAPI = {
  get: async (): Promise<UserProfile> => {
    requireAuthToken();
    const res = await api.get("/users/me/profile");
    return res.data;
  },
  update: async (payload: Partial<UserProfile>): Promise<UserProfile> => {
    requireAuthToken();
    const res = await api.patch("/users/me/profile", payload);
    return res.data;
  },
};

export const userAddressAPI = {
  get: async (): Promise<UserAddress> => {
    requireAuthToken();
    const res = await api.get("/users/me/address");
    return res.data;
  },
  update: async (payload: UserAddress): Promise<UserAddress> => {
    requireAuthToken();
    const res = await api.patch("/users/me/address", payload);
    return res.data;
  },
};

export const userBankAPI = {
  list: async (): Promise<UserBank[]> => {
    requireAuthToken();
    const res = await api.get("/users/me/banks");
    return res.data;
  },
  create: async (payload: Omit<UserBank, "id">): Promise<UserBank> => {
    requireAuthToken();
    const res = await api.post("/users/me/banks", payload);
    return res.data;
  },
};

export const userPasswordAPI = {
  change: async (payload: { currentPassword: string; newPassword: string }) => {
    requireAuthToken();
    return api.patch("/users/me/password", payload);
  },
};

export const contactAPI = {
  create: async (payload: ContactPayload) => {
    const res = await api.post("/contact", payload);
    return res.data;
  },
};
